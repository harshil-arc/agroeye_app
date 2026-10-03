'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import Link from 'next/link';
import { getFirebaseInstance } from '@/lib/firebase';
import { ref, set, push, onValue, get, off } from 'firebase/database';
import {
  Video,
  Play,
  Square,
  RefreshCw,
  Terminal,
  Wifi,
  WifiOff,
  Activity,
  CheckCircle,
  AlertCircle,
  ArrowLeft,
  Server,
  Zap
} from 'lucide-react';

const ICE_SERVERS: RTCConfiguration = {
  iceServers: [
    { urls: 'stun:stun.l.google.com:19302' },
    { urls: 'stun:stun1.l.google.com:19302' },
    { urls: 'stun:stun2.l.google.com:19302' },
    { urls: 'stun:stun3.l.google.com:19302' },
    { urls: 'stun:stun4.l.google.com:19302' },
    { urls: 'stun:stun.cloudflare.com:3478' },
    { urls: 'stun:stun.services.mozilla.com:3478' },
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
    {
      urls: 'turn:global.relay.metered.ca:80',
      username: 'openrelayproject',
      credential: 'openrelayproject',
    },
    {
      urls: 'turn:global.relay.metered.ca:443',
      username: 'openrelayproject',
      credential: 'openrelayproject',
    },
    {
      urls: 'turn:global.relay.metered.ca:443?transport=tcp',
      username: 'openrelayproject',
      credential: 'openrelayproject',
    },
  ],
  iceCandidatePoolSize: 4,
  bundlePolicy: 'max-bundle',
  rtcpMuxPolicy: 'require',
};

interface LogEntry {
  id: string;
  time: string;
  type: 'info' | 'success' | 'warning' | 'error' | 'step';
  message: string;
}

