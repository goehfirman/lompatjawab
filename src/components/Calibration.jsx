import React, { useRef, useEffect } from 'react';
import { 
  Users, ShieldAlert, Video, Play, AlertCircle, RefreshCw, 
  Flame, Sparkles, Footprints, Trophy, Camera, Medal, Check 
} from 'lucide-react';

export function Calibration({
  activeSet,
  settings,
  onUpdateSettings,
  onStartCountdown,
  isCameraReady,
  cameraError,
  onRequestCamera,
  crowdDensity,
  fps,
  stream
}) {
  const { 
    initialStudentsCount = 20, 
    survivorTarget = 1, 
    gameMode = 'free',
    motionMode = 'jump', 
    timerOverride 
  } = settings;

  const calibVideoRef = useRef(null);

  useEffect(() => {
    if (calibVideoRef.current && stream) {
      calibVideoRef.current.srcObject = stream;
      calibVideoRef.current.play().catch(e => console.warn("calib video play deferred:", e));
    }
  }, [stream]);

  const handleStudentsCountChange = (count) => {
    onUpdateSettings({ ...settings, initialStudentsCount: Math.max(2, count) });
  };

  return (
    <div className="flex-1 flex flex-col lg:flex-row overflow-hidden bg-slate-950 text-slate-100 p-6 gap-6 relative z-10">
      {/* Left: Interactive Class Camera Alignment & Live Crowd Test */}
      <div className="flex-1 flex flex-col bg-slate-900/80 backdrop-blur border border-slate-800 rounded-3xl p-5 relative overflow-hidden">
        <div className="flex items-center justify-between mb-3 z-20">
          <div className="flex items-center gap-2">
            <span className={`w-3 h-3 rounded-full ${isCameraReady ? 'bg-emerald-500 animate-ping' : 'bg-rose-500'}`} />
            <h2 className="font-extrabold text-xl text-white">Area Kamera Seluruh Kelas</h2>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs px-2.5 py-1 rounded-lg bg-slate-800/80 font-mono text-slate-300">
              {fps} FPS
            </span>
            {!isCameraReady && (
              <button
                type="button"
                onClick={onRequestCamera}
                className="text-xs px-3 py-1.5 rounded-xl font-bold bg-rose-600 hover:bg-rose-500 text-white flex items-center gap-1.5 shadow"
              >
                <Camera size={14} /> Izinkan Kamera
              </button>
            )}
          </div>
        </div>

        {/* Viewport Frame with Live Video */}
        <div className="relative flex-1 bg-black rounded-2xl overflow-hidden border-2 border-slate-700/60 flex items-center justify-center min-h-[360px]">
          {/* Live Video in Calibration Frame */}
          <video
            ref={calibVideoRef}
            playsInline
            muted
            autoPlay
            className="absolute inset-0 w-full h-full object-cover -scale-x-100 z-0"
          />

          {/* Center Dividing Line in Preview */}
          <div className="absolute inset-y-0 left-1/2 w-[2px] bg-white/50 -translate-x-1/2 pointer-events-none z-10 shadow" />

          {/* Top Zone Labels */}
          <div className="absolute inset-x-0 top-4 flex justify-between px-6 pointer-events-none z-20">
            <div className="bg-sky-500/90 text-white font-extrabold text-lg px-4 py-1.5 rounded-xl shadow-lg border border-sky-300">
              <span>ZONA A (KIRI)</span>
            </div>
            <div className="bg-amber-500/90 text-white font-extrabold text-lg px-4 py-1.5 rounded-xl shadow-lg border border-amber-300">
              <span>ZONA B (KANAN)</span>
            </div>
          </div>

          {/* Interactive Crowd Density Bar at Bottom of Camera */}
          <div className="absolute bottom-6 inset-x-8 z-20 bg-slate-900/90 backdrop-blur-md border border-slate-700 p-3.5 rounded-2xl flex items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <span className="font-extrabold text-sm text-sky-400">Kepadatan Zona A:</span>
              <span className="font-mono font-black text-base text-white">{crowdDensity.pctA}%</span>
            </div>

            {/* Visual Balance Bar */}
            <div className="flex-1 h-3 rounded-full bg-slate-800 overflow-hidden flex">
              <div className="bg-sky-500 transition-all duration-300" style={{ width: `${crowdDensity.pctA}%` }} />
              <div className="bg-amber-500 transition-all duration-300" style={{ width: `${crowdDensity.pctB}%` }} />
            </div>

            <div className="flex items-center gap-2">
              <span className="font-extrabold text-sm text-amber-400">Kepadatan Zona B:</span>
              <span className="font-mono font-black text-base text-white">{crowdDensity.pctB}%</span>
            </div>
          </div>

          {/* Camera Inactive / Error Overlay */}
          {!isCameraReady && (
            <div className="absolute inset-0 bg-slate-950/90 backdrop-blur-md flex flex-col items-center justify-center p-6 text-center z-30 space-y-4">
              <div className="w-16 h-16 rounded-3xl bg-amber-500/20 text-amber-400 flex items-center justify-center border border-amber-500/30">
                <Camera size={32} />
              </div>
              <div className="max-w-md space-y-1">
                <h3 className="font-bold text-lg text-white">
                  {cameraError ? "Kendala Kamera" : "Kamera Belum Aktif di Layar"}
                </h3>
                <p className="text-xs text-slate-300 leading-relaxed">
                  {cameraError || "Klik tombol di bawah untuk mengizinkan akses kamera PID agar seluruh kelas terlihat di layar."}
                </p>
              </div>
              <button
                type="button"
                onClick={onRequestCamera}
                className="px-6 py-3 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:opacity-95 text-white font-black text-sm shadow-xl shadow-emerald-500/30 flex items-center gap-2 transition active:scale-95"
              >
                <Camera size={18} /> Nyalakan / Izinkan Kamera
              </button>
            </div>
          )}
        </div>

        {/* Live instructions */}
        <div className="mt-3 p-3 rounded-xl bg-slate-800/60 border border-slate-700/60 flex items-center justify-between text-xs text-slate-300">
          <span>
            💡 <strong>Panduan:</strong> Minta seluruh siswa berdiri di depan kamera PID. Siswa dapat bergerak ke sisi kiri (A) atau kanan (B) untuk mencoba batas zona sebelum kuis dimulai.
          </span>
        </div>
      </div>

      {/* Right Sidebar: Mass Battle Royale Settings */}
      <div className="w-full lg:w-96 flex flex-col gap-5 shrink-0">
        {/* Safety Guidelines */}
        <div className="p-4 rounded-3xl bg-amber-950/40 border border-amber-600/40 text-amber-200 space-y-2">
          <div className="flex items-center gap-2 font-black text-sm text-amber-300">
            <ShieldAlert size={18} />
            ATURAN KESELAMATAN KELAS
          </div>
          <ul className="text-xs space-y-1 text-amber-200/90 list-disc list-inside">
            <li>Bersihkan lantai dari tas dan rintangan meja/kursi.</li>
            <li>Siswa melompat atau berpindah dengan tertib tanpa saling mendorong.</li>
            <li>Siswa yang tereliminasi langsung berjalan ke pinggir arena / duduk.</li>
          </ul>
        </div>

        {/* Settings Form */}
        <div className="flex-1 bg-slate-900/80 border border-slate-800 rounded-3xl p-5 space-y-5 overflow-y-auto">
          {/* Active Set Info */}
          <div>
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block mb-1">
              Set Kuis Terpilih
            </span>
            <div className="p-3.5 rounded-2xl bg-slate-800/80 border border-slate-700">
              <h3 className="font-black text-white text-base leading-tight">{activeSet.title}</h3>
              <p className="text-xs text-sky-400 font-semibold mt-1">
                {activeSet.subject} • {activeSet.questions.length} Soal • {activeSet.timerSeconds} dtk/soal
              </p>
            </div>
          </div>

          {/* Initial Class Size (Jumlah Siswa Awal) */}
          <div>
            <label className="text-xs font-bold text-slate-300 flex items-center justify-between mb-2">
              <span className="flex items-center gap-1.5">
                <Users size={16} className="text-amber-400" /> Jumlah Siswa Peserta
              </span>
              <span className="text-amber-400 font-black text-lg">{initialStudentsCount} Siswa</span>
            </label>
            
            {/* Quick buttons */}
            <div className="grid grid-cols-4 gap-2 mb-2">
              {[15, 20, 25, 30].map(count => (
                <button
                  key={count}
                  type="button"
                  onClick={() => handleStudentsCountChange(count)}
                  className={`py-2 rounded-xl text-xs font-bold transition border ${
                    initialStudentsCount === count
                      ? 'bg-amber-500 text-white border-amber-400 shadow-md shadow-amber-500/25'
                      : 'bg-slate-800 hover:bg-slate-700 text-slate-300 border-slate-700'
                  }`}
                >
                  {count} Siswa
                </button>
              ))}
            </div>

            {/* Custom slider */}
            <div className="flex items-center gap-3">
              <input
                type="range"
                min="5"
                max="50"
                step="1"
                value={initialStudentsCount}
                onChange={(e) => handleStudentsCountChange(parseInt(e.target.value))}
                className="flex-1 accent-amber-500"
              />
              <span className="text-xs font-bold text-slate-300 min-w-[3rem] text-right">
                {initialStudentsCount} Anak
              </span>
            </div>
          </div>

          {/* Mode & Aturan Permainan */}
          <div className="space-y-2">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">
              Mode & Aturan Selesai
            </span>

            {/* Mode Bebas (Semua Soal - Tanpa Batas Eliminasi) */}
            <button
              type="button"
              onClick={() => onUpdateSettings({ ...settings, gameMode: 'free', survivorTarget: 0 })}
              className={`w-full p-3.5 rounded-2xl border text-left transition flex items-start justify-between gap-3 ${
                gameMode === 'free'
                  ? 'bg-gradient-to-r from-emerald-950/80 to-teal-950/80 border-emerald-500 text-emerald-200 ring-2 ring-emerald-500/40 shadow-lg shadow-emerald-500/10'
                  : 'bg-slate-800/60 border-slate-700 text-slate-400 hover:bg-slate-800'
              }`}
            >
              <div className="space-y-1">
                <div className="flex items-center gap-2 font-black text-sm text-white">
                  <div className={`w-6 h-6 rounded-lg flex items-center justify-center ${gameMode === 'free' ? 'bg-emerald-500 text-white' : 'bg-slate-700 text-slate-300'}`}>
                    <Sparkles size={14} />
                  </div>
                  <span>Mode Bebas (Sampai Soal Habis)</span>
                  <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 text-[10px] font-bold border border-emerald-500/30">
                    Bebas
                  </span>
                </div>
                <p className="text-xs text-slate-300 pl-8 leading-relaxed">
                  Tidak ada batasan siswa tereliminasi. Seluruh kelas bermain bersama di setiap nomor soal dari awal sampai soal habis.
                </p>
              </div>
              <div className={`w-5 h-5 rounded-full border-2 mt-0.5 flex items-center justify-center shrink-0 ${
                gameMode === 'free' ? 'border-emerald-400 bg-emerald-500' : 'border-slate-600'
              }`}>
                {gameMode === 'free' && <Check size={12} className="text-white" />}
              </div>
            </button>

            {/* Mode Eliminasi Options */}
            <div className="grid grid-cols-2 gap-2 pt-1">
              <button
                type="button"
                onClick={() => onUpdateSettings({ ...settings, gameMode: 'elimination', survivorTarget: 1 })}
                className={`p-3 rounded-2xl border text-left transition ${
                  gameMode === 'elimination' && survivorTarget === 1
                    ? 'bg-amber-950/70 border-amber-500 text-amber-200 ring-2 ring-amber-500/40 shadow-md shadow-amber-500/10'
                    : 'bg-slate-800/60 border-slate-700 text-slate-400 hover:bg-slate-800'
                }`}
              >
                <div className="flex items-center gap-1.5 font-bold text-xs text-white">
                  <Trophy size={16} className="text-amber-400" /> Eliminasi: 1 Juara
                </div>
                <p className="text-[11px] mt-1 text-slate-300 leading-snug">Main sampai tersisa 1 siswa juara</p>
              </button>

              <button
                type="button"
                onClick={() => onUpdateSettings({ ...settings, gameMode: 'elimination', survivorTarget: 3 })}
                className={`p-3 rounded-2xl border text-left transition ${
                  gameMode === 'elimination' && survivorTarget === 3
                    ? 'bg-amber-950/70 border-amber-500 text-amber-200 ring-2 ring-amber-500/40 shadow-md shadow-amber-500/10'
                    : 'bg-slate-800/60 border-slate-700 text-slate-400 hover:bg-slate-800'
                }`}
              >
                <div className="flex items-center gap-1.5 font-bold text-xs text-white">
                  <Medal size={16} className="text-sky-400" /> Eliminasi: Top 3
                </div>
                <p className="text-[11px] mt-1 text-slate-300 leading-snug">Main sampai tersisa 3 siswa juara</p>
              </button>
            </div>
          </div>

          {/* Motion Mode */}
          <div>
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block mb-2">
              Gaya Gerak Siswa
            </span>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => onUpdateSettings({ ...settings, motionMode: 'jump' })}
                className={`p-3 rounded-2xl border text-left transition ${
                  motionMode === 'jump'
                    ? 'bg-sky-950/60 border-sky-500 text-sky-200'
                    : 'bg-slate-800/60 border-slate-700 text-slate-400'
                }`}
              >
                <div className="flex items-center gap-1.5 font-bold text-xs text-white">
                  <Flame size={16} className="text-orange-400" /> Lompat Ceria
                </div>
                <p className="text-[11px] mt-1 opacity-80">Melompat ke sisi A atau B</p>
              </button>

              <button
                type="button"
                onClick={() => onUpdateSettings({ ...settings, motionMode: 'step' })}
                className={`p-3 rounded-2xl border text-left transition ${
                  motionMode === 'step'
                    ? 'bg-sky-950/60 border-sky-500 text-sky-200'
                    : 'bg-slate-800/60 border-slate-700 text-slate-400'
                }`}
              >
                <div className="flex items-center gap-1.5 font-bold text-xs text-white">
                  <Footprints size={16} className="text-emerald-400" /> Langkah Tertib
                </div>
                <p className="text-[11px] mt-1 opacity-80">Melangkah tanpa lompatan</p>
              </button>
            </div>
          </div>
        </div>

        {/* Start Game Button (PID Touch target >= 64px) */}
        <button
          onClick={onStartCountdown}
          className="w-full h-16 rounded-2xl bg-gradient-to-r from-emerald-500 via-teal-500 to-sky-500 hover:opacity-95 text-white font-black text-xl flex items-center justify-center gap-3 shadow-2xl shadow-emerald-500/30 transition active:scale-[0.98]"
        >
          <Play size={24} fill="currentColor" />
          Mulai Kuis Eliminasi Massal
        </button>
      </div>
    </div>
  );
}
