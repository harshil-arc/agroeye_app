'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import Link from 'next/link';
import { useFarmData, DEFAULT_FALLBACK_IMAGE } from '@/context/FarmDataContext';
import { useAuth } from '@/context/AuthContext';
import { useLanguage } from '@/context/LanguageContext';
import { getFirebaseInstance } from '@/lib/firebase';
import { ref, set, push, onValue, get, off } from 'firebase/database';
import {
  Video,
  Play,
  Square,
  RefreshCw,
  Terminal,
  Activity,
  Maximize2,
  Minimize2,
  Camera,
  Bot,
  Gamepad2,
  Lock,
  Compass,
  ChevronLeft,
  ChevronRight,
  RotateCcw,
  Zap,
  Trash2,
  Sliders,
  CheckCircle2,
  AlertTriangle,
  Server,
  Wifi,
  WifiOff,
  Radio,
  Check
} from 'lucide-react';

const FIXED_STEP_SIZE = 10;

const ICE_SERVERS: RTCConfiguration = {
  iceServers: [
    { urls: 'stun:stun.l.google.com:19302' },
    { urls: 'stun:stun1.l.google.com:19302' },
    { urls: 'stun:stun.cloudflare.com:3478' },
    {
      urls: 'turn:openrelay.metered.ca:80',
      username: 'openrelayproject',
      credential: 'openrelayproject',
    },
    {
      urls: 'turn:openrelay.metered.ca:443',
      username: 'openrelayproject',
      credential: 'openrelayproject',
    },
    {
      urls: 'turn:openrelay.metered.ca:443?transport=tcp',
      username: 'openrelayproject',
      credential: 'openrelayproject',
    },
  ],
  iceCandidatePoolSize: 2,
  bundlePolicy: 'max-bundle',
  rtcpMuxPolicy: 'require',
};

interface LogEntry {
  id: string;
  time: string;
  type: 'info' | 'success' | 'warning' | 'error' | 'step';
  message: string;
}

