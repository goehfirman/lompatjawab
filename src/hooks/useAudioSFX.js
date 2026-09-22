import { useRef, useCallback, useEffect, useMemo } from 'react';

export function useAudioSFX(soundEnabled = true) {
  const audioCtxRef = useRef(null);

  const getAudioContext = useCallback(() => {
    if (!audioCtxRef.current) {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (AudioCtx) {
        audioCtxRef.current = new AudioCtx();
      }
    }
    if (audioCtxRef.current && audioCtxRef.current.state === 'suspended') {
      audioCtxRef.current.resume();
    }
    return audioCtxRef.current;
  }, []);

  const playBeep = useCallback((freq = 440, type = 'sine', duration = 0.1, gainVal = 0.15) => {
    if (!soundEnabled) return;
    try {
      const ctx = getAudioContext();
      if (!ctx) return;

      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = type;
      osc.frequency.setValueAtTime(freq, ctx.currentTime);

      gain.gain.setValueAtTime(gainVal, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start();
      osc.stop(ctx.currentTime + duration);
    } catch (e) {}
  }, [soundEnabled, getAudioContext]);

  // Tick sound during countdown
  const playTick = useCallback(() => {
    playBeep(700, 'triangle', 0.04, 0.08);
  }, [playBeep]);

  // Warning beeps for last 3 seconds
  const playWarningBeep = useCallback((count) => {
    const freq = count === 1 ? 950 : 700;
    playBeep(freq, 'sawtooth', 0.15, 0.18);
  }, [playBeep]);

  // Start 3-2-1 Countdown
  const playCountdownBeep = useCallback((number) => {
    if (!soundEnabled) return;
    try {
      const ctx = getAudioContext();
      if (!ctx) return;
      const freq = number === 0 ? 1046.5 : 523.25; // C6 for GO, C5 for numbers
      const duration = number === 0 ? 0.4 : 0.2;

      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = number === 0 ? 'triangle' : 'sine';
      osc.frequency.setValueAtTime(freq, ctx.currentTime);

      gain.gain.setValueAtTime(0.25, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration);

      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + duration);
    } catch (e) {}
  }, [soundEnabled, getAudioContext]);

  // Elimination Siren / Buzzer for wrong zone
  const playEliminationSiren = useCallback(() => {
    if (!soundEnabled) return;
    try {
      const ctx = getAudioContext();
      if (!ctx) return;

      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sawtooth';
      // Pitch drop siren
      osc.frequency.setValueAtTime(320, ctx.currentTime);
      osc.frequency.linearRampToValueAtTime(110, ctx.currentTime + 0.6);

      gain.gain.setValueAtTime(0.3, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.65);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start();
      osc.stop(ctx.currentTime + 0.65);
    } catch (e) {}
  }, [soundEnabled, getAudioContext]);

  // Safe chime for advancing zone
  const playSafeChime = useCallback(() => {
    if (!soundEnabled) return;
    try {
      const ctx = getAudioContext();
      if (!ctx) return;

      const notes = [523.25, 659.25, 783.99, 1046.50]; // C5, E5, G5, C6
      notes.forEach((freq, idx) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(freq, ctx.currentTime + idx * 0.08);

        gain.gain.setValueAtTime(0, ctx.currentTime + idx * 0.08);
        gain.gain.linearRampToValueAtTime(0.22, ctx.currentTime + idx * 0.08 + 0.02);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + idx * 0.08 + 0.35);

        osc.connect(gain);
        gain.connect(ctx.destination);

        osc.start(ctx.currentTime + idx * 0.08);
        osc.stop(ctx.currentTime + idx * 0.08 + 0.4);
      });
    } catch (e) {}
  }, [soundEnabled, getAudioContext]);

  // Whistle / Lock Zone cue
  const playWhistle = useCallback(() => {
    playBeep(987.77, 'sine', 0.28, 0.22);
  }, [playBeep]);

  // Fanfare for winner / last standing
  const playFanfare = useCallback(() => {
    if (!soundEnabled) return;
    try {
      const ctx = getAudioContext();
      if (!ctx) return;

      const chords = [
        { freq: 523.25, time: 0.0, dur: 0.15 },
        { freq: 523.25, time: 0.15, dur: 0.15 },
        { freq: 523.25, time: 0.3, dur: 0.15 },
        { freq: 659.25, time: 0.45, dur: 0.25 },
        { freq: 783.99, time: 0.7, dur: 0.25 },
        { freq: 1046.50, time: 0.95, dur: 0.7 }
      ];

      chords.forEach(({ freq, time, dur }) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(freq, ctx.currentTime + time);

        gain.gain.setValueAtTime(0.25, ctx.currentTime + time);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + time + dur);

        osc.connect(gain);
        gain.connect(ctx.destination);

        osc.start(ctx.currentTime + time);
        osc.stop(ctx.currentTime + time + dur);
      });
    } catch (e) {}
  }, [soundEnabled, getAudioContext]);

  useEffect(() => {
    return () => {
      if (audioCtxRef.current) {
        try {
          audioCtxRef.current.close();
        } catch (e) {}
      }
    };
  }, []);

  return useMemo(() => ({
    playTick,
    playWarningBeep,
    playCountdownBeep,
    playEliminationSiren,
    playSafeChime,
    playWhistle,
    playFanfare
  }), [
    playTick,
    playWarningBeep,
    playCountdownBeep,
    playEliminationSiren,
    playSafeChime,
    playWhistle,
    playFanfare
  ]);
}
