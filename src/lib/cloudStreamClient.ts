'use client';

import { Database, ref, onValue, off, set } from 'firebase/database';
import Hls from 'hls.js';

export type CloudStreamStatus = 'connecting' | 'live' | 'unavailable' | 'reconnecting';

export interface CloudStreamInfo {
  streamUrl: string;
  streamStatus: string;
  fps: number;
  resolution: string;
  lastActive: number;
  protocol?: string;
  server?: string;
}

export interface CloudStreamPlayerOptions {
  deviceId?: string;
  db: Database | null;
  onStatusChange: (status: CloudStreamStatus, message?: string) => void;
  onInfoUpdate?: (info: CloudStreamInfo) => void;
  onError?: (error: Error) => void;
}

/**
 * Cloud Video Stream Viewer Client for AgroEye Android / Mobile Web App.
 *
 * Architecture:
 * Raspberry Pi -> SRT Ingest -> Cloud Video Server -> Public Stream URL (HLS / HTTPS) -> Android App
 *
 * Reads stream_url and stream_status from Firebase metadata node and manages
 * the underlying HTML5 / Hls.js video player with automated stall recovery,
 * zero IP direct connection to Pi, and full resource cleanup.
 */
export class CloudStreamClient {
  private deviceId: string;
  private db: Database | null;
  private streamPath: string;
  private onStatusChange: (status: CloudStreamStatus, message?: string) => void;
  private onInfoUpdate?: (info: CloudStreamInfo) => void;
  private onError?: (error: Error) => void;

  private hlsInstance: Hls | null = null;
  private activeVideoElement: HTMLVideoElement | null = null;
  private streamInfoUnsub: (() => void) | null = null;
  private liveStatusUnsub: (() => void) | null = null;

  private currentStreamUrl: string = '';
  private currentStatus: CloudStreamStatus = 'connecting';
  private retryTimeout: NodeJS.Timeout | null = null;
  private stallCheckInterval: NodeJS.Timeout | null = null;
  private isDisposed: boolean = false;
  private retryAttempts: number = 0;
  private lastPlaybackTime: number = 0;

  constructor(options: CloudStreamPlayerOptions) {
    this.deviceId = options.deviceId || 'pi_agroeye_01';
    this.db = options.db;
    this.streamPath = `live_stream/${this.deviceId}`;
    this.onStatusChange = options.onStatusChange;
    this.onInfoUpdate = options.onInfoUpdate;
    this.onError = options.onError;
  }

  public setDatabase(db: Database | null) {
    this.db = db;
  }

  public getStatus(): CloudStreamStatus {
    return this.currentStatus;
  }

  public getStreamUrl(): string {
    return this.currentStreamUrl;
  }

  /**
   * Starts listening to Firebase stream metadata and binds to video elements.
   */
  public attach(videoElement: HTMLVideoElement | null, secondaryVideoElement?: HTMLVideoElement | null): void {
    this.stopInternal();
    this.isDisposed = false;
    this.activeVideoElement = videoElement;
    this.retryAttempts = 0;
    this.updateStatus('connecting', 'Connecting to Cloud Stream...');

    if (!this.db) {
      this.updateStatus('unavailable', 'Firebase database not configured.');
      return;
    }

    // 1. Listen to dedicated /live_stream/<deviceId> node in Firebase
    const streamMetaRef = ref(this.db, this.streamPath);
    this.streamInfoUnsub = onValue(streamMetaRef, (snapshot) => {
      if (this.isDisposed) return;
      const data = snapshot.val();
      if (data && typeof data === 'object') {
        this.handleStreamMetadata(data);
      } else {
        // Fallback: Check /live_status for stream_url if dedicated node is empty
        this.checkLiveStatusFallback();
      }
    }, (err) => {
      console.warn('[CloudStream] Metadata subscription error:', err);
    });
  }

