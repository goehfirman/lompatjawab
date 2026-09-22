import { useEffect, useRef, useState, useCallback } from 'react';

/**
 * Hook for Camera management, Crowd Motion Density detection,
 * device selection (PID integrated vs USB webcam), and pose estimation.
 */
export function usePoseDetection({
  videoRef,
  canvasRef,
  neutralMargin = 0.08,
  isActive = true
}) {
  const [isCameraReady, setIsCameraReady] = useState(false);
  const [cameraError, setCameraError] = useState(null);
  const [availableCameras, setAvailableCameras] = useState([]);
  const [activeCameraId, setActiveCameraId] = useState('');
  const [crowdDensity, setCrowdDensity] = useState({ pctA: 50, pctB: 50, dominantZone: 'TIE', activityLevel: 0 });
  const [fps, setFps] = useState(0);

  const streamRef = useRef(null);
  const animFrameIdRef = useRef(null);
  const prevFrameCanvasRef = useRef(null);
  const fpsCounterRef = useRef({ frames: 0, lastTime: performance.now() });
  const lastDensityUpdateRef = useRef(0);

  // Enumerate camera devices
  const refreshCameraDevices = useCallback(async () => {
    try {
      if (!navigator.mediaDevices || !navigator.mediaDevices.enumerateDevices) return;
      const devices = await navigator.mediaDevices.enumerateDevices();
      const videoDevs = devices.filter(d => d.kind === 'videoinput');
      setAvailableCameras(videoDevs);
      if (videoDevs.length > 0 && !activeCameraId) {
        setActiveCameraId(videoDevs[0].deviceId);
      }
    } catch (e) {
      console.warn("Error enumerating devices", e);
    }
  }, [activeCameraId]);

  // Request & Start Camera
  const startCamera = useCallback(async (selectedDeviceId = '') => {
    try {
      setCameraError(null);
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error("Browser tidak mendukung akses kamera (getUserMedia).");
      }

      // Stop previous stream tracks
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
      }

      const constraints = {
        video: selectedDeviceId 
          ? { deviceId: { exact: selectedDeviceId }, width: { ideal: 1280 }, height: { ideal: 720 } }
          : { facingMode: 'user', width: { ideal: 1280 }, height: { ideal: 720 } },
        audio: false
      };

      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      streamRef.current = stream;

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.onloadedmetadata = async () => {
          try {
            await videoRef.current.play();
            setIsCameraReady(true);
            refreshCameraDevices();
          } catch (err) {
            console.warn("Video play error", err);
            // Autoplay might need user click
            setIsCameraReady(true);
          }
        };
      }
    } catch (err) {
      console.error("Camera access error:", err);
      setIsCameraReady(false);
      if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
        setCameraError("Izin kamera belum diberikan. Klik tombol 'Izinkan Kamera' di atas.");
      } else if (err.name === 'NotFoundError' || err.name === 'DevicesNotFoundError') {
        setCameraError("Tidak ada kamera yang terdeteksi di PID. Sambungkan webcam USB.");
      } else {
        setCameraError(`Gagal mengakses kamera: ${err.message || 'Periksa koneksi kamera'}`);
      }
    }
  }, [videoRef, refreshCameraDevices]);

  // Switch camera device
  const switchCamera = useCallback((deviceId) => {
    setActiveCameraId(deviceId);
    startCamera(deviceId);
  }, [startCamera]);

  // Auto start camera on mount if active
  useEffect(() => {
    if (isActive) {
      startCamera(activeCameraId);
    }
    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
      }
    };
  }, [isActive]);

  // Analyze Crowd Motion & Split Zones
  useEffect(() => {
    if (!isActive) return;

    let isRunning = true;

    // Small offscreen canvas for fast pixel difference motion analysis
    if (!prevFrameCanvasRef.current) {
      const offCanvas = document.createElement('canvas');
      offCanvas.width = 160;
      offCanvas.height = 90;
      prevFrameCanvasRef.current = offCanvas;
    }

    const offCtx = prevFrameCanvasRef.current.getContext('2d', { willReadFrequently: true });
    let lastImageData = null;

    function processFrame() {
      if (!isRunning) return;

      const now = performance.now();
      fpsCounterRef.current.frames++;
      if (now - fpsCounterRef.current.lastTime >= 1000) {
        setFps(Math.round((fpsCounterRef.current.frames * 1000) / (now - fpsCounterRef.current.lastTime)));
        fpsCounterRef.current.frames = 0;
        fpsCounterRef.current.lastTime = now;
      }

      const video = videoRef.current;
      const canvas = canvasRef.current;

      if (video && video.readyState >= 2) {
        const vW = video.videoWidth || 1280;
        const vH = video.videoHeight || 720;

        // 1. Motion & Presence Calculation
        try {
          offCtx.drawImage(video, 0, 0, 160, 90);
          const currentImg = offCtx.getImageData(0, 0, 160, 90);
          const data = currentImg.data;

          if (lastImageData) {
            const prevData = lastImageData.data;
            let motionScoreA = 0; // Left side (inverted mirror)
            let motionScoreB = 0; // Right side
            const midCol = 80;
            const neutralMarginCols = 160 * neutralMargin;

            // Sample motion changes
            for (let y = 0; y < 90; y += 2) {
              for (let x = 0; x < 160; x += 2) {
                const idx = (y * 160 + x) * 4;
                const diff = Math.abs(data[idx] - prevData[idx]) +
                             Math.abs(data[idx+1] - prevData[idx+1]) +
                             Math.abs(data[idx+2] - prevData[idx+2]);

                if (diff > 45) { // Significant motion or presence
                  // Note: video is mirrored with -scale-x-100!
                  // So right pixel in video = LEFT in mirrored view (Zone A)!
                  const mirroredX = 160 - x;
                  if (mirroredX < midCol - neutralMarginCols) {
                    motionScoreA += diff;
                  } else if (mirroredX > midCol + neutralMarginCols) {
                    motionScoreB += diff;
                  }
                }
              }
            }

            const totalScore = motionScoreA + motionScoreB;
            if (totalScore > 100 && (now - lastDensityUpdateRef.current > 250)) {
              lastDensityUpdateRef.current = now;
              const pA = Math.round((motionScoreA / totalScore) * 100);
              const pB = 100 - pA;
              setCrowdDensity({
                pctA: pA,
                pctB: pB,
                dominantZone: pA > 55 ? 'A' : pB > 55 ? 'B' : 'TIE',
                activityLevel: Math.min(100, Math.round(totalScore / 150))
              });
            }
          }
          lastImageData = currentImg;
        } catch (e) {}

        // 2. Draw Visual Split Overlay on Canvas
        if (canvas) {
          const cW = canvas.width = canvas.clientWidth || 1280;
          const cH = canvas.height = canvas.clientHeight || 720;
          const ctx = canvas.getContext('2d');

          if (ctx) {
            ctx.clearRect(0, 0, cW, cH);

            // Garis lurus pemisah tengah saja (tanpa shaded box & tanpa garis putus-putus)
            ctx.strokeStyle = 'rgba(255, 255, 255, 0.45)';
            ctx.lineWidth = 2;
            ctx.setLineDash([]);
            ctx.beginPath();
            ctx.moveTo(cW / 2, 0);
            ctx.lineTo(cW / 2, cH);
            ctx.stroke();
          }
        }
      }

      animFrameIdRef.current = requestAnimationFrame(processFrame);
    }

    animFrameIdRef.current = requestAnimationFrame(processFrame);

    return () => {
      isRunning = false;
      if (animFrameIdRef.current) {
        cancelAnimationFrame(animFrameIdRef.current);
      }
    };
  }, [isActive, neutralMargin, videoRef, canvasRef]);

  return {
    isCameraReady,
    cameraError,
    availableCameras,
    activeCameraId,
    switchCamera,
    startCamera,
    crowdDensity,
    fps
  };
}
