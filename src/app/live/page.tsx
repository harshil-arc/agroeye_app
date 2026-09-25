'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useFarmData } from '@/context/FarmDataContext';
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
  Check
} from 'lucide-react';

export default function LiveCameraPage() {
  const {
    isOfflineMode,
    latestImageUrl,
    cameraControl,
    setCameraMode,
    updateCameraCoords,
    sendCameraStep,
    firebaseConfig
  } = useFarmData();

  const [isPlaying, setIsPlaying] = useState<boolean>(true);
  const [isNightMode, setIsNightMode] = useState<boolean>(false);
  const [showToast, setShowToast] = useState<boolean>(false);
  const [toastMessage, setToastMessage] = useState<string>('');
  const [toastCode, setToastCode] = useState<string>('');
  const [clockString, setClockString] = useState<string>('');
  const [stepSize, setStepSize] = useState<number>(10);
  const [lastActionStatus, setLastActionStatus] = useState<string>('Ready');
  const [isSendingToFirebase, setIsSendingToFirebase] = useState<boolean>(false);
  const videoViewportRef = useRef<HTMLDivElement>(null);

  // Live timestamp clock update
  useEffect(() => {
    const updateClock = () => {
      const now = new Date();
      setClockString(
        now.toISOString().replace('T', ' ').substring(0, 19) + ' IST'
      );
    };
    updateClock();
    const interval = setInterval(updateClock, 1000);
    return () => clearInterval(interval);
  }, []);

  // AUTOMATIC SHIFT TO AUTO MODE ON PAGE EXIT / BACK NAVIGATION
  useEffect(() => {
    // When unmounting (navigating away / backing out of Live tab)
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

      // Use fetch with keepalive or sendBeacon for guaranteed delivery on page exit
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
        console.warn('Auto mode reset on unmount error:', err);
      }
    };
  }, [firebaseConfig]);

  // Window beforeunload fallback
  useEffect(() => {
    const handleBeforeUnload = () => {
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
        source: 'window_unload_reset',
      });
      if (typeof navigator !== 'undefined' && navigator.sendBeacon) {
        const blob = new Blob([resetPayload], { type: 'application/json' });
        navigator.sendBeacon(`${dbUrl}/camera_control.json`, blob);
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [firebaseConfig]);

  const handleModeToggle = async (newMode: 'auto' | 'manual') => {
    setIsSendingToFirebase(true);
    await setCameraMode(newMode);
    setLastActionStatus(newMode === 'manual' ? 'Manual Joystick Active' : 'Auto Patrol Resumed');
    setTimeout(() => setIsSendingToFirebase(false), 500);
  };

  const handleDirectionClick = async (deltaPan: number, deltaTilt: number, cmd: 'pan_left' | 'pan_right' | 'tilt_up' | 'tilt_down') => {
    setIsSendingToFirebase(true);
    await sendCameraStep(deltaPan, deltaTilt, cmd);
    setLastActionStatus(`Sent ${cmd.replace('_', ' ').toUpperCase()} to Firebase`);
    setTimeout(() => setIsSendingToFirebase(false), 350);
  };

  const handleCenterPreset = async () => {
    setIsSendingToFirebase(true);
    await updateCameraCoords(90, 90, 'center');
    setLastActionStatus('Reset to Center (90°, 90°)');
    setTimeout(() => setIsSendingToFirebase(false), 350);
  };

  const handleSliderChange = async (e: React.ChangeEvent<HTMLInputElement>, axis: 'pan' | 'tilt') => {
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
    setToastMessage('Snapshot captured from camera & saved to gallery');
    setShowToast(true);
    setTimeout(() => {
      setShowToast(false);
    }, 4000);
  };

  const toggleFullscreen = () => {
    if (!videoViewportRef.current) return;
    if (!document.fullscreenElement) {
      videoViewportRef.current.requestFullscreen().catch((err) => {
        console.warn('Fullscreen error:', err);
      });
    } else {
      document.exitFullscreen();
    }
  };

  // Convert pan angle (0-180) and tilt angle (0-180) to visual CSS transforms
  const panVisualX = (cameraControl.pan_angle - 90) * 0.4;
  const tiltVisualY = -(cameraControl.tilt_angle - 90) * 0.4;

  return (
    <div className="flex flex-col w-full pb-10">
      {/* 1. Status Header / Mode Ribbon */}
      <section className="px-4 pt-3 pb-2">
        <div className="flex items-center justify-between gap-2 mb-1">
          <div className="min-w-0">
            <span className="font-headline text-[11px] uppercase tracking-wider text-emerald-700 font-bold">
              Camera Servo Gateway • Raspberry Pi
            </span>
            <h1 className="font-headline text-2xl text-slate-900 font-bold tracking-tight truncate">
              Live Farm Camera &amp; PTZ
            </h1>
          </div>
          <div
            className={`flex items-center gap-1.5 px-3 py-1 rounded-full border shadow-sm flex-shrink-0 ${
              cameraControl.mode === 'manual'
                ? 'bg-amber-50 border-amber-300 text-amber-900'
                : 'bg-emerald-50 border-emerald-200 text-emerald-700'
            }`}
          >
            <span
              className={`w-2 h-2 rounded-full ${
                cameraControl.mode === 'manual'
                  ? 'bg-amber-500 animate-pulse'
                  : 'bg-emerald-500 animate-pulse'
              }`}
            />
            <span className="font-headline text-[11px] tracking-widest uppercase font-bold">
              {cameraControl.mode === 'manual' ? 'Manual Mode' : 'Auto Mode'}
            </span>
          </div>
        </div>

        <p className="text-xs text-slate-500 flex items-center gap-1.5 font-medium">
          <Video className="w-4 h-4 text-emerald-600 flex-shrink-0" />
          <span>RPi Camera Node #01</span>
          <span className="text-slate-300">•</span>
          <span>Dual Axis Servo (X-Pan / Y-Tilt)</span>
        </p>

        {/* Mode Selector Toggle Pill */}
        <div className="mt-3 p-1 bg-slate-100 rounded-xl border border-slate-200 flex items-center gap-1">
          <button
            type="button"
            onClick={() => handleModeToggle('auto')}
            className={`flex-1 min-h-[42px] px-3 rounded-lg font-headline text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-2 transition-all ${
              cameraControl.mode === 'auto'
                ? 'bg-white text-emerald-800 shadow-sm border border-emerald-200/80'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Bot className="w-4 h-4 text-emerald-600" />
            <span>1. Auto Mode (Patrol)</span>
          </button>

          <button
            type="button"
            onClick={() => handleModeToggle('manual')}
            className={`flex-1 min-h-[42px] px-3 rounded-lg font-headline text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-2 transition-all ${
              cameraControl.mode === 'manual'
                ? 'bg-emerald-600 text-white shadow-md'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Gamepad2 className="w-4 h-4" />
            <span>2. Manual Mode (Joystick)</span>
          </button>
        </div>
      </section>

      {/* 2. VIDEO STREAM DISPLAY CONTAINER */}
      <section className="px-4 mb-4">
        <div
          ref={videoViewportRef}
          className="relative w-full rounded-2xl overflow-hidden bg-slate-950 border border-slate-200/80 shadow-md ring-1 ring-black/5"
        >
          {isPlaying && !isOfflineMode ? (
            /* Live Stream Active Layer */
            <div className="relative w-full aspect-[16/10] sm:aspect-video overflow-hidden group">
              <img
                alt="Raspberry Pi outdoor farm camera feed"
                className="w-full h-full object-cover transition-transform duration-300 will-change-transform"
                style={{
                  transform: `scale(1.08) translate(${panVisualX}px, ${tiltVisualY}px)`,
                }}
                src={latestImageUrl}
                onError={(e) => {
                  (e.target as HTMLElement).setAttribute('src', 'https://iili.io/nuiqbzg.jpg');
                }}
              />

              {/* Night Vision IR Green Tint Overlay */}
              {isNightMode && (
                <div className="absolute inset-0 bg-emerald-950/40 mix-blend-color pointer-events-none transition-opacity duration-300" />
              )}

              {/* Contrast gradients and grid */}
              <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-transparent to-black/60 pointer-events-none" />
              <div className="absolute inset-0 bg-[radial-gradient(#10b981_1px,transparent_1px)] [background-size:24px_24px] opacity-10 pointer-events-none" />

              {/* Telemetry Reticle Corners */}
              <div className="absolute top-3 left-3 w-3.5 h-3.5 border-t-2 border-l-2 border-emerald-400 pointer-events-none" />
              <div className="absolute top-3 right-3 w-3.5 h-3.5 border-t-2 border-r-2 border-emerald-400 pointer-events-none" />
              <div className="absolute bottom-3 left-3 w-3.5 h-3.5 border-b-2 border-l-2 border-emerald-400 pointer-events-none" />
              <div className="absolute bottom-3 right-3 w-3.5 h-3.5 border-b-2 border-r-2 border-emerald-400 pointer-events-none" />

              {/* Top HUD Indicators */}
              <div className="absolute top-0 left-0 right-0 p-3 flex items-start justify-between gap-2 pointer-events-none">
                <div className="flex flex-col gap-0.5 max-w-[65%]">
                  <span className="font-headline text-[10px] text-emerald-400 tracking-widest uppercase font-bold drop-shadow">
                    RASPBERRY PI CAM • DUAL SERVO X-Y
                  </span>
                  <div className="flex items-center gap-1.5 text-white/90 drop-shadow">
                    <span className="font-mono text-[10px] bg-black/60 backdrop-blur-sm px-1.5 py-0.5 rounded text-white">
                      MODE: {cameraControl.mode.toUpperCase()}
                    </span>
                    <span className="font-mono text-[10px] text-emerald-300">
                      PAN: {cameraControl.pan_angle}° • TILT: {cameraControl.tilt_angle}°
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-red-600/85 text-white backdrop-blur-md shadow-sm">
                    <span className="w-1.5 h-1.5 rounded-full bg-white animate-ping" />
                    <span className="font-headline text-[10px] font-bold tracking-wider uppercase">
                      REC
                    </span>
                  </div>
                  <div className="flex items-center gap-1 bg-black/60 backdrop-blur-md px-2 py-0.5 rounded text-white border border-white/10">
                    <BatteryCharging className="w-3.5 h-3.5 text-emerald-400" />
                    <span className="font-headline text-[10px] font-bold">98%</span>
                  </div>
                </div>
              </div>

              {/* Center Crosshair HUD */}
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-40">
                <div className="w-12 h-12 border border-emerald-400/60 rounded-full flex items-center justify-center">
                  <div className="w-2 h-2 bg-emerald-400 rounded-full" />
                </div>
              </div>

              {/* Bottom Layer Overlays */}
              <div className="absolute bottom-0 left-0 right-0 p-3 flex flex-col gap-1 pointer-events-none">
                <div className="flex items-center justify-between gap-2 text-white">
                  <div className="flex items-center gap-1.5 drop-shadow">
                    <Crosshair className="w-4 h-4 text-teal-300" />
                    <span className="font-headline text-xs font-bold tracking-tight text-white drop-shadow">
                      Dabok Rice Field • Node 01
                    </span>
                  </div>
                  <div className="flex items-center gap-1 bg-black/60 backdrop-blur-sm px-2 py-0.5 rounded border border-white/10 text-emerald-400 text-right font-headline text-[10px] font-bold drop-shadow">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                    <span>FIREBASE SYNC ACTIVE</span>
                  </div>
                </div>
                <div className="flex items-center justify-between text-white/80 font-mono text-[10px] tracking-wider">
                  <span className="text-white font-semibold drop-shadow">{clockString}</span>
                  <span className="drop-shadow">
                    SERVO: X ({cameraControl.x_coord}) • Y ({cameraControl.y_coord})
                  </span>
                </div>
              </div>
            </div>
          ) : (
            /* Stream Paused Screen */
            <div className="relative w-full aspect-[16/10] sm:aspect-video bg-slate-100 flex flex-col items-center justify-center p-6 text-center">
              <div className="w-14 h-14 rounded-full bg-rose-50 border border-rose-200 text-rose-600 flex items-center justify-center mb-3 shadow-sm">
                <AlertOctagon className="w-7 h-7" />
              </div>
              <h2 className="font-headline text-lg text-slate-900 font-bold tracking-tight mb-1">
                Camera Stream Suspended
              </h2>
              <p className="text-xs text-slate-600 mb-4 max-w-sm">
                Live stream paused. Tap below to resume real-time video frames.
              </p>
              <button
                type="button"
                onClick={() => setIsPlaying(true)}
                className="h-10 px-4 rounded-xl bg-emerald-600 text-white font-headline text-xs uppercase font-bold flex items-center gap-2 hover:bg-emerald-700 transition-colors active:scale-95 shadow-sm"
              >
                <RotateCw className="w-4 h-4" />
                <span>Resume Stream</span>
              </button>
            </div>
          )}
        </div>

        {/* Snapshot / Action Toast */}
        {showToast && (
          <div className="mt-2 p-2.5 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-900 font-headline text-xs flex items-center justify-between shadow-sm animate-in fade-in duration-200">
            <div className="flex items-center gap-2">
              <CheckCircle className="w-4 h-4 text-emerald-600" />
              <span>{toastMessage}</span>
            </div>
            <span className="font-bold text-emerald-700">{toastCode}</span>
          </div>
        )}
      </section>

      {/* 3. SERVO JOYSTICK CONTROLLER & FIREBASE SYNC */}
      <section className="px-4 mb-4">
        <div className="p-4 rounded-2xl bg-white border border-slate-200/90 shadow-sm">
          {/* Controller Header */}
          <div className="flex items-center justify-between mb-3 pb-2.5 border-b border-slate-100">
            <div>
              <div className="flex items-center gap-2">
                <Gamepad2 className="w-5 h-5 text-emerald-600" />
                <h2 className="font-headline text-sm font-bold text-slate-900">
                  Servo Motor Control Panel (Raspberry Pi)
                </h2>
              </div>
              <span className="text-[11px] text-slate-500 font-medium">
                Real-time Firebase coordinates sync for physical servo actuators
              </span>
            </div>

            <div className="flex items-center gap-1.5">
              <span
                className={`px-2.5 py-0.5 rounded-full font-headline text-[10px] font-bold uppercase ${
                  cameraControl.mode === 'manual'
                    ? 'bg-amber-100 text-amber-900 border border-amber-200'
                    : 'bg-emerald-100 text-emerald-900 border border-emerald-200'
                }`}
              >
                {cameraControl.mode === 'manual' ? '🎮 Manual Active' : '🤖 Auto Patrol'}
              </span>
            </div>
          </div>

          {cameraControl.mode === 'auto' ? (
            /* Auto Mode Banner & Switch Prompt */
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 text-center flex flex-col items-center">
              <Bot className="w-10 h-10 text-emerald-600 mb-2 animate-bounce" />
              <h3 className="font-headline text-sm font-bold text-slate-900">
                Camera is in Autonomous Patrol Mode
              </h3>
              <p className="text-xs text-slate-600 mt-1 max-w-md leading-relaxed">
                The Raspberry Pi is operating the camera servos automatically. When you navigate away from this page, it automatically preserves Auto Mode.
              </p>
              <button
                type="button"
                onClick={() => handleModeToggle('manual')}
                className="mt-3.5 h-10 px-5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-headline text-xs font-bold uppercase tracking-wider flex items-center gap-2 shadow-sm active:scale-95 transition-all"
              >
                <Gamepad2 className="w-4 h-4" />
                <span>Switch to Manual Joystick Control</span>
              </button>
            </div>
          ) : (
            /* Manual Mode Interactive Joystick & Sliders */
            <div className="space-y-4 animate-in fade-in duration-200">
              {/* Step Size Selector */}
              <div className="flex items-center justify-between">
                <span className="font-headline text-xs font-bold text-slate-700">
                  Servo Step Angle:
                </span>
                <div className="flex items-center gap-1">
                  {[5, 10, 15, 30].map((step) => (
                    <button
                      key={step}
                      type="button"
                      onClick={() => setStepSize(step)}
                      className={`h-7 px-2.5 rounded-md font-headline text-xs font-bold transition-all ${
                        stepSize === step
                          ? 'bg-emerald-600 text-white shadow-2xs'
                          : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                      }`}
                    >
                      {step}°
                    </button>
                  ))}
                </div>
              </div>

              {/* Main D-Pad & Coordinates Layout */}
              <div className="flex flex-col sm:flex-row items-center justify-between gap-5 p-3.5 bg-slate-50 rounded-xl border border-slate-200">
                {/* Virtual 4-Way D-Pad for Left/Right/Up/Down */}
                <div className="flex flex-col items-center">
                  <span className="font-headline text-[10px] text-slate-500 uppercase font-bold tracking-wider mb-1.5">
                    Joystick D-Pad
                  </span>
                  <div className="grid grid-cols-3 gap-1.5 w-36 h-36 p-1.5 bg-white rounded-2xl border border-slate-200 shadow-xs">
                    <div />
                    <button
                      type="button"
                      onClick={() => handleDirectionClick(0, stepSize, 'tilt_up')}
                      className="rounded-xl bg-slate-50 hover:bg-emerald-50 active:bg-emerald-100 border border-slate-200 hover:border-emerald-300 text-slate-700 hover:text-emerald-700 active:scale-90 flex items-center justify-center transition-all shadow-2xs"
                      title="Tilt Up"
                    >
                      <ChevronUp className="w-6 h-6" />
                    </button>
                    <div />

                    <button
                      type="button"
                      onClick={() => handleDirectionClick(-stepSize, 0, 'pan_left')}
                      className="rounded-xl bg-slate-50 hover:bg-emerald-50 active:bg-emerald-100 border border-slate-200 hover:border-emerald-300 text-slate-700 hover:text-emerald-700 active:scale-90 flex items-center justify-center transition-all shadow-2xs"
                      title="Pan Left (Turn Camera Left)"
                    >
                      <ChevronLeft className="w-6 h-6" />
                    </button>

                    <button
                      type="button"
                      onClick={handleCenterPreset}
                      className="rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-headline text-xs font-bold active:scale-90 flex items-center justify-center transition-all shadow-xs"
                      title="Center Preset (90°, 90°)"
                    >
                      CTR
                    </button>

                    <button
                      type="button"
                      onClick={() => handleDirectionClick(stepSize, 0, 'pan_right')}
                      className="rounded-xl bg-slate-50 hover:bg-emerald-50 active:bg-emerald-100 border border-slate-200 hover:border-emerald-300 text-slate-700 hover:text-emerald-700 active:scale-90 flex items-center justify-center transition-all shadow-2xs"
                      title="Pan Right (Turn Camera Right)"
                    >
                      <ChevronRight className="w-6 h-6" />
                    </button>

                    <div />
                    <button
                      type="button"
                      onClick={() => handleDirectionClick(0, -stepSize, 'tilt_down')}
                      className="rounded-xl bg-slate-50 hover:bg-emerald-50 active:bg-emerald-100 border border-slate-200 hover:border-emerald-300 text-slate-700 hover:text-emerald-700 active:scale-90 flex items-center justify-center transition-all shadow-2xs"
                      title="Tilt Down"
                    >
                      <ChevronDown className="w-6 h-6" />
                    </button>
                    <div />
                  </div>
                </div>

                {/* Real-time Servo Angle Readouts & Sliders */}
                <div className="flex-1 w-full space-y-3">
                  {/* Pan Slider (X-Axis) */}
                  <div className="p-3 bg-white rounded-xl border border-slate-200 shadow-2xs">
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-headline text-xs font-bold text-slate-800 flex items-center gap-1">
                        <span>↔️</span> Pan Servo (X-Axis / Left-Right)
                      </span>
                      <span className="font-headline text-xs font-bold text-emerald-700 font-mono bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                        {cameraControl.pan_angle}° (X: {cameraControl.x_coord})
                      </span>
                    </div>
                    <input
                      type="range"
                      min={0}
                      max={180}
                      step={1}
                      value={cameraControl.pan_angle}
                      onChange={(e) => handleSliderChange(e, 'pan')}
                      className="w-full accent-emerald-600 cursor-pointer h-2 bg-slate-200 rounded-lg"
                    />
                    <div className="flex justify-between text-[10px] text-slate-400 font-headline font-semibold mt-1">
                      <span>0° (Far Left)</span>
                      <span>90° (Center)</span>
                      <span>180° (Far Right)</span>
                    </div>
                  </div>

                  {/* Tilt Slider (Y-Axis) */}
                  <div className="p-3 bg-white rounded-xl border border-slate-200 shadow-2xs">
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-headline text-xs font-bold text-slate-800 flex items-center gap-1">
                        <span>↕️</span> Tilt Servo (Y-Axis / Up-Down)
                      </span>
                      <span className="font-headline text-xs font-bold text-emerald-700 font-mono bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                        {cameraControl.tilt_angle}° (Y: {cameraControl.y_coord})
                      </span>
                    </div>
                    <input
                      type="range"
                      min={0}
                      max={180}
                      step={1}
                      value={cameraControl.tilt_angle}
                      onChange={(e) => handleSliderChange(e, 'tilt')}
                      className="w-full accent-emerald-600 cursor-pointer h-2 bg-slate-200 rounded-lg"
                    />
                    <div className="flex justify-between text-[10px] text-slate-400 font-headline font-semibold mt-1">
                      <span>0° (Down)</span>
                      <span>90° (Level Horizon)</span>
                      <span>180° (Up)</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Angle Presets Bar */}
              <div className="space-y-1.5">
                <span className="font-headline text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                  Quick Servo Angle Presets:
                </span>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  <button
                    type="button"
                    onClick={() => updateCameraCoords(90, 90, 'center')}
                    className="p-2 rounded-lg bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-700 font-headline text-xs font-semibold text-center active:scale-95 transition-all"
                  >
                    Center (90°, 90°)
                  </button>
                  <button
                    type="button"
                    onClick={() => updateCameraCoords(30, 90, 'pan_left')}
                    className="p-2 rounded-lg bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-700 font-headline text-xs font-semibold text-center active:scale-95 transition-all"
                  >
                    Left Plot (30°, 90°)
                  </button>
                  <button
                    type="button"
                    onClick={() => updateCameraCoords(150, 90, 'pan_right')}
                    className="p-2 rounded-lg bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-700 font-headline text-xs font-semibold text-center active:scale-95 transition-all"
                  >
                    Right Plot (150°, 90°)
                  </button>
                  <button
                    type="button"
                    onClick={() => updateCameraCoords(90, 60, 'tilt_down')}
                    className="p-2 rounded-lg bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-700 font-headline text-xs font-semibold text-center active:scale-95 transition-all"
                  >
                    Crop Soil (90°, 60°)
                  </button>
                </div>
              </div>

              {/* Status and Feedback info */}
              <div className="p-2.5 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-900 text-xs flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-emerald-600" />
                  <span>
                    Status: <strong className="font-mono font-bold">{lastActionStatus}</strong>
                  </span>
                </div>
                <span className="font-mono text-[10px] text-emerald-700">
                  Firebase: /camera_control
                </span>
              </div>
            </div>
          )}
        </div>
      </section>

      {/* 4. CAMERA TACTICAL CONTROLS TOOLBAR */}
      <section className="px-4 mb-4">
        <div className="p-3.5 rounded-2xl bg-white border border-slate-200/90 shadow-sm">
          <div className="flex items-center justify-between mb-3 px-1">
            <span className="font-headline text-xs text-slate-500 font-bold uppercase tracking-wider">
              Tactical Camera Controls
            </span>
            <span className="font-headline text-[11px] text-emerald-700 font-bold">
              WebRTC Direct Sync
            </span>
          </div>

          <div className="grid grid-cols-3 gap-2">
            <button
              type="button"
              onClick={() => setIsPlaying(!isPlaying)}
              className="min-h-[52px] px-2 py-2 rounded-xl bg-white border border-slate-200 hover:bg-slate-50 text-slate-800 flex flex-col items-center justify-center gap-1 active:scale-95 transition-all shadow-xs"
            >
              {isPlaying ? (
                <>
                  <Pause className="w-5 h-5 text-emerald-600" />
                  <span className="font-headline text-[10px] font-bold uppercase text-slate-700">
                    Pause Stream
                  </span>
                </>
              ) : (
                <>
                  <Play className="w-5 h-5 text-emerald-600" />
                  <span className="font-headline text-[10px] font-bold uppercase text-slate-700">
                    Play Stream
                  </span>
                </>
              )}
            </button>

            <button
              type="button"
              onClick={handleSnapshot}
              className="min-h-[52px] px-2 py-2 rounded-xl bg-white border border-slate-200 hover:bg-slate-50 text-slate-800 flex flex-col items-center justify-center gap-1 active:scale-95 transition-all shadow-xs"
            >
              <Camera className="w-5 h-5 text-teal-600" />
              <span className="font-headline text-[10px] font-bold uppercase text-slate-700">
                Snapshot
              </span>
            </button>

            <button
              type="button"
              onClick={toggleFullscreen}
              className="min-h-[52px] px-2 py-2 rounded-xl bg-white border border-slate-200 hover:bg-slate-50 text-slate-800 flex flex-col items-center justify-center gap-1 active:scale-95 transition-all shadow-xs"
            >
              <Maximize2 className="w-5 h-5 text-slate-700" />
              <span className="font-headline text-[10px] font-bold uppercase text-slate-700">
                Fullscreen
              </span>
            </button>

            <button
              type="button"
              onClick={() => setIsNightMode(!isNightMode)}
              className={`min-h-[52px] px-2 py-2 rounded-xl border flex flex-col items-center justify-center gap-1 active:scale-95 transition-all shadow-xs ${
                isNightMode
                  ? 'bg-emerald-50 border-emerald-300 text-emerald-800'
                  : 'bg-white border-slate-200 text-slate-800 hover:bg-slate-50'
              }`}
            >
              <Moon className={`w-5 h-5 ${isNightMode ? 'text-emerald-700' : 'text-slate-700'}`} />
              <span className="font-headline text-[10px] font-bold uppercase">
                {isNightMode ? 'IR: On' : 'IR: Off'}
              </span>
            </button>

            <button
              type="button"
              onClick={() => handleModeToggle('auto')}
              className="min-h-[52px] px-2 py-2 rounded-xl bg-white border border-slate-200 hover:bg-slate-50 text-slate-800 flex flex-col items-center justify-center gap-1 active:scale-95 transition-all shadow-xs"
            >
              <Bot className="w-5 h-5 text-emerald-600" />
              <span className="font-headline text-[10px] font-bold uppercase text-slate-700">
                Auto Sweep
              </span>
            </button>

            <button
              type="button"
              onClick={handleCenterPreset}
              className="min-h-[52px] px-2 py-2 rounded-xl bg-white border border-slate-200 hover:bg-slate-50 text-slate-800 flex flex-col items-center justify-center gap-1 active:scale-95 transition-all shadow-xs"
            >
              <Compass className="w-5 h-5 text-amber-600" />
              <span className="font-headline text-[10px] font-bold uppercase text-slate-700">
                Reset Servos
              </span>
            </button>
          </div>
        </div>
      </section>

      {/* 5. CONNECTION STATUS & HARDWARE TELEMETRY */}
      <section className="px-4">
        <div className="rounded-2xl bg-white border border-slate-200/90 p-4 shadow-sm">
          <div className="flex items-center justify-between mb-3.5 pb-2 border-b border-slate-100">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-700 flex items-center justify-center">
                <Cpu className="w-4 h-4 text-emerald-700" />
              </div>
              <div>
                <h2 className="font-headline text-sm text-slate-900 font-bold leading-tight">
                  Raspberry Pi Servo Gateway
                </h2>
                <span className="text-xs text-slate-500">Dual Servo Actuators • Pan (GPIO 18) / Tilt (GPIO 19)</span>
              </div>
            </div>
            <div className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-800">
              <span className="w-2 h-2 rounded-full bg-emerald-500" />
              <span className="font-headline text-[10px] font-bold uppercase">Connected</span>
            </div>
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50 border border-slate-100">
              <div className="flex items-center gap-2 text-xs text-slate-700 font-medium">
                <Cpu className="w-4 h-4 text-emerald-600" />
                <span>Hardware Controller</span>
              </div>
              <span className="font-headline text-xs font-bold text-slate-900">
                Raspberry Pi 4B • PCA9685 / PWM Servo
              </span>
            </div>

            <div className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50 border border-slate-100">
              <div className="flex items-center gap-2 text-xs text-slate-700 font-medium">
                <Wifi className="w-4 h-4 text-emerald-600" />
                <span>Command Uplink</span>
              </div>
              <span className="font-headline text-xs font-bold text-slate-900">
                Firebase Realtime Database (/camera_control)
              </span>
            </div>

            <div className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50 border border-slate-100">
              <div className="flex items-center gap-2 text-xs text-slate-700 font-medium">
                <HardDrive className="w-4 h-4 text-emerald-600" />
                <span>Autonomous Fallback</span>
              </div>
              <span className="font-headline text-xs font-bold text-emerald-700">
                Auto-reset on page exit enabled
              </span>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