  private checkLiveStatusFallback(): void {
    if (!this.db || this.liveStatusUnsub) return;

    const liveStatusRef = ref(this.db, 'live_status');
    this.liveStatusUnsub = onValue(liveStatusRef, (snapshot) => {
      if (this.isDisposed) return;
      const data = snapshot.val();
      if (data && typeof data === 'object') {
        const streamUrl = data.stream_url || data.streamUrl || '';
        const status = data.stream_status || data.streamStatus || (streamUrl ? 'live' : 'offline');
        this.handleStreamMetadata({
          stream_url: streamUrl,
          stream_status: status,
          fps: data.fps || 30,
          resolution: data.resolution || '640x480',
          last_active: data.last_updated || Date.now(),
        });
      }
    });
  }

  private handleStreamMetadata(data: Record<string, any>): void {
    const rawUrl = String(data.stream_url || data.streamUrl || data.url || '').trim();
    const rawStatus = String(data.stream_status || data.streamStatus || data.status || '').toLowerCase();
    const fps = Number(data.fps || 30);
    const resolution = String(data.resolution || '640x480');
    const lastActive = Number(data.last_active || data.lastActive || data.timestamp || Date.now());

    const info: CloudStreamInfo = {
      streamUrl: rawUrl,
      streamStatus: rawStatus,
      fps,
      resolution,
      lastActive,
      protocol: data.protocol || (rawUrl.includes('.m3u8') ? 'HLS' : 'HTTPS Stream'),
      server: data.server || 'Cloud SRT Transcoder',
    };

    this.onInfoUpdate?.(info);

    if (!rawUrl || rawStatus === 'offline' || rawStatus === 'unavailable') {
      this.currentStreamUrl = '';
      this.destroyPlayer();
      this.updateStatus('unavailable', 'Cloud Video Stream Unavailable (Pi is offline or stream stopped).');
      return;
    }

    // If stream URL changed or player was not active, initialize playback
    if (rawUrl !== this.currentStreamUrl || !this.hlsInstance) {
      this.currentStreamUrl = rawUrl;
      this.playStream(rawUrl);
    }
  }

  /**
   * Initializes playback for the cloud stream URL (HLS / HTTPS) with auto-stall recovery.
   */
  public playStream(streamUrl?: string): void {
    const targetUrl = (streamUrl || this.currentStreamUrl).trim();
    if (!targetUrl || !this.activeVideoElement || this.isDisposed) {
      return;
    }

    this.destroyPlayer();
    this.updateStatus('connecting', 'Connecting to Cloud Video Stream...');

    const video = this.activeVideoElement;
    video.muted = true;
    video.playsInline = true;
    video.setAttribute('playsinline', 'true');
    video.setAttribute('webkit-playsinline', 'true');

    const isHls = targetUrl.includes('.m3u8') || targetUrl.includes('m3u8');

    if (isHls && Hls.isSupported()) {
      // High-performance Low-Latency HLS Player configuration
      const hls = new Hls({
        enableWorker: true,
        lowLatencyMode: true,
        backBufferLength: 10,
        maxBufferLength: 8,
        maxMaxBufferLength: 15,
        liveSyncDurationCount: 2,
        liveMaxLatencyDurationCount: 4,
        fragLoadingTimeOut: 8000,
        manifestLoadingTimeOut: 8000,
        levelLoadingTimeOut: 8000,
      });

      this.hlsInstance = hls;

      hls.loadSource(targetUrl);
      hls.attachMedia(video);

      hls.on(Hls.Events.MANIFEST_PARSED, () => {
        if (this.isDisposed) return;
        video.play().catch((e) => console.debug('[CloudStream] Auto-play pending user gesture:', e));
      });

      hls.on(Hls.Events.FRAG_LOADED, () => {
        if (this.isDisposed) return;
        this.retryAttempts = 0;
        this.updateStatus('live', 'Live Cloud Stream Active');
      });

      hls.on(Hls.Events.ERROR, (_event, data) => {
        if (this.isDisposed) return;
        console.warn('[CloudStream] HLS Error event:', data.type, data.details);

        if (data.fatal) {
          switch (data.type) {
            case Hls.ErrorTypes.NETWORK_ERROR:
              this.updateStatus('reconnecting', 'Network interruption. Reconnecting...');
              hls.startLoad();
              this.scheduleRetry();
              break;
            case Hls.ErrorTypes.MEDIA_ERROR:
              this.updateStatus('reconnecting', 'Media stall detected. Recovering buffer...');
              hls.recoverMediaError();
              break;
            default:
              this.updateStatus('reconnecting', 'Recovering stream connection...');
              this.destroyPlayer();
              this.scheduleRetry();
              break;
          }
        }
      });
    } else if (video.canPlayType('application/vnd.apple.mpegurl') || !isHls) {
      // Native HLS playback (Safari/Android WebViews) or direct HTTPS video stream
      video.src = targetUrl;
      video.load();
      video.play().catch(() => {});

      video.onplaying = () => {
        if (this.isDisposed) return;
        this.retryAttempts = 0;
        this.updateStatus('live', 'Live Cloud Stream Active');
      };

      video.onerror = () => {
        if (this.isDisposed) return;
        this.updateStatus('reconnecting', 'Stream connection interrupted. Retrying...');
        this.scheduleRetry();
      };
    }

    this.startStallWatchdog();
  }

