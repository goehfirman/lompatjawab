import React from 'react';
import { 
  Play, Pause, FastForward, RotateCcw, CheckCircle, 
  Users, LogOut, Minus, Plus 
} from 'lucide-react';

export function TeacherControls({
  isPaused,
  onTogglePause,
  onRevealEarly,
  onSkipQuestion,
  onRepeatQuestion,
  onQuitToMenu,
  isTimerFinished,
  remainingStudents,
  initialStudentsCount,
  onAdjustRemaining,
  onNextQuestion,
  isLastQuestion
}) {
  return (
    <footer className="h-20 px-6 bg-slate-900/95 backdrop-blur-md border-t border-slate-800 flex items-center justify-between z-30 shrink-0 gap-4">
      {/* Left: Remaining Students Touch Adjuster */}
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2 px-3.5 py-2 rounded-2xl bg-slate-800/90 border border-slate-700">
          <Users size={18} className="text-amber-400" />
          <span className="text-xs font-bold text-slate-300">
            Siswa Bertahan: <strong className="text-emerald-400 text-base font-black">{remainingStudents}</strong> / {initialStudentsCount}
          </span>
        </div>

        {/* Quick touch buttons for teacher */}
        <div className="flex items-center gap-1.5">
          <button
            onClick={() => onAdjustRemaining(Math.max(1, remainingStudents - 1))}
            className="w-10 h-10 rounded-xl bg-slate-800 hover:bg-slate-700 text-rose-400 border border-slate-700 font-black flex items-center justify-center transition active:scale-95"
            title="Kurangi 1 Siswa yang Tereliminasi"
          >
            <Minus size={18} />
          </button>
          <button
            onClick={() => onAdjustRemaining(remainingStudents + 1)}
            className="w-10 h-10 rounded-xl bg-slate-800 hover:bg-slate-700 text-emerald-400 border border-slate-700 font-black flex items-center justify-center transition active:scale-95"
            title="Tambah 1 Siswa"
          >
            <Plus size={18} />
          </button>
        </div>
      </div>

      {/* Right: Teacher Quick Action Buttons (Touch target >= 48px) */}
      <div className="flex items-center gap-2 shrink-0">
        {/* Next Question button when answer is revealed */}
        {isTimerFinished && (
          <button
            onClick={onNextQuestion}
            className="h-12 px-6 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-500 text-white font-black text-sm flex items-center gap-2 shadow-xl shadow-emerald-500/30 transition active:scale-95 animate-bounce-short"
          >
            <span>{isLastQuestion ? 'Lihat Juara Bertahan 🏆' : 'Soal Berikutnya ➜'}</span>
          </button>
        )}

        {/* Early Reveal */}
        {!isTimerFinished && (
          <button
            onClick={onRevealEarly}
            className="h-12 px-5 rounded-2xl bg-indigo-600 hover:bg-indigo-500 text-white font-black text-xs flex items-center gap-2 shadow-lg shadow-indigo-600/30 transition active:scale-95"
            title="Kunci & Ungkapkan jawaban benar sekarang"
          >
            <CheckCircle size={18} />
            <span className="hidden sm:inline">Kunci & Buka Sekarang</span>
          </button>
        )}

        {/* Pause / Resume */}
        <button
          onClick={onTogglePause}
          className={`h-12 px-4 rounded-2xl font-bold text-xs flex items-center gap-2 transition active:scale-95 ${
            isPaused
              ? 'bg-emerald-600 hover:bg-emerald-500 text-white'
              : 'bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700'
          }`}
        >
          {isPaused ? <Play size={18} /> : <Pause size={18} />}
          <span className="hidden sm:inline">{isPaused ? 'Lanjut' : 'Jeda'}</span>
        </button>

        {/* Repeat Question */}
        <button
          onClick={onRepeatQuestion}
          className="h-12 w-12 rounded-2xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 flex items-center justify-center transition active:scale-95"
          title="Ulangi Soal Ini"
        >
          <RotateCcw size={18} />
        </button>

        {/* Skip Question */}
        <button
          onClick={onSkipQuestion}
          className="h-12 px-4 rounded-2xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 font-bold text-xs flex items-center gap-2 transition active:scale-95"
          title="Lewati Soal Ini"
        >
          <FastForward size={18} />
          <span className="hidden sm:inline">Lewati</span>
        </button>

        {/* Quit to Menu */}
        <button
          onClick={onQuitToMenu}
          className="h-12 w-12 rounded-2xl bg-rose-600/20 hover:bg-rose-600/30 text-rose-300 border border-rose-500/30 flex items-center justify-center transition active:scale-95"
          title="Keluar ke Menu"
        >
          <LogOut size={18} />
        </button>
      </div>
    </footer>
  );
}
