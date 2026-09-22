import React from 'react';
import { 
  Volume2, VolumeX, Maximize, Minimize, BookOpen, Play, 
  Camera, CameraOff, Users, AlertCircle, RefreshCw, Sparkles 
} from 'lucide-react';

export function Navbar({
  currentScreen,
  onNavigate,
  soundEnabled,
  onToggleSound,
  activeSetTitle,
  onQuitGame,
  isCameraReady,
  cameraError,
  availableCameras = [],
  activeCameraId,
  onSwitchCamera,
  onRequestCamera,
  remainingStudents,
  initialStudentsCount,
  gameMode = 'free'
}) {
  const [isFullscreen, setIsFullscreen] = React.useState(false);
  const [showCameraSelect, setShowCameraSelect] = React.useState(false);

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().then(() => {
        setIsFullscreen(true);
      }).catch(err => {
        console.warn('Fullscreen request failed', err);
      });
    } else {
      document.exitFullscreen().then(() => {
        setIsFullscreen(false);
      });
    }
  };

  return (
    <header className="h-16 px-6 bg-slate-900/95 backdrop-blur-md border-b border-slate-800 flex items-center justify-between select-none z-30 shrink-0">
      {/* Brand & Mode */}
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2.5">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-sky-500 to-amber-500 flex items-center justify-center font-black text-xl text-white shadow-lg shadow-sky-500/20">
            LP
          </div>
          <div>
            <h1 className="font-extrabold text-lg tracking-tight bg-gradient-to-r from-sky-400 via-amber-300 to-orange-400 bg-clip-text text-transparent">
              LOMPAT PILIH
            </h1>
            <p className="text-xs text-slate-400 font-medium">
              {gameMode === 'free' ? 'Mode Bebas PID (Semua Soal)' : 'Mode Eliminasi Massal PID'}
            </p>
          </div>
        </div>

        {/* Surviving / Active Students Indicator during Game */}
        {currentScreen === 'game' && (
          gameMode === 'free' ? (
            <div className="flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-sky-500/20 border border-sky-500/40 text-sky-300 font-black text-sm shadow-md">
              <Sparkles size={16} className="text-sky-400" />
              <span>Mode Bebas: <strong className="text-white text-base">{initialStudentsCount}</strong> Siswa (Semua Soal)</span>
            </div>
          ) : (
            remainingStudents !== undefined && (
              <div className="flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-amber-500/20 to-emerald-500/20 border border-amber-500/40 text-amber-300 font-black text-sm shadow-md animate-pulse">
                <Users size={16} className="text-amber-400" />
                <span>Siswa Bertahan: <strong className="text-white text-base">{remainingStudents}</strong> / {initialStudentsCount}</span>
              </div>
            )
          )
        )}

        {/* Active Set Name */}
        {activeSetTitle && currentScreen !== 'game' && (
          <div className="hidden lg:flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-800/80 border border-slate-700 text-xs font-semibold text-slate-300">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            Set: <span className="text-sky-300 max-w-[180px] truncate">{activeSetTitle}</span>
          </div>
        )}
      </div>

      {/* Center / Right: Camera Status & Controls */}
      <div className="flex items-center gap-2.5">
        {/* Camera Selector / Status Pill */}
        <div className="relative">
          {isCameraReady ? (
            <button
              onClick={() => setShowCameraSelect(!showCameraSelect)}
              className="px-3 py-1.5 rounded-xl bg-emerald-950/80 border border-emerald-500/60 text-emerald-300 font-bold text-xs flex items-center gap-2 hover:bg-emerald-900/80 transition"
              title="Kamera Aktif — Klik untuk ganti kamera"
            >
              <Camera size={16} className="text-emerald-400" />
              <span className="hidden sm:inline">Kamera PID Aktif</span>
              {availableCameras.length > 1 && (
                <span className="px-1.5 py-0.5 rounded bg-emerald-800 text-[10px] text-white">
                  {availableCameras.length}
                </span>
              )}
            </button>
          ) : (
            <button
              onClick={onRequestCamera}
              className="px-3.5 py-1.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-black text-xs flex items-center gap-2 shadow-lg shadow-rose-600/30 transition animate-bounce-short"
              title="Klik untuk Mengizinkan & Menyalakan Kamera PID"
            >
              <CameraOff size={16} />
              <span>Nyalakan Kamera</span>
            </button>
          )}

          {/* Camera Dropdown */}
          {showCameraSelect && availableCameras.length > 0 && (
            <div className="absolute right-0 mt-2 w-64 bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl p-2 z-50 space-y-1">
              <div className="text-[11px] font-bold text-slate-400 px-3 py-1.5 uppercase">
                Pilih Kamera PID:
              </div>
              {availableCameras.map((cam, idx) => (
                <button
                  key={cam.deviceId || idx}
                  onClick={() => {
                    onSwitchCamera(cam.deviceId);
                    setShowCameraSelect(false);
                  }}
                  className={`w-full text-left px-3 py-2 rounded-xl text-xs font-semibold flex items-center justify-between transition ${
                    cam.deviceId === activeCameraId
                      ? 'bg-sky-500 text-white font-bold'
                      : 'hover:bg-slate-800 text-slate-300'
                  }`}
                >
                  <span className="truncate max-w-[180px]">{cam.label || `Kamera ${idx + 1}`}</span>
                  {cam.deviceId === activeCameraId && <span>✓</span>}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Screen Navigation */}
        {currentScreen === 'game' || currentScreen === 'calibration' ? (
          <button
            onClick={onQuitGame}
            className="px-4 py-2 rounded-xl bg-rose-600/20 hover:bg-rose-600/30 text-rose-300 border border-rose-500/30 font-semibold text-xs transition flex items-center gap-2"
          >
            Selesai / Keluar
          </button>
        ) : (
          <>
            <button
              onClick={() => onNavigate('home')}
              className={`px-4 py-2 rounded-xl font-semibold text-xs transition flex items-center gap-2 ${
                currentScreen === 'home'
                  ? 'bg-sky-500 text-white shadow-md shadow-sky-500/25'
                  : 'bg-slate-800/80 hover:bg-slate-800 text-slate-300'
              }`}
            >
              <Play size={15} />
              Main Kuis
            </button>
            <button
              onClick={() => onNavigate('manager')}
              className={`px-4 py-2 rounded-xl font-semibold text-xs transition flex items-center gap-2 ${
                currentScreen === 'manager'
                  ? 'bg-amber-500 text-white shadow-md shadow-amber-500/25'
                  : 'bg-slate-800/80 hover:bg-slate-800 text-slate-300'
              }`}
            >
              <BookOpen size={15} />
              Bank Soal
            </button>
          </>
        )}

        {/* SFX Toggle */}
        <button
          onClick={onToggleSound}
          title={soundEnabled ? "Matikan Suara" : "Nyalakan Suara"}
          className="w-10 h-10 rounded-xl bg-slate-800 hover:bg-slate-700 flex items-center justify-center text-slate-300 border border-slate-700/60 transition"
        >
          {soundEnabled ? <Volume2 size={18} className="text-emerald-400" /> : <VolumeX size={18} className="text-slate-500" />}
        </button>

        {/* Fullscreen Button */}
        <button
          onClick={toggleFullscreen}
          title="Layar Penuh (Fullscreen PID)"
          className="w-10 h-10 rounded-xl bg-slate-800 hover:bg-slate-700 flex items-center justify-center text-slate-300 border border-slate-700/60 transition"
        >
          {isFullscreen ? <Minimize size={18} /> : <Maximize size={18} />}
        </button>
      </div>
    </header>
  );
}
