import React from 'react';
import { Play, BookOpen, Sparkles, Layers, ShieldCheck, Footprints, Flame, Camera, ChevronRight } from 'lucide-react';

export function HomeScreen({
  sets,
  activeSetId,
  onSelectSet,
  onStartCalibration,
  onOpenManager,
  isCameraReady,
  onRequestCamera
}) {
  const activeSet = sets.find(s => s.id === activeSetId) || sets[0];

  return (
    <div className="flex-1 flex flex-col items-center justify-between p-6 md:p-10 overflow-y-auto text-slate-100 space-y-8 select-none">
      {/* Hero Section */}
      <div className="text-center space-y-4 max-w-3xl pt-2">
        <div className="inline-flex items-center gap-2 px-5 py-2 rounded-full bg-slate-900/90 border border-slate-700 text-sky-300 font-extrabold text-xs tracking-wider uppercase shadow-xl backdrop-blur">
          <Sparkles size={16} className="text-amber-400" />
          Game Edukasi Gerak Papan Interaktif Digital (PID) — Mode Eliminasi Massal
        </div>

        <h1 className="text-4xl sm:text-6xl font-black tracking-tight text-white leading-tight drop-shadow-lg">
          LOMPAT <span className="bg-gradient-to-r from-sky-400 via-amber-300 to-orange-400 bg-clip-text text-transparent">PILIH</span>
        </h1>

        <p className="text-base sm:text-xl text-slate-200 font-semibold max-w-2xl mx-auto leading-relaxed drop-shadow">
          Main bersama satu kelas! Siswa melompat ke sisi <strong>Kiri (A)</strong> atau <strong>Kanan (B)</strong> di depan kamera PID. Yang menjawab benar <strong>lanjut ke babak berikutnya</strong>, yang salah <strong>tereliminasi</strong>!
        </p>
      </div>

      {/* Camera Prompt if not ready */}
      {!isCameraReady && (
        <div className="w-full max-w-3xl bg-amber-950/60 backdrop-blur-md border-2 border-amber-500/80 rounded-3xl p-5 flex flex-col sm:flex-row items-center justify-between gap-4 shadow-2xl animate-bounce-short">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-amber-500 text-slate-950 flex items-center justify-center font-black">
              <Camera size={24} />
            </div>
            <div>
              <h3 className="font-extrabold text-base text-white">Kamera PID Belum Aktif</h3>
              <p className="text-xs text-amber-200">
                Klik tombol di samping untuk mengizinkan akses kamera PID agar seluruh kelas terlihat di layar.
              </p>
            </div>
          </div>
          <button
            onClick={onRequestCamera}
            className="px-6 py-3 rounded-2xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-sm shadow-xl shadow-amber-500/30 transition active:scale-95 shrink-0"
          >
            Aktifkan Kamera Sekarang
          </button>
        </div>
      )}

      {/* Selected Set Card & Quick Start */}
      <div className="w-full max-w-3xl bg-slate-900/85 backdrop-blur-xl border border-slate-700 rounded-3xl p-6 sm:p-8 shadow-2xl space-y-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-slate-800 pb-5">
          <div>
            <span className="text-xs font-black text-amber-400 uppercase tracking-wider block mb-1">
              Set Soal Kuis Terpilih
            </span>
            <h2 className="text-2xl font-black text-white">{activeSet.title}</h2>
            <p className="text-xs text-slate-300 font-semibold mt-1">
              {activeSet.subject} • {activeSet.grade} • {activeSet.questions.length} Soal • {activeSet.timerSeconds} detik/soal
            </p>
          </div>

          <button
            onClick={onOpenManager}
            className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 font-bold text-xs flex items-center gap-1.5 transition shadow"
          >
            <BookOpen size={16} className="text-amber-400" /> Bank Soal Guru
          </button>
        </div>

        {/* Big Action Buttons */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <button
            onClick={onStartCalibration}
            className="h-20 rounded-2xl bg-gradient-to-r from-emerald-500 via-teal-500 to-sky-500 hover:opacity-95 text-white font-black text-xl flex items-center justify-center gap-3 shadow-2xl shadow-emerald-500/30 transition active:scale-[0.98]"
          >
            <Play size={28} fill="currentColor" />
            <span>Mulai Ronde Eliminasi</span>
          </button>

          <button
            onClick={onOpenManager}
            className="h-20 rounded-2xl bg-slate-800/90 hover:bg-slate-800 text-slate-200 border border-slate-700 font-black text-lg flex items-center justify-center gap-3 transition active:scale-[0.98]"
          >
            <Layers size={24} className="text-amber-400" />
            <span>Kelola Bank Soal ({sets.length})</span>
          </button>
        </div>
      </div>

      {/* 3 Step Interactive Battle Royale Guide */}
      <div className="w-full max-w-4xl grid grid-cols-1 md:grid-cols-3 gap-4 pb-4">
        <div className="p-5 rounded-3xl bg-slate-900/80 backdrop-blur border border-slate-800 space-y-2">
          <div className="w-10 h-10 rounded-2xl bg-sky-500/20 text-sky-400 font-black text-base flex items-center justify-center border border-sky-500/40">
            1
          </div>
          <h3 className="font-extrabold text-white text-base">Seluruh Kelas Bersiap</h3>
          <p className="text-xs text-slate-300 leading-relaxed font-medium">
            Siswa berdiri di depan kamera PID menghadap layar. Layar dibagi dua: Zona A (Kiri) dan Zona B (Kanan).
          </p>
        </div>

        <div className="p-5 rounded-3xl bg-slate-900/80 backdrop-blur border border-slate-800 space-y-2">
          <div className="w-10 h-10 rounded-2xl bg-amber-500/20 text-amber-400 font-black text-base flex items-center justify-center border border-amber-500/40">
            2
          </div>
          <h3 className="font-extrabold text-white text-base">Melompat ke Sisi Pilihan</h3>
          <p className="text-xs text-slate-300 leading-relaxed font-medium">
            Soal tampil dengan timer hitung mundur. Siswa ramai-ramai melompat ke sisi A atau B sesuai jawaban mereka.
          </p>
        </div>

        <div className="p-5 rounded-3xl bg-slate-900/80 backdrop-blur border border-slate-800 space-y-2">
          <div className="w-10 h-10 rounded-2xl bg-rose-500/20 text-rose-400 font-black text-base flex items-center justify-center border border-rose-500/40">
            3
          </div>
          <h3 className="font-extrabold text-white text-base">Eliminasi & Lolos</h3>
          <p className="text-xs text-slate-300 leading-relaxed font-medium">
            Saat waktu habis, sisi yang salah <strong>TERELIMINASI</strong> (gugur/duduk). Sisi yang benar <strong>LOLOS</strong> ke babak berikutnya!
          </p>
        </div>
      </div>
    </div>
  );
}