  private startStallWatchdog(): void {
    if (this.stallCheckInterval) clearInterval(this.stallCheckInterval);

    this.stallCheckInterval = setInterval(() => {
      if (this.isDisposed || !this.activeVideoElement) return;

      const video = this.activeVideoElement;
      if (this.currentStatus === 'live') {
        // If playback is paused or currentTime is frozen for > 4 seconds while stream is marked live
        if (video.currentTime === this.lastPlaybackTime && !video.paused) {
          this.updateStatus('reconnecting', 'Stream stalled. Resyncing live edge...');
          this.scheduleRetry();
        }
        this.lastPlaybackTime = video.currentTime;
      }
    }, 4000);
  }

  private scheduleRetry(): void {
    if (this.isDisposed || this.retryTimeout) return;

    this.retryAttempts += 1;
    const backoffMs = Math.min(1000 * Math.pow(1.5, Math.min(this.retryAttempts, 5)), 8000);

    this.retryTimeout = setTimeout(() => {
      this.retryTimeout = null;
      if (!this.isDisposed && this.currentStreamUrl) {
        this.playStream(this.currentStreamUrl);
      }
    }, backoffMs);
  }

  private updateStatus(status: CloudStreamStatus, message?: string): void {
    this.currentStatus = status;
    this.onStatusChange(status, message);
  }

  private destroyPlayer(): void {
    if (this.stallCheckInterval) {
      clearInterval(this.stallCheckInterval);
      this.stallCheckInterval = null;
    }
    if (this.retryTimeout) {
      clearTimeout(this.retryTimeout);
      this.retryTimeout = null;
    }
    if (this.hlsInstance) {
      try {
        this.hlsInstance.stopLoad();
        this.hlsInstance.detachMedia();
        this.hlsInstance.destroy();
      } catch (e) {}
      this.hlsInstance = null;
    }
    if (this.activeVideoElement) {
      try {
        this.activeVideoElement.pause();
        this.activeVideoElement.removeAttribute('src');
        this.activeVideoElement.load();
      } catch (e) {}
    }
  }

  private stopInternal(): void {
    this.isDisposed = true;
    if (this.streamInfoUnsub) {
      this.streamInfoUnsub();
      this.streamInfoUnsub = null;
    }
    if (this.liveStatusUnsub) {
      this.liveStatusUnsub();
      this.liveStatusUnsub = null;
    }
    this.destroyPlayer();
    this.activeVideoElement = null;
  }

  /**
   * Gracefully releases all video and Firebase resources upon exiting the screen.
   */
  public detach(): void {
    this.stopInternal();
    this.updateStatus('unavailable', 'Live stream detached');
  }
}
