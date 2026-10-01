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
      username: 'openrelay',
      credential: 'openrelay',
    },
    {
      urls: 'turn:openrelay.metered.ca:443',
      username: 'openrelay',
      credential: 'openrelay',
    },
    {
      urls: 'turn:openrelay.metered.ca:443?transport=tcp',
      username: 'openrelay',
      credential: 'openrelay',
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
  private isManuallyStopped = false;
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

  public async start(): Promise<void> {
    this.isManuallyStopped = false;
    if (this.isConnecting || (this.pc && this.pc.connectionState === 'connected')) {
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

    this.stopInternal();
    this.isConnecting = true;
    this.processedPiCandidates.clear();
    this.pendingRemoteCandidates = [];
    this.currentOfferTimestamp = Date.now();

    // Timeout: If Pi doesn't answer within 20s, update status
    if (this.connectionTimeout) clearTimeout(this.connectionTimeout);
    this.connectionTimeout = setTimeout(() => {
      if (this.pc && this.pc.connectionState !== 'connected') {
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
    }, 20000);

    try {
      // 1. Initialize PeerConnection
      this.pc = new RTCPeerConnection(DEFAULT_ICE_SERVERS);

      this.pc.ontrack = (event) => {
        if (this.connectionTimeout) clearTimeout(this.connectionTimeout);
        
        const stream = (event.streams && event.streams[0]) 
          ? event.streams[0] 
          : (event.track ? new MediaStream([event.track]) : null);

        if (stream) {
          console.log('[WebRTC] Video stream track received successfully');
          this.onStreamCallback(stream);
        }
      };

      this.pc.onicecandidate = (event) => {
        if (event.candidate && this.db) {
          const candidateData = {
            candidate: event.candidate.candidate,
            sdpMid: event.candidate.sdpMid || '0',
            sdpMLineIndex: event.candidate.sdpMLineIndex ?? 0,
          };
          const clientCandRef = push(ref(this.db, `${this.sessionPath}/client_candidates`));
          set(clientCandRef, candidateData).catch(() => {});
        }
      };

      this.pc.onconnectionstatechange = () => {
        if (!this.pc) return;
        const state = this.pc.connectionState;
        if (state === 'connected') {
          if (this.connectionTimeout) clearTimeout(this.connectionTimeout);
          this.isConnecting = false;
        } else if (state === 'failed' || state === 'closed' || state === 'disconnected') {
          this.isConnecting = false;
        }
        this.emitStats();
      };

      this.pc.oniceconnectionstatechange = () => {
        if (!this.pc) return;
        if (this.pc.iceConnectionState === 'failed' || this.pc.iceConnectionState === 'disconnected') {
          if (!this.isManuallyStopped) {
            try {
              this.pc.restartIce();
            } catch (e) {}
          }
        }
        this.emitStats();
      };

      const transceiver = this.pc.addTransceiver('video', { direction: 'recvonly' });
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

      // 2. Clear old client candidates & answer
      await set(ref(this.db, `${this.sessionPath}/client_candidates`), null);
      await set(ref(this.db, `${this.sessionPath}/pi_candidates`), null);
      await set(ref(this.db, `${this.sessionPath}/answer`), null);

      // 3. Create Offer
      const offer = await this.pc.createOffer({
        offerToReceiveVideo: true,
        offerToReceiveAudio: false,
      });

      await this.pc.setLocalDescription(offer);

      // Wait briefly for initial local ICE candidates
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
        }, 1000);
      });

      const fullLocalSdp = this.pc.localDescription?.sdp || offer.sdp || '';
      const offerPayload = {
        sdp: fullLocalSdp,
        type: 'offer',
        timestamp: this.currentOfferTimestamp,
        client: 'AgroEye Web Client',
      };

      await set(ref(this.db, `${this.sessionPath}/client_status`), {
        status: 'requesting_stream',
        timestamp: Date.now(),
      }).catch(() => {});

      // 4. Attach Answer & Remote ICE listeners
      const answerRef = ref(this.db, `${this.sessionPath}/answer`);
      this.answerListenerUnsub = onValue(answerRef, async (snapshot) => {
        const answer = snapshot.val();
        if (!answer || !answer.sdp) return;

        if (this.pc && (this.pc.signalingState === 'have-local-offer')) {
          try {
            await this.pc.setRemoteDescription(
              new RTCSessionDescription({
                sdp: answer.sdp,
                type: answer.type || 'answer',
              })
            );
            console.log('[WebRTC] Remote description (answer) set successfully');

            // Flush pending remote ICE candidates
            while (this.pendingRemoteCandidates.length > 0) {
              const pendingCand = this.pendingRemoteCandidates.shift();
              if (pendingCand && this.pc && this.pc.remoteDescription) {
                try {
                  await this.pc.addIceCandidate(new RTCIceCandidate(pendingCand));
                } catch (e) {}
              }
            }
          } catch (err) {
            console.error('[WebRTC] Set remote description failed:', err);
          }
        }
      });

      const piCandRef = ref(this.db, `${this.sessionPath}/pi_candidates`);
      this.piCandidatesUnsub = onValue(piCandRef, async (snapshot) => {
        const val = snapshot.val();
        if (!val || !this.pc) return;

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
                console.debug('[WebRTC] ICE candidate error:', err);
              }
            }
          }
        }
      });

      // 5. Write Offer payload to Firebase to trigger Raspberry Pi
      await set(ref(this.db, `${this.sessionPath}/offer`), offerPayload);

      this.startStatsLoop();
    } catch (error: any) {
      this.isConnecting = false;
      this.onErrorCallback?.(error);
    }
  }

  private startStatsLoop() {
    if (this.statsInterval) clearInterval(this.statsInterval);
    this.statsInterval = setInterval(() => {
      this.emitStats();
    }, 1500);
  }

  private async emitStats() {
    if (!this.pc || !this.onStatsCallback) return;

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
        this.pc.close();
      } catch (e) {}
      this.pc = null;
    }
    this.prevBytesReceived = 0;
    this.prevTimestamp = 0;
  }

  public stop(): void {
    this.isManuallyStopped = true;
    if (this.db) {
      set(ref(this.db, `${this.sessionPath}/client_status`), {
        status: 'disconnected',
        timestamp: Date.now(),
      }).catch(() => {});
      set(ref(this.db, `${this.sessionPath}/answer`), null).catch(() => {});
    }
    this.stopInternal();
  }
}
