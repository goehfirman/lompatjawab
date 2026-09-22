import React, { useState, useEffect, useRef } from 'react';
import { Clock, Pause, AlertTriangle, Sparkles, ShieldCheck, X, ArrowRight, ArrowLeft, Footprints } from 'lucide-react';
import { TeacherControls } from './TeacherControls';

export function GameArena({
  questionSet,
  settings,
  onFinishGame,
  onQuitToMenu,
  audioSFX,
  crowdDensity,
  isCameraReady,
  onRequestCamera
}) {
  const { questions, timerSeconds = 10, randomizeQuestions, shuffleChoices } = questionSet;
  const { initialStudentsCount = 20, survivorTarget = 1, gameMode = 'free' } = settings;

  // Prepare questions
  const [gameQuestions, setGameQuestions] = useState(() => {
    let list = [...questions];
    if (randomizeQuestions) {
      list = list.sort(() => Math.random() - 0.5);
    }
    if (shuffleChoices) {
      list = list.map(q => {
        if (Math.random() > 0.5) {
          return {
            ...q,
            choiceA: q.choiceB,
            choiceB: q.choiceA,
            correctAnswer: q.correctAnswer === 'A' ? 'B' : 'A'
          };
        }
        return q;
      });
    }
    return list;
  });

  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [countdownStart, setCountdownStart] = useState(3); // 3, 2, 1, 0
  const [timeLeft, setTimeLeft] = useState(timerSeconds);
  const [isPaused, setIsPaused] = useState(false);
  const [isJumping, setIsJumping] = useState(false); // 2-second jumping phase after countdown
  const [jumpTimeLeft, setJumpTimeLeft] = useState(2);
  const [isRevealed, setIsRevealed] = useState(false);
  const [remainingStudents, setRemainingStudents] = useState(initialStudentsCount);
  const [roundEliminations, setRoundEliminations] = useState([]); // [{ questionIndex, correctZone, eliminatedCount, remainingAfter }]

  const currentQ = gameQuestions[currentQuestionIndex] || gameQuestions[0];
  const timerIntervalRef = useRef(null);
  const audioRef = useRef(audioSFX);
  audioRef.current = audioSFX;

  // 3-2-1 Countdown before first question
  useEffect(() => {
    let count = 3;
    audioRef.current?.playCountdownBeep(3);

    const cdInterval = setInterval(() => {
      count -= 1;
      if (count > 0) {
        setCountdownStart(count);
        audioRef.current?.playCountdownBeep(count);
      } else if (count === 0) {
        setCountdownStart(0);
        audioRef.current?.playCountdownBeep(0);
        setTimeLeft(timerSeconds);
        clearInterval(cdInterval);
      }
    }, 1000);

    return () => clearInterval(cdInterval);
  }, [timerSeconds]);

  // Main question timer
  useEffect(() => {
    if (countdownStart > 0 || isPaused || isRevealed || isJumping) return;

    timerIntervalRef.current = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timerIntervalRef.current);
          startJumpPhase();
          return 0;
        }

        if (prev <= 6 && prev > 1) {
          audioRef.current?.playWarningBeep(prev - 1);
        } else {
          audioRef.current?.playTick();
        }

        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timerIntervalRef.current);
  }, [countdownStart, isPaused, isRevealed, isJumping]);

  // Trigger 2-second jumping phase after countdown reaches 0 (after 1)
  const startJumpPhase = () => {
    setTimeLeft(0);
    setIsJumping(true);
    setJumpTimeLeft(2);
    audioRef.current?.playJumpCue();
  };

  // 2-Second Jump Countdown Effect: reveals answer once time expires
  useEffect(() => {
    if (!isJumping) return;

    let seconds = 2;
    const jumpInterval = setInterval(() => {
      seconds -= 1;
      if (seconds > 0) {
        setJumpTimeLeft(seconds);
      } else {
        clearInterval(jumpInterval);
        setIsJumping(false);
        handleLockAnswers();
      }
    }, 1000);

    return () => clearInterval(jumpInterval);
  }, [isJumping]);

  // Lock answers and evaluate zones
  const handleLockAnswers = () => {
    audioRef.current?.playWhistle();

    const isFreeMode = gameMode === 'free';

    // Sound effects: in free mode, celebrate without harsh elimination siren
    if (!isFreeMode) {
      setTimeout(() => {
        audioRef.current?.playEliminationSiren();
      }, 300);
      setTimeout(() => {
        audioRef.current?.playSafeChime();
      }, 1000);
    } else {
      setTimeout(() => {
        audioRef.current?.playSafeChime();
      }, 400);
    }

    // Estimate participants based on crowd density
    const correctZone = currentQ.correctAnswer;
    const estimatedWrongPct = correctZone === 'A' ? (crowdDensity.pctB / 100) : (crowdDensity.pctA / 100);
    const estimatedCorrectPct = correctZone === 'A' ? (crowdDensity.pctA / 100) : (crowdDensity.pctB / 100);
    
    let estimatedEliminated = 0;
    let newRemaining = initialStudentsCount;

    if (!isFreeMode) {
      // Elimination mode: reduce surviving students
      estimatedEliminated = Math.round(remainingStudents * Math.max(0.15, Math.min(0.85, estimatedWrongPct)));
      if (estimatedEliminated >= remainingStudents) {
        estimatedEliminated = remainingStudents - 1;
      }
      newRemaining = Math.max(1, remainingStudents - estimatedEliminated);
      setRemainingStudents(newRemaining);
    } else {
      // Free mode: no elimination! All students continue playing
      const correctCount = Math.round(initialStudentsCount * Math.max(0.1, Math.min(0.95, estimatedCorrectPct)));
      estimatedEliminated = initialStudentsCount - correctCount;
      newRemaining = initialStudentsCount;
    }

    setRoundEliminations(prev => [
      ...prev,
      {
        questionIndex: currentQuestionIndex,
        correctZone,
        eliminatedCount: estimatedEliminated,
        remainingAfter: newRemaining,
        isFreeMode
      }
    ]);

    setIsRevealed(true);
  };

  // Next question or finish (Mode Bebas ONLY finishes when all questions are answered)
  const handleNextQuestion = () => {
    setIsRevealed(false);
    setIsJumping(false);
    setJumpTimeLeft(2);

    const isLastQuestion = currentQuestionIndex + 1 >= gameQuestions.length;
    const isEliminationFinished = gameMode !== 'free' && remainingStudents <= survivorTarget;

    // In Mode Bebas: game continues until all questions are exhausted!
    if (isLastQuestion || isEliminationFinished) {
      onFinishGame({
        initialStudentsCount,
        survivorTarget,
        gameMode,
        remainingStudents: gameMode === 'free' ? initialStudentsCount : remainingStudents,
        totalQuestions: gameQuestions.length,
        questions: gameQuestions,
        roundEliminations
      });
    } else {
      setCurrentQuestionIndex(prev => prev + 1);
      setTimeLeft(timerSeconds);
    }
  };

  const handleSkipQuestion = () => {
    if (confirm("Lewati soal ini dan lanjut ke soal berikutnya?")) {
      handleNextQuestion();
    }
  };

  const handleRepeatQuestion = () => {
    setIsRevealed(false);
    setIsJumping(false);
    setJumpTimeLeft(2);
    setTimeLeft(timerSeconds);
  };

  // Early reveal action by teacher: triggers jump instruction or forces reveal
  const handleEarlyReveal = () => {
    if (!isRevealed && !isJumping) {
      clearInterval(timerIntervalRef.current);
      startJumpPhase();
    } else if (isJumping) {
      setIsJumping(false);
      handleLockAnswers();
    }
  };

  // Keyboard shortcut for fast teacher control
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === ' ' && !isRevealed && !isJumping) {
        e.preventDefault();
        setIsPaused(p => !p);
      } else if (e.key === 'Enter' && !isRevealed) {
        e.preventDefault();
        handleEarlyReveal();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isRevealed, isJumping, timeLeft]);

  const timerPct = (timeLeft / timerSeconds) * 100;
  const isUrgent = timeLeft <= 5 && timeLeft > 0;

  return (
    <div className="flex-1 flex flex-col overflow-hidden text-slate-100 relative select-none z-10">
      {/* 3-2-1 Countdown Overlay */}
      {countdownStart > 0 && (
        <div className="absolute inset-0 bg-slate-950/85 backdrop-blur-lg z-50 flex flex-col items-center justify-center">
          <span className="text-base font-extrabold text-amber-400 uppercase tracking-widest mb-4 animate-pulse">
            Seluruh Siswa Bersiap di Garis Tengah...
          </span>
          <div className="text-9xl font-black text-white animate-ping">
            {countdownStart}
          </div>
        </div>
      )}

      {/* Main Split-Screen Arena Area */}
      <div className="flex-1 relative flex overflow-hidden">
        {/* Compact Top Question Banner (Leaves maximum room for camera view) */}
        <div className="absolute top-3 inset-x-4 z-20 flex flex-col items-center pointer-events-none">
          <div className="w-full max-w-3xl bg-slate-900/85 backdrop-blur-md border border-slate-700/60 rounded-2xl px-4 py-2.5 shadow-xl space-y-1.5 pointer-events-auto">
            {/* Top row: Question index & Timer */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="px-2.5 py-0.5 rounded-lg bg-amber-500/20 text-amber-300 font-extrabold text-[11px] border border-amber-500/30">
                  SOAL {currentQuestionIndex + 1} / {gameQuestions.length}
                </span>
                {gameMode === 'free' ? (
                  <span className="px-2.5 py-0.5 rounded-lg bg-sky-500/20 text-sky-300 font-bold text-[11px] border border-sky-500/30 flex items-center gap-1">
                    <Sparkles size={12} className="text-sky-400" /> Mode Bebas ({initialStudentsCount} Siswa)
                  </span>
                ) : (
                  <span className="text-[11px] font-semibold text-slate-300 hidden sm:inline">
                    Siswa Bertahan: <strong className="text-emerald-400 font-bold">{remainingStudents}</strong> / {initialStudentsCount}
                  </span>
                )}
              </div>

              {/* Compact Timer Pill */}
              <div className={`px-3 py-0.5 rounded-xl flex items-center gap-1.5 font-mono font-black text-sm border transition-all ${
                isUrgent
                  ? 'bg-rose-600 text-white border-rose-400 animate-pulse-fast shadow-md shadow-rose-600/50'
                  : 'bg-slate-800/90 text-slate-100 border-slate-700'
              }`}>
                <Clock size={15} className={isUrgent ? 'animate-spin' : 'text-sky-400'} />
                <span>{String(timeLeft).padStart(2, '0')}s</span>
              </div>
            </div>

            {/* Question Text (Compact & High Contrast) */}
            <h2 className="text-base sm:text-lg md:text-xl font-black text-white text-center leading-snug px-1">
              {currentQ.text}
            </h2>

            {/* Slim Timer Progress Bar */}
            <div className="w-full h-1.5 rounded-full bg-slate-800 overflow-hidden">
              <div
                className={`h-full rounded-full transition-all duration-1000 ease-linear ${
                  isUrgent ? 'bg-rose-500' : 'bg-gradient-to-r from-sky-400 via-emerald-400 to-amber-400'
                }`}
                style={{ width: `${timerPct}%` }}
              />
            </div>

            {/* Compact Teacher Explanation Banner when revealed */}
            {isRevealed && currentQ.explanation && (
              <div className="w-full bg-slate-900/90 border border-amber-400/50 px-3 py-1.5 rounded-xl text-slate-100 text-xs shadow-md flex items-center gap-2 animate-fadeIn">
                <span className="text-amber-400 font-extrabold shrink-0">💡 Pembahasan:</span>
                <span className="font-medium truncate">{currentQ.explanation}</span>
              </div>
            )}
          </div>
        </div>

        {/* Translucent 5-Second Center Countdown Overlay */}
        {!isRevealed && !isJumping && countdownStart === 0 && timeLeft <= 5 && timeLeft > 0 && (
          <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none z-30">
            <div
              key={timeLeft}
              className={`flex flex-col items-center justify-center w-52 h-52 sm:w-64 sm:h-64 rounded-full bg-slate-950/45 backdrop-blur-[3px] border-4 transition-all animate-countdownPop ${
                timeLeft <= 2
                  ? 'border-rose-500/80 shadow-[0_0_80px_rgba(244,63,94,0.6)]'
                  : 'border-amber-400/80 shadow-[0_0_70px_rgba(245,158,11,0.5)]'
              }`}
            >
              <span
                className={`text-8xl sm:text-9xl md:text-[10rem] font-black font-mono leading-none drop-shadow-[0_8px_24px_rgba(0,0,0,0.95)] ${
                  timeLeft <= 2 ? 'text-rose-400/95' : 'text-amber-300/95'
                }`}
              >
                {timeLeft}
              </span>
              <span
                className={`text-xs sm:text-sm font-black uppercase tracking-widest -mt-1 drop-shadow-md ${
                  timeLeft <= 2 ? 'text-rose-200/90' : 'text-amber-200/90'
                }`}
              >
                {timeLeft === 1 ? 'SIAP-SIAP LOMPAT!' : 'DETIK LAGI!'}
              </span>
            </div>
          </div>
        )}

        {/* "LOMPAT!" 2-Second Jump Instruction Overlay (Suspense before answer reveals) */}
        {isJumping && !isRevealed && (
          <div className="absolute inset-0 flex flex-col items-center justify-center z-40 bg-slate-950/70 backdrop-blur-[3px] animate-fadeIn pointer-events-none">
            <div className="relative flex flex-col items-center max-w-xl mx-4 text-center">
              {/* Pulsing ambient glow */}
              <div className="absolute -inset-8 bg-gradient-to-r from-amber-500/30 via-rose-500/30 to-sky-500/30 blur-3xl animate-pulse rounded-full" />

              <div className="relative flex flex-col items-center p-6 sm:p-8 rounded-3xl bg-slate-950/95 border-4 border-amber-400 shadow-[0_0_100px_rgba(245,158,11,0.75)] animate-jumpPulse w-full">
                {/* Top Alert Badge */}
                <div className="px-4 py-1.5 rounded-full bg-amber-500 text-slate-950 font-black text-xs sm:text-sm uppercase tracking-widest mb-3 flex items-center gap-2 shadow-md">
                  <Footprints size={18} className="animate-bounce" />
                  <span>WAKTU HABIS! KUNCI PILIHAN</span>
                </div>

                {/* Massive Animated Text: LOMPAT! */}
                <h1 className="text-7xl sm:text-8xl md:text-9xl font-black text-transparent bg-clip-text bg-gradient-to-r from-amber-300 via-orange-400 to-rose-500 tracking-tight drop-shadow-[0_8px_32px_rgba(245,158,11,0.9)] animate-pulse leading-none">
                  LOMPAT!
                </h1>

                {/* Clear Subtitle */}
                <p className="text-base sm:text-xl font-black text-white mt-3 drop-shadow">
                  Melompat ke Sisi Pilihanmu Sekarang! 🏃‍♂️💨
                </p>

                {/* 2-Second Visual Countdown Gauge */}
                <div className="mt-4 flex items-center gap-3 px-6 py-2 rounded-2xl bg-slate-900/90 border border-amber-400/50 shadow-inner">
                  <span className="text-xs font-extrabold text-slate-300 uppercase tracking-wider">
                    Jawaban Terbuka Dalam:
                  </span>
                  <span className="text-3xl font-black font-mono text-amber-400 animate-pulse">
                    {jumpTimeLeft}s
                  </span>
                </div>

                {/* Visual Directional Zones */}
                <div className="w-full flex items-center justify-between mt-5 pt-4 border-t border-slate-800/80 text-xs sm:text-sm font-black">
                  <div className="flex items-center gap-2 text-sky-400">
                    <ArrowLeft size={18} className="animate-pulse" />
                    <span>ZONA A (KIRI)</span>
                  </div>
                  <div className="flex items-center gap-2 text-amber-400">
                    <span>ZONA B (KANAN)</span>
                    <ArrowRight size={18} className="animate-pulse" />
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Split Screen Zones: Left (A) | Straight Line | Right (B) */}
        <div className="absolute inset-0 flex pointer-events-none">
          {/* Zone A (Left Half) */}
          <div className={`flex-1 flex flex-col justify-start items-start p-4 sm:p-6 pt-24 sm:pt-28 gap-3 transition-all duration-500 relative ${
            isRevealed
              ? currentQ.correctAnswer === 'A'
                ? 'bg-emerald-600/60 backdrop-brightness-110 shadow-[inset_0_0_130px_rgba(5,150,105,0.75)]'
                : 'bg-rose-700/65 backdrop-brightness-90 shadow-[inset_0_0_130px_rgba(225,29,72,0.85)]'
              : ''
          }`}>
            {/* Choice Card A (Top Left) */}
            <div className={`p-3.5 sm:p-4 rounded-2xl min-w-[220px] max-w-xs sm:max-w-sm pointer-events-auto transition-all duration-300 shadow-xl ${
              isRevealed
                ? currentQ.correctAnswer === 'A'
                  ? 'bg-emerald-950/95 border-4 border-emerald-400 shadow-2xl shadow-emerald-500/60 ring-4 ring-emerald-400/30'
                  : 'bg-rose-950/95 border-4 border-rose-500 shadow-2xl shadow-rose-600/60 ring-4 ring-rose-500/30'
                : 'bg-slate-900/85 border-2 border-sky-500/70 shadow-lg'
            }`}>
              <div className="flex items-center gap-2.5 mb-1.5">
                <span className={`w-9 h-9 rounded-xl text-white flex items-center justify-center font-black text-lg shadow border-2 ${
                  isRevealed
                    ? currentQ.correctAnswer === 'A'
                      ? 'bg-emerald-500 border-emerald-200 shadow-emerald-400/50'
                      : 'bg-rose-600 border-rose-200 shadow-rose-500/50'
                    : 'bg-sky-500 border-sky-300'
                }`}>
                  A
                </span>
                <div>
                  <span className={`text-[11px] font-black tracking-wider uppercase block ${
                    isRevealed
                      ? currentQ.correctAnswer === 'A' ? 'text-emerald-300' : 'text-rose-300'
                      : 'text-sky-400'
                  }`}>
                    {isRevealed
                      ? (currentQ.correctAnswer === 'A' ? 'JAWABAN BENAR' : (gameMode === 'free' ? 'JAWABAN SALAH' : 'TERELIMINASI'))
                      : 'PILIHAN A'}
                  </span>
                  <span className="text-[10px] text-slate-300 font-bold">
                    Siswa: {crowdDensity.pctA}%
                  </span>
                </div>
              </div>
              <p className="text-base sm:text-lg font-black text-white leading-snug">
                {currentQ.choiceA}
              </p>
            </div>

            {/* Status Result Badge under Choice A when revealed */}
            {isRevealed && (
              <div className="animate-bounce-short pointer-events-auto">
                {currentQ.correctAnswer === 'A' ? (
                  <div className="px-5 py-2.5 rounded-xl bg-emerald-600 text-white font-black text-sm flex items-center gap-2 shadow-2xl border-2 border-emerald-200 shadow-emerald-500/60">
                    <ShieldCheck size={20} />
                    <span>ZONA A BENAR {gameMode === 'free' ? '(BENAR!)' : '(LOLOS)'}</span>
                  </div>
                ) : (
                  <div className="px-5 py-2.5 rounded-xl bg-rose-600 text-white font-black text-sm flex items-center gap-2 shadow-2xl border-2 border-rose-200 shadow-rose-600/60">
                    <X size={20} />
                    <span>ZONA A SALAH {gameMode === 'free' ? '(TETAP MAIN)' : '(GUGUR)'}</span>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Garis Lurus Pemisah Tengah Saja (Single Straight Line) */}
          <div className={`w-[2px] self-stretch pointer-events-none transition-all duration-500 ${
            isRevealed ? 'bg-white/80 shadow-[0_0_12px_rgba(255,255,255,0.8)]' : 'bg-white/40 shadow-sm'
          }`} />

          {/* Zone B (Right Half) */}
          <div className={`flex-1 flex flex-col justify-start items-end p-4 sm:p-6 pt-24 sm:pt-28 gap-3 transition-all duration-500 relative ${
            isRevealed
              ? currentQ.correctAnswer === 'B'
                ? 'bg-emerald-600/60 backdrop-brightness-110 shadow-[inset_0_0_130px_rgba(5,150,105,0.75)]'
                : 'bg-rose-700/65 backdrop-brightness-90 shadow-[inset_0_0_130px_rgba(225,29,72,0.85)]'
              : ''
          }`}>
            {/* Choice Card B (Top Right) */}
            <div className={`p-3.5 sm:p-4 rounded-2xl min-w-[220px] max-w-xs sm:max-w-sm text-right pointer-events-auto transition-all duration-300 shadow-xl ${
              isRevealed
                ? currentQ.correctAnswer === 'B'
                  ? 'bg-emerald-950/95 border-4 border-emerald-400 shadow-2xl shadow-emerald-500/60 ring-4 ring-emerald-400/30'
                  : 'bg-rose-950/95 border-4 border-rose-500 shadow-2xl shadow-rose-600/60 ring-4 ring-rose-500/30'
                : 'bg-slate-900/85 border-2 border-amber-500/70 shadow-lg'
            }`}>
              <div className="flex items-center justify-end gap-2.5 mb-1.5">
                <div>
                  <span className={`text-[11px] font-black tracking-wider uppercase block ${
                    isRevealed
                      ? currentQ.correctAnswer === 'B' ? 'text-emerald-300' : 'text-rose-300'
                      : 'text-amber-400'
                  }`}>
                    {isRevealed
                      ? (currentQ.correctAnswer === 'B' ? 'JAWABAN BENAR' : (gameMode === 'free' ? 'JAWABAN SALAH' : 'TERELIMINASI'))
                      : 'PILIHAN B'}
                  </span>
                  <span className="text-[10px] text-slate-300 font-bold">
                    Siswa: {crowdDensity.pctB}%
                  </span>
                </div>
                <span className={`w-9 h-9 rounded-xl text-white flex items-center justify-center font-black text-lg shadow border-2 ${
                  isRevealed
                    ? currentQ.correctAnswer === 'B'
                      ? 'bg-emerald-500 border-emerald-200 shadow-emerald-400/50'
                      : 'bg-rose-600 border-rose-200 shadow-rose-500/50'
                    : 'bg-amber-500 border-amber-300'
                }`}>
                  B
                </span>
              </div>
              <p className="text-base sm:text-lg font-black text-white leading-snug">
                {currentQ.choiceB}
              </p>
            </div>

            {/* Status Result Badge under Choice B when revealed */}
            {isRevealed && (
              <div className="animate-bounce-short pointer-events-auto">
                {currentQ.correctAnswer === 'B' ? (
                  <div className="px-5 py-2.5 rounded-xl bg-emerald-600 text-white font-black text-sm flex items-center gap-2 shadow-2xl border-2 border-emerald-200 shadow-emerald-500/60">
                    <ShieldCheck size={20} />
                    <span>ZONA B BENAR {gameMode === 'free' ? '(BENAR!)' : '(LOLOS)'}</span>
                  </div>
                ) : (
                  <div className="px-5 py-2.5 rounded-xl bg-rose-600 text-white font-black text-sm flex items-center gap-2 shadow-2xl border-2 border-rose-200 shadow-rose-600/60">
                    <X size={20} />
                    <span>ZONA B SALAH {gameMode === 'free' ? '(TETAP MAIN)' : '(GUGUR)'}</span>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Compact Realtime Crowd Density Bar (Bottom Center) */}
        {!isRevealed && (
          <div className="absolute bottom-3 inset-x-0 flex justify-center z-20 pointer-events-none">
            <div className="flex items-center gap-2 bg-slate-950/80 backdrop-blur-md px-3.5 py-1.5 rounded-full border border-slate-700/60 shadow-lg pointer-events-auto text-[11px]">
              <span className="font-bold text-sky-400">A ({crowdDensity.pctA}%)</span>
              <div className="w-24 h-2 rounded-full bg-slate-800 overflow-hidden flex">
                <div className="bg-sky-500 transition-all duration-300" style={{ width: `${crowdDensity.pctA}%` }} />
                <div className="bg-amber-500 transition-all duration-300" style={{ width: `${crowdDensity.pctB}%` }} />
              </div>
              <span className="font-bold text-amber-400">B ({crowdDensity.pctB}%)</span>
            </div>
          </div>
        )}

        {/* Compact Floating Action Button at Bottom Center when revealed */}
        {isRevealed && (
          <div className="absolute bottom-5 inset-x-0 flex justify-center z-30 pointer-events-auto animate-fadeIn">
            <button
              onClick={handleNextQuestion}
              className="h-14 px-8 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:opacity-95 text-white font-black text-base flex items-center gap-2.5 shadow-xl shadow-emerald-500/30 transition active:scale-95 animate-bounce-short border border-white/20"
            >
              <span>{currentQuestionIndex + 1 < gameQuestions.length ? 'Lanjut ke Soal Berikutnya' : (gameMode === 'free' ? 'Selesai & Lihat Rekap Kuis' : 'Lihat Juara Bertahan')}</span>
              <ArrowRight size={20} />
            </button>
          </div>
        )}
      </div>

      {/* Teacher Bottom Touch Control Bar */}
      <TeacherControls
        isPaused={isPaused}
        onTogglePause={() => setIsPaused(p => !p)}
        onRevealEarly={handleEarlyReveal}
        onSkipQuestion={handleSkipQuestion}
        onRepeatQuestion={handleRepeatQuestion}
        onQuitToMenu={onQuitToMenu}
        isTimerFinished={isRevealed}
        remainingStudents={remainingStudents}
        initialStudentsCount={initialStudentsCount}
        onAdjustRemaining={setRemainingStudents}
        onNextQuestion={handleNextQuestion}
        isLastQuestion={currentQuestionIndex + 1 >= gameQuestions.length}
        gameMode={gameMode}
        isJumping={isJumping}
      />
    </div>
  );
}
