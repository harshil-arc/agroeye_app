'use client';

import React from 'react';
import { useFarmData } from '@/context/FarmDataContext';
import Link from 'next/link';
import { X, ExternalLink, ShieldAlert, CheckCircle, ArrowRight, Eye } from 'lucide-react';

export default function DetectionModal() {
  const { autoOpenedDetection, setAutoOpenedDetection, markDetectionTreated } = useFarmData();

  if (!autoOpenedDetection) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-lg bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header Alert Bar */}
        <div className="px-4 py-3 bg-amber-500 text-white flex items-center justify-between">
          <div className="flex items-center gap-2">
            <ShieldAlert className="w-5 h-5 animate-bounce" />
            <div>
              <span className="font-headline text-xs font-bold uppercase tracking-wider block">
                Automatic Anomaly Ingestion
              </span>
              <span className="text-[11px] text-amber-100">Live feed from Edge Camera • iilo Ingest</span>
            </div>
          </div>
          <button
            onClick={() => setAutoOpenedDetection(null)}
            className="p-1 rounded-full hover:bg-black/10 transition-colors"
            title="Close Alert"
          >
            <X className="w-5 h-5 text-white" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-4 overflow-y-auto flex flex-col gap-3">
          {/* Main Detected Image Canvas with Bounding Box Overlay */}
          <div className="relative w-full aspect-[4/3] rounded-xl overflow-hidden bg-slate-900 border border-slate-200 shadow-inner">
            <img
              src={autoOpenedDetection.imageUrl}
              alt={autoOpenedDetection.title}
              className="w-full h-full object-cover"
              onError={(e) => {
                (e.target as HTMLElement).setAttribute('src', 'https://images.unsplash.com/photo-1592417817098-8f3d6eb2252a?w=800&auto=format&fit=crop&q=80');
              }}
            />
            {/* Dark gradient for HUD contrast */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-black/30 pointer-events-none" />

            {/* Bounding Box HUD if available */}
            {autoOpenedDetection.boundingBox && (
              <div
                className="absolute rounded border-2 border-dashed border-amber-400 pointer-events-none transition-all duration-300 shadow-[0_0_15px_rgba(251,191,36,0.6)]"
                style={{
                  top: autoOpenedDetection.boundingBox.top,
                  left: autoOpenedDetection.boundingBox.left,
                  width: autoOpenedDetection.boundingBox.width,
                  height: autoOpenedDetection.boundingBox.height,
                }}
              >
                <div className="absolute -top-6 left-0 bg-amber-500 text-slate-950 font-headline text-[10px] font-bold px-2 py-0.5 rounded shadow-md whitespace-nowrap flex items-center gap-1">
                  <span>🎯</span>
                  <span>{autoOpenedDetection.boundingBox.label}</span>
                </div>
              </div>
            )}

            {/* Bottom HUD metadata */}
            <div className="absolute bottom-2 left-2 right-2 flex items-center justify-between text-white text-xs pointer-events-none">
              <span className="px-2 py-0.5 rounded bg-black/60 backdrop-blur-sm font-mono font-bold">
                {autoOpenedDetection.plot}
              </span>
              <span className="px-2 py-0.5 rounded bg-black/60 backdrop-blur-sm font-mono font-bold text-amber-300">
                Confidence: {autoOpenedDetection.confidence}%
              </span>
            </div>
          </div>

          {/* Anomaly Information */}
          <div className="flex flex-col gap-1.5">
            <div className="flex items-center justify-between">
              <span className="px-2.5 py-0.5 rounded-full bg-amber-50 border border-amber-200 text-amber-800 font-headline text-[11px] font-bold uppercase tracking-wide">
                {autoOpenedDetection.categoryLabel}
              </span>
              <span className="text-xs text-slate-500 font-medium">{autoOpenedDetection.timeAgo}</span>
            </div>

            <h3 className="font-headline text-lg font-bold text-slate-900 leading-tight">
              {autoOpenedDetection.title}
            </h3>
            <p className="text-sm text-slate-600 leading-relaxed">
              {autoOpenedDetection.description}
            </p>
          </div>

          {/* Quick Treatment Recommendation */}
          <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200/80 text-emerald-900 flex items-start gap-2.5">
            <CheckCircle className="w-5 h-5 text-emerald-600 flex-shrink-0 mt-0.5" />
            <div className="flex-1 min-w-0">
              <span className="font-headline text-xs uppercase font-bold text-emerald-800 tracking-wider block">
                Recommended Agronomic Action
              </span>
              <p className="text-xs text-slate-700 mt-0.5 leading-snug">
                {autoOpenedDetection.recommendation}
              </p>
            </div>
          </div>
        </div>

        {/* Action Footer */}
        <div className="p-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between gap-2">
          <button
            type="button"
            onClick={() => {
              markDetectionTreated(autoOpenedDetection.id);
              setAutoOpenedDetection(null);
            }}
            className="h-10 px-3.5 rounded-xl bg-white border border-slate-300 text-slate-700 font-headline text-xs uppercase tracking-wider font-bold hover:bg-slate-100 transition-all"
          >
            Mark Handled
          </button>

          <Link
            href={`/detections/${autoOpenedDetection.id}`}
            onClick={() => setAutoOpenedDetection(null)}
            className="h-10 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-headline text-xs uppercase tracking-wider font-bold flex items-center gap-1.5 shadow-sm active:scale-95 transition-all"
          >
            <span>Full Diagnostics</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </div>
    </div>
  );
}
