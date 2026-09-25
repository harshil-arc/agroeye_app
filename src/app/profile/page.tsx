'use client';

import React, { useState } from 'react';
import { useFarmData } from '@/context/FarmDataContext';
import {
  User,
  MapPin,
  CheckCircle,
  Cpu,
  Layers,
  HardDrive,
  Globe,
  Database,
  Key,
  Shield,
  Bell,
  RefreshCw,
  Save,
  Check,
  Radio,
  Wifi,
  BatteryCharging,
  Sparkles,
  Award
} from 'lucide-react';
import { FirebaseConfig } from '@/types';

export default function ProfilePage() {
  const {
    plots,
    nodes,
    firebaseConfig,
    saveFirebaseConfig,
    firebaseConnected,
    isOfflineMode,
    setIsOfflineMode,
    triggerManualAlert
  } = useFarmData();

  const [editConfig, setEditConfig] = useState<FirebaseConfig>(firebaseConfig);
  const [saveSuccess, setSaveSuccess] = useState<boolean>(false);
  const [selectedLanguage, setSelectedLanguage] = useState<string>('en');

  const handleSaveFirebase = (e: React.FormEvent) => {
    e.preventDefault();
    saveFirebaseConfig(editConfig);
    setSaveSuccess(true);
    setTimeout(() => {
      setSaveSuccess(false);
    }, 3500);
  };

  return (
    <div className="flex flex-col w-full pb-10 space-y-4">
      {/* 1. Profile & Hero Header Card */}
      <div className="px-4 pt-3">
        <div className="relative overflow-hidden rounded-2xl bg-white p-5 shadow-sm border border-slate-200">
          <div className="absolute -top-16 -right-16 w-44 h-44 rounded-full bg-emerald-100/60 blur-3xl pointer-events-none" />

          <div className="flex items-start justify-between relative z-10 mb-4">
            <div>
              <span className="font-headline text-[11px] text-emerald-700 uppercase font-bold tracking-wider">
                Operator Central
              </span>
              <h1 className="font-headline text-2xl text-slate-900 font-bold mt-0.5 tracking-tight">
                My Profile &amp; Farm Hub
              </h1>
            </div>
            <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 border border-emerald-200">
              <span className="w-2 h-2 rounded-full bg-emerald-600 animate-pulse" />
              <span className="font-headline text-[10px] uppercase text-emerald-800 font-bold">
                Node #01 Active
              </span>
            </div>
          </div>

          <div className="flex items-center gap-4 relative z-10">
            <div className="relative flex-shrink-0">
              <div className="w-20 h-20 rounded-full p-1 bg-slate-50 shadow-inner border border-slate-200">
                <img
                  alt="Farmer portrait"
                  className="w-full h-full object-cover rounded-full"
                  src="https://lh3.googleusercontent.com/aida/AEtjO1W7Z0YmoEh7fgrCcTh2Zj1tOtDNvssAXZe49VQblwr0m_SajWroswX9VueDJ1XL7Oq754rKujEHCOicP945BMczKQk4C39fpFmtoALbhwnKL3sFZIf8n55_snPfmLlgYwxzHco0DLEj_QUM6odyMdwom9pPogxl7f4pdZO448qjd2hrxU0Kf9gYiaKFqhnGa9dbjFmzz6OG38MEYvVN2qP5x4cGNJCgIbnr67uhoLfOWiyTUx2RyQb0eg"
                />
              </div>
              <span className="absolute bottom-1 right-1 w-4 h-4 rounded-full bg-emerald-500 ring-2 ring-white" />
            </div>

            <div className="flex flex-col min-w-0">
              <div className="flex items-center gap-1.5">
                <span className="font-headline text-xl text-slate-900 truncate font-bold">
                  Sardar Baldev Singh
                </span>
                <Award className="w-5 h-5 text-emerald-600 flex-shrink-0" />
              </div>
              <span className="text-xs text-emerald-700 font-bold">Lead Farm Operator</span>
              <span className="text-xs text-slate-500 flex items-center gap-1 mt-0.5 truncate font-medium">
                <MapPin className="w-3.5 h-3.5 text-slate-400" />
                My Farm • Udaipur, Rajasthan
              </span>
            </div>
          </div>

          {/* Quick Operator Stats Pill Group */}
          <div className="grid grid-cols-3 gap-2 mt-5 pt-4 border-t border-slate-100 bg-slate-50/80 rounded-xl p-3">
            <div className="flex flex-col items-center justify-center text-center">
              <span className="font-headline text-[10px] uppercase font-bold text-slate-500">
                Total Land
              </span>
              <span className="font-headline text-base font-bold text-slate-900 mt-0.5">
                24.5 Acres
              </span>
            </div>

            <div className="flex flex-col items-center justify-center text-center border-x border-slate-200">
              <span className="font-headline text-[10px] uppercase font-bold text-slate-500">
                Active Nodes
              </span>
              <span className="font-headline text-base font-bold text-emerald-700 mt-0.5">
                {nodes.length} IoT Hubs
              </span>
            </div>

            <div className="flex flex-col items-center justify-center text-center">
              <span className="font-headline text-[10px] uppercase font-bold text-slate-500">
                Crop Health
              </span>
              <span className="font-headline text-base font-bold text-slate-900 mt-0.5">
                94% Index
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* 2. Farm Plots & Acreage Section */}
      <div className="px-4">
        <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-sm">
          <div className="flex items-center justify-between mb-3 pb-2 border-b border-slate-100">
            <div className="flex items-center gap-2">
              <Layers className="w-4 h-4 text-emerald-600" />
              <h2 className="font-headline text-sm font-bold text-slate-900">
                Monitored Farm Plots &amp; Crops
              </h2>
            </div>
            <span className="font-headline text-[11px] text-slate-500 font-semibold">3 Active Sectors</span>
          </div>

          <div className="space-y-3">
            {plots.map((plot) => (
              <div
                key={plot.id}
                className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/80 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
              >
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-headline text-sm font-bold text-slate-900">{plot.name}</span>
                    <span
                      className={`px-2 py-0.2 rounded-full font-headline text-[10px] font-bold uppercase ${
                        plot.status === 'Healthy'
                          ? 'bg-emerald-100 text-emerald-800'
                          : 'bg-amber-100 text-amber-800'
                      }`}
                    >
                      {plot.status}
                    </span>
                  </div>
                  <span className="text-xs text-slate-600 block mt-0.5">
                    {plot.crop} ({plot.variety}) • {plot.area}
                  </span>
                  <span className="text-[11px] text-slate-500 block">
                    Soil: {plot.soilType} • Sown: {plot.sowingDate}
                  </span>
                </div>

                <div className="flex items-center gap-3">
                  <div className="text-right">
                    <span className="text-[10px] text-slate-500 uppercase font-medium block">Health Score</span>
                    <span className="font-headline text-base font-bold text-slate-900 font-tabular">
                      {plot.healthScore}%
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* 3. Connected IoT Hardware Nodes */}
      <div className="px-4">
        <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-sm">
          <div className="flex items-center justify-between mb-3 pb-2 border-b border-slate-100">
            <div className="flex items-center gap-2">
              <Cpu className="w-4 h-4 text-emerald-600" />
              <h2 className="font-headline text-sm font-bold text-slate-900">
                Connected Hardware Nodes &amp; Gateways
              </h2>
            </div>
            <span className="font-headline text-[10px] text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full font-bold">
              LoRa &amp; 4G Mesh
            </span>
          </div>

          <div className="space-y-2.5">
            {nodes.map((node) => (
              <div
                key={node.id}
                className="p-3 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-between gap-2"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-8 h-8 rounded-lg bg-white border border-slate-200 flex items-center justify-center flex-shrink-0 text-emerald-600">
                    <Radio className="w-4 h-4" />
                  </div>
                  <div className="min-w-0">
                    <span className="font-headline text-xs font-bold text-slate-900 block truncate">
                      {node.name}
                    </span>
                    <span className="text-[11px] text-slate-500 truncate block">
                      {node.location} • {node.signal}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-2 flex-shrink-0">
                  <span className="font-headline text-[11px] text-slate-700 font-semibold">
                    {node.battery}%
                  </span>
                  <span className="w-2 h-2 rounded-full bg-emerald-500" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* 4. Firebase & Edge Cloud Configuration */}
      <div className="px-4">
        <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-sm">
          <div className="flex items-center justify-between mb-3 pb-2 border-b border-slate-100">
            <div className="flex items-center gap-2">
              <Database className="w-4 h-4 text-emerald-600" />
              <div>
                <h2 className="font-headline text-sm font-bold text-slate-900">
                  Firebase Realtime Telemetry Sync
                </h2>
                <span className="text-[11px] text-slate-500">
                  Connect live sensors and iilo image ingestion
                </span>
              </div>
            </div>
            <div
              className={`px-2.5 py-0.5 rounded-full font-headline text-[10px] font-bold uppercase ${
                firebaseConnected
                  ? 'bg-emerald-100 text-emerald-800'
                  : 'bg-slate-100 text-slate-600'
              }`}
            >
              {firebaseConnected ? 'Connected' : 'Demo / Standby'}
            </div>
          </div>

          <form onSubmit={handleSaveFirebase} className="space-y-3">
            <div>
              <label className="font-headline text-xs font-bold text-slate-700 block mb-1">
                Database URL (Realtime Database)
              </label>
              <input
                type="text"
                value={editConfig.databaseURL || ''}
                onChange={(e) => setEditConfig({ ...editConfig, databaseURL: e.target.value })}
                placeholder="https://your-project-default-rtdb.firebaseio.com"
                className="w-full h-10 px-3 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-800 font-mono focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="font-headline text-xs font-bold text-slate-700 block mb-1">
                  Project ID
                </label>
                <input
                  type="text"
                  value={editConfig.projectId || ''}
                  onChange={(e) => setEditConfig({ ...editConfig, projectId: e.target.value })}
                  placeholder="agroeye-smart-farm"
                  className="w-full h-10 px-3 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-800 font-mono focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="font-headline text-xs font-bold text-slate-700 block mb-1">
                  API Key
                </label>
                <input
                  type="password"
                  value={editConfig.apiKey || ''}
                  onChange={(e) => setEditConfig({ ...editConfig, apiKey: e.target.value })}
                  placeholder="AIzaSy..."
                  className="w-full h-10 px-3 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-800 font-mono focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                />
              </div>
            </div>

            {saveSuccess && (
              <div className="p-2.5 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-900 text-xs flex items-center gap-2">
                <Check className="w-4 h-4 text-emerald-600" />
                <span>Firebase credentials saved &amp; applied successfully.</span>
              </div>
            )}

            <div className="pt-2 flex items-center justify-between gap-2">
              <button
                type="submit"
                className="h-10 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-headline text-xs uppercase font-bold tracking-wider flex items-center gap-1.5 shadow-sm active:scale-95 transition-all"
              >
                <Save className="w-4 h-4" />
                <span>Save Credentials</span>
              </button>

              <button
                type="button"
                onClick={() => triggerManualAlert()}
                className="h-10 px-3 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-headline text-xs font-semibold flex items-center gap-1.5 active:scale-95 transition-all"
              >
                <Sparkles className="w-4 h-4 text-emerald-600" />
                <span>Test Ingest</span>
              </button>
            </div>
          </form>
        </div>
      </div>

      {/* 5. Language & Regional Preferences */}
      <div className="px-4">
        <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-sm">
          <div className="flex items-center gap-2 mb-3 pb-2 border-b border-slate-100">
            <Globe className="w-4 h-4 text-emerald-600" />
            <h2 className="font-headline text-sm font-bold text-slate-900">
              Language &amp; Regional Display
            </h2>
          </div>

          <div className="grid grid-cols-3 gap-2">
            {[
              { id: 'en', label: 'English', sub: 'Default' },
              { id: 'hi', label: 'हिन्दी', sub: 'Hindi' },
              { id: 'raj', label: 'राजस्थानी', sub: 'Mewari' },
            ].map((lang) => (
              <button
                key={lang.id}
                type="button"
                onClick={() => setSelectedLanguage(lang.id)}
                className={`p-2.5 rounded-xl border flex flex-col items-center justify-center transition-all ${
                  selectedLanguage === lang.id
                    ? 'bg-emerald-50 border-emerald-300 text-emerald-800 font-bold shadow-xs'
                    : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'
                }`}
              >
                <span className="font-headline text-xs">{lang.label}</span>
                <span className="text-[10px] text-slate-500">{lang.sub}</span>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
