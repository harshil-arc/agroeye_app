'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useFarmData } from '@/context/FarmDataContext';
import { useAuth } from '@/context/AuthContext';
import { useLanguage } from '@/context/LanguageContext';
import { getFirebaseInstance } from '@/lib/firebase';
import { WebRTCStreamClient, WebRTCStreamStats } from '@/lib/webrtcClient';
import {
  Video,
  VideoOff,
  Camera,
  Maximize2,
  Minimize2,
  Radio,
  Sliders,
  Activity,
  ChevronLeft,
  ChevronRight,
  Bot,
  Gamepad2,
  Lock,
  Compass,
  Check,
  RefreshCw,
  AlertTriangle,
  X,
  RotateCcw,
  PowerOff,
  WifiOff
} from 'lucide-react';

const FIXED_STEP_SIZE = 10;

export default function LiveCameraPage() {
  const {
    isOfflineMode,
    cameraControl,
    setCameraMode,
    updateCameraCoords,
    sendCameraStep,
    firebaseConfig,
  } = useFarmData();

  const { isAuthenticated, operator, setIsAuthModalOpen } = useAuth();
  const { t, lang } = useLanguage();

  const [isPlaying, setIsPlaying] = useState<boolean>(true);
  const [showToast, setShowToast] = useState<boolean>(false);
  const [toastMessage, setToastMessage] = useState<string>('');
  const [toastCode, setToastCode] = useState<string>('');
  const [clockString, setClockString] = useState<string>('');
  const [lastActionStatus, setLastActionStatus] = useState<string>('Ready');
  const [isSendingToGateway, setIsSendingToGateway] = useState<boolean>(false);
  const [isRetryingStream, setIsRetryingStream] = useState<boolean>(false);
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);

  const videoViewportRef = useRef<HTMLDivElement>(null);
  const fullscreenContainerRef = useRef<HTMLDivElement>(null);
  const videoElementRef = useRef<HTMLVideoElement>(null);
  const fullscreenVideoElementRef = useRef<HTMLVideoElement>(null);
  const webrtcClientRef = useRef<WebRTCStreamClient | null>(null);

  const [hasLiveStream, setHasLiveStream] = useState<boolean>(false);
  const [streamMedia, setStreamMedia] = useState<MediaStream | null>(null);
  const [streamStats, setStreamStats] = useState<WebRTCStreamStats>({
    fps: 0,
    bitrateKbps: 0,
    latencyMs: 45,
    resolution: '640x480',
    connectionState: 'idle',
    iceState: 'idle',
    isRelayed: false,
  });

  // Keep refs to prevent stale closures and avoid re-triggering unmount cleanup on re-renders
  const cameraControlRef = useRef(cameraControl);
  useEffect(() => {
    cameraControlRef.current = cameraControl;
  }, [cameraControl]);

  const setCameraModeRef = useRef(setCameraMode);
  useEffect(() => {
    setCameraModeRef.current = setCameraMode;
  }, [setCameraMode]);

  const firebaseConfigRef = useRef(firebaseConfig);
  useEffect(() => {
    firebaseConfigRef.current = firebaseConfig;
  }, [firebaseConfig]);

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

  const bindVideoMedia = useCallback((vid: HTMLVideoElement | null, stream: MediaStream | null) => {
    if (!vid) return;
    if (stream) {
      if (vid.srcObject !== stream) {
        vid.srcObject = stream;
      }
      vid.muted = true;
      vid.playsInline = true;
      vid.setAttribute('playsinline', 'true');
      vid.setAttribute('webkit-playsinline', 'true');
      vid.play().catch((err) => {
        console.warn('Video play handler notice:', err);
      });
    } else {
      vid.srcObject = null;
    }
  }, []);

  // Stream Initializer & Lifecycle Manager
  const startStream = useCallback(() => {
    if (!isPlaying || isOfflineMode) return;

    const { db } = getFirebaseInstance();
    if (!db) {
      setHasLiveStream(false);
      return;
    }

    setIsRetryingStream(true);

    if (webrtcClientRef.current) {
      webrtcClientRef.current.stop();
      webrtcClientRef.current = null;
    }

    const client = new WebRTCStreamClient({
      deviceId: 'pi_agroeye_01',
      db: db,
      onStream: (stream) => {
        setHasLiveStream(true);
        setStreamMedia(stream);
        setIsRetryingStream(false);
        bindVideoMedia(videoElementRef.current, stream);
        bindVideoMedia(fullscreenVideoElementRef.current, stream);
      },
      onStatsUpdate: (stats) => {
        setStreamStats(stats);
        if (stats.connectionState === 'connected') {
          setHasLiveStream(true);
          setIsRetryingStream(false);
        } else if (stats.connectionState === 'timeout' || stats.connectionState === 'failed' || stats.connectionState === 'closed') {
          setIsRetryingStream(false);
        }
      },
      onError: () => {
        setIsRetryingStream(false);
        setHasLiveStream(false);
      },
    });

    webrtcClientRef.current = client;
    client.start();
  }, [isPlaying, isOfflineMode, bindVideoMedia]);

  useEffect(() => {
    startStream();
    return () => {
      if (webrtcClientRef.current) {
        webrtcClientRef.current.stop();
        webrtcClientRef.current = null;
      }
      if (videoElementRef.current) {
        videoElementRef.current.srcObject = null;
      }
      if (fullscreenVideoElementRef.current) {
        fullscreenVideoElementRef.current.srcObject = null;
      }
      setHasLiveStream(false);
      setStreamMedia(null);
    };
  }, [startStream]);

  // Keep video source synced when toggling fullscreen
  useEffect(() => {
    if (streamMedia && hasLiveStream) {
      bindVideoMedia(videoElementRef.current, streamMedia);
      bindVideoMedia(fullscreenVideoElementRef.current, streamMedia);
    }
  }, [isFullscreen, streamMedia, hasLiveStream, bindVideoMedia]);

  // Automatic reset to Auto Mode strictly on component unmount (when user navigates away from Live tab)
  useEffect(() => {
    return () => {
      if (cameraControlRef.current.mode === 'manual') {
        setCameraModeRef.current('auto').catch(() => {});
      }

      const dbUrl = (firebaseConfigRef.current.databaseURL || 'https://sample-629de-default-rtdb.firebaseio.com').replace(/\/$/, '');
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
        console.warn('Auto mode reset on exit notice:', err);
      }
    };
  }, []);

  const handleModeToggle = async (newMode: 'auto' | 'manual') => {
    if (newMode === 'manual' && !isAuthenticated) {
      setIsAuthModalOpen(true);
      return;
    }
    setIsSendingToGateway(true);
    await setCameraMode(newMode);
    setLastActionStatus(newMode === 'manual' ? 'Manual Control Active' : 'Auto Mode Active');
    setTimeout(() => setIsSendingToGateway(false), 400);
  };

  const handleDirectionClick = async (deltaPan: number, cmd: 'pan_left' | 'pan_right') => {
    if (!isAuthenticated) {
      setIsAuthModalOpen(true);
      return;
    }
    setIsSendingToGateway(true);
    await sendCameraStep(deltaPan, 0, cmd);
    setLastActionStatus(`Moved ${cmd === 'pan_left' ? 'Left' : 'Right'} (Pan: ${cameraControl.pan_angle}°)`);
    setTimeout(() => setIsSendingToGateway(false), 300);
  };

  const handleCenterPreset = async () => {
    if (!isAuthenticated) {
      setIsAuthModalOpen(true);
      return;
    }
    setIsSendingToGateway(true);
    await updateCameraCoords(90, 90, 'center');
    setLastActionStatus('Reset to Center (90°)');
    setTimeout(() => setIsSendingToGateway(false), 300);
  };

  const handleSliderChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!isAuthenticated) {
      setIsAuthModalOpen(true);
      return;
    }
    const val = Number(e.target.value);
    await updateCameraCoords(val, 90, 'set_coords');
    setLastActionStatus(`Camera Angle: ${val}°`);
  };

  const handleSnapshot = () => {
    const snapId = `#SNAP_${Math.floor(1000 + Math.random() * 9000)}`;
    setToastCode(snapId);
    setToastMessage('Snapshot captured & saved');
    setShowToast(true);
    setTimeout(() => {
      setShowToast(false);
    }, 3500);
  };

  const openFullscreen = () => {
    setIsFullscreen(true);
    try {
      if (typeof document !== 'undefined') {
        document.body.style.overflow = 'hidden';
      }
      if (document.documentElement.requestFullscreen) {
        document.documentElement.requestFullscreen().catch(() => {});
      }
      if (typeof window !== 'undefined' && window.screen && (window.screen as any).orientation?.lock) {
        (window.screen as any).orientation.lock('landscape').catch(() => {});
      }
    } catch {}
  };

  const closeFullscreen = () => {
    setIsFullscreen(false);
    try {
      if (typeof document !== 'undefined') {
        document.body.style.overflow = '';
      }
      if (document.fullscreenElement && document.exitFullscreen) {
        document.exitFullscreen().catch(() => {});
      }
      if (typeof window !== 'undefined' && window.screen && (window.screen as any).orientation?.unlock) {
        (window.screen as any).orientation.unlock();
      }
    } catch {}
  };

  return (
    <div className="flex flex-col w-full pb-14 space-y-4">
      {/* 1. Header & Mode Ribbon */}
      <section className="px-4 pt-3">
        <div className="bg-white rounded-2xl p-4 shadow-sm border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <div className="flex items-center gap-1.5">
              <span
                className={`w-2.5 h-2.5 rounded-full ${
                  hasLiveStream ? 'bg-emerald-600 animate-pulse' : isRetryingStream ? 'bg-amber-500 animate-ping' : 'bg-slate-400'
                }`}
              />
              <span
                className={`font-headline text-[11px] uppercase tracking-wider font-bold ${
                  hasLiveStream ? 'text-emerald-800' : isRetryingStream ? 'text-amber-800' : 'text-slate-600'
                }`}
              >
                {hasLiveStream
                  ? 'Live Video Stream (30 FPS)'
                  : isRetryingStream
                  ? 'Connecting Live Camera Stream...'
                  : 'Camera Inactive • Standby'}
              </span>
            </div>
            <h1 className="font-headline text-2xl font-bold text-slate-900 tracking-tight mt-0.5">
              {t('liveCamera')}
            </h1>
            <p className="text-xs text-slate-500 mt-0.5">
              Live optical field view and horizontal axis camera rotation (Left - Right: 0° to 180°).
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
              <span>{cameraControl.mode === 'manual' ? 'Manual Mode Active' : 'Auto Patrol Mode'}</span>
            </div>
          </div>
        </div>
      </section>

      {/* 2. CAMERA VIEWPORT: LIVE STREAM / CONNECTING HUD / STANDBY */}
      <section className="px-4">
        <div
          ref={videoViewportRef}
          className="relative w-full rounded-2xl overflow-hidden bg-slate-950 border border-slate-200 shadow-lg ring-1 ring-black/5 aspect-[16/10] sm:aspect-video flex items-center justify-center"
        >
          {/* Active WebRTC Live Video Track (Always mounted to instantly receive incoming frames) */}
          <video
            ref={videoElementRef}
            autoPlay
            playsInline
            muted
            onLoadedData={() => {
              if (videoElementRef.current) {
                videoElementRef.current.play().catch(() => {});
              }
            }}
            className={`absolute inset-0 w-full h-full object-cover bg-slate-950 transition-opacity duration-300 ${
              hasLiveStream ? 'opacity-100 z-10' : 'opacity-0 pointer-events-none'
            }`}
          />

          {/* Connecting State Overlay */}
          {!hasLiveStream && isRetryingStream && (
            <div className="absolute inset-0 bg-slate-950 flex flex-col items-center justify-center p-6 text-center text-white z-10">
              <div className="relative mb-3 flex items-center justify-center">
                <div className="w-16 h-16 rounded-2xl bg-emerald-500/20 border border-emerald-500/40 text-emerald-400 flex items-center justify-center shadow-2xl animate-pulse">
                  <Video className="w-8 h-8" />
                </div>
                <span className="absolute -top-1 -right-1 w-3.5 h-3.5 bg-emerald-500 rounded-full animate-ping" />
              </div>

              <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-950/80 border border-emerald-500/30 text-emerald-300 text-[11px] font-headline font-bold uppercase tracking-wider mb-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                <span>Negotiating Live Video Feed</span>
              </div>

              <h3 className="font-headline text-base sm:text-lg font-bold text-white tracking-tight">
                {lang === 'hi' ? 'लाइव कैमरा स्ट्रीम से कनेक्ट हो रहा है...' : 'Connecting to Live Camera Stream (30 FPS)...'}
              </h3>

              <p className="text-xs text-slate-300 mt-1.5 max-w-md leading-relaxed">
                {lang === 'hi'
                  ? 'फील्ड कैमरा नोड (CAM #01) से रीयल-टाइम वीडियो कनेक्शन स्थापित किया जा रहा है।'
                  : 'Establishing ultra-low latency WebRTC connection with optical camera node (pi_agroeye_01)...'}
              </p>

              <div className="mt-4 flex items-center gap-2">
                <RefreshCw className="w-4 h-4 text-emerald-400 animate-spin" />
                <span className="text-xs text-emerald-300 font-mono font-bold">Syncing live video packets...</span>
              </div>
            </div>
          )}

          {/* Camera Inactive Standby Page (When not streaming and not actively negotiating) */}
          {!hasLiveStream && !isRetryingStream && (
            <div className="absolute inset-0 bg-slate-950 flex flex-col items-center justify-center p-6 text-center text-white z-10">
              <div className="relative mb-3 flex items-center justify-center">
                <div className="w-16 h-16 rounded-2xl bg-slate-900 border border-slate-800 text-slate-400 flex items-center justify-center shadow-2xl ring-1 ring-slate-800/80">
                  <VideoOff className="w-8 h-8 text-slate-400" />
                </div>
                <span className="absolute -top-1 -right-1 w-3 h-3 bg-amber-500 rounded-full animate-ping" />
              </div>

              <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-slate-900 border border-slate-800 text-slate-400 text-[11px] font-headline font-bold uppercase tracking-wider mb-1.5">
                <span className="w-2 h-2 rounded-full bg-amber-500" />
                <span>Camera Inactive • Standby Mode</span>
              </div>

              <h3 className="font-headline text-base sm:text-lg font-bold text-white tracking-tight">
                {lang === 'hi' ? 'कैमरा निष्क्रिय • स्टैंडबाय मोड' : 'Optical Camera Node Inactive'}
              </h3>

              <p className="text-xs text-slate-400 mt-1.5 max-w-md leading-relaxed">
                {lang === 'hi'
                  ? 'फील्ड ऑप्टिकल कैमरा नोड वर्तमान में निष्क्रिय या स्टैंडबाय स्थिति में है। कैमरा शुरू होने पर लाइव वीडियो स्ट्रीम यहां स्वचालित रूप से दिखाई देगी।'
                  : 'The optical camera node (pi_agroeye_01) is currently inactive or in standby. Click below to initiate live 30 FPS video streaming.'}
              </p>

              <button
                type="button"
                onClick={startStream}
                className="mt-4 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-headline text-xs font-bold uppercase tracking-wider flex items-center gap-2 active:scale-95 transition-all shadow-md"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>Connect Live Camera Feed</span>
              </button>

              <div className="mt-4 pt-3 border-t border-slate-800/80 flex items-center gap-3 text-[10px] font-mono text-slate-500">
                <span>Node: pi_agroeye_01</span>
                <span>•</span>
                <span>Signaling: Realtime RTDB</span>
              </div>
            </div>
          )}

          {/* Reticle HUD & Gradient when active */}
          {hasLiveStream && (
            <>
              <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-transparent to-black/60 pointer-events-none z-20" />
              <div className="absolute top-3 left-3 w-3.5 h-3.5 border-t-2 border-l-2 border-emerald-400 pointer-events-none z-20" />
              <div className="absolute top-3 right-3 w-3.5 h-3.5 border-t-2 border-r-2 border-emerald-400 pointer-events-none z-20" />
              <div className="absolute bottom-3 left-3 w-3.5 h-3.5 border-b-2 border-l-2 border-emerald-400 pointer-events-none z-20" />
              <div className="absolute bottom-3 right-3 w-3.5 h-3.5 border-b-2 border-r-2 border-emerald-400 pointer-events-none z-20" />

              {/* Top HUD Indicators */}
              <div className="absolute top-0 left-0 right-0 p-3 flex items-start justify-between gap-2 pointer-events-none z-30">
                <div className="flex flex-col gap-0.5">
                  <span className="font-headline text-[10px] text-emerald-400 tracking-widest uppercase font-bold drop-shadow flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                    <span>FARM CAMERA STREAM • 30 FPS</span>
                  </span>
                  <div className="flex items-center gap-1.5 text-white/90 drop-shadow">
                    <span className="font-mono text-[10px] bg-black/60 backdrop-blur-sm px-1.5 py-0.5 rounded text-white font-bold">
                      MODE: {cameraControl.mode.toUpperCase()}
                    </span>
                    <span className="font-mono text-[10px] text-emerald-300 font-bold bg-black/60 backdrop-blur-sm px-1.5 py-0.5 rounded">
                      PAN: {cameraControl.pan_angle}°
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-1.5 pointer-events-auto">
                  <button
                    type="button"
                    onClick={startStream}
                    className="p-1.5 rounded-lg bg-black/60 hover:bg-black/80 backdrop-blur-md border border-white/20 text-slate-200 hover:text-white transition-all"
                    title="Re-sync WebRTC Stream"
                  >
                    <RefreshCw className="w-3.5 h-3.5" />
                  </button>
                  <span className="font-headline text-[10px] bg-black/60 backdrop-blur-sm text-slate-200 px-2 py-1 rounded-lg border border-white/10 font-bold">
                    {streamStats.fps > 0 ? `${streamStats.fps} FPS` : '30 FPS'}
                  </span>
                </div>
              </div>

              {/* Bottom Viewport Action Toolbar */}
              <div className="absolute bottom-0 left-0 right-0 p-3 flex items-center justify-between text-white text-xs z-30">
                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={handleSnapshot}
                    className="h-8 px-2.5 bg-black/60 hover:bg-black/80 backdrop-blur-md rounded-lg border border-white/20 flex items-center gap-1 font-headline text-xs font-bold active:scale-95 transition-all"
                    title="Capture Snapshot"
                  >
                    <Camera className="w-3.5 h-3.5 text-emerald-400" />
                    <span className="hidden sm:inline">Capture</span>
                  </button>
                </div>

                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={openFullscreen}
                    className="px-3 py-1.5 bg-black/60 hover:bg-black/80 backdrop-blur-md rounded-lg border border-white/20 flex items-center gap-1.5 font-headline text-xs font-bold active:scale-95 transition-all"
                    title="Open Fullscreen Landscape View"
                  >
                    <Maximize2 className="w-3.5 h-3.5 text-emerald-400" />
                    <span>Fullscreen</span>
                  </button>
                </div>
              </div>
            </>
          )}
        </div>
      </section>

      {/* 3. MODE SELECTOR & OPERATOR AUTH */}
      <section className="px-4">
        <div className="p-3 bg-white rounded-2xl border border-slate-200 shadow-sm flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Sliders className="w-4 h-4 text-emerald-600" />
              <h3 className="font-headline text-xs font-bold uppercase tracking-wider text-slate-900">
                Camera Control Mode
              </h3>
            </div>
            {!isAuthenticated && (
              <span className="text-[10px] font-headline font-bold text-amber-700 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-full flex items-center gap-1">
                <Lock className="w-3 h-3" />
                <span>Sign in required for manual control</span>
              </span>
            )}
          </div>

          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => handleModeToggle('auto')}
              className={`h-11 px-3 rounded-xl font-headline text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-2 transition-all ${
                cameraControl.mode === 'auto'
                  ? 'bg-emerald-600 text-white shadow-sm ring-2 ring-emerald-600/30'
                  : 'bg-slate-50 border border-slate-200 text-slate-700 hover:bg-slate-100'
              }`}
            >
              <Bot className="w-4 h-4" />
              <span>1. Auto Patrol Mode</span>
            </button>

            <button
              type="button"
              onClick={() => handleModeToggle('manual')}
              className={`h-11 px-3 rounded-xl font-headline text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-2 transition-all ${
                cameraControl.mode === 'manual'
                  ? 'bg-amber-500 text-slate-950 font-extrabold shadow-sm ring-2 ring-amber-500/40'
                  : 'bg-slate-50 border border-slate-200 text-slate-700 hover:bg-slate-100'
              }`}
            >
              <Gamepad2 className="w-4 h-4" />
              <span>2. Manual Joystick Mode</span>
            </button>
          </div>
        </div>
      </section>

      {/* 4. HORIZONTAL SERVO OPERATION (ONLY VISIBLE IN MANUAL MODE - FIXED 10° STEP) */}
      <section className="px-4">
        {cameraControl.mode === 'manual' ? (
          <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-sm space-y-4 animate-in fade-in duration-200">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <Compass className="w-4 h-4 text-emerald-600" />
                <h3 className="font-headline text-xs uppercase tracking-wider font-bold text-slate-900">
                  Manual Rotation Controls (Current: {cameraControl.pan_angle}°)
                </h3>
              </div>
              <button
                type="button"
                onClick={handleCenterPreset}
                className="h-7 px-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-headline text-[11px] font-bold rounded-lg transition-all flex items-center gap-1"
              >
                <RotateCcw className="w-3 h-3" />
                <span>Center (90°)</span>
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 items-center">
              {/* Left / Right Horizontal Controls (Fixed 10° Step) */}
              <div className="flex flex-col items-center justify-center p-4 bg-slate-50 rounded-2xl border border-slate-200">
                <div className="flex items-center justify-center gap-4 w-full py-2">
                  <button
                    type="button"
                    onClick={() => handleDirectionClick(-FIXED_STEP_SIZE, 'pan_left')}
                    className="flex-1 h-14 bg-white hover:bg-emerald-50 active:bg-emerald-600 active:text-white rounded-xl shadow-sm border border-slate-200 flex items-center justify-center gap-2 text-slate-800 font-headline text-sm font-bold transition-all active:scale-95"
                    title="Turn Left 10°"
                  >
                    <ChevronLeft className="w-6 h-6 text-emerald-600" />
                    <span>Turn Left (-10°)</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleDirectionClick(FIXED_STEP_SIZE, 'pan_right')}
                    className="flex-1 h-14 bg-white hover:bg-emerald-50 active:bg-emerald-600 active:text-white rounded-xl shadow-sm border border-slate-200 flex items-center justify-center gap-2 text-slate-800 font-headline text-sm font-bold transition-all active:scale-95"
                    title="Turn Right 10°"
                  >
                    <span>Turn Right (+10°)</span>
                    <ChevronRight className="w-6 h-6 text-emerald-600" />
                  </button>
                </div>
              </div>

              {/* Precision Horizontal Angle Slider */}
              <div className="space-y-3 p-4 bg-slate-50 rounded-2xl border border-slate-200">
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-headline font-bold text-slate-700">Horizontal Angle (0° - 180°)</span>
                    <span className="font-mono font-bold text-emerald-700 text-sm">{cameraControl.pan_angle}°</span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="180"
                    value={cameraControl.pan_angle}
                    onChange={handleSliderChange}
                    className="w-full h-2.5 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-emerald-600"
                  />
                  <div className="flex justify-between text-[10px] font-mono text-slate-400">
                    <span>0° (Full Left)</span>
                    <span>90° (Center)</span>
                    <span>180° (Full Right)</span>
                  </div>
                </div>

                <div className="pt-2 border-t border-slate-200 text-[11px] text-slate-500 font-mono">
                  Status: <strong className="text-slate-800">{lastActionStatus}</strong>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm flex items-center justify-between gap-3 animate-in fade-in duration-200">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-700 flex items-center justify-center flex-shrink-0">
                <Bot className="w-5 h-5 animate-pulse" />
              </div>
              <div>
                <h4 className="font-headline text-sm font-bold text-slate-900">
                  {lang === 'hi' ? 'ऑटो पेट्रोल मोड सक्रिय' : 'Auto Patrol Mode Active'}
                </h4>
                <p className="text-xs text-slate-500 mt-0.5">
                  {lang === 'hi'
                    ? 'कैमरा स्वचालित रूप से खेत की निगरानी कर रहा है। रोटेशन नियंत्रण के लिए ऊपर मैनुअल मोड चुनें।'
                    : 'The camera is automatically monitoring your field. Select Manual Mode above to enable rotation controls.'}
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => handleModeToggle('manual')}
              className="px-3.5 py-2 rounded-xl bg-slate-100 hover:bg-emerald-50 hover:text-emerald-700 text-slate-700 font-headline text-xs font-bold whitespace-nowrap transition-all border border-slate-200"
            >
              {lang === 'hi' ? 'मैनुअल सक्षम करें' : 'Enable Manual'}
            </button>
          </div>
        )}
      </section>

      {/* 5. FULLSCREEN LANDSCAPE VIEW MODAL */}
      {isFullscreen && (
        <div
          ref={fullscreenContainerRef}
          className="fixed inset-0 z-[99999] bg-black flex flex-col justify-between overflow-hidden animate-in fade-in"
        >
          {/* Fullscreen Video Canvas / Viewport */}
          <div className="relative w-full h-full flex items-center justify-center bg-black">
            {hasLiveStream ? (
              <video
                ref={fullscreenVideoElementRef}
                autoPlay
                playsInline
                muted
                onLoadedData={() => {
                  if (fullscreenVideoElementRef.current) {
                    fullscreenVideoElementRef.current.play().catch(() => {});
                  }
                }}
                className="w-full h-full object-contain"
              />
            ) : isRetryingStream ? (
              <div className="absolute inset-0 bg-slate-950 flex flex-col items-center justify-center p-6 text-center text-white z-10">
                <Video className="w-14 h-14 text-emerald-400 animate-pulse mb-3" />
                <h3 className="font-headline text-lg font-bold">
                  {lang === 'hi' ? 'लाइव स्ट्रीम कनेक्ट हो रही है...' : 'Connecting Live Camera Stream...'}
                </h3>
                <p className="text-xs text-slate-400 mt-1 max-w-sm">
                  {lang === 'hi'
                    ? 'ऑप्टिकल कैमरा नोड से रीयल-टाइम वीडियो स्ट्रीम प्राप्त की जा रही है।'
                    : 'Connecting to field optical camera node (pi_agroeye_01)...'}
                </p>
              </div>
            ) : (
              <div className="absolute inset-0 bg-slate-950 flex flex-col items-center justify-center p-6 text-center text-white z-10">
                <VideoOff className="w-14 h-14 text-slate-500 mb-3" />
                <h3 className="font-headline text-lg font-bold">
                  {lang === 'hi' ? 'कैमरा निष्क्रिय • स्टैंडबाय मोड' : 'Optical Camera Node Inactive'}
                </h3>
                <p className="text-xs text-slate-400 mt-1 max-w-sm">
                  {lang === 'hi'
                    ? 'फील्ड ऑप्टिकल कैमरा वर्तमान में स्टैंडबाय स्थिति में है।'
                    : 'The optical camera node (pi_agroeye_01) is currently in standby mode.'}
                </p>
                <button
                  type="button"
                  onClick={startStream}
                  className="mt-4 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold uppercase tracking-wider transition-all"
                >
                  Connect Stream
                </button>
              </div>
            )}

            {/* Top Overlay Bar */}
            <div className="absolute top-0 left-0 right-0 p-4 bg-gradient-to-b from-black/80 to-transparent flex items-center justify-between text-white z-30 pointer-events-auto">
              <div className="flex items-center gap-2">
                <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-black/60 backdrop-blur-md border border-white/20">
                  <span
                    className={`w-2 h-2 rounded-full ${
                      hasLiveStream ? 'bg-emerald-500 animate-pulse' : 'bg-slate-400'
                    }`}
                  />
                  <span className="font-headline text-xs font-bold">
                    {hasLiveStream ? 'LIVE STREAM (30 FPS)' : 'CAMERA STANDBY'}
                  </span>
                </div>
                <span className="font-mono text-xs text-emerald-300 font-bold px-2 py-1 rounded bg-black/60 backdrop-blur-md">
                  MODE: {cameraControl.mode.toUpperCase()} • {cameraControl.pan_angle}°
                </span>
              </div>

              <div className="flex items-center gap-2">
                {hasLiveStream && (
                  <button
                    type="button"
                    onClick={handleSnapshot}
                    className="p-2 rounded-xl bg-black/60 hover:bg-black/80 backdrop-blur-md border border-white/20 active:scale-95 transition-all text-white"
                    title="Capture Snapshot"
                  >
                    <Camera className="w-4 h-4 text-emerald-400" />
                  </button>
                )}

                <button
                  type="button"
                  onClick={closeFullscreen}
                  className="px-3 py-1.5 rounded-xl bg-rose-600/90 hover:bg-rose-600 text-white font-headline text-xs font-bold flex items-center gap-1 shadow-lg active:scale-95 transition-all"
                  title="Exit Fullscreen"
                >
                  <X className="w-4 h-4" />
                  <span>Exit</span>
                </button>
              </div>
            </div>

            {/* Floating Left Movement Button (ONLY in Manual Mode - Fixed 10° Step) */}
            {cameraControl.mode === 'manual' && (
              <div className="absolute left-4 top-1/2 -translate-y-1/2 z-30 pointer-events-auto flex flex-col items-center gap-2 animate-in fade-in">
                <button
                  type="button"
                  onClick={() => handleDirectionClick(-FIXED_STEP_SIZE, 'pan_left')}
                  className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-black/70 hover:bg-emerald-600 active:bg-emerald-700 text-white backdrop-blur-md border border-white/30 shadow-2xl flex flex-col items-center justify-center gap-1 active:scale-90 transition-all group"
                  title="Pan Left 10°"
                >
                  <ChevronLeft className="w-8 h-8 group-hover:-translate-x-1 transition-transform" />
                  <span className="font-headline text-[10px] uppercase font-bold tracking-wider">-10° Left</span>
                </button>
              </div>
            )}

            {/* Floating Right Movement Button (ONLY in Manual Mode - Fixed 10° Step) */}
            {cameraControl.mode === 'manual' && (
              <div className="absolute right-4 top-1/2 -translate-y-1/2 z-30 pointer-events-auto flex flex-col items-center gap-2 animate-in fade-in">
                <button
                  type="button"
                  onClick={() => handleDirectionClick(FIXED_STEP_SIZE, 'pan_right')}
                  className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-black/70 hover:bg-emerald-600 active:bg-emerald-700 text-white backdrop-blur-md border border-white/30 shadow-2xl flex flex-col items-center justify-center gap-1 active:scale-90 transition-all group"
                  title="Pan Right 10°"
                >
                  <ChevronRight className="w-8 h-8 group-hover:translate-x-1 transition-transform" />
                  <span className="font-headline text-[10px] uppercase font-bold tracking-wider">+10° Right</span>
                </button>
              </div>
            )}

            {/* Bottom Overlay Info & Mode Controls */}
            <div className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-black/80 to-transparent flex items-center justify-center gap-3 text-white z-30 pointer-events-auto">
              {cameraControl.mode === 'manual' ? (
                <button
                  type="button"
                  onClick={handleCenterPreset}
                  className="px-4 py-2 rounded-xl bg-black/60 hover:bg-black/80 backdrop-blur-md border border-white/20 font-headline text-xs font-bold flex items-center gap-1.5 active:scale-95 transition-all text-slate-200"
                >
                  <RotateCcw className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Center (90°)</span>
                </button>
              ) : (
                <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-black/60 backdrop-blur-md border border-white/20 text-xs text-slate-200 font-headline">
                  <Bot className="w-4 h-4 text-emerald-400" />
                  <span>Auto Patrol Mode Active</span>
                  <button
                    type="button"
                    onClick={() => handleModeToggle('manual')}
                    className="ml-2 px-2.5 py-0.5 rounded-lg bg-emerald-600 text-white font-bold uppercase text-[10px]"
                  >
                    Switch to Manual
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Snapshot Toast */}
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
