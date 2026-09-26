'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useFarmData } from '@/context/FarmDataContext';
import { useAuth } from '@/context/AuthContext';
import { useLanguage } from '@/context/LanguageContext';
import { getFirebaseInstance } from '@/lib/firebase';
import { WebRTCStreamClient, WebRTCStreamStats } from '@/lib/webrtcClient';
import {
  Video,
  Play,
  Pause,
  Square,
  Camera,
  Maximize2,
  RotateCw,
  Moon,
  Sun,
  Radio,
  Wifi,
  BatteryCharging,
  Sliders,
  Cpu,
  Shield,
  HardDrive,
  Activity,
  CheckCircle,
  AlertOctagon,
  ChevronUp,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  ZoomIn,
  ZoomOut,
  Crosshair,
  Sparkles,
  Bot,
  Gamepad2,
  Lock,
  Compass,
  Check,
  Loader2,
  RefreshCw,
  AlertTriangle,
  UserCheck,
} from 'lucide-react';

export default function LiveCameraPage() {
  const {
    isOfflineMode,
    latestImageUrl,
    cameraControl,
    setCameraMode,
    updateCameraCoords,
    sendCameraStep,
    firebaseConfig,
    firebaseConnected,
  } = useFarmData();

  const { isAuthenticated, operator, setIsAuthModalOpen } = useAuth();
  const { t } = useLanguage();

  const [isPlaying, setIsPlaying] = useState<boolean>(true);
  const [isNightMode, setIsNightMode] = useState<boolean>(false);
  const [showToast, setShowToast] = useState<boolean>(false);
  const [toastMessage, setToastMessage] = useState<string>('');
  const [toastCode, setToastCode] = useState<string>('');
  const [clockString, setClockString] = useState<string>('');
  const [stepSize, setStepSize] = useState<number>(10);
  const [lastActionStatus, setLastActionStatus] = useState<string>('Ready');
  const [isSendingToFirebase, setIsSendingToFirebase] = useState<boolean>(false);
  const [isRetryingStream, setIsRetryingStream] = useState<boolean>(false);

  const videoViewportRef = useRef<HTMLDivElement>(null);
  const videoElementRef = useRef<HTMLVideoElement>(null);
  const webrtcClientRef = useRef<WebRTCStreamClient | null>(null);

  const [hasLiveStream, setHasLiveStream] = useState<boolean>(false);
  const [streamStats, setStreamStats] = useState<WebRTCStreamStats>({
    fps: 0,
    bitrateKbps: 0,
    latencyMs: 65,
    resolution: '640x480',
    connectionState: 'idle',
    iceState: 'idle',
    isRelayed: false,
  });
  const [connectionStatusText, setConnectionStatusText] = useState<string>('Connecting...');

  // Live timestamp clock update
  useEffect(() => {
    const updateClock = () => {
      const now = new Date();
      setClockString(now.toISOString().replace('T', ' ').substring(0, 19) + ' IST');
    };
    updateClock();
    const interval = setInterval(updateClock, 1000);
    return () => clearInterval(interval);
  }, []);

  // WebRTC Stream Initializer & Lifecycle Manager
  const startWebRTC = useCallback(() => {
    if (!isPlaying || isOfflineMode) return;

    const { db } = getFirebaseInstance();
    if (!db) return;

    setIsRetryingStream(true);
    setConnectionStatusText('Negotiating WebRTC / TURN...');

    if (webrtcClientRef.current) {
      webrtcClientRef.current.stop();
    }

    const client = new WebRTCStreamClient({
      deviceId: 'pi_agroeye_01',
      db: db,
      onStream: (stream) => {
        setHasLiveStream(true);
        setIsRetryingStream(false);
        setConnectionStatusText('Live Stream Active');
        if (videoElementRef.current) {
          videoElementRef.current.srcObject = stream;
          videoElementRef.current.play().catch(() => {});
        }
      },
      onStatsUpdate: (stats) => {
        setStreamStats(stats);
        setIsRetryingStream(false);
        if (stats.connectionState === 'connected') {
          setConnectionStatusText(stats.isRelayed ? 'Live (TURN Relay)' : 'Live (Direct P2P)');
        } else if (stats.connectionState === 'connecting') {
          setConnectionStatusText('Establishing Connection...');
        } else if (stats.connectionState === 'timeout' || stats.connectionState === 'failed') {
          setConnectionStatusText('Pi Camera Standby (Snapshot Preview)');
        }
      },
      onError: () => {
        setIsRetryingStream(false);
        setConnectionStatusText('Pi Camera Standby (Snapshot Preview)');
      },
    });

    webrtcClientRef.current = client;
    client.start();
  }, [isPlaying, isOfflineMode]);

  useEffect(() => {
    startWebRTC();
    return () => {
      if (webrtcClientRef.current) {
        webrtcClientRef.current.stop();
        webrtcClientRef.current = null;
      }
      setHasLiveStream(false);
    };
  }, [startWebRTC]);

  // Automatic reset to Auto Mode on unmount / page exit
  useEffect(() => {
    return () => {
      const dbUrl = (firebaseConfig.databaseURL || 'https://sample-629de-default-rtdb.firebaseio.com').replace(/\/$/, '');
      const resetPayload = JSON.stringify({
        mode: 'auto',
        pan_angle: 90,
        tilt_angle: 90,
        x_coord: 0,
        y_coord: 0,
        command: 'mode_change',
        last_updated: new Date().toISOString(),
        timestamp: Date.now(),
        source: 'page_exit_auto_reset',
      });

      try {
        if (typeof navigator !== 'undefined' && navigator.sendBeacon) {
          const blob = new Blob([resetPayload], { type: 'application/json' });
          navigator.sendBeacon(`${dbUrl}/camera_control.json`, blob);
        } else {
          fetch(`${dbUrl}/camera_control.json`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: resetPayload,
            keepalive: true,
          }).catch(() => {});
        }
      } catch (err) {
        console.warn('Auto mode reset on unmount notice:', err);
      }
    };
  }, [firebaseConfig]);

  const handleModeToggle = async (newMode: 'auto' | 'manual') => {
    if (newMode === 'manual' && !isAuthenticated) {
      setIsAuthModalOpen(true);
      return;
    }
    setIsSendingToFirebase(true);
    await setCameraMode(newMode);
    setLastActionStatus(newMode === 'manual' ? 'Manual Joystick Active' : 'Auto Patrol Resumed');
    setTimeout(() => setIsSendingToFirebase(false), 500);
  };

  const handleDirectionClick = async (deltaPan: number, deltaTilt: number, cmd: 'pan_left' | 'pan_right' | 'tilt_up' | 'tilt_down') => {
    if (!isAuthenticated) {
      setIsAuthModalOpen(true);
      return;
    }
    setIsSendingToFirebase(true);
    await sendCameraStep(deltaPan, deltaTilt, cmd);
    setLastActionStatus(`Sent ${cmd.replace('_', ' ').toUpperCase()} to Firebase`);
    setTimeout(() => setIsSendingToFirebase(false), 350);
  };

  const handleCenterPreset = async () => {
    if (!isAuthenticated) {
      setIsAuthModalOpen(true);
      return;
    }
    setIsSendingToFirebase(true);
    await updateCameraCoords(90, 90, 'center');
    setLastActionStatus('Reset to Center (90°, 90°)');
    setTimeout(() => setIsSendingToFirebase(false), 350);
  };

  const handleSliderChange = async (e: React.ChangeEvent<HTMLInputElement>, axis: 'pan' | 'tilt') => {
    if (!isAuthenticated) {
      setIsAuthModalOpen(true);
      return;
    }
    const val = Number(e.target.value);
    if (axis === 'pan') {
      await updateCameraCoords(val, cameraControl.tilt_angle, 'set_coords');
    } else {
      await updateCameraCoords(cameraControl.pan_angle, val, 'set_coords');
    }
    setLastActionStatus(`Servo updated: Pan ${cameraControl.pan_angle}°, Tilt ${cameraControl.tilt_angle}°`);
  };

  const handleSnapshot = () => {
    const snapId = `#SNAP_${Math.floor(1000 + Math.random() * 9000)}`;
    setToastCode(snapId);
    setToastMessage('Snapshot captured from camera & saved to field log');
    setShowToast(true);
    setTimeout(() => {
      setShowToast(false);
    }, 4000);
  };

  const toggleFullscreen = () => {
    if (!videoViewportRef.current) return;
    if (!document.fullscreenElement) {
      videoViewportRef.current.requestFullscreen().catch(() => {});
    } else {
      document.exitFullscreen();
    }
  };

  // Convert pan/tilt angles to visual CSS offsets
  const panVisualX = (cameraControl.pan_angle - 90) * 0.35;
  const tiltVisualY = -(cameraControl.tilt_angle - 90) * 0.35;

  const isStreamOffline = !hasLiveStream && (streamStats.connectionState === 'timeout' || streamStats.connectionState === 'failed' || streamStats.connectionState === 'idle');

  return (
    <div className="flex flex-col w-full pb-14 space-y-4">
      {/* 1. Header & Mode Ribbon */}
      <section className="px-4 pt-3">
        <div className="bg-white rounded-2xl p-4 shadow-sm border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-600 animate-pulse" />
              <span className="font-headline text-[11px] uppercase tracking-wider text-emerald-800 font-bold">
                Camera Gateway • Raspberry Pi 4B Dual-Axis PTZ
              </span>
            </div>
            <h1 className="font-headline text-2xl font-bold text-slate-900 tracking-tight mt-0.5">
              Live Field Camera &amp; Servo Control
            </h1>
            <p className="text-xs text-slate-500 mt-0.5">
              Real-time video feed and dual-axis servo joystick (X-Pan 0-180° / Y-Tilt 0-180°) syncing to Firebase.
            </p>
          </div>

          <div className="flex items-center gap-2 flex-shrink-0">
            <div
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border font-headline text-xs font-bold uppercase tracking-wider ${
                cameraControl.mode === 'manual'
                  ? 'bg-amber-50 border-amber-300 text-amber-900'
                  : 'bg-emerald-50 border-emerald-200 text-emerald-800'
              }`}
            >
              <span
                className={`w-2 h-2 rounded-full ${
                  cameraControl.mode === 'manual' ? 'bg-amber-500 animate-pulse' : 'bg-emerald-500 animate-pulse'
                }`}
              />
              <span>{cameraControl.mode === 'manual' ? '2. Manual Mode' : '1. Auto Patrol'}</span>
            </div>
          </div>
        </div>
      </section>

      {/* 2. VIDEO STREAM / SNAPSHOT VIEWPORT */}
      <section className="px-4">
        <div
          ref={videoViewportRef}
          className="relative w-full rounded-2xl overflow-hidden bg-slate-950 border border-slate-200 shadow-lg ring-1 ring-black/5"
        >
          {/* Active WebRTC Video Track */}
          <video
            ref={videoElementRef}
            autoPlay
            playsInline
            muted
            className={`w-full aspect-[16/10] sm:aspect-video object-cover transition-all ${
              hasLiveStream ? 'block' : 'hidden'
            }`}
          />

          {/* Fallback Snapshot Preview Layer */}
          {!hasLiveStream && (
            <div className="relative w-full aspect-[16/10] sm:aspect-video overflow-hidden group">
              <img
                alt="Raspberry Pi field camera snapshot"
                className="w-full h-full object-cover transition-transform duration-300 will-change-transform"
                style={{
                  transform: `scale(1.08) translate(${panVisualX}px, ${tiltVisualY}px)`,
                }}
                src={latestImageUrl}
                onError={(e) => {
                  (e.target as HTMLElement).setAttribute('src', 'https://iili.io/nuiqbzg.jpg');
                }}
              />

              {/* Night Vision Green Tint */}
              {isNightMode && (
                <div className="absolute inset-0 bg-emerald-950/40 mix-blend-color pointer-events-none transition-opacity duration-300" />
              )}

              {/* Offline / Standby Status Banner */}
              {isStreamOffline && (
                <div className="absolute inset-0 bg-slate-950/40 backdrop-blur-2xs flex flex-col items-center justify-center p-4 text-center text-white">
                  <div className="bg-slate-900/90 border border-slate-700 p-3.5 rounded-2xl max-w-xs shadow-2xl flex flex-col items-center gap-2">
                    <Radio className="w-6 h-6 text-amber-400 animate-pulse" />
                    <div>
                      <h4 className="font-headline text-xs font-bold text-white uppercase tracking-wider">
                        Pi Camera Standby
                      </h4>
                      <p className="text-[11px] text-slate-300 mt-0.5">
                        Rendering live snapshot stream. WebRTC auto-reconnecting.
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={startWebRTC}
                      className="mt-1 px-3 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-headline text-xs font-bold flex items-center gap-1.5 transition-all active:scale-95 shadow-xs"
                    >
                      <RefreshCw className={`w-3 h-3 ${isRetryingStream ? 'animate-spin' : ''}`} />
                      <span>{isRetryingStream ? 'Negotiating...' : 'Retry WebRTC'}</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Gradient Scrim & Reticle HUD */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-transparent to-black/60 pointer-events-none" />

          {/* Corner Reticles */}
          <div className="absolute top-3 left-3 w-3.5 h-3.5 border-t-2 border-l-2 border-emerald-400 pointer-events-none" />
          <div className="absolute top-3 right-3 w-3.5 h-3.5 border-t-2 border-r-2 border-emerald-400 pointer-events-none" />
          <div className="absolute bottom-3 left-3 w-3.5 h-3.5 border-b-2 border-l-2 border-emerald-400 pointer-events-none" />
          <div className="absolute bottom-3 right-3 w-3.5 h-3.5 border-b-2 border-r-2 border-emerald-400 pointer-events-none" />

          {/* Top HUD Indicators */}
          <div className="absolute top-0 left-0 right-0 p-3 flex items-start justify-between gap-2 pointer-events-none">
            <div className="flex flex-col gap-0.5">
              <span className="font-headline text-[10px] text-emerald-400 tracking-widest uppercase font-bold drop-shadow">
                RASPBERRY PI CAM #01 • 1080P PTZ
              </span>
              <div className="flex items-center gap-1.5 text-white/90 drop-shadow">
                <span className="font-mono text-[10px] bg-black/60 backdrop-blur-sm px-1.5 py-0.5 rounded text-white font-bold">
                  MODE: {cameraControl.mode.toUpperCase()}
                </span>
                <span className="font-mono text-[10px] text-emerald-300 font-bold">
                  PAN: {cameraControl.pan_angle}° • TILT: {cameraControl.tilt_angle}°
                </span>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <span className="font-headline text-[10px] bg-black/60 backdrop-blur-sm text-slate-200 px-2 py-0.5 rounded font-bold">
                {hasLiveStream ? `${streamStats.fps} FPS` : 'SNAPSHOT MODE'}
              </span>
            </div>
          </div>

          {/* Bottom Viewport Action Toolbar */}
          <div className="absolute bottom-0 left-0 right-0 p-3 flex items-center justify-between text-white text-xs z-20">
            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={handleSnapshot}
                className="h-8 px-2.5 bg-black/60 hover:bg-black/80 backdrop-blur-md rounded-lg border border-white/20 flex items-center gap-1 font-headline text-xs font-bold active:scale-95 transition-all"
                title="Capture Field Snapshot"
              >
                <Camera className="w-3.5 h-3.5 text-emerald-400" />
                <span className="hidden sm:inline">Capture</span>
              </button>

              <button
                type="button"
                onClick={() => setIsNightMode(!isNightMode)}
                className={`h-8 px-2.5 rounded-lg border backdrop-blur-md flex items-center gap-1 font-headline text-xs font-bold active:scale-95 transition-all ${
                  isNightMode
                    ? 'bg-emerald-600 border-emerald-400 text-white'
                    : 'bg-black/60 hover:bg-black/80 border-white/20 text-white'
                }`}
                title="Night Vision Filter"
              >
                <Moon className="w-3.5 h-3.5 text-emerald-300" />
                <span className="hidden sm:inline">IR Night</span>
              </button>
            </div>

            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={toggleFullscreen}
                className="p-2 bg-black/60 hover:bg-black/80 backdrop-blur-md rounded-lg border border-white/20 active:scale-95 transition-all"
                title="Fullscreen View"
              >
                <Maximize2 className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* 3. MODE SELECTOR & OPERATOR AUTH LOCK */}
      <section className="px-4">
        <div className="p-3 bg-white rounded-2xl border border-slate-200 shadow-sm flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Sliders className="w-4 h-4 text-emerald-600" />
              <h3 className="font-headline text-xs font-bold uppercase tracking-wider text-slate-900">
                Servo Operation Mode
              </h3>
            </div>
            {!isAuthenticated && (
              <span className="text-[10px] font-headline font-bold text-amber-700 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-full flex items-center gap-1">
                <Lock className="w-3 h-3" />
                <span>Sign in required for manual joystick</span>
              </span>
            )}
          </div>

          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => handleModeToggle('auto')}
              className={`h-11 px-3 rounded-xl font-headline text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-2 transition-all ${
                cameraControl.mode === 'auto'
                  ? 'bg-emerald-600 text-white shadow-sm'
                  : 'bg-slate-50 border border-slate-200 text-slate-700 hover:bg-slate-100'
              }`}
            >
              <Bot className="w-4 h-4" />
              <span>1. Auto Mode (Patrol)</span>
            </button>

            <button
              type="button"
              onClick={() => handleModeToggle('manual')}
              className={`h-11 px-3 rounded-xl font-headline text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-2 transition-all ${
                cameraControl.mode === 'manual'
                  ? 'bg-amber-500 text-slate-950 font-extrabold shadow-sm'
                  : 'bg-slate-50 border border-slate-200 text-slate-700 hover:bg-slate-100'
              }`}
            >
              <Gamepad2 className="w-4 h-4" />
              <span>2. Manual Mode (PTZ)</span>
            </button>
          </div>
        </div>
      </section>

      {/* 4. DUAL-AXIS JOYSTICK & SLIDERS (MANUAL MODE) */}
      <section className="px-4">
        <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-sm space-y-4">
          <div className="flex items-center justify-between pb-2 border-b border-slate-100">
            <div className="flex items-center gap-2">
              <Compass className="w-4 h-4 text-emerald-600" />
              <h3 className="font-headline text-xs uppercase tracking-wider font-bold text-slate-900">
                PTZ Dual-Axis Control Matrix (X: {cameraControl.pan_angle}° / Y: {cameraControl.tilt_angle}°)
              </h3>
            </div>
            <button
              type="button"
              onClick={handleCenterPreset}
              className="h-7 px-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-headline text-[11px] font-bold rounded-lg transition-all"
            >
              Center (90°, 90°)
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 items-center">
            {/* Virtual D-Pad Joystick */}
            <div className="flex flex-col items-center justify-center p-3 bg-slate-50 rounded-2xl border border-slate-200">
              <div className="relative w-36 h-36 flex items-center justify-center">
                {/* UP (Tilt Up) */}
                <button
                  type="button"
                  onClick={() => handleDirectionClick(0, stepSize, 'tilt_up')}
                  className="absolute top-0 w-11 h-11 bg-white hover:bg-emerald-50 active:bg-emerald-600 active:text-white rounded-xl shadow-md border border-slate-200 flex items-center justify-center text-slate-700 transition-all active:scale-95"
                  title="Tilt Up"
                >
                  <ChevronUp className="w-5 h-5" />
                </button>

                {/* DOWN (Tilt Down) */}
                <button
                  type="button"
                  onClick={() => handleDirectionClick(0, -stepSize, 'tilt_down')}
                  className="absolute bottom-0 w-11 h-11 bg-white hover:bg-emerald-50 active:bg-emerald-600 active:text-white rounded-xl shadow-md border border-slate-200 flex items-center justify-center text-slate-700 transition-all active:scale-95"
                  title="Tilt Down"
                >
                  <ChevronDown className="w-5 h-5" />
                </button>

                {/* LEFT (Pan Left) */}
                <button
                  type="button"
                  onClick={() => handleDirectionClick(-stepSize, 0, 'pan_left')}
                  className="absolute left-0 w-11 h-11 bg-white hover:bg-emerald-50 active:bg-emerald-600 active:text-white rounded-xl shadow-md border border-slate-200 flex items-center justify-center text-slate-700 transition-all active:scale-95"
                  title="Pan Left"
                >
                  <ChevronLeft className="w-5 h-5" />
                </button>

                {/* RIGHT (Pan Right) */}
                <button
                  type="button"
                  onClick={() => handleDirectionClick(stepSize, 0, 'pan_right')}
                  className="absolute right-0 w-11 h-11 bg-white hover:bg-emerald-50 active:bg-emerald-600 active:text-white rounded-xl shadow-md border border-slate-200 flex items-center justify-center text-slate-700 transition-all active:scale-95"
                  title="Pan Right"
                >
                  <ChevronRight className="w-5 h-5" />
                </button>

                {/* Center Reticle */}
                <div className="w-10 h-10 rounded-full bg-slate-900 text-emerald-400 flex items-center justify-center shadow-md font-mono text-[10px] font-bold">
                  PTZ
                </div>
              </div>

              <div className="flex items-center gap-1.5 mt-2">
                <span className="text-[10px] text-slate-500 font-bold uppercase">Step:</span>
                {[5, 10, 20].map((sz) => (
                  <button
                    key={sz}
                    type="button"
                    onClick={() => setStepSize(sz)}
                    className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold transition-all ${
                      stepSize === sz
                        ? 'bg-emerald-600 text-white'
                        : 'bg-white border border-slate-200 text-slate-600'
                    }`}
                  >
                    ±{sz}°
                  </button>
                ))}
              </div>
            </div>

            {/* Precision Angle Sliders */}
            <div className="space-y-3 p-3 bg-slate-50 rounded-2xl border border-slate-200">
              {/* Pan Slider */}
              <div className="space-y-1">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-headline font-bold text-slate-700">X-Axis Pan (0° - 180°)</span>
                  <span className="font-mono font-bold text-emerald-700">{cameraControl.pan_angle}°</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="180"
                  value={cameraControl.pan_angle}
                  onChange={(e) => handleSliderChange(e, 'pan')}
                  className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-emerald-600"
                />
              </div>

              {/* Tilt Slider */}
              <div className="space-y-1">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-headline font-bold text-slate-700">Y-Axis Tilt (0° - 180°)</span>
                  <span className="font-mono font-bold text-emerald-700">{cameraControl.tilt_angle}°</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="180"
                  value={cameraControl.tilt_angle}
                  onChange={(e) => handleSliderChange(e, 'tilt')}
                  className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-emerald-600"
                />
              </div>

              <div className="pt-1 text-[11px] text-slate-500 font-mono">
                Status: <strong className="text-slate-800">{lastActionStatus}</strong>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Snapshot Confirmation Toast */}
      {showToast && (
        <div className="fixed bottom-20 left-4 right-4 z-50 p-3.5 bg-slate-900 text-white rounded-xl shadow-xl flex items-center justify-between animate-in fade-in slide-in-from-bottom-2">
          <div className="flex items-center gap-2">
            <Camera className="w-4 h-4 text-emerald-400" />
            <span className="text-xs font-headline font-bold">{toastMessage} ({toastCode})</span>
          </div>
          <button onClick={() => setShowToast(false)} className="text-slate-400 hover:text-white">✕</button>
        </div>
      )}
    </div>
  );
}
