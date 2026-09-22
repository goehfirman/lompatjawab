import React, { useEffect } from 'react';
import confetti from 'canvas-confetti';
import { Trophy, Medal, RotateCcw, Users, Home, Award, ShieldCheck, Flame, X } from 'lucide-react';

export function FinalScore({
  initialStudentsCount,
  remainingStudents,
  survivorTarget,
  totalQuestions,
  questions,
  roundEliminations = [],
  onPlayAgain,
  onBackToMenu
}) {
  const eliminatedTotal = initialStudentsCount - remainingStudents;

  // Fire celebratory confetti
  useEffect(() => {
    try {
      const end = Date.now() + 4000;
      const colors = ['#38bdf8', '#fb923c', '#34d399', '#f59e0b', '#e11d48'];

      (function frame() {
        confetti({
          particleCount: 5,
          angle: 60,
          spread: 60,
          origin: { x: 0 },
          colors: colors
        });
        confetti({
          particleCount: 5,
          angle: 120,
          spread: 60,
          origin: { x: 1 },
          colors: colors
        });

        if (Date.now() < end) {
          requestAnimationFrame(frame);
        }
      }());
    } catch (e) {}
  }, []);

  return (
    <div className="flex-1 flex flex-col overflow-y-auto bg-slate-950 text-slate-100 p-6 space-y-8 relative z-10 select-none">
      {/* Header Banner */}
      <div className="text-center space-y-3 pt-2">
        <div className="inline-flex items-center gap-2 px-6 py-2 rounded-full bg-amber-500/20 border border-amber-500/50 text-amber-300 font-black text-sm tracking-wider uppercase shadow-xl animate-bounce-short">
          <Trophy size={20} className="text-amber-400" />
          PERMAINAN SELESAI — SELAMAT KEPADA SELURUH JUARA BERTAHAN!
        </div>
        <h1 className="text-4xl md:text-6xl font-black text-white tracking-tight">
          Juara Bertahan Kuis
        </h1>
        <p className="text-slate-300 font-medium text-base max-w-xl mx-auto">
          Luar biasa! Setelah melewati rintangan soal demi soal dan melompat tepat ke zona yang benar, berikut adalah hasil akhir kelas:
        </p>
      </div>

      {/* Class Statistics Scorecards */}
      <div className="max-w-4xl mx-auto w-full grid grid-cols-1 sm:grid-cols-3 gap-5">
        {/* Surviving Champions */}
        <div className="p-6 rounded-3xl bg-gradient-to-b from-emerald-950/80 to-slate-900 border-2 border-emerald-500 shadow-2xl shadow-emerald-500/25 flex flex-col items-center text-center">
          <div className="w-14 h-14 rounded-2xl bg-emerald-500 text-white flex items-center justify-center font-black text-2xl mb-3 shadow-lg shadow-emerald-500/40">
            <Trophy size={28} />
          </div>
          <span className="text-xs font-black text-emerald-400 uppercase tracking-wider">
            Juara Bertahan Lolos
          </span>
          <div className="text-5xl font-black text-white my-1">
            {remainingStudents}
          </div>
          <span className="text-xs text-slate-400 font-semibold">Siswa Berhasil Lolos</span>
        </div>

        {/* Total Class Participants */}
        <div className="p-6 rounded-3xl bg-slate-900/90 border border-slate-800 flex flex-col items-center text-center">
          <div className="w-14 h-14 rounded-2xl bg-sky-500/20 text-sky-400 flex items-center justify-center font-black text-2xl mb-3 border border-sky-500/30">
            <Users size={28} />
          </div>
          <span className="text-xs font-black text-sky-400 uppercase tracking-wider">
            Total Siswa Peserta
          </span>
          <div className="text-5xl font-black text-white my-1">
            {initialStudentsCount}
          </div>
          <span className="text-xs text-slate-400 font-semibold">Peserta di Awal Kuis</span>
        </div>

        {/* Total Eliminated */}
        <div className="p-6 rounded-3xl bg-slate-900/90 border border-slate-800 flex flex-col items-center text-center">
          <div className="w-14 h-14 rounded-2xl bg-rose-600/20 text-rose-400 flex items-center justify-center font-black text-2xl mb-3 border border-rose-500/30">
            <X size={28} />
          </div>
          <span className="text-xs font-black text-rose-400 uppercase tracking-wider">
            Siswa Tereliminasi
          </span>
          <div className="text-5xl font-black text-white my-1">
            {eliminatedTotal}
          </div>
          <span className="text-xs text-slate-400 font-semibold">Gugur Selama Kuis</span>
        </div>
      </div>

      {/* Round-by-Round Elimination History */}
      <div className="max-w-4xl mx-auto w-full bg-slate-900/90 border border-slate-800 rounded-3xl p-6 space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="font-extrabold text-lg text-white flex items-center gap-2">
            <Award size={22} className="text-amber-400" />
            Rekap Babak Eliminasi per Soal
          </h2>
          <span className="text-xs text-slate-400 font-semibold">
            {questions.length} Soal Dimainkan
          </span>
        </div>

        <div className="space-y-3">
          {questions.map((q, idx) => {
            const roundData = roundEliminations[idx] || { eliminatedCount: 0, remainingAfter: initialStudentsCount };

            return (
              <div
                key={idx}
                className="p-4 rounded-2xl bg-slate-800/50 border border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
              >
                <div className="space-y-1 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="w-7 h-7 rounded-lg bg-slate-800 text-xs font-black flex items-center justify-center text-slate-300">
                      #{idx + 1}
                    </span>
                    <h3 className="font-bold text-sm text-slate-200">
                      {q.text}
                    </h3>
                  </div>
                  <div className="text-xs text-slate-400 flex items-center gap-3 pl-9">
                    <span>Zona Aman: <strong className="text-emerald-400 font-bold">Zona {q.correctAnswer}</strong></span>
                    {q.explanation && (
                      <span className="italic truncate max-w-sm text-slate-500 hidden md:inline">
                        ({q.explanation})
                      </span>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-4 pl-9 sm:pl-0 shrink-0">
                  <div className="text-right">
                    <span className="text-xs font-bold text-rose-400 block">
                      -{roundData.eliminatedCount} Siswa Gugur
                    </span>
                    <span className="text-[11px] text-slate-400 font-semibold">
                      Tersisa {roundData.remainingAfter} Anak
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Actions */}
      <div className="max-w-4xl mx-auto w-full flex flex-wrap items-center justify-center gap-4 pb-8">
        <button
          onClick={onPlayAgain}
          className="h-14 px-8 rounded-2xl bg-emerald-500 hover:bg-emerald-400 text-white font-black text-base flex items-center gap-2.5 shadow-xl shadow-emerald-500/30 transition active:scale-95"
        >
          <RotateCcw size={20} />
          Main Lagi (Reset Kelas)
        </button>

        <button
          onClick={onBackToMenu}
          className="h-14 px-8 rounded-2xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 font-bold text-base flex items-center gap-2.5 transition active:scale-95"
        >
          <Home size={20} />
          Kembali ke Menu Utama
        </button>
      </div>
    </div>
  );
}
