'use client';

import React, { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { useFarmData } from '@/context/FarmDataContext';
import {
  ArrowLeft,
  AlertTriangle,
  ShieldCheck,
  CheckCircle2,
  Share2,
  FileText,
  Clock,
  MapPin,
  Thermometer,
  Droplets,
  Wind,
  Layers,
  Bug,
  Sparkles,
  Plane,
  Check,
  RefreshCw,
  Trash2
} from 'lucide-react';

export default function DetectionDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { detections, markDetectionTreated, deleteDetection, isLoadingDetections } = useFarmData();
  const [isTreated, setIsTreated] = useState<boolean>(false);
  const [showDroneSuccess, setShowDroneSuccess] = useState<boolean>(false);
  const [isDeleting, setIsDeleting] = useState<boolean>(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<boolean>(false);

  const detectionId = params?.id as string;
  const detection = detections.find((d) => d.id === detectionId || d.code.replace('#', '') === detectionId) || (detections.length > 0 ? detections[0] : null);

  const handleMarkTreated = () => {
    if (!detection) return;
    setIsTreated(true);
    markDetectionTreated(detection.id);
  };

  const handleDelete = async () => {
    if (!detection) return;
    setIsDeleting(true);
    await deleteDetection(detection.id);
    router.push('/detections');
  };

  const handleScheduleDrone = () => {
    setShowDroneSuccess(true);
    setTimeout(() => {
      setShowDroneSuccess(false);
    }, 4500);
  };

  if (!detection) {
    return (
      <div className="p-12 text-center flex flex-col items-center justify-center min-h-[50vh]">
        {isLoadingDetections ? (
          <>
            <RefreshCw className="w-8 h-8 text-emerald-600 animate-spin mb-3" />
            <h2 className="font-headline text-lg font-bold text-slate-900">
              Loading Real Ingest from Firebase...
            </h2>
            <p className="text-xs text-slate-500 mt-1">Retrieving spectral diagnostic data</p>
          </>
        ) : (
          <>
            <ShieldCheck className="w-10 h-10 text-slate-400 mb-3" />
            <h2 className="font-headline text-lg font-bold text-slate-900">Detection Not Found</h2>
            <p className="text-xs text-slate-500 mt-1 mb-4">
              This detection event may have been updated or archived.
            </p>
            <Link
              href="/detections"
              className="px-4 py-2 bg-emerald-600 text-white rounded-xl font-headline text-xs font-bold uppercase tracking-wider shadow-sm"
            >
              Return to Detections Feed
            </Link>
          </>
        )}
      </div>
    );
  }

  return (
    <div className="flex flex-col w-full pb-10">
      {/* 1. Top Navigation & Status Strip */}
      <div className="px-4 pt-3 pb-2 flex flex-col gap-2">
        <div className="flex items-center justify-between">
          <Link
            href="/detections"
            className="inline-flex items-center gap-1.5 py-1.5 px-3 rounded-lg bg-white border border-slate-200 shadow-2xs text-slate-700 hover:text-slate-900 hover:bg-slate-50 transition-colors font-headline text-xs font-semibold uppercase tracking-wider"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back to Detections</span>
          </Link>

          <div
            className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full border ${
              isTreated || detection.isTreated
                ? 'bg-emerald-50 border-emerald-300 text-emerald-800'
                : 'bg-amber-50 border-amber-300 text-amber-800'
            }`}
          >
            <span
              className={`w-2 h-2 rounded-full ${
                isTreated || detection.isTreated
                  ? 'bg-emerald-600'
                  : 'bg-amber-500 animate-ping'
              }`}
            />
            <span className="font-headline text-xs uppercase tracking-wide font-bold">
              {isTreated || detection.isTreated ? 'Treated & Verified' : '⚠️ Attention Required'}
            </span>
          </div>
        </div>

        <div className="flex items-baseline justify-between mt-1">
          <div>
            <h1 className="font-headline text-2xl font-bold text-slate-900 tracking-tight">
              {detection.title}
            </h1>
            <p className="text-xs text-slate-500 mt-0.5 font-medium">
              Real Edge Ingest • Code: {detection.code} • ID: {detection.id}
            </p>
          </div>
          <span className="font-headline text-[10px] text-emerald-800 font-bold px-2.5 py-1 rounded bg-emerald-50 border border-emerald-200 uppercase tracking-wider">
            Verified Edge Ingest
          </span>
        </div>
      </div>

      {/* 2. Primary Real Image Canvas from Firebase (iili.io) */}
      <div className="px-4 mb-4">
        <div className="relative w-full rounded-2xl overflow-hidden bg-slate-950 shadow-md border border-slate-200">
          <img
            src={detection.imageUrl}
            alt={detection.title}
            className="w-full h-80 sm:h-[450px] object-cover block"
            onError={(e) => {
              (e.target as HTMLElement).setAttribute('src', 'https://iili.io/nuiqbzg.jpg');
            }}
          />

          {/* Ambient Contrast Scrim */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-transparent to-black/30 pointer-events-none" />

          {/* Bounding Box overlay */}
          {detection.boundingBox && (
            <div
              className="absolute pointer-events-none rounded-lg bg-amber-400/15 shadow-lg outline outline-2 outline-dashed outline-amber-400"
              style={{
                top: detection.boundingBox.top,
                left: detection.boundingBox.left,
                width: detection.boundingBox.width,
                height: detection.boundingBox.height,
              }}
            >
              <div className="absolute -top-4 left-2 flex items-center gap-1.5 px-2 py-0.5 bg-amber-500 text-slate-950 rounded shadow-md">
                <Bug className="w-3.5 h-3.5" />
                <span className="font-headline text-[10px] tracking-wider uppercase font-bold text-slate-950">
                  {detection.boundingBox.label}
                </span>
              </div>
            </div>
          )}

          {/* Bottom HUD metadata */}
          <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between text-white text-xs pointer-events-none">
            <div className="flex items-center gap-2">
              <span className="px-2 py-1 rounded bg-black/60 backdrop-blur-md font-headline font-bold">
                {detection.plot}
              </span>
              <span className="px-2 py-1 rounded bg-black/60 backdrop-blur-md text-emerald-400 font-mono">
                {detection.crop}
              </span>
            </div>
            <span className="px-2 py-1 rounded bg-black/60 backdrop-blur-md text-amber-300 font-mono font-bold">
              Confidence: {detection.confidence}%
            </span>
          </div>
        </div>
      </div>

      {/* 3. Diagnostic Breakdown Card */}
      <div className="px-4 mb-4">
        <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-sm">
          <div className="flex items-center justify-between mb-3 pb-2 border-b border-slate-100">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-amber-50 border border-amber-200 text-amber-700 flex items-center justify-center">
                <Sparkles className="w-4 h-4" />
              </div>
              <div>
                <h2 className="font-headline text-base font-bold text-slate-900 leading-tight">
                  {detection.title}
                </h2>
                <span className="text-xs text-slate-500 font-medium">{detection.timeAgo} • {detection.location}</span>
              </div>
            </div>
            <span className="px-2.5 py-1 rounded-full bg-rose-50 border border-rose-200 text-rose-800 font-headline text-[10px] font-bold uppercase">
              {detection.severity}
            </span>
          </div>

          <p className="text-xs text-slate-700 leading-relaxed mb-4">
            {detection.description}
          </p>

          <div className="grid grid-cols-2 gap-2 text-xs">
            <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-100">
              <span className="text-slate-500 text-[11px] block font-medium">Model / Classifier</span>
              <strong className="text-slate-900 font-headline text-xs mt-0.5 block font-mono">
                {detection.pathogen || 'YOLOv8 Edge Vision'}
              </strong>
            </div>

            <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-100">
              <span className="text-slate-500 text-[11px] block font-medium">Confidence Score</span>
              <strong className="text-slate-900 font-headline text-xs mt-0.5 block font-mono">
                {detection.confidence}% Positive
              </strong>
            </div>
          </div>
        </div>
      </div>

      {/* 4. Sensor Context at Detection Time */}
      {detection.sensorContext && (
        <div className="px-4 mb-4">
          <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-sm">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-1.5">
                <Layers className="w-4 h-4 text-emerald-600" />
                <h3 className="font-headline text-xs uppercase tracking-wider text-slate-900 font-bold">
                  Telemetry at Detection Instant
                </h3>
              </div>
              <span className="text-[11px] text-slate-500 font-medium">ESP32 Ingest</span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              <div className="p-2 bg-slate-50 rounded-xl border border-slate-100 text-center">
                <span className="text-[10px] text-slate-500 font-medium">Canopy Temp</span>
                <span className="font-headline text-sm font-bold text-slate-900 block mt-0.5">
                  {detection.sensorContext.temperature}
                </span>
              </div>

              <div className="p-2 bg-slate-50 rounded-xl border border-slate-100 text-center">
                <span className="text-[10px] text-slate-500 font-medium">Air Humidity</span>
                <span className="font-headline text-sm font-bold text-slate-900 block mt-0.5">
                  {detection.sensorContext.humidity}
                </span>
              </div>

              <div className="p-2 bg-slate-50 rounded-xl border border-slate-100 text-center">
                <span className="text-[10px] text-slate-500 font-medium">Leaf Wetness</span>
                <span className="font-headline text-sm font-bold text-amber-700 block mt-0.5">
                  {detection.sensorContext.leafWetness}
                </span>
              </div>

              <div className="p-2 bg-slate-50 rounded-xl border border-slate-100 text-center">
                <span className="text-[10px] text-slate-500 font-medium">Soil Moisture</span>
                <span className="font-headline text-sm font-bold text-slate-900 block mt-0.5">
                  {detection.sensorContext.soilMoisture}
                </span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 5. Treatment Protocol & Agronomist Recommendations */}
      {detection.treatmentProtocol && (
        <div className="px-4 mb-4">
          <div className="bg-emerald-50/60 rounded-2xl border border-emerald-200 p-4 shadow-sm">
            <div className="flex items-center gap-2 mb-2">
              <ShieldCheck className="w-5 h-5 text-emerald-700" />
              <h3 className="font-headline text-sm font-bold text-emerald-950 uppercase tracking-wide">
                Agronomic Treatment Protocol &amp; Remedies
              </h3>
            </div>

            <div className="space-y-2 mt-3 text-xs text-slate-700">
              <div className="p-2.5 bg-white rounded-xl border border-emerald-100">
                <span className="font-headline font-bold text-emerald-900 block">Organic Remedy</span>
                <span>{detection.treatmentProtocol.action}</span>
              </div>

              <div className="p-2.5 bg-white rounded-xl border border-emerald-100">
                <span className="font-headline font-bold text-emerald-900 block">Chemical Remedy / Dosage</span>
                <span>{detection.treatmentProtocol.dosage}</span>
              </div>

              <div className="p-2.5 bg-white rounded-xl border border-emerald-100">
                <span className="font-headline font-bold text-emerald-900 block">Ideal Spray Window</span>
                <span>{detection.treatmentProtocol.window}</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Drone schedule feedback toast */}
      {showDroneSuccess && (
        <div className="fixed top-20 left-4 right-4 z-50 p-3.5 bg-emerald-600 text-white rounded-xl shadow-xl flex items-center justify-between animate-in fade-in slide-in-from-top-2">
          <div className="flex items-center gap-2">
            <Plane className="w-5 h-5" />
            <span className="font-headline text-xs font-bold">
              Autonomous spray drone mission scheduled for Dabok Rice Field tomorrow 06:30 AM.
            </span>
          </div>
          <Check className="w-4 h-4" />
        </div>
      )}

      {/* 6. Action Bar */}
      <div className="px-4 pt-2 flex flex-col sm:flex-row items-center gap-2">
        <button
          type="button"
          onClick={handleMarkTreated}
          className={`w-full sm:flex-1 h-12 rounded-xl font-headline text-xs uppercase font-bold tracking-wider flex items-center justify-center gap-2 active:scale-95 transition-all shadow-sm ${
            isTreated || detection.isTreated
              ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
              : 'bg-emerald-600 hover:bg-emerald-700 text-white'
          }`}
        >
          <CheckCircle2 className="w-4 h-4" />
          <span>{isTreated || detection.isTreated ? 'Marked as Handled' : 'Mark as Treated'}</span>
        </button>

        <button
          type="button"
          onClick={handleScheduleDrone}
          className="w-full sm:flex-1 h-12 rounded-xl bg-slate-900 hover:bg-black text-white font-headline text-xs uppercase font-bold tracking-wider flex items-center justify-center gap-2 active:scale-95 transition-all shadow-sm"
        >
          <Plane className="w-4 h-4 text-emerald-400" />
          <span>Schedule Spray Drone</span>
        </button>

        {showDeleteConfirm ? (
          <div className="w-full sm:w-auto h-12 px-3 rounded-xl bg-rose-50 border border-rose-300 flex items-center gap-2 animate-in fade-in">
            <span className="text-xs text-rose-800 font-bold">Permanently delete?</span>
            <button
              type="button"
              onClick={handleDelete}
              disabled={isDeleting}
              className="h-8 px-3 bg-rose-600 hover:bg-rose-700 text-white rounded-lg text-xs font-bold uppercase transition-all shadow-xs active:scale-95"
            >
              {isDeleting ? 'Deleting...' : 'Yes, Delete'}
            </button>
            <button
              type="button"
              onClick={() => setShowDeleteConfirm(false)}
              className="h-8 px-2.5 bg-slate-200 hover:bg-slate-300 text-slate-700 rounded-lg text-xs font-bold transition-all active:scale-95"
            >
              Cancel
            </button>
          </div>
        ) : (
          <button
            type="button"
            onClick={() => setShowDeleteConfirm(true)}
            className="w-full sm:w-auto h-12 px-4 rounded-xl bg-white hover:bg-rose-50 hover:text-rose-700 hover:border-rose-300 border border-slate-200 text-slate-700 font-headline text-xs uppercase font-bold tracking-wider flex items-center justify-center gap-1.5 active:scale-95 transition-all shadow-sm flex-shrink-0"
            title="Delete this detection record"
          >
            <Trash2 className="w-4 h-4 text-rose-500" />
            <span>Delete</span>
          </button>
        )}
      </div>
    </div>
  );
}