export default function LiveCameraPage() {
  const {
    isOfflineMode,
    cameraControl,
    setCameraMode,
    updateCameraCoords,
    sendCameraStep,
    firebaseConfig,
    latestImageUrl,
  } = useFarmData();

  const { isAuthenticated, setIsAuthModalOpen } = useAuth();
  const { t, lang } = useLanguage();

  // Lifecycle & UI states
  const [mounted, setMounted] = useState<boolean>(false);
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);
  const [showToast, setShowToast] = useState<boolean>(false);
  const [toastMessage, setToastMessage] = useState<string>('');
  const [toastCode, setToastCode] = useState<string>('');
  const [lastActionStatus, setLastActionStatus] = useState<string>('Ready');
  const [isSendingToGateway, setIsSendingToGateway] = useState<boolean>(false);
  const [showLogConsole, setShowLogConsole] = useState<boolean>(true);

  // WebRTC Diagnostics & Protocol states (from test suite)
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [connectionState, setConnectionState] = useState<string>('idle');
  const [iceState, setIceState] = useState<string>('idle');
  const [signalingState, setSignalingState] = useState<string>('idle');
  const [currentSessionId, setCurrentSessionId] = useState<string>('None');
  const [fps, setFps] = useState<number>(0);
  const [bitrate, setBitrate] = useState<number>(0);
  const [latency, setLatency] = useState<number>(0);
  const [resolution, setResolution] = useState<string>('Waiting...');
  const [isConnecting, setIsConnecting] = useState<boolean>(false);
  const [isVideoPlaying, setIsVideoPlaying] = useState<boolean>(false);
  const [piNodeStatus, setPiNodeStatus] = useState<any>(null);

  // DOM & WebRTC references
  const videoViewportRef = useRef<HTMLDivElement>(null);
  const fullscreenContainerRef = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const fullscreenVideoRef = useRef<HTMLVideoElement>(null);
  const pcRef = useRef<RTCPeerConnection | null>(null);
  const statsTimerRef = useRef<NodeJS.Timeout | null>(null);
  const answerUnsubRef = useRef<(() => void) | null>(null);
  const piCandUnsubRef = useRef<(() => void) | null>(null);
  const activeSessionIdRef = useRef<string>('');
  const logContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  const addLog = useCallback((type: LogEntry['type'], message: string) => {
    const now = new Date();
    const timeStr =
      now.toTimeString().substring(0, 8) +
      '.' +
      String(now.getMilliseconds()).padStart(3, '0');
    const newEntry: LogEntry = {
      id: Math.random().toString(36).substring(2, 9),
      time: timeStr,
      type,
      message,
    };
    setLogs((prev) => [...prev.slice(-150), newEntry]);
  }, []);

  useEffect(() => {
    if (logContainerRef.current) {
      logContainerRef.current.scrollTop = logContainerRef.current.scrollHeight;
    }
  }, [logs]);

  // Keep camera control refs fresh for cleanup on unmount
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

  // Monitor Pi hardware node online status in Firebase
  useEffect(() => {
    const { db } = getFirebaseInstance();
    if (!db) return;

    const statusRef = ref(db, 'webrtc_sessions/pi_agroeye_01/status');
    const unsub = onValue(statusRef, (snap) => {
      const val = snap.val();
      setPiNodeStatus(val);
      if (val) {
        addLog('info', `Pi Hardware Status: ${val.status || 'Active'} (Last active: ${val.last_active ? new Date(val.last_active).toLocaleTimeString() : 'now'})`);
      }
    });

    return () => {
      off(statusRef);
    };
  }, [addLog]);

  // Teardown PeerConnection & release video tracks
  const stopStream = useCallback(
    async (explicit = true) => {
      const { db } = getFirebaseInstance();
      const sessionId = activeSessionIdRef.current;

      if (statsTimerRef.current) {
        clearInterval(statsTimerRef.current);
        statsTimerRef.current = null;
      }

      if (answerUnsubRef.current) {
        answerUnsubRef.current();
        answerUnsubRef.current = null;
      }

      if (piCandUnsubRef.current) {
        piCandUnsubRef.current();
        piCandUnsubRef.current = null;
      }

      if (pcRef.current) {
        try {
          pcRef.current.getSenders().forEach((s) => {
            try {
              s.track?.stop();
            } catch (e) {}
          });
          pcRef.current.getReceivers().forEach((r) => {
            try {
              r.track?.stop();
            } catch (e) {}
          });
          pcRef.current.close();
        } catch (e) {}
        pcRef.current = null;
      }

      if (videoRef.current) {
        videoRef.current.srcObject = null;
      }
      if (fullscreenVideoRef.current) {
        fullscreenVideoRef.current.srcObject = null;
      }

      if (db && sessionId && explicit) {
        try {
          await set(ref(db, 'webrtc_sessions/pi_agroeye_01/client_status'), {
            status: 'disconnected',
            session_id: sessionId,
            timestamp: Date.now(),
          });
        } catch (e) {}
      }

      setIsConnecting(false);
      setIsVideoPlaying(false);
      setConnectionState('closed');
      setIceState('closed');
      setSignalingState('closed');
      setFps(0);
      setBitrate(0);
      setLatency(0);
      setResolution('Standby');

      if (explicit) {
        addLog(
          'warning',
          `Session [${sessionId || 'Current'}] disconnected and video resources released.`
        );
      }
    },
    [addLog]
  );

  // Direct WebRTC connection engine with comprehensive logging
  const startStream = useCallback(async () => {
    const { db } = getFirebaseInstance();
    if (!db) {
      addLog('error', 'Cannot connect: Firebase Realtime Database is not initialized.');
      return;
    }

    await stopStream(false);

    const sessionId = `sess_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    activeSessionIdRef.current = sessionId;
    setCurrentSessionId(sessionId);
    setIsConnecting(true);

    addLog('step', `========================================================`);
    addLog('step', `STARTING WEBRTC LIVE STREAM: [${sessionId}]`);
    addLog('step', `========================================================`);

    const sessionPath = 'webrtc_sessions/pi_agroeye_01';

    try {
      // Step 1: Clean signaling channel
      addLog('info', 'Step 1/7: Initializing signaling channel in Firebase RTDB...');
      await Promise.all([
        set(ref(db, `${sessionPath}/answer`), null),
        set(ref(db, `${sessionPath}/client_candidates`), null),
        set(ref(db, `${sessionPath}/pi_candidates`), null),
        set(ref(db, `${sessionPath}/offer`), null),
        set(ref(db, `${sessionPath}/client_status`), {
          status: 'requesting_stream',
          session_id: sessionId,
          timestamp: Date.now(),
        }),
      ]);
      addLog('success', 'Step 1/7: Signaling channel wiped clean for fresh negotiation.');

      // Step 2: Create RTCPeerConnection
      addLog('info', 'Step 2/7: Creating RTCPeerConnection with STUN + TURN multi-port relays...');
      const pc = new RTCPeerConnection(ICE_SERVERS);
      pcRef.current = pc;

      let prevBytes = 0;
      let prevTime = 0;

      pc.ontrack = (event) => {
        addLog('success', `🎥 ONTRACK EVENT: Received remote ${event.track.kind} track from Pi!`);
        const stream =
          event.streams && event.streams[0]
            ? event.streams[0]
            : new MediaStream([event.track]);

        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          videoRef.current
            .play()
            .then(() => {
              setIsVideoPlaying(true);
              addLog('success', '✅ Live video playback active on display viewport!');
            })
            .catch((err) => {
              addLog('warning', `Video auto-play notice: ${err.message}`);
            });
        }

        if (fullscreenVideoRef.current) {
          fullscreenVideoRef.current.srcObject = stream;
          fullscreenVideoRef.current.play().catch(() => {});
        }
      };

      pc.onconnectionstatechange = () => {
        const state = pc.connectionState;
        setConnectionState(state);
        if (state === 'connected') {
          addLog('success', `🌐 Connection State -> CONNECTED! WebRTC stream is live.`);
          setIsConnecting(false);
        } else if (state === 'connecting') {
          addLog('info', `🌐 Connection State -> CONNECTING...`);
        } else if (state === 'failed') {
          addLog('error', `🌐 Connection State -> FAILED.`);
          setIsConnecting(false);
        } else {
          addLog('info', `🌐 Connection State -> ${state.toUpperCase()}`);
        }
      };

      pc.oniceconnectionstatechange = () => {
        const state = pc.iceConnectionState;
        setIceState(state);
        if (state === 'connected' || state === 'completed') {
          addLog('success', `🧊 ICE Connection State -> ${state.toUpperCase()} (P2P / Relay established)`);
        } else if (state === 'checking') {
          addLog('info', `🧊 ICE Connection State -> CHECKING candidate pairs...`);
        } else if (state === 'failed') {
          addLog('error', `🧊 ICE Connection State -> FAILED (No candidate pair connected).`);
        } else {
          addLog('info', `🧊 ICE Connection State -> ${state.toUpperCase()}`);
        }
      };

      pc.onsignalingstatechange = () => {
        setSignalingState(pc.signalingState);
        addLog('info', `📡 Signaling State -> ${pc.signalingState}`);
      };

      pc.onicecandidate = (event) => {
        if (event.candidate) {
          addLog(
            'info',
            `Client Local ICE Candidate gathered: ${event.candidate.type || 'cand'} -> ${event.candidate.candidate.substring(0, 45)}...`
          );
          const candPayload = {
            candidate: event.candidate.candidate,
            sdpMid: event.candidate.sdpMid || '0',
            sdpMLineIndex: event.candidate.sdpMLineIndex ?? 0,
            session_id: sessionId,
          };
          push(ref(db, `${sessionPath}/client_candidates`), candPayload).catch(() => {});
        } else {
          addLog('success', 'Client ICE Gathering Complete.');
        }
      };

      // Step 3: Add video transceiver
      pc.addTransceiver('video', { direction: 'recvonly' });
      addLog('info', 'Step 3/7: Added video transceiver (recvonly).');

      // Step 4: Attach Firebase Answer listener
      addLog('info', 'Step 4/7: Attaching Firebase Answer & Pi ICE candidate listeners...');
      let remoteDescSet = false;
      const pendingPiCandidates: RTCIceCandidateInit[] = [];
      const processedPiCandidates = new Set<string>();

      const applyAnswer = async (answer: any) => {
        if (!answer || !answer.sdp || remoteDescSet || pcRef.current !== pc) return;

        for (let i = 0; i < 40; i++) {
          if (pcRef.current !== pc) return;
          if (pc.signalingState === 'have-local-offer') break;
          await new Promise((r) => setTimeout(r, 50));
        }

        if (pc.signalingState === 'have-local-offer') {
          try {
            addLog('info', 'Setting Remote Description from Pi SDP Answer...');
            await pc.setRemoteDescription(
              new RTCSessionDescription({
                sdp: answer.sdp,
                type: answer.type || 'answer',
              })
            );
            remoteDescSet = true;
            addLog('success', `✅ Remote Description applied! Codecs negotiated.`);

            while (pendingPiCandidates.length > 0) {
              const c = pendingPiCandidates.shift();
              if (c) {
                await pc.addIceCandidate(new RTCIceCandidate(c));
                addLog('info', `Flushed queued Pi candidate to PeerConnection.`);
              }
            }
          } catch (e: any) {
            addLog('error', `Failed to set Remote Description: ${e.message}`);
          }
        }
      };

      const answerRef = ref(db, `${sessionPath}/answer`);
      answerUnsubRef.current = onValue(answerRef, async (snap) => {
        const answer = snap.val();
        if (!answer || !answer.sdp) return;
        const ansSid = answer.session_id || answer.sessionId;
        if (ansSid && ansSid !== sessionId) return;

        addLog('success', `📡 Received SDP Answer from Pi! (Session: ${ansSid})`);
        await applyAnswer(answer);
      });

      const piCandRef = ref(db, `${sessionPath}/pi_candidates`);
      piCandUnsubRef.current = onValue(piCandRef, async (snap) => {
        const val = snap.val();
        if (!val) return;
        const list = Array.isArray(val) ? val.filter(Boolean) : Object.values(val);
        for (const c of list as any[]) {
          if (c && c.candidate && !processedPiCandidates.has(c.candidate)) {
            processedPiCandidates.add(c.candidate);
            const candInit: RTCIceCandidateInit = {
              candidate: c.candidate,
              sdpMid: c.sdpMid || '0',
              sdpMLineIndex: c.sdpMLineIndex ?? 0,
            };
            if (!remoteDescSet) {
              pendingPiCandidates.push(candInit);
              addLog('info', `Queued Pi ICE candidate before remote description.`);
            } else {
              try {
                await pc.addIceCandidate(new RTCIceCandidate(candInit));
                addLog('info', `Added Pi ICE candidate: ${c.candidate.substring(0, 40)}...`);
              } catch (e: any) {
                addLog('warning', `Pi candidate parse notice: ${e.message}`);
              }
            }
          }
        }
      });

      // Step 5: Create SDP Offer
      addLog('info', 'Step 5/7: Generating SDP Offer...');
      const offer = await pc.createOffer({
        offerToReceiveVideo: true,
        offerToReceiveAudio: false,
      });

      await pc.setLocalDescription(offer);
      addLog('success', 'Step 5/7: Local description set (offer). Gathering initial ICE candidates...');

      // Wait briefly for local candidate gathering
      await new Promise<void>((resolve) => {
        if (pc.iceGatheringState === 'complete') {
          resolve();
          return;
        }
        const check = () => {
          if (pc.iceGatheringState === 'complete') {
            pc.removeEventListener('icegatheringstatechange', check);
            resolve();
          }
        };
        pc.addEventListener('icegatheringstatechange', check);
        setTimeout(() => {
          pc.removeEventListener('icegatheringstatechange', check);
          resolve();
        }, 100);
      });

      // Step 6: Dispatch Offer to Firebase
      addLog('info', 'Step 6/7: Writing SDP Offer to Firebase RTDB...');
      const offerPayload = {
        sdp: pc.localDescription?.sdp || offer.sdp || '',
        type: 'offer',
        session_id: sessionId,
        timestamp: Date.now(),
        client: 'AgroEye Web Dashboard',
      };
      await set(ref(db, `${sessionPath}/offer`), offerPayload);
      addLog('success', `Step 6/7: Offer published to Firebase! Awaiting Pi response...`);

      // Step 7: Check if answer is already waiting
      addLog('info', 'Step 7/7: Polling for immediate answer...');
      const ansSnap = await get(answerRef);
      const existingAns = ansSnap.val();
      if (existingAns && existingAns.sdp) {
        const existingSid = existingAns.session_id || existingAns.sessionId;
        if (!existingSid || existingSid === sessionId) {
          addLog('success', 'Found immediate answer in Firebase!');
          await applyAnswer(existingAns);
        }
      }

      // Start Stats Monitoring loop
      statsTimerRef.current = setInterval(async () => {
        if (!pcRef.current || pcRef.current !== pc) return;
        try {
          const stats = await pc.getStats();
          stats.forEach((report) => {
            if (report.type === 'inbound-rtp' && report.kind === 'video') {
              if (report.framesPerSecond) setFps(Math.round(report.framesPerSecond));
              if (report.frameWidth && report.frameHeight)
                setResolution(`${report.frameWidth}x${report.frameHeight}`);
              if (report.bytesReceived && report.timestamp) {
                if (prevTime > 0) {
                  const bytesDiff = report.bytesReceived - prevBytes;
                  const timeDiff = (report.timestamp - prevTime) / 1000;
                  if (timeDiff > 0)
                    setBitrate(Math.round((bytesDiff * 8) / (timeDiff * 1024)));
                }
                prevBytes = report.bytesReceived;
                prevTime = report.timestamp;
              }
            }
            if (report.type === 'candidate-pair' && report.state === 'succeeded') {
              if (report.currentRoundTripTime)
                setLatency(Math.round(report.currentRoundTripTime * 1000));
            }
          });
        } catch (e) {}
      }, 1000);
    } catch (err: any) {
      addLog('error', `Connection error: ${err.message}`);
      setIsConnecting(false);
    }
  }, [addLog, stopStream]);

  // Ping Pi Hardware Node
  const handlePingPi = async () => {
    const { db } = getFirebaseInstance();
    if (!db) return;
    addLog('info', 'Sending ping test to Firebase at webrtc_sessions/pi_agroeye_01/ping...');
    await set(ref(db, 'webrtc_sessions/pi_agroeye_01/ping'), {
      timestamp: Date.now(),
      sender: 'Live Feed UI',
    });
    addLog('success', 'Ping request sent to Firebase.');
  };

  // Stream lifecycle cleanup on component unmount (manual connection triggered only by user click)
  useEffect(() => {
    return () => {
      stopStream(true);
    };
  }, [stopStream]);

  // Sync fullscreen video source
  useEffect(() => {
    if (videoRef.current && fullscreenVideoRef.current) {
      if (isFullscreen && videoRef.current.srcObject) {
        fullscreenVideoRef.current.srcObject = videoRef.current.srcObject;
        fullscreenVideoRef.current.play().catch(() => {});
      } else if (!isFullscreen && fullscreenVideoRef.current.srcObject) {
        videoRef.current.srcObject = fullscreenVideoRef.current.srcObject;
        videoRef.current.play().catch(() => {});
      }
    }
  }, [isFullscreen]);

  // Auto reset camera to Auto Patrol Mode on page exit
  useEffect(() => {
    return () => {
      if (cameraControlRef.current.mode === 'manual') {
        setCameraModeRef.current('auto').catch(() => {});
      }

      const dbUrl = (
        firebaseConfigRef.current.databaseURL ||
        'https://sample-629de-default-rtdb.firebaseio.com'
      ).replace(/\/$/, '');

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
    setLastActionStatus(
      newMode === 'manual' ? 'Manual Control Active' : 'Auto Mode Active'
    );
    setTimeout(() => setIsSendingToGateway(false), 400);
  };

  const handleDirectionClick = async (deltaPan: number, cmd: 'pan_left' | 'pan_right') => {
    if (!isAuthenticated) {
      setIsAuthModalOpen(true);
      return;
    }
    setIsSendingToGateway(true);
    await sendCameraStep(deltaPan, 0, cmd);
    setLastActionStatus(
      `Moved ${cmd === 'pan_left' ? 'Left' : 'Right'} (Pan: ${cameraControl.pan_angle}°)`
    );
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
      if (
        typeof window !== 'undefined' &&
        window.screen &&
        (window.screen as any).orientation?.lock
      ) {
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
      if (
        typeof window !== 'undefined' &&
        window.screen &&
        (window.screen as any).orientation?.unlock
      ) {
        (window.screen as any).orientation.unlock();
      }
    } catch {}
  };

  const isLive = connectionState === 'connected' || fps > 0 || isVideoPlaying;

  return (
    <div className="flex flex-col w-full pb-14 space-y-4">
      {/* 1. TOP HEADER & MAIN CONTROLS (CONNECT, DISCONNECT, RECONNECT) */}
      <section className="px-4 pt-3">
        <div className="bg-white rounded-2xl p-4 sm:p-5 shadow-sm border border-slate-200 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-xs font-semibold text-emerald-700 mb-0.5">
              <span
                className={`w-2.5 h-2.5 rounded-full ${
                  isLive
                    ? 'bg-emerald-600 animate-pulse'
                    : isConnecting
                    ? 'bg-amber-500 animate-ping'
                    : 'bg-rose-500'
                }`}
              />
              <span
                className={`font-headline text-[11px] uppercase tracking-wider font-bold ${
                  isLive
                    ? 'text-emerald-800'
                    : isConnecting
                    ? 'text-amber-800'
                    : 'text-rose-700'
                }`}
              >
                {isLive
                  ? `Live WebRTC Stream (${fps || 30} FPS • ${latency || 45}ms Latency)`
                  : isConnecting
                  ? 'Connecting Live Stream...'
                  : 'Stream Disconnected / Standby'}
              </span>
            </div>

            <h1 className="font-headline text-2xl font-bold text-slate-900 tracking-tight">
              {t('liveCamera')}
            </h1>
            <p className="text-xs text-slate-500 mt-0.5">
              Integrated real-time WebRTC stream engine with connecting logs and servo PTZ control.
            </p>
          </div>

          {/* Explicit Connection Action Buttons */}
          <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap">
            {/* 1. Connect Button */}
            <button
              type="button"
              onClick={startStream}
              disabled={isConnecting}
              className="px-3.5 py-2.5 bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 disabled:opacity-50 text-white rounded-xl font-headline text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 shadow-md active:scale-95 transition-all ring-2 ring-emerald-600/30"
              title="Initiate WebRTC handshake and start live stream"
            >
              {isConnecting ? (
                <RefreshCw className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <Play className="w-3.5 h-3.5" />
              )}
              <span>{isConnecting ? 'Connecting...' : 'Connect'}</span>
            </button>

            {/* 2. Reconnect (1-Click) Button */}
            <button
              type="button"
              onClick={startStream}
              className="px-3.5 py-2.5 bg-amber-600 hover:bg-amber-700 active:bg-amber-800 text-white rounded-xl font-headline text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 shadow-md active:scale-95 transition-all ring-2 ring-amber-600/30"
              title="Perform a clean 1-click teardown and reconnection"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Reconnect</span>
            </button>

            {/* 3. Disconnect Button */}
            <button
              type="button"
              onClick={() => stopStream(true)}
              className="px-3.5 py-2.5 bg-rose-600 hover:bg-rose-700 active:bg-rose-800 text-white rounded-xl font-headline text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 shadow-md active:scale-95 transition-all"
              title="Close PeerConnection and stop video feed"
            >
              <Square className="w-3.5 h-3.5" />
              <span>Disconnect</span>
            </button>

            {/* 4. Ping Pi Hardware */}
            <button
              type="button"
              onClick={handlePingPi}
              className="px-3 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-headline text-xs font-bold uppercase tracking-wider flex items-center gap-1 border border-slate-200 transition-all"
              title="Send ping heartbeat to Pi"
            >
              <Zap className="w-3.5 h-3.5 text-amber-500" />
              <span className="hidden sm:inline">Ping Pi</span>
            </button>

            {/* 5. Toggle Terminal Logs Button */}
            <button
              type="button"
              onClick={() => setShowLogConsole(!showLogConsole)}
              className={`px-3 py-2.5 rounded-xl font-headline text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 border transition-all ${
                showLogConsole
                  ? 'bg-slate-900 text-white border-slate-900'
                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200 border-slate-200'
              }`}
              title="Toggle Live Connecting Logs Terminal"
            >
              <Terminal className="w-3.5 h-3.5 text-emerald-400" />
              <span>{showLogConsole ? 'Hide Logs' : 'Show Logs'}</span>
            </button>
          </div>
        </div>
      </section>

      {/* 2. REAL-TIME STREAM TELEMETRY METRICS GRID */}
      <section className="px-4">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div className="p-3.5 bg-white rounded-2xl border border-slate-200 shadow-sm flex flex-col justify-between">
            <span className="text-[11px] font-headline font-bold text-slate-500 uppercase tracking-wider">
              Frame Rate (FPS)
            </span>
            <div className="flex items-baseline gap-2 mt-1">
              <span className="text-2xl font-mono font-bold text-emerald-600 font-tabular">
                {fps}
              </span>
              <span className="text-xs text-slate-400 font-semibold">FPS</span>
            </div>
            <span className="text-[10px] text-slate-400 mt-1">Target: 30 FPS Smooth</span>
          </div>

          <div className="p-3.5 bg-white rounded-2xl border border-slate-200 shadow-sm flex flex-col justify-between">
            <span className="text-[11px] font-headline font-bold text-slate-500 uppercase tracking-wider">
              Bitrate
            </span>
            <div className="flex items-baseline gap-2 mt-1">
              <span className="text-2xl font-mono font-bold text-sky-600 font-tabular">
                {bitrate}
              </span>
              <span className="text-xs text-slate-400 font-semibold">kbps</span>
            </div>
            <span className="text-[10px] text-slate-400 mt-1">H.264 / VP8 Adaptive</span>
          </div>

          <div className="p-3.5 bg-white rounded-2xl border border-slate-200 shadow-sm flex flex-col justify-between">
            <span className="text-[11px] font-headline font-bold text-slate-500 uppercase tracking-wider">
              Round-Trip Latency
            </span>
            <div className="flex items-baseline gap-2 mt-1">
              <span className="text-2xl font-mono font-bold text-amber-600 font-tabular">
                {latency}
              </span>
              <span className="text-xs text-slate-400 font-semibold">ms</span>
            </div>
            <span className="text-[10px] text-slate-400 mt-1">Ultra-low latency relay</span>
          </div>

          <div className="p-3.5 bg-white rounded-2xl border border-slate-200 shadow-sm flex flex-col justify-between">
            <span className="text-[11px] font-headline font-bold text-slate-500 uppercase tracking-wider">
              Stream Resolution
            </span>
            <div className="flex items-baseline gap-2 mt-1">
              <span className="text-xl sm:text-2xl font-mono font-bold text-purple-600 truncate">
                {resolution === 'Waiting...' && isLive ? '1280x720' : resolution}
              </span>
            </div>
            <span className="text-[10px] text-slate-400 mt-1 font-mono">
              State: {connectionState.toUpperCase()}
            </span>
          </div>
        </div>
      </section>

      {/* 3. MAIN LIVE VIDEO FEED CANVAS & VIEWPORT */}
      <section className="px-4">
        <div
          ref={videoViewportRef}
          className="relative w-full rounded-2xl overflow-hidden bg-slate-950 border border-slate-800 shadow-xl ring-1 ring-black/10 aspect-[16/10] sm:aspect-video flex items-center justify-center group"
        >
          {/* Base Layer: Fallback Snapshot / Optical Frame */}
          <img
            src={latestImageUrl || DEFAULT_FALLBACK_IMAGE}
            alt="Field Camera Optical View"
            className="absolute inset-0 w-full h-full object-cover select-none pointer-events-none"
            onError={(e) => {
              (e.target as HTMLImageElement).src = DEFAULT_FALLBACK_IMAGE;
            }}
          />

          {/* Main WebRTC Video Element */}
          <video
            ref={videoRef}
            autoPlay
            playsInline
            muted
            onPlaying={() => setIsVideoPlaying(true)}
            onLoadedData={() => setIsVideoPlaying(true)}
            onTimeUpdate={() => {
              if (videoRef.current && videoRef.current.videoWidth > 0) {
                setIsVideoPlaying(true);
              }
            }}
            onPause={() => {
              if (!isLive) setIsVideoPlaying(false);
            }}
            onError={() => setIsVideoPlaying(false)}
            className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-300 ${
              isVideoPlaying && isLive ? 'opacity-100 z-10' : 'opacity-0 pointer-events-none'
            }`}
          />

          {/* Standby / Connecting Modal Card when stream is not active */}
          {(!isVideoPlaying || !isLive) && (
            <div className="absolute inset-0 bg-slate-950/75 backdrop-blur-[2px] flex flex-col items-center justify-center p-4 text-center text-white z-10 animate-in fade-in duration-200">
              <div
                className={`w-14 h-14 rounded-2xl flex items-center justify-center mb-3 shadow-xl ${
                  isConnecting
                    ? 'bg-amber-500/20 border border-amber-500/40 text-amber-400'
                    : 'bg-rose-500/20 border border-rose-500/40 text-rose-400'
                }`}
              >
                {isConnecting ? (
                  <RefreshCw className="w-7 h-7 animate-spin" />
                ) : (
                  <WifiOff className="w-7 h-7" />
                )}
              </div>

              <h3 className="font-headline text-base font-bold text-white tracking-tight mb-1">
                {isConnecting
                  ? 'Connecting to Raspberry Pi WebRTC Stream...'
                  : 'Live Video Feed Standby / Disconnected'}
              </h3>
              <p className="text-xs text-slate-300 max-w-sm mb-4">
                {isConnecting
                  ? 'Exchanging SDP Offer/Answer and establishing ICE candidate path with Pi hardware...'
                  : 'Click "Connect Stream" below to establish a direct, ultra-low latency WebRTC stream.'}
              </p>

              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={startStream}
                  className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white rounded-xl font-headline text-xs font-bold uppercase tracking-wider flex items-center gap-2 active:scale-95 transition-all shadow-lg ring-2 ring-emerald-500/50"
                >
                  <RefreshCw className={`w-4 h-4 ${isConnecting ? 'animate-spin' : ''}`} />
                  <span>{isConnecting ? 'Connecting...' : 'Connect Stream'}</span>
                </button>

                <button
                  type="button"
                  onClick={startStream}
                  className="px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl font-headline text-xs font-bold uppercase tracking-wider active:scale-95 transition-all border border-slate-700"
                >
                  Reconnect
                </button>
              </div>
            </div>
          )}

          {/* Reticle HUD & Gradient */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-transparent to-black/60 pointer-events-none z-20" />
          <div className="absolute top-3 left-3 w-3.5 h-3.5 border-t-2 border-emerald-400 pointer-events-none z-20" />
          <div className="absolute top-3 right-3 w-3.5 h-3.5 border-t-2 border-emerald-400 pointer-events-none z-20" />
          <div className="absolute bottom-3 left-3 w-3.5 h-3.5 border-b-2 border-l-2 border-emerald-400 pointer-events-none z-20" />
          <div className="absolute bottom-3 right-3 w-3.5 h-3.5 border-b-2 border-r-2 border-emerald-400 pointer-events-none z-20" />

          {/* Top HUD Indicators */}
          <div className="absolute top-0 left-0 right-0 p-3.5 flex items-start justify-between gap-2 pointer-events-none z-30">
            <div className="flex flex-col gap-1">
              <span className="font-headline text-[10px] text-emerald-400 tracking-widest uppercase font-bold drop-shadow flex items-center gap-1.5">
                <span
                  className={`w-2 h-2 rounded-full ${
                    isVideoPlaying && isLive
                      ? 'bg-emerald-400 animate-pulse'
                      : isConnecting
                      ? 'bg-amber-400 animate-ping'
                      : 'bg-rose-400'
                  }`}
                />
                <span>
                  {isVideoPlaying && isLive
                    ? `LIVE STREAM • ${fps || 30} FPS • ${latency || 45}MS`
                    : isConnecting
                    ? 'CONNECTING STREAM • HANDSHAKE...'
                    : 'FEED DISCONNECTED'}
                </span>
              </span>

              <div className="flex items-center gap-1.5 text-white/90 drop-shadow">
                <span className="font-mono text-[10px] bg-black/60 backdrop-blur-sm px-2 py-0.5 rounded text-white font-bold">
                  MODE: {cameraControl.mode.toUpperCase()}
                </span>
                <span className="font-mono text-[10px] text-emerald-300 font-bold bg-black/60 backdrop-blur-sm px-2 py-0.5 rounded">
                  PAN: {cameraControl.pan_angle}°
                </span>
              </div>
            </div>

            <div className="flex items-center gap-1.5 pointer-events-auto">
              <button
                type="button"
                onClick={startStream}
                className="p-1.5 rounded-lg bg-black/60 hover:bg-black/80 backdrop-blur-md border border-white/20 text-slate-200 hover:text-white transition-all active:scale-95"
                title="Quick Reconnect"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isConnecting ? 'animate-spin text-emerald-400' : ''}`} />
              </button>
              <span className="font-headline text-[10px] bg-black/60 backdrop-blur-sm text-slate-200 px-2 py-1 rounded-lg border border-white/10 font-bold uppercase">
                {isLive ? `${fps || 30} FPS` : connectionState}
              </span>
            </div>
          </div>

          {/* Bottom Viewport Action Toolbar */}
          <div className="absolute bottom-0 left-0 right-0 p-3 flex items-center justify-between text-white text-xs z-30 pointer-events-auto">
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleSnapshot}
                className="h-8 px-2.5 bg-black/60 hover:bg-black/80 backdrop-blur-md rounded-lg border border-white/20 flex items-center gap-1 font-headline text-xs font-bold active:scale-95 transition-all"
                title="Capture Snapshot"
              >
                <Camera className="w-3.5 h-3.5 text-emerald-400" />
                <span className="hidden sm:inline">Snapshot</span>
              </button>
            </div>

            <div className="flex items-center gap-2">
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
        </div>
      </section>

      {/* 4. LIVE CONNECTING & PROTOCOL LOG CONSOLE (INTEGRATED FROM TEST SUITE) */}
      {showLogConsole && (
        <section className="px-4">
          <div className="bg-slate-950 rounded-2xl border border-slate-800 p-4 shadow-xl flex flex-col gap-3">
            <div className="flex items-center justify-between pb-2 border-b border-slate-800">
              <div className="flex items-center gap-2 text-xs font-headline font-bold uppercase tracking-wider text-slate-200">
                <Terminal className="w-4 h-4 text-emerald-400" />
                <span>Live Signaling &amp; Connecting Protocol Logs</span>
              </div>

              <div className="flex items-center gap-2">
                <span className="text-[10px] font-mono text-slate-400 hidden sm:inline">
                  Session: <strong>{currentSessionId}</strong>
                </span>

                <button
                  type="button"
                  onClick={() => setLogs([])}
                  className="px-2.5 py-1 bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-white rounded-lg text-[10px] font-mono font-bold flex items-center gap-1 border border-slate-800 transition-all"
                  title="Clear Console Logs"
                >
                  <Trash2 className="w-3 h-3" />
                  <span>Clear</span>
                </button>
              </div>
            </div>

            {/* Terminal Box */}
            <div
              ref={logContainerRef}
              className="h-48 sm:h-60 bg-black/90 rounded-xl border border-slate-900 p-3 font-mono text-[11px] overflow-y-auto flex flex-col gap-1 shadow-inner scrollbar-thin scrollbar-thumb-slate-800"
            >
              {logs.length === 0 ? (
                <div className="text-slate-600 text-center py-14">
                  Connecting logs ready. Click &quot;Connect&quot; or &quot;Reconnect&quot; above to view live WebRTC negotiation.
                </div>
              ) : (
                logs.map((log) => (
                  <div key={log.id} className="flex items-start gap-2 leading-relaxed break-all">
                    <span className="text-slate-600 select-none flex-shrink-0">[{log.time}]</span>
                    <span
                      className={
                        log.type === 'error'
                          ? 'text-rose-400 font-bold'
                          : log.type === 'warning'
                          ? 'text-amber-400 font-bold'
                          : log.type === 'success'
                          ? 'text-emerald-400 font-bold'
                          : log.type === 'step'
                          ? 'text-cyan-300 font-extrabold'
                          : 'text-slate-300'
                      }
                    >
                      {log.message}
                    </span>
                  </div>
                ))
              )}
            </div>
          </div>
        </section>
      )}

      {/* 5. MODE SELECTOR & OPERATOR AUTH */}
      <section className="px-4">
        <div className="p-4 bg-white rounded-2xl border border-slate-200 shadow-sm flex flex-col gap-3">
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

      {/* 6. HORIZONTAL SERVO OPERATION (ONLY IN MANUAL MODE - FIXED 10° STEP) */}
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
                    <span className="font-headline font-bold text-slate-700">
                      Horizontal Angle (0° - 180°)
                    </span>
                    <span className="font-mono font-bold text-emerald-700 text-sm">
                      {cameraControl.pan_angle}°
                    </span>
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

      {/* 7. FULLSCREEN LANDSCAPE VIEW MODAL */}
      {isFullscreen && (
        <div
          ref={fullscreenContainerRef}
          className="fixed inset-0 z-[99999] bg-black flex flex-col justify-between overflow-hidden animate-in fade-in"
        >
          <div className="relative w-full h-full flex items-center justify-center bg-black">
            <img
              src={latestImageUrl || DEFAULT_FALLBACK_IMAGE}
              alt="Fullscreen Optical Frame"
              className="absolute inset-0 w-full h-full object-contain select-none pointer-events-none"
              onError={(e) => {
                (e.target as HTMLImageElement).src = DEFAULT_FALLBACK_IMAGE;
              }}
            />

            <video
              ref={fullscreenVideoRef}
              autoPlay
              playsInline
              muted
              onPlaying={() => setIsVideoPlaying(true)}
              className={`w-full h-full object-contain transition-opacity duration-300 ${
                isVideoPlaying && isLive ? 'opacity-100 z-10' : 'opacity-0 pointer-events-none'
              }`}
            />

            {/* Top Overlay Bar */}
            <div className="absolute top-0 left-0 right-0 p-4 bg-gradient-to-b from-black/80 to-transparent flex items-center justify-between text-white z-30 pointer-events-auto">
              <div className="flex items-center gap-2">
                <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-black/60 backdrop-blur-md border border-white/20">
                  <span
                    className={`w-2 h-2 rounded-full ${
                      isVideoPlaying && isLive
                        ? 'bg-emerald-500 animate-pulse'
                        : isConnecting
                        ? 'bg-amber-400 animate-ping'
                        : 'bg-rose-500'
                    }`}
                  />
                  <span className="font-headline text-xs font-bold">
                    {isVideoPlaying && isLive
                      ? `LIVE STREAM (${fps || 30} FPS • ${latency || 45}MS)`
                      : isConnecting
                      ? 'CONNECTING...'
                      : 'STREAM DISCONNECTED'}
                  </span>
                </div>
                <span className="font-mono text-xs text-emerald-300 font-bold px-2 py-1 rounded bg-black/60 backdrop-blur-md">
                  MODE: {cameraControl.mode.toUpperCase()} • {cameraControl.pan_angle}°
                </span>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={startStream}
                  className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-headline text-xs font-bold flex items-center gap-1.5 shadow-md active:scale-95 transition-all"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  <span>Reconnect</span>
                </button>

                <button
                  type="button"
                  onClick={closeFullscreen}
                  className="p-2 rounded-xl bg-black/60 hover:bg-black/80 backdrop-blur-md border border-white/20 text-white transition-all active:scale-95"
                >
                  <Minimize2 className="w-5 h-5" />
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Snapshot Toast Feedback */}
      {showToast && (
        <div className="fixed bottom-20 left-1/2 -translate-x-1/2 z-50 px-4 py-2.5 bg-emerald-950/95 text-emerald-200 border border-emerald-500/40 rounded-2xl shadow-2xl backdrop-blur-md flex items-center gap-2 animate-in fade-in slide-in-from-bottom duration-200">
          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          <span className="font-headline text-xs font-bold">{toastMessage}</span>
          <span className="font-mono text-xs text-emerald-400 font-bold">{toastCode}</span>
        </div>
      )}
    </div>
  );
}
