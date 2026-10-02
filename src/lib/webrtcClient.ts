'use client';

import { Database, ref, set, push, onValue, off, get } from 'firebase/database';

export interface WebRTCStreamStats {
  fps: number;
  bitrateKbps: number;
  latencyMs: number;
  resolution: string;
  connectionState: RTCPeerConnectionState | 'idle' | 'failed' | 'connecting' | 'connected' | 'timeout';
  iceState: RTCIceConnectionState | 'idle';
  isRelayed: boolean;
}

export interface WebRTCOptions {
  deviceId?: string;
  db: Database | null;
  onStream: (stream: MediaStream) => void;
  onStatsUpdate?: (stats: WebRTCStreamStats) => void;
  onError?: (error: Error) => void;
}

const DEFAULT_ICE_SERVERS: RTCConfiguration = {
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

export class WebRTCStreamClient {
  private pc: RTCPeerConnection | null = null;
  private db: Database | null = null;
  private deviceId: string;
  private sessionPath: string;
  private sessionId: string = '';
  private onStreamCallback: (stream: MediaStream) => void;
  private onStatsCallback?: (stats: WebRTCStreamStats) => void;
  private onErrorCallback?: (error: Error) => void;
  private answerListenerUnsub: (() => void) | null = null;
  private piCandidatesUnsub: (() => void) | null = null;
  private statsInterval: NodeJS.Timeout | null = null;
  private connectionTimeout: NodeJS.Timeout | null = null;
  private processedPiCandidates: Set<string> = new Set();
  private pendingRemoteCandidates: RTCIceCandidateInit[] = [];
  private prevBytesReceived = 0;
  private prevTimestamp = 0;
  private isConnecting = false;
  private isDisposed = false;
  private currentOfferTimestamp = 0;

  constructor(options: WebRTCOptions) {
    this.deviceId = options.deviceId || 'pi_agroeye_01';
    this.sessionPath = `webrtc_sessions/${this.deviceId}`;
    this.db = options.db;
    this.onStreamCallback = options.onStream;
    this.onStatsCallback = options.onStatsUpdate;
    this.onErrorCallback = options.onError;
  }

  public setDatabase(db: Database | null) {
    this.db = db;
  }

  public isConnected(): boolean {
    return this.pc !== null && this.pc.connectionState === 'connected';
  }

  public getSessionId(): string {
    return this.sessionId;
  }

  public async start(): Promise<void> {
    if (this.isConnecting) {
      return;
    }

    if (!this.db) {
      console.warn('[WebRTC] Firebase Database not available for signaling.');
      this.onStatsCallback?.({
        fps: 0,
        bitrateKbps: 0,
        latencyMs: 0,
        resolution: 'Standby',
        connectionState: 'idle',
        iceState: 'idle',
        isRelayed: false,
      });
      return;
    }

    // 1. Dispose old peer connection and state completely
    this.stopInternal();
    this.isDisposed = false;
    this.isConnecting = true;
    this.sessionId = `sess_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;
    this.currentOfferTimestamp = Date.now();
    this.processedPiCandidates.clear();
    this.pendingRemoteCandidates = [];

    const activeSessionId = this.sessionId;

    // 2. Clean previous session nodes in Firebase RTDB with new session ID
    try {
      await Promise.all([
        set(ref(this.db, `${this.sessionPath}/answer`), null),
        set(ref(this.db, `${this.sessionPath}/client_candidates`), null),
        set(ref(this.db, `${this.sessionPath}/pi_candidates`), null),
        set(ref(this.db, `${this.sessionPath}/offer`), null),
        set(ref(this.db, `${this.sessionPath}/client_status`), {
          status: 'requesting_stream',
          session_id: activeSessionId,
          timestamp: this.currentOfferTimestamp,
        }),
      ]);
      await new Promise((r) => setTimeout(r, 100));
    } catch (e) {}

    if (this.isDisposed || this.sessionId !== activeSessionId) return;

    // 3. Setup Connection Timeout (40s)
    if (this.connectionTimeout) clearTimeout(this.connectionTimeout);
    this.connectionTimeout = setTimeout(() => {
      if (this.sessionId === activeSessionId && this.pc && this.pc.connectionState !== 'connected') {
        this.isConnecting = false;
        this.onStatsCallback?.({
          fps: 0,
          bitrateKbps: 0,
          latencyMs: 0,
          resolution: 'Standby',
          connectionState: 'timeout',
          iceState: 'idle',
          isRelayed: false,
        });
      }
    }, 40000);

    try {
      // 4. Create brand-new RTCPeerConnection
      const pc = new RTCPeerConnection(DEFAULT_ICE_SERVERS);
      this.pc = pc;

      pc.ontrack = (event) => {
        if (this.isDisposed || this.sessionId !== activeSessionId) return;
        if (this.connectionTimeout) clearTimeout(this.connectionTimeout);

        const stream = (event.streams && event.streams[0])
          ? event.streams[0]
          : (event.track ? new MediaStream([event.track]) : null);

        if (stream) {
          console.log('[WebRTC] Stream track received for session:', activeSessionId);
          this.onStreamCallback(stream);
        }
      };

      pc.onicecandidate = (event) => {
        if (this.isDisposed || this.sessionId !== activeSessionId || !this.db) return;
        if (event.candidate) {
          const candidateData = {
            candidate: event.candidate.candidate,
            sdpMid: event.candidate.sdpMid || '0',
            sdpMLineIndex: event.candidate.sdpMLineIndex ?? 0,
            session_id: activeSessionId,
          };
          const clientCandRef = push(ref(this.db, `${this.sessionPath}/client_candidates`));
          set(clientCandRef, candidateData).catch(() => {});
        }
      };

      pc.onconnectionstatechange = () => {
        if (this.isDisposed || this.sessionId !== activeSessionId || !this.pc) return;
        const state = this.pc.connectionState;
        if (state === 'connected') {
          if (this.connectionTimeout) clearTimeout(this.connectionTimeout);
          this.isConnecting = false;
        } else if (state === 'failed' || state === 'closed') {
          this.isConnecting = false;
        }
        this.emitStats();
      };

      pc.oniceconnectionstatechange = () => {
        if (this.isDisposed || this.sessionId !== activeSessionId || !this.pc) return;
        this.emitStats();
      };

      const transceiver = pc.addTransceiver('video', { direction: 'recvonly' });
      if (transceiver.receiver) {
        try {
          if ('playoutDelayHint' in transceiver.receiver) {
            (transceiver.receiver as any).playoutDelayHint = 0;
          }
          if ('jitterBufferTarget' in transceiver.receiver) {
            (transceiver.receiver as any).jitterBufferTarget = 0;
          }
        } catch (e) {}
      }

      // 5. Asynchronous SDP Answer processor that handles any signaling timing / race conditions
      let pendingAnswer: any = null;
      let remoteDescriptionApplied = false;

      const applyAnswerIfReady = async (answer: any) => {
        if (!answer || !answer.sdp || remoteDescriptionApplied || this.isDisposed || this.sessionId !== activeSessionId || !this.pc) {
          return;
        }

        // Wait until pc is in 'have-local-offer' state
        for (let i = 0; i < 40; i++) {
          if (this.isDisposed || this.sessionId !== activeSessionId || !this.pc) return;
          if (this.pc.signalingState === 'have-local-offer') break;
          if (this.pc.signalingState === 'stable' && this.pc.remoteDescription) return;
          await new Promise((r) => setTimeout(r, 50));
        }

        if (this.pc && this.pc.signalingState === 'have-local-offer') {
          try {
            await this.pc.setRemoteDescription(
              new RTCSessionDescription({
                sdp: answer.sdp,
                type: answer.type || 'answer',
              })
            );
            remoteDescriptionApplied = true;
            console.log('[WebRTC] Remote description set successfully for session:', activeSessionId);

            // Flush all pending remote ICE candidates
            while (this.pendingRemoteCandidates.length > 0) {
              const pendingCand = this.pendingRemoteCandidates.shift();
              if (pendingCand && this.pc && this.pc.remoteDescription) {
                try {
                  await this.pc.addIceCandidate(new RTCIceCandidate(pendingCand));
                } catch (e) {}
              }
            }
          } catch (err) {
            console.error('[WebRTC] Error applying remote description:', err);
          }
        }
      };

      const answerRef = ref(this.db, `${this.sessionPath}/answer`);
      this.answerListenerUnsub = onValue(answerRef, async (snapshot) => {
        if (this.isDisposed || this.sessionId !== activeSessionId || !this.pc) return;
        const answer = snapshot.val();
        if (!answer || !answer.sdp) return;

        const answerSessionId = answer.session_id || answer.sessionId;
        if (answerSessionId && answerSessionId !== activeSessionId) return;

        pendingAnswer = answer;
        await applyAnswerIfReady(answer);
      });

      const piCandRef = ref(this.db, `${this.sessionPath}/pi_candidates`);
      this.piCandidatesUnsub = onValue(piCandRef, async (snapshot) => {
        if (this.isDisposed || this.sessionId !== activeSessionId || !this.pc) return;
        const val = snapshot.val();
        if (!val) return;

        const candidatesList = Array.isArray(val)
          ? val.filter(Boolean)
          : typeof val === 'object'
          ? Object.values(val)
          : [];

        for (const cand of candidatesList as any[]) {
          if (cand && cand.candidate && !this.processedPiCandidates.has(cand.candidate)) {
            this.processedPiCandidates.add(cand.candidate);
            const candInit: RTCIceCandidateInit = {
              candidate: cand.candidate,
              sdpMid: cand.sdpMid || '0',
              sdpMLineIndex: cand.sdpMLineIndex ?? 0,
            };

            if (!this.pc.remoteDescription || !this.pc.remoteDescription.type) {
              this.pendingRemoteCandidates.push(candInit);
            } else {
              try {
                await this.pc.addIceCandidate(new RTCIceCandidate(candInit));
              } catch (err) {
                console.debug('[WebRTC] Remote candidate error:', err);
              }
            }
          }
        }
      });

      // 6. Create Offer & set local description
      const offer = await pc.createOffer({
        offerToReceiveVideo: true,
        offerToReceiveAudio: false,
      });

      await pc.setLocalDescription(offer);

      // Brief pause for initial host/srflx candidates (max 200ms)
      await new Promise<void>((resolve) => {
        if (!this.pc || this.pc.iceGatheringState === 'complete') {
          resolve();
          return;
        }
        const checkState = () => {
          if (!this.pc || this.pc.iceGatheringState === 'complete') {
            if (this.pc) this.pc.removeEventListener('icegatheringstatechange', checkState);
            resolve();
          }
        };
        this.pc.addEventListener('icegatheringstatechange', checkState);
        setTimeout(() => {
          if (this.pc) this.pc.removeEventListener('icegatheringstatechange', checkState);
          resolve();
        }, 200);
      });

      if (this.isDisposed || this.sessionId !== activeSessionId || !this.pc) return;

      const fullLocalSdp = this.pc.localDescription?.sdp || offer.sdp || '';
      const offerPayload = {
        sdp: fullLocalSdp,
        type: 'offer',
        session_id: activeSessionId,
        timestamp: this.currentOfferTimestamp,
        client: 'AgroEye Web Client',
      };

      // 7. Write Offer to Firebase RTDB
      await set(ref(this.db, `${this.sessionPath}/offer`), offerPayload);

      // 8. If answer already arrived during offer creation, apply it immediately
      if (pendingAnswer) {
        await applyAnswerIfReady(pendingAnswer);
      } else {
        try {
          const snap = await get(answerRef);
          const ans = snap.val();
          if (ans && ans.sdp) {
            const ansSid = ans.session_id || ans.sessionId;
            if (!ansSid || ansSid === activeSessionId) {
              await applyAnswerIfReady(ans);
            }
          }
        } catch (e) {}
      }

      this.startStatsLoop();
    } catch (error: any) {
      if (this.sessionId === activeSessionId) {
        this.isConnecting = false;
        this.onErrorCallback?.(error);
      }
    }
  }

  private startStatsLoop() {
    if (this.statsInterval) clearInterval(this.statsInterval);
    this.statsInterval = setInterval(() => {
      this.emitStats();
    }, 1500);
  }

  private async emitStats() {
    if (!this.pc || !this.onStatsCallback || this.isDisposed) return;

    try {
      const stats = await this.pc.getStats();
      let fps = 0;
      let bitrateKbps = 0;
      let latencyMs = 45;
      let resolution = '640x480';
      let isRelayed = false;

      stats.forEach((report) => {
        if (report.type === 'inbound-rtp' && report.kind === 'video') {
          if (report.framesPerSecond) fps = Math.round(report.framesPerSecond);
          if (report.frameWidth && report.frameHeight) resolution = `${report.frameWidth}x${report.frameHeight}`;
          if (report.bytesReceived && report.timestamp) {
            if (this.prevTimestamp > 0) {
              const bytesDiff = report.bytesReceived - this.prevBytesReceived;
              const timeDiff = (report.timestamp - this.prevTimestamp) / 1000;
              if (timeDiff > 0) bitrateKbps = Math.round((bytesDiff * 8) / (timeDiff * 1024));
            }
            this.prevBytesReceived = report.bytesReceived;
            this.prevTimestamp = report.timestamp;
          }
        }
        if (report.type === 'candidate-pair' && report.state === 'succeeded') {
          if (report.currentRoundTripTime) latencyMs = Math.round(report.currentRoundTripTime * 1000);
        }
        if (report.type === 'local-candidate' || report.type === 'remote-candidate') {
          if (report.candidateType === 'relay') isRelayed = true;
        }
      });

      this.onStatsCallback({
        fps,
        bitrateKbps,
        latencyMs,
        resolution,
        connectionState: this.pc.connectionState,
        iceState: this.pc.iceConnectionState,
        isRelayed,
      });
    } catch (e) {}
  }

  private stopInternal(): void {
    this.isDisposed = true;
    this.isConnecting = false;
    if (this.connectionTimeout) {
      clearTimeout(this.connectionTimeout);
      this.connectionTimeout = null;
    }
    if (this.statsInterval) {
      clearInterval(this.statsInterval);
      this.statsInterval = null;
    }
    if (this.answerListenerUnsub) {
      this.answerListenerUnsub();
      this.answerListenerUnsub = null;
    }
    if (this.piCandidatesUnsub) {
      this.piCandidatesUnsub();
      this.piCandidatesUnsub = null;
    }
    if (this.pc) {
      try {
        this.pc.ontrack = null;
        this.pc.onicecandidate = null;
        this.pc.onconnectionstatechange = null;
        this.pc.oniceconnectionstatechange = null;
        this.pc.getSenders().forEach((s) => {
          try { s.track?.stop(); } catch (e) {}
        });
        this.pc.getReceivers().forEach((r) => {
          try { r.track?.stop(); } catch (e) {}
        });
        this.pc.close();
      } catch (e) {}
      this.pc = null;
    }
    this.processedPiCandidates.clear();
    this.pendingRemoteCandidates = [];
    this.prevBytesReceived = 0;
    this.prevTimestamp = 0;
  }

  public stop(): void {
    if (this.db && this.sessionId) {
      const closingSessionId = this.sessionId;
      set(ref(this.db, `${this.sessionPath}/client_status`), {
        status: 'disconnected',
        session_id: closingSessionId,
        timestamp: Date.now(),
      }).catch(() => {});
    }
    this.stopInternal();
  }
}
