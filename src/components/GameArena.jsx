import React, { useState, useEffect, useRef } from 'react';
import { Clock, Pause, AlertTriangle, Sparkles, ShieldCheck, X, ArrowRight } from 'lucide-react';
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
  const { initialStudentsCount = 20, survivorTarget = 1 } = settings;

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
    if (countdownStart > 0 || isPaused || isRevealed) return;

    timerIntervalRef.current = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timerIntervalRef.current);
          handleLockAnswers();
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
  }, [countdownStart, isPaused, isRevealed]);

  // Lock answers and eliminate the wrong zone
  const handleLockAnswers = () => {
    audioRef.current?.playWhistle();

    // Sound siren for wrong zone and safe chime for correct zone
    setTimeout(() => {
      audioRef.current?.playEliminationSiren();
    }, 300);

    setTimeout(() => {
      audioRef.current?.playSafeChime();
    }, 1000);

    // Estimate eliminated students based on crowd density or conservative drop
    const correctZone = currentQ.correctAnswer;
    const estimatedWrongPct = correctZone === 'A' ? (crowdDensity.pctB / 100) : (crowdDensity.pctA / 100);
    
    // Estimate students who picked wrong side (at least 1 if remaining > 1, max remaining - 1)
    let estimatedEliminated = Math.round(remainingStudents * Math.max(0.15, Math.min(0.85, estimatedWrongPct)));
    if (estimatedEliminated >= remainingStudents) {
      estimatedEliminated = remainingStudents - 1;
    }
    const newRemaining = Math.max(1, remainingStudents - estimatedEliminated);

    setRoundEliminations(prev => [
      ...prev,
      {
        questionIndex: currentQuestionIndex,
        correctZone,
        eliminatedCount: estimatedEliminated,
        remainingAfter: newRemaining
      }
    ]);

    setRemainingStudents(newRemaining);
    setIsRevealed(true);
  };

  // Next question or finish
  const handleNextQuestion = () => {
    setIsRevealed(false);

    // If remaining students is at or below target (e.g. 1 or 3) or questions finished
    if (remainingStudents <= survivorTarget || currentQuestionIndex + 1 >= gameQuestions.length) {
      onFinishGame({
        initialStudentsCount,
        survivorTarget,
        remainingStudents,
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
    setTimeLeft(timerSeconds);
  };

  // Keyboard shortcut for fast teacher control
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === ' ' && !isRevealed) {
        e.preventDefault();
        setIsPaused(p => !p);
      } else if (e.key === 'Enter' && !isRevealed && timeLeft > 0) {
        e.preventDefault();
        handleLockAnswers();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isRevealed, timeLeft]);

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
                <span className="text-[11px] font-semibold text-slate-300 hidden sm:inline">
                  Siswa Bertahan: <strong className="text-emerald-400 font-bold">{remainingStudents}</strong>
                </span>
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
        {!isRevealed && countdownStart === 0 && timeLeft <= 5 && timeLeft > 0 && (
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
                {timeLeft === 1 ? 'WAKTU HABIS!' : 'DETIK LAGI!'}
              </span>
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
                      ? (currentQ.correctAnswer === 'A' ? 'JAWABAN BENAR' : 'TERELIMINASI')
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
                    <span>ZONA A BENAR (LOLOS)</span>
                  </div>
                ) : (
                  <div className="px-5 py-2.5 rounded-xl bg-rose-600 text-white font-black text-sm flex items-center gap-2 shadow-2xl border-2 border-rose-200 shadow-rose-600/60 animate-pulse">
                    <X size={20} />
                    <span>ZONA A SALAH (GUGUR)</span>
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
                      ? (currentQ.correctAnswer === 'B' ? 'JAWABAN BENAR' : 'TERELIMINASI')
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
                    <span>ZONA B BENAR (LOLOS)</span>
                  </div>
                ) : (
                  <div className="px-5 py-2.5 rounded-xl bg-rose-600 text-white font-black text-sm flex items-center gap-2 shadow-2xl border-2 border-rose-200 shadow-rose-600/60 animate-pulse">
                    <X size={20} />
                    <span>ZONA B SALAH (GUGUR)</span>
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
              <span>{currentQuestionIndex + 1 < gameQuestions.length ? 'Lanjut ke Soal Berikutnya' : 'Lihat Juara Bertahan'}</span>
              <ArrowRight size={20} />
            </button>
          </div>
        )}
      </div>

      {/* Teacher Bottom Touch Control Bar */}
      <TeacherControls
        isPaused={isPaused}
        onTogglePause={() => setIsPaused(p => !p)}
        onRevealEarly={handleLockAnswers}
        onSkipQuestion={handleSkipQuestion}
        onRepeatQuestion={handleRepeatQuestion}
        onQuitToMenu={onQuitToMenu}
        isTimerFinished={isRevealed}
        remainingStudents={remainingStudents}
        initialStudentsCount={initialStudentsCount}
        onAdjustRemaining={setRemainingStudents}
        onNextQuestion={handleNextQuestion}
        isLastQuestion={currentQuestionIndex + 1 >= gameQuestions.length}
      />
    </div>
  );
}
