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
  const [cameraStream, setCameraStream] = useState(null);
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

      // Check secure context for local network HTTP
      const isLocal = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
      if (!window.isSecureContext && !isLocal) {
        throw new Error(
          "Kamera diblokir browser karena halaman dibuka via HTTP di jaringan (" + window.location.host + "). Untuk mengizinkan: Buka chrome://flags/#unsafely-treat-insecure-origin-as-secure di Chrome PID, masukkan " + window.location.origin + ", pilih Enabled, lalu Relaunch browser."
        );
      }

      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error("Browser tidak mendukung akses kamera (getUserMedia).");
      }

      // Stop previous stream tracks
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
      }

      let stream = null;

      // Strategy 1: Ideal 720p without strict facingMode
      try {
        const constraints = {
          video: selectedDeviceId 
            ? { deviceId: { exact: selectedDeviceId }, width: { ideal: 1280 }, height: { ideal: 720 } }
            : { width: { ideal: 1280 }, height: { ideal: 720 } },
          audio: false
        };
        stream = await navigator.mediaDevices.getUserMedia(constraints);
      } catch (e1) {
        console.warn("Strategy 1 failed, trying fallback with { video: true }...", e1);
      }

      // Strategy 2: Absolute generic { video: true }
      if (!stream) {
        try {
          stream = await navigator.mediaDevices.getUserMedia({
            video: selectedDeviceId ? { deviceId: { exact: selectedDeviceId } } : true,
            audio: false
          });
        } catch (e2) {
          console.warn("Strategy 2 failed, trying unconditional { video: true }...", e2);
        }
      }

      // Strategy 3: Pure { video: true } with no deviceId
      if (!stream) {
        stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: false });
      }

      streamRef.current = stream;
      setCameraStream(stream);

      if (videoRef.current) {
        const v = videoRef.current;
        v.srcObject = stream;
        v.muted = true;
        v.playsInline = true;
        v.setAttribute('playsinline', 'true');
        v.setAttribute('webkit-playsinline', 'true');

        const tryPlay = async () => {
          try {
            await v.play();
            setIsCameraReady(true);
            refreshCameraDevices();
          } catch (playErr) {
            console.warn("video.play() deferred:", playErr);
            setIsCameraReady(true);
          }
        };

        if (v.readyState >= 2) {
          tryPlay();
        } else {
          v.onloadedmetadata = tryPlay;
          v.oncanplay = tryPlay;
        }
      }
    } catch (err) {
      console.error("Camera access error:", err);
      setIsCameraReady(false);
      if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
        setCameraError("Izin kamera belum diberikan atau ditolak. Pastikan izin kamera telah diaktifkan di Pengaturan PID atau klik 'Izinkan' di browser.");
      } else if (err.name === 'NotFoundError' || err.name === 'DevicesNotFoundError') {
        setCameraError("Tidak ada kamera/webcam yang terdeteksi di perangkat PID ini. Sambungkan webcam USB.");
      } else if (err.name === 'NotReadableError' || err.name === 'TrackStartError') {
        setCameraError("Kamera sedang digunakan oleh aplikasi lain di PID. Tutup aplikasi lain terlebih dahulu.");
      } else {
        setCameraError(err.message || "Gagal mengakses kamera. Periksa koneksi kamera.");
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
    fps,
    stream: cameraStream
  };
}
