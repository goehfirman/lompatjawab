import React, { useState, useRef, useEffect } from 'react';
import { Navbar } from './components/Navbar';
import { HomeScreen } from './components/HomeScreen';
import { QuestionManager } from './components/QuestionManager';
import { Calibration } from './components/Calibration';
import { GameArena } from './components/GameArena';
import { FinalScore } from './components/FinalScore';

import { 
  loadQuestionSets, saveQuestionSets, 
  getActiveSetId, setActiveSetId, 
  loadGameSettings, saveGameSettings,
  mergeLocalAndCloudSets
} from './utils/storage';

import { 
  fetchQuestionSetsFromVercel, 
  saveQuestionSetToVercel, 
  deleteQuestionSetFromVercel,
  uploadAllSetsToVercel 
} from './services/vercelKv';

import { useAudioSFX } from './hooks/useAudioSFX';
import { usePoseDetection } from './hooks/usePoseDetection';

export default function App() {
  const [sets, setSets] = useState(loadQuestionSets);
  const [activeSetId, setActiveId] = useState(getActiveSetId);
  const [settings, setSettings] = useState(() => {
    const loaded = loadGameSettings();
    return {
      initialStudentsCount: 20,
      survivorTarget: 1,
      motionMode: 'jump',
      soundEnabled: true,
      ...loaded
    };
  });
  const [currentScreen, setCurrentScreen] = useState('home'); // 'home' | 'manager' | 'calibration' | 'game' | 'final'
  const [finalData, setFinalData] = useState(null);

  // Vercel KV Cloud Sync State
  const [isCloudConfigured, setIsCloudConfigured] = useState(false);
  const [cloudStatus, setCloudStatus] = useState('checking'); // 'connected' | 'syncing' | 'offline' | 'unconfigured'

  const videoRef = useRef(null);
  const canvasRef = useRef(null);

  const activeSet = sets.find(s => s.id === activeSetId) || sets[0];

  // Sound Engine
  const audioSFX = useAudioSFX(settings.soundEnabled);

  // Sync with Vercel KV Serverless API on load
  const syncWithVercel = async () => {
    setCloudStatus('syncing');
    try {
      const res = await fetchQuestionSetsFromVercel();
      if (res && res.success && res.configured) {
        setIsCloudConfigured(true);
        setCloudStatus('connected');
        if (Array.isArray(res.data) && res.data.length > 0) {
          setSets((prevSets) => {
            const merged = mergeLocalAndCloudSets(prevSets, res.data);
            saveQuestionSets(merged);
            return merged;
          });
        }
      } else if (res && res.configured === false) {
        setIsCloudConfigured(false);
        setCloudStatus('unconfigured');
      } else {
        setCloudStatus('offline');
      }
    } catch (e) {
      console.warn("Vercel sync error", e);
      setCloudStatus('offline');
    }
  };

  useEffect(() => {
    syncWithVercel();
  }, []);

  // Pose & Crowd Detection Hook (Always persistent)
  const {
    isCameraReady,
    cameraError,
    availableCameras,
    activeCameraId,
    switchCamera,
    startCamera,
    crowdDensity,
    fps,
    stream
  } = usePoseDetection({
    videoRef,
    canvasRef,
    isActive: true
  });

  // Save changes to localStorage AND sync to Vercel KV if available
  const handleUpdateSets = async (newSets, modifiedSet = null, deletedSetId = null) => {
    setSets(newSets);
    saveQuestionSets(newSets);

    if (cloudStatus === 'connected' || isCloudConfigured) {
      setCloudStatus('syncing');
      try {
        if (deletedSetId) {
          await deleteQuestionSetFromVercel(deletedSetId);
        } else if (modifiedSet) {
          await saveQuestionSetToVercel(modifiedSet);
        } else {
          await uploadAllSetsToVercel(newSets);
        }
        setCloudStatus('connected');
      } catch (err) {
        console.warn("Vercel KV sync failed", err);
        setCloudStatus('offline');
      }
    }
  };

  const handleCloudConfigChange = () => {
    syncWithVercel();
  };

  const handleSelectSet = (id) => {
    setActiveId(id);
    setActiveSetId(id);
  };

  const handleUpdateSettings = (newSettings) => {
    setSettings(newSettings);
    saveGameSettings(newSettings);
  };

  const handleToggleSound = () => {
    const updated = !settings.soundEnabled;
    handleUpdateSettings({ ...settings, soundEnabled: updated });
  };

  // Screen Transitions
  const handleStartCalibration = () => {
    setCurrentScreen('calibration');
  };

  const handleStartGame = () => {
    setCurrentScreen('game');
  };

  const handleFinishGame = (results) => {
    setFinalData(results);
    setCurrentScreen('final');
  };

  const handleQuitGame = () => {
    if (confirm("Keluar dari kuis saat ini dan kembali ke Menu Utama?")) {
      setCurrentScreen('home');
    }
  };

  // Whether camera is fully sharp or subtly dimmed for menus
  const isCameraInFocus = currentScreen === 'calibration' || currentScreen === 'game';

  return (
    <div className="w-screen h-screen flex flex-col bg-slate-950 text-slate-100 overflow-hidden font-sans select-none relative">
      {/* 1. PERMANENT FULLSCREEN CAMERA BACKGROUND (Z-0) */}
      <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden bg-slate-950">
        <video
          ref={videoRef}
          playsInline
          muted
          autoPlay
          className={`w-full h-full object-cover -scale-x-100 transition-opacity duration-500 ${
            isCameraInFocus ? 'opacity-90' : 'opacity-25'
          }`}
        />
        <canvas
          ref={canvasRef}
          className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-500 ${
            isCameraInFocus ? 'opacity-100' : 'opacity-10'
          }`}
        />
        {/* Subtle dark backdrop overlay on non-game screens for clean readability */}
        {!isCameraInFocus && (
          <div className="absolute inset-0 bg-slate-950/75 backdrop-blur-[2px]" />
        )}
      </div>

      {/* 2. TOP NAVBAR (Z-30) */}
      <Navbar
        currentScreen={currentScreen}
        onNavigate={(screen) => setCurrentScreen(screen)}
        soundEnabled={settings.soundEnabled}
        onToggleSound={handleToggleSound}
        activeSetTitle={activeSet?.title}
        onQuitGame={handleQuitGame}
        isCameraReady={isCameraReady}
        cameraError={cameraError}
        availableCameras={availableCameras}
        activeCameraId={activeCameraId}
        onSwitchCamera={switchCamera}
        onRequestCamera={() => startCamera(activeCameraId)}
      />

      {/* 3. SCREEN ROUTER (Z-10) */}
      <div className="flex-1 flex overflow-hidden relative z-10">
        {currentScreen === 'home' && (
          <HomeScreen
            sets={sets}
            activeSetId={activeSetId}
            onSelectSet={handleSelectSet}
            onStartCalibration={handleStartCalibration}
            onOpenManager={() => setCurrentScreen('manager')}
            isCameraReady={isCameraReady}
            onRequestCamera={() => startCamera(activeCameraId)}
          />
        )}

        {currentScreen === 'manager' && (
          <QuestionManager
            sets={sets}
            activeSetId={activeSetId}
            onSelectSet={handleSelectSet}
            onUpdateSets={handleUpdateSets}
            cloudStatus={cloudStatus}
            isCloudConfigured={isCloudConfigured}
            onCloudConfigChange={handleCloudConfigChange}
          />
        )}

        {currentScreen === 'calibration' && (
          <Calibration
            activeSet={activeSet}
            settings={settings}
            onUpdateSettings={handleUpdateSettings}
            onStartCountdown={handleStartGame}
            isCameraReady={isCameraReady}
            cameraError={cameraError}
            onRequestCamera={() => startCamera(activeCameraId)}
            crowdDensity={crowdDensity}
            fps={fps}
            stream={stream}
          />
        )}

        {currentScreen === 'game' && (
          <GameArena
            questionSet={activeSet}
            settings={settings}
            onFinishGame={handleFinishGame}
            onQuitToMenu={() => setCurrentScreen('home')}
            audioSFX={audioSFX}
            crowdDensity={crowdDensity}
            isCameraReady={isCameraReady}
            onRequestCamera={() => startCamera(activeCameraId)}
          />
        )}

        {currentScreen === 'final' && finalData && (
          <FinalScore
            initialStudentsCount={finalData.initialStudentsCount}
            remainingStudents={finalData.remainingStudents}
            survivorTarget={finalData.survivorTarget}
            totalQuestions={finalData.totalQuestions}
            questions={finalData.questions}
            roundEliminations={finalData.roundEliminations}
            onPlayAgain={() => setCurrentScreen('game')}
            onBackToMenu={() => setCurrentScreen('home')}
          />
        )}
      </div>
    </div>
  );
}