export default function LiveStreamTestPage() {
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [connectionState, setConnectionState] = useState<string>('idle');
  const [iceState, setIceState] = useState<string>('idle');
  const [signalingState, setSignalingState] = useState<string>('idle');
  const [currentSessionId, setCurrentSessionId] = useState<string>('None');
  const [fps, setFps] = useState<number>(0);
  const [bitrate, setBitrate] = useState<number>(0);
  const [latency, setLatency] = useState<number>(0);
  const [resolution, setResolution] = useState<string>('Waiting...');
  const [piNodeStatus, setPiNodeStatus] = useState<any>(null);
  const [isConnecting, setIsConnecting] = useState<boolean>(false);
  const [isVideoPlaying, setIsVideoPlaying] = useState<boolean>(false);
  const [mounted, setMounted] = useState<boolean>(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const videoRef = useRef<HTMLVideoElement>(null);
  const pcRef = useRef<RTCPeerConnection | null>(null);
  const statsTimerRef = useRef<NodeJS.Timeout | null>(null);
  const answerUnsubRef = useRef<(() => void) | null>(null);
  const piCandUnsubRef = useRef<(() => void) | null>(null);
  const activeSessionIdRef = useRef<string>('');
  const logContainerRef = useRef<HTMLDivElement>(null);

  const addLog = useCallback((type: LogEntry['type'], message: string) => {
    const now = new Date();
    const timeStr = now.toTimeString().substring(0, 8) + '.' + String(now.getMilliseconds()).padStart(3, '0');
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

  // Check Pi node status in Firebase on mount
  useEffect(() => {
    const { db } = getFirebaseInstance();
    if (!db) {
      addLog('error', 'Firebase Realtime Database instance not found. Check .env.local');
      return;
    }

    addLog('info', 'Listening to Pi node status at webrtc_sessions/pi_agroeye_01/status');
    const statusRef = ref(db, 'webrtc_sessions/pi_agroeye_01/status');
    const unsub = onValue(statusRef, (snap) => {
      const val = snap.val();
      setPiNodeStatus(val);
      if (val) {
        addLog('info', `Pi Hardware Node Status Update: ${JSON.stringify(val)}`);
      }
    });

    return () => {
      off(statusRef);
    };
  }, [addLog]);

  // Teardown PeerConnection
  const stopStream = useCallback(async (explicit = true) => {
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
          try { s.track?.stop(); } catch (e) {}
        });
        pcRef.current.getReceivers().forEach((r) => {
          try { r.track?.stop(); } catch (e) {}
        });
        pcRef.current.close();
      } catch (e) {}
      pcRef.current = null;
    }

    if (videoRef.current) {
      videoRef.current.srcObject = null;
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
    if (explicit) {
      addLog('warning', `Session [${sessionId}] closed and all resources released.`);
    }
  }, [addLog]);

  // Start WebRTC connection with verbose step-by-step logging
  const startStream = useCallback(async () => {
    const { db } = getFirebaseInstance();
    if (!db) {
      addLog('error', 'Cannot connect: Firebase Database is null.');
      return;
    }

    await stopStream(false);

    const sessionId = `test_sess_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    activeSessionIdRef.current = sessionId;
    setCurrentSessionId(sessionId);
    setIsConnecting(true);

    addLog('step', `========================================================`);
    addLog('step', `STARTING WEBRTC TEST SESSION: [${sessionId}]`);
    addLog('step', `========================================================`);

    const sessionPath = 'webrtc_sessions/pi_agroeye_01';

    try {
      // Step 1: Clean signaling channel
      addLog('info', 'Step 1/7: Initializing signaling node in Firebase RTDB...');
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
      addLog('info', 'Step 2/7: Creating RTCPeerConnection with STUN + TURN configurations...');
      const pc = new RTCPeerConnection(ICE_SERVERS);
      pcRef.current = pc;

      let prevBytes = 0;
      let prevTime = 0;

      pc.ontrack = (event) => {
        addLog('success', `🎥 ONTRACK EVENT: Received remote ${event.track.kind} track from Pi!`);
        const stream = (event.streams && event.streams[0]) ? event.streams[0] : new MediaStream([event.track]);
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          videoRef.current.play().then(() => {
            setIsVideoPlaying(true);
            addLog('success', 'Video playback started successfully on <video> element!');
          }).catch((err) => {
            addLog('warning', `Video auto-play warning: ${err.message}`);
          });
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
          addLog('error', `🧊 ICE Connection State -> FAILED (No candidate pair could connect).`);
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
          addLog('info', `Client Local ICE Candidate gathered: ${event.candidate.type || 'cand'} -> ${event.candidate.candidate.substring(0, 45)}...`);
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

      // Add transceiver
      const transceiver = pc.addTransceiver('video', { direction: 'recvonly' });
      addLog('info', 'Step 3/7: Added video transceiver (recvonly).');

      // Step 4: Attach Firebase Answer listener
      addLog('info', 'Step 4/7: Attaching Firebase Answer & Pi ICE listeners...');
      let remoteDescSet = false;
      const pendingPiCandidates: RTCIceCandidateInit[] = [];
      const processedPiCandidates = new Set<string>();

      const applyAnswer = async (answer: any) => {
        if (!answer || !answer.sdp || remoteDescSet || pcRef.current !== pc) return;

        // Wait for have-local-offer
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

            // Flush pending candidates
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

      // Brief wait for local candidate gathering
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
        }, 250);
      });

      // Step 6: Dispatch Offer to Firebase
      addLog('info', 'Step 6/7: Writing SDP Offer to Firebase RTDB...');
      const offerPayload = {
        sdp: pc.localDescription?.sdp || offer.sdp || '',
        type: 'offer',
        session_id: sessionId,
        timestamp: Date.now(),
        client: 'AgroEye Live Test Suite',
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
              if (report.frameWidth && report.frameHeight) setResolution(`${report.frameWidth}x${report.frameHeight}`);
              if (report.bytesReceived && report.timestamp) {
                if (prevTime > 0) {
                  const bytesDiff = report.bytesReceived - prevBytes;
                  const timeDiff = (report.timestamp - prevTime) / 1000;
                  if (timeDiff > 0) setBitrate(Math.round((bytesDiff * 8) / (timeDiff * 1024)));
                }
                prevBytes = report.bytesReceived;
                prevTime = report.timestamp;
              }
            }
            if (report.type === 'candidate-pair' && report.state === 'succeeded') {
              if (report.currentRoundTripTime) setLatency(Math.round(report.currentRoundTripTime * 1000));
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
      sender: 'Test Page UI',
    });
    addLog('success', 'Ping sent to Firebase.');
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 p-4 sm:p-6 flex flex-col gap-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-4 border-b border-slate-800">
        <div className="flex items-center gap-3">
          <Link
            href="/live"
            className="p-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-white border border-slate-800 transition-all"
            title="Return to Main Live Camera Page"
          >
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div>
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
              <span className="text-xs font-mono font-bold uppercase tracking-wider text-emerald-400">
                AgroEye Diagnostics Suite
              </span>
            </div>
            <h1 className="text-xl sm:text-2xl font-bold font-headline text-white tracking-tight">
              Live WebRTC Connectivity & Stream Inspector
            </h1>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2 flex-wrap">
          <button
            type="button"
            onClick={startStream}
            disabled={isConnecting}
            className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 active:bg-emerald-700 disabled:opacity-50 text-white rounded-xl font-bold text-xs uppercase tracking-wider flex items-center gap-2 shadow-lg ring-2 ring-emerald-500/30 transition-all"
          >
            {isConnecting ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Play className="w-4 h-4" />}
            <span>{isConnecting ? 'Connecting...' : '1. Start / Connect Stream'}</span>
          </button>

          <button
            type="button"
            onClick={() => stopStream(true)}
            className="px-4 py-2 bg-rose-600 hover:bg-rose-500 active:bg-rose-700 text-white rounded-xl font-bold text-xs uppercase tracking-wider flex items-center gap-2 shadow-lg transition-all"
          >
            <Square className="w-4 h-4" />
            <span>2. Disconnect</span>
          </button>

          <button
            type="button"
            onClick={startStream}
            className="px-4 py-2 bg-amber-600 hover:bg-amber-500 active:bg-amber-700 text-white rounded-xl font-bold text-xs uppercase tracking-wider flex items-center gap-2 shadow-lg transition-all"
          >
            <RefreshCw className="w-4 h-4" />
            <span>3. Reconnect (1-Click)</span>
          </button>

          <button
            type="button"
            onClick={handlePingPi}
            className="px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl font-bold text-xs uppercase tracking-wider flex items-center gap-1.5 border border-slate-700 transition-all"
          >
            <Zap className="w-4 h-4 text-amber-400" />
            <span>Ping Pi</span>
          </button>

          <button
            type="button"
            onClick={() => setLogs([])}
            className="px-3 py-2 bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-white rounded-xl text-xs font-bold transition-all border border-slate-800"
          >
            Clear Logs
          </button>
        </div>
      </div>

      {/* Main Grid: Video + Metrics + Live Terminal */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Video Screen & Telemetry Badges (7 cols) */}
        <div className="lg:col-span-7 flex flex-col gap-4">
          {/* Video Player Box */}
          <div className="relative aspect-video w-full rounded-2xl overflow-hidden bg-black border border-slate-800 shadow-2xl flex items-center justify-center group">
            <video
              ref={videoRef}
              autoPlay
              playsInline
              muted
              className={`w-full h-full object-cover transition-opacity duration-300 ${
                isVideoPlaying ? 'opacity-100' : 'opacity-20'
              }`}
            />

            {!isVideoPlaying && (
              <div className="absolute inset-0 flex flex-col items-center justify-center p-4 text-center">
                <Video className="w-12 h-12 text-slate-600 mb-2 animate-pulse" />
                <p className="text-sm font-bold text-slate-400">Stream Standby / Connecting</p>
                <p className="text-xs text-slate-500 mt-1">
                  Click &quot;Start / Connect Stream&quot; above to initiate live WebRTC handshake.
                </p>
              </div>
            )}

            {/* Overlaid Badges */}
            <div className="absolute top-3 left-3 flex items-center gap-2 pointer-events-none">
              <span
                className={`px-2.5 py-1 rounded-lg text-xs font-mono font-bold flex items-center gap-1.5 backdrop-blur-md border ${
                  connectionState === 'connected'
                    ? 'bg-emerald-950/80 border-emerald-500/50 text-emerald-400'
                    : connectionState === 'connecting'
                    ? 'bg-amber-950/80 border-amber-500/50 text-amber-400'
                    : 'bg-slate-900/80 border-slate-700 text-slate-400'
                }`}
              >
                <span
                  className={`w-2 h-2 rounded-full ${
                    connectionState === 'connected'
                      ? 'bg-emerald-400 animate-pulse'
                      : connectionState === 'connecting'
                      ? 'bg-amber-400 animate-ping'
                      : 'bg-slate-500'
                  }`}
                />
                <span>STATE: {connectionState.toUpperCase()}</span>
              </span>

              <span className="px-2.5 py-1 rounded-lg text-xs font-mono font-bold bg-slate-900/80 border border-slate-700 text-slate-300 backdrop-blur-md">
                ICE: {iceState.toUpperCase()}
              </span>
            </div>

            <div className="absolute top-3 right-3 px-2.5 py-1 rounded-lg text-xs font-mono font-bold bg-slate-900/80 border border-slate-700 text-slate-300 backdrop-blur-md">
              {fps} FPS • {latency}ms
            </div>
          </div>

          {/* Telemetry Metrics Bar */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="p-3 bg-slate-900 rounded-xl border border-slate-800">
              <div className="text-[11px] font-bold text-slate-400 uppercase">Frame Rate</div>
              <div className="text-xl font-mono font-bold text-emerald-400 mt-0.5">{fps} FPS</div>
              <div className="text-[10px] text-slate-500 mt-0.5">Target: 30 FPS</div>
            </div>

            <div className="p-3 bg-slate-900 rounded-xl border border-slate-800">
              <div className="text-[11px] font-bold text-slate-400 uppercase">Bitrate</div>
              <div className="text-xl font-mono font-bold text-sky-400 mt-0.5">{bitrate} kbps</div>
              <div className="text-[10px] text-slate-500 mt-0.5">Adaptive H.264 / VP8</div>
            </div>

            <div className="p-3 bg-slate-900 rounded-xl border border-slate-800">
              <div className="text-[11px] font-bold text-slate-400 uppercase">Latency (RTT)</div>
              <div className="text-xl font-mono font-bold text-amber-400 mt-0.5">{latency} ms</div>
              <div className="text-[10px] text-slate-500 mt-0.5">Round trip ICE path</div>
            </div>

            <div className="p-3 bg-slate-900 rounded-xl border border-slate-800">
              <div className="text-[11px] font-bold text-slate-400 uppercase">Resolution</div>
              <div className="text-xl font-mono font-bold text-purple-400 mt-0.5">{resolution}</div>
              <div className="text-[10px] text-slate-500 mt-0.5">Stream geometry</div>
            </div>
          </div>

          {/* Pi Hardware Status Card */}
          <div className="p-4 bg-slate-900/80 rounded-2xl border border-slate-800 flex flex-col gap-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Server className="w-4 h-4 text-emerald-400" />
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-200">
                  Raspberry Pi Hardware Node Info
                </h3>
              </div>
              <span className="text-[10px] font-mono text-slate-400">
                Device: <strong>pi_agroeye_01</strong>
              </span>
            </div>
            <div className="bg-slate-950 p-3 rounded-xl font-mono text-xs text-slate-300 border border-slate-800/80 overflow-x-auto">
              {piNodeStatus ? (
                <pre>{JSON.stringify(piNodeStatus, null, 2)}</pre>
              ) : (
                <span className="text-slate-500">Awaiting status from Firebase node...</span>
              )}
            </div>
          </div>
        </div>

        {/* Right Column: Live Diagnostic Terminal (5 cols) */}
        <div className="lg:col-span-5 flex flex-col gap-2">
          <div className="flex items-center justify-between px-1">
            <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-300">
              <Terminal className="w-4 h-4 text-emerald-400" />
              <span>Signaling & Protocol Log Console</span>
            </div>
            <span className="text-[10px] font-mono text-slate-500">
              Session: {currentSessionId}
            </span>
          </div>

          {/* Terminal Box */}
          <div
            ref={logContainerRef}
            className="flex-1 min-h-[480px] max-h-[600px] bg-black/90 rounded-2xl border border-slate-800 p-4 font-mono text-[11px] overflow-y-auto flex flex-col gap-1.5 shadow-inner"
          >
            {logs.length === 0 ? (
              <div className="text-slate-600 text-center py-20">
                Console ready. Click &quot;1. Start / Connect Stream&quot; to begin inspection.
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
      </div>
    </div>
  );
}
