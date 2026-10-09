'use client';

import React, { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import {
  Map as MapIcon,
  Layers,
  MapPin,
  Calendar,
  Compass,
  CheckCircle2,
  Sparkles,
} from 'lucide-react';
import {
  StateRegionData,
  FarmLocation,
  Language,
  PredictionResult,
  CityMonsoonData,
} from '@/types/monsoon';
import { REGIONAL_MONSOON_DATA } from '@/data/historicMonsoonData';
import { CITIES_MONSOON_DATA } from '@/data/cityMonsoonData';
import { translations } from '@/i18n/monsoonTranslations';
import { estimateStateArrival, estimateCityArrival } from '@/utils/monsoonPredictor';

// Fix default Leaflet icon paths
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

interface MonsoonProgressionMapProps {
  currentPlot: FarmLocation;
  selectedState: StateRegionData;
  onSelectState: (state: StateRegionData) => void;
  selectedCity?: CityMonsoonData;
  onSelectCity?: (city: CityMonsoonData) => void;
  prediction: PredictionResult;
  lang: Language;
}

// Isochrone lines approximating IMD advance lines across India
const ISOCHRONE_LINES = [
  {
    date: '25 May',
    coords: [
      [7.5, 93.5], // Nicobar
      [10.0, 92.5], // Andaman Sea
      [12.0, 94.0],
      [14.0, 96.0],
    ],
    color: '#0d9488',
  },
  {
    date: '01 June (Kerala)',
    coords: [
      [8.5, 76.5], // Trivandrum
      [11.5, 78.5], // TN
      [14.0, 83.0], // Bay of Bengal
      [17.0, 87.0],
      [21.0, 91.0], // NE entry
      [24.5, 92.5], // Assam
    ],
    color: '#059669',
  },
  {
    date: '05 June',
    coords: [
      [13.0, 74.8], // Mangalore
      [14.5, 76.5],
      [16.0, 81.0], // Coastal AP
      [19.0, 85.0],
      [24.0, 89.0],
      [26.5, 92.0], // Brahmaputra valley
    ],
    color: '#10b981',
  },
  {
    date: '10 June (Mumbai/Bengal)',
    coords: [
      [17.5, 73.0], // Ratnagiri
      [19.0, 75.0], // Marathwada
      [20.5, 80.0], // Vidarbha
      [22.0, 85.0], // Odisha/Jharkhand
      [23.5, 88.5], // Kolkata
    ],
    color: '#3b82f6',
  },
  {
    date: '15 June (Gujarat/Central)',
    coords: [
      [21.0, 72.5], // Surat
      [22.5, 76.0], // MP
      [24.0, 80.0],
      [25.5, 84.5], // Bihar
      [27.0, 88.0],
    ],
    color: '#6366f1',
  },
  {
    date: '25 June - 01 July',
    coords: [
      [23.5, 69.5], // Kutch
      [25.0, 73.0], // East Rajasthan
      [27.5, 76.5], // Haryana / Delhi
      [29.5, 78.5], // Uttarakhand
    ],
    color: '#f59e0b',
  },
  {
    date: '08 July (Far West)',
    coords: [
      [26.5, 70.5], // Jaisalmer
      [29.0, 73.5], // Bikaner
      [31.5, 75.5], // Punjab
      [33.0, 76.0], // J&K
    ],
    color: '#ef4444',
  },
];

export const MonsoonProgressionMap: React.FC<MonsoonProgressionMapProps> = ({
  currentPlot,
  selectedState,
  onSelectState,
  selectedCity,
  onSelectCity,
  prediction,
  lang,
}) => {
  const t = translations[lang];
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const layerGroupRef = useRef<L.LayerGroup | null>(null);
  const [mapLayer, setMapLayer] = useState<'street' | 'satellite'>('street');

  // Initialize Map
  useEffect(() => {
    if (!mapContainerRef.current) return;

    if (!mapInstanceRef.current) {
      const map = L.map(mapContainerRef.current, {
        center: [22.5, 79.0],
        zoom: 4.8,
        minZoom: 4,
        maxZoom: 16,
        zoomControl: true,
      });

      mapInstanceRef.current = map;
      layerGroupRef.current = L.layerGroup().addTo(map);
    }

    const map = mapInstanceRef.current;
    if (!map) return;

    // Remove existing tile layers
    map.eachLayer((layer) => {
      if (layer instanceof L.TileLayer) {
        map.removeLayer(layer);
      }
    });

    // Add 100% Free OpenStreetMap & Esri Satellite Layers (Zero API Key required)
    if (mapLayer === 'street') {
      L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
        maxZoom: 19,
      }).addTo(map);
    } else {
      L.tileLayer(
        'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
        {
          attribution: '&copy; Esri & Earthstar Geographics',
          maxZoom: 19,
        }
      ).addTo(map);
    }
  }, [mapLayer]);

  // Pan to selected city when changed
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map || !selectedCity) return;
    map.flyTo([selectedCity.lat, selectedCity.lng], 7, {
      duration: 1.2,
    });
  }, [selectedCity]);

  // Update Map Layers, Isochrones & Markers
  useEffect(() => {
    const map = mapInstanceRef.current;
    const group = layerGroupRef.current;
    if (!map || !group) return;

    group.clearLayers();

    // 1. Draw Isochrone Advance Polylines
    ISOCHRONE_LINES.forEach((line) => {
      const poly = L.polyline(line.coords as [number, number][], {
        color: line.color,
        weight: 3,
        dashArray: '5, 6',
        opacity: 0.85,
      }).addTo(group);

      poly.bindTooltip(
        `<div class="font-headline font-bold text-xs px-2 py-1 bg-white text-slate-900 rounded shadow-md border border-slate-200">
          <strong>📅 ${line.date}</strong><br/>
          <span class="text-[10px] text-slate-500">Normal Advance Isochrone</span>
        </div>`,
        { sticky: true, opacity: 0.95 }
      );
    });

    // 2. Add Regional State Markers
    REGIONAL_MONSOON_DATA.forEach((state) => {
      const isSelected = selectedState.id === state.id;
      const stateEstimate = estimateStateArrival(state, prediction.estimatedDayOfYear, prediction.targetYear);

      const stateIcon = L.divIcon({
        className: 'custom-state-pin',
        html: `
          <div class="flex items-center gap-1 px-2 py-1 rounded-full text-[11px] font-headline font-bold shadow-md cursor-pointer transition-transform hover:scale-110 ${
            isSelected
              ? 'bg-emerald-600 text-white ring-4 ring-emerald-200'
              : 'bg-white/95 text-slate-800 border border-slate-300/80 hover:bg-slate-50'
          }">
            <span class="w-2 h-2 rounded-full ${isSelected ? 'bg-white' : 'bg-emerald-600'}"></span>
            <span class="truncate max-w-[80px]">${lang === 'hi' ? state.nameHi.split(' ')[0] : state.name.split(' ')[0]}</span>
          </div>
        `,
        iconSize: [90, 26],
        iconAnchor: [45, 13],
      });

      const marker = L.marker(state.coordinates, { icon: stateIcon }).addTo(group);
      marker.on('click', () => {
        onSelectState(state);
      });

      marker.bindPopup(`
        <div class="p-1 font-headline">
          <div class="font-bold text-sm text-slate-900 border-b pb-1">
            ${lang === 'hi' ? state.nameHi : state.name}
          </div>
          <div class="mt-2 space-y-1 text-xs text-slate-700">
            <div><strong>${t.normalStateArrival}</strong> ${state.normalOnsetDate}</div>
            <div><strong>${t.estimatedStateArrival}</strong> <span class="text-emerald-700 font-bold">${stateEstimate.estimatedDate}</span></div>
            <div><strong>${t.optimumSowingWindow}:</strong> ${lang === 'hi' ? state.sowingWindowHi : state.sowingWindow}</div>
          </div>
        </div>
      `);
    });

    // 3. Add Major Agricultural Cities as Clickable Pins
    CITIES_MONSOON_DATA.forEach((city) => {
      const isCitySelected = selectedCity && selectedCity.id === city.id;
      const cityEstimate = estimateCityArrival(city, prediction.estimatedDayOfYear, prediction.targetYear);

      const cityIcon = L.divIcon({
        className: 'custom-city-pin',
        html: `
          <div class="flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-headline font-extrabold shadow-sm cursor-pointer transition-all hover:scale-115 ${
            isCitySelected
              ? 'bg-amber-500 text-white ring-4 ring-amber-200 scale-110'
              : 'bg-slate-900/85 text-white hover:bg-slate-900'
          }">
            <span>📍</span>
            <span class="truncate max-w-[65px]">${lang === 'hi' ? city.nameHi : city.name}</span>
          </div>
        `,
        iconSize: [80, 22],
        iconAnchor: [40, 11],
      });

      const cityMarker = L.marker([city.lat, city.lng], { icon: cityIcon, zIndexOffset: isCitySelected ? 1200 : 500 }).addTo(group);
      
      cityMarker.on('click', () => {
        if (onSelectCity) onSelectCity(city);
        const matchedState = REGIONAL_MONSOON_DATA.find((s) => s.id === city.stateId);
        if (matchedState) onSelectState(matchedState);
      });

      cityMarker.bindPopup(`
        <div class="p-1 font-headline">
          <div class="font-bold text-sm text-slate-900 border-b pb-1">
            📍 ${lang === 'hi' ? city.nameHi : city.name} (${lang === 'hi' ? city.stateNameHi : city.stateName})
          </div>
          <div class="mt-2 space-y-1 text-xs text-slate-700">
            <div><strong>Normal Onset:</strong> ${city.normalOnsetDate}</div>
            <div><strong>${prediction.targetYear} Estimated:</strong> <span class="text-amber-700 font-bold">${cityEstimate.estimatedDate}</span></div>
            <div><strong>Sowing Window:</strong> ${lang === 'hi' ? city.sowingWindowHi : city.sowingWindow}</div>
            <div><strong>Key Crops:</strong> ${(lang === 'hi' ? city.primaryCropsHi : city.primaryCrops).join(', ')}</div>
          </div>
        </div>
      `);
    });

    // 4. Add Active Farm Plot Marker
    const farmIcon = L.divIcon({
      className: 'custom-farm-pin',
      html: `
        <div class="relative flex items-center justify-center">
          <span class="absolute w-8 h-8 rounded-full bg-emerald-500/40 animate-ping"></span>
          <div class="w-7 h-7 rounded-full bg-slate-900 text-white border-2 border-emerald-400 flex items-center justify-center font-bold text-xs shadow-xl">
            🌱
          </div>
        </div>
      `,
      iconSize: [28, 28],
      iconAnchor: [14, 14],
    });

    const farmMarker = L.marker([currentPlot.lat, currentPlot.lng], {
      icon: farmIcon,
      zIndexOffset: 1500,
    }).addTo(group);

    farmMarker.bindPopup(`
      <div class="p-1 font-headline">
        <div class="font-bold text-xs text-emerald-800 uppercase">${t.farmLocationPin}</div>
        <div class="font-bold text-sm text-slate-900 mt-0.5">${currentPlot.name}</div>
        <div class="text-[11px] text-slate-500 mt-1">${currentPlot.crop || 'Field'} • ${currentPlot.areaAcres || 5} Acres</div>
      </div>
    `);
  }, [selectedState, selectedCity, currentPlot, mapLayer, prediction, lang, onSelectState, onSelectCity, t]);

  const activeStateEstimate = estimateStateArrival(selectedState, prediction.estimatedDayOfYear, prediction.targetYear);

  return (
    <section className="bg-white rounded-3xl border border-slate-200/90 shadow-sm p-5 sm:p-6 space-y-4">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 pb-3 border-b border-slate-100">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-1 rounded-lg bg-emerald-100 text-emerald-700">
              <Compass className="w-4 h-4" />
            </span>
            <h2 className="text-lg sm:text-xl font-headline font-extrabold text-slate-900 tracking-tight">
              {t.mapSectionTitle}
            </h2>
          </div>
          <p className="text-xs text-slate-500 mt-0.5 font-medium">
            {t.mapSectionSub}
          </p>
        </div>

        {/* Map Layer Switcher */}
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setMapLayer(mapLayer === 'street' ? 'satellite' : 'street')}
            className="px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-headline font-bold flex items-center gap-1.5 transition-all cursor-pointer border border-slate-200"
          >
            <Layers className="w-3.5 h-3.5 text-emerald-600" />
            <span>{mapLayer === 'street' ? 'Satellite View' : 'Street Map View'}</span>
          </button>
        </div>
      </div>

      {/* Map + Side State Quick Inspection Card */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        {/* Leaflet Map Box (8 Cols) */}
        <div className="lg:col-span-8 rounded-2xl overflow-hidden border border-slate-200 shadow-inner h-[380px] sm:h-[440px] relative">
          <div ref={mapContainerRef} className="w-full h-full" />

          {/* Floating Map Legend Overlay */}
          <div className="absolute bottom-3 left-3 z-[1000] bg-white/95 backdrop-blur-md p-2.5 rounded-xl border border-slate-200/80 shadow-md text-[11px] font-headline max-w-xs hidden sm:block">
            <span className="font-bold text-slate-800 block mb-1">
              {t.isochroneLegend}
            </span>
            <div className="grid grid-cols-2 gap-x-3 gap-y-1 text-slate-600">
              <span className="flex items-center gap-1.5">
                <span className="w-2.5 h-1 rounded bg-[#059669]" />
                01 June (Kerala)
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-2.5 h-1 rounded bg-[#10b981]" />
                05 June (Goa/South)
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-2.5 h-1 rounded bg-[#3b82f6]" />
                10 June (Mumbai/WB)
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-2.5 h-1 rounded bg-[#6366f1]" />
                15 June (Central/Gujarat)
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-2.5 h-1 rounded bg-[#f59e0b]" />
                01 July (Delhi/North)
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-2.5 h-1 rounded bg-[#ef4444]" />
                08 July (West Thar)
              </span>
            </div>
          </div>
        </div>

        {/* Selected State / City Insight Panel (4 Cols) */}
        <div className="lg:col-span-4 bg-slate-50 p-4 rounded-2xl border border-slate-200 flex flex-col justify-between space-y-3">
          <div>
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-headline font-bold uppercase tracking-wider text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded-full">
                {selectedState.region} India Hub
              </span>
              <span className="text-xs font-mono font-bold text-slate-500">
                {prediction.targetYear} Outlook
              </span>
            </div>

            <h3 className="text-xl font-headline font-extrabold text-slate-900 mt-2">
              {lang === 'hi' ? selectedState.nameHi : selectedState.name}
            </h3>

            <div className="mt-3 grid grid-cols-2 gap-2 text-xs">
              <div className="p-2.5 bg-white rounded-xl border border-slate-200">
                <span className="text-[10px] text-slate-400 font-bold block">{t.stateNormalDate}</span>
                <span className="font-headline font-extrabold text-slate-900 text-sm">{selectedState.normalOnsetDate}</span>
              </div>
              <div className="p-2.5 bg-emerald-50 rounded-xl border border-emerald-200">
                <span className="text-[10px] text-emerald-700 font-bold block">{t.estimatedStateArrival}</span>
                <span className="font-headline font-extrabold text-emerald-800 text-sm">{activeStateEstimate.estimatedDate}</span>
              </div>
            </div>

            <div className="mt-3 text-xs space-y-2">
              <div className="flex items-center justify-between text-slate-600">
                <span>{t.optimumSowingWindow}:</span>
                <strong className="text-slate-900 font-mono">{lang === 'hi' ? selectedState.sowingWindowHi : selectedState.sowingWindow}</strong>
              </div>
              <div className="flex items-center justify-between text-slate-600">
                <span>{t.stateAvgArrival}:</span>
                <strong className="text-slate-900 font-mono">{selectedState.avgHistoricOnset}</strong>
              </div>
            </div>

            <div className="mt-3 p-3 bg-white rounded-xl border border-slate-200 text-xs text-slate-700">
              <span className="font-headline font-bold text-slate-900 block mb-1">
                🌱 {lang === 'hi' ? selectedState.nameHi : selectedState.name} {t.majorKharifCrops}:
              </span>
              <div className="flex flex-wrap gap-1 mt-1">
                {(lang === 'hi' ? selectedState.kharifCropsHi : selectedState.kharifCrops).map((crop, idx) => (
                  <span key={idx} className="px-2 py-0.5 bg-emerald-50 text-emerald-800 rounded-md font-mono text-[10px] font-bold border border-emerald-200/60">
                    {crop}
                  </span>
                ))}
              </div>
            </div>
          </div>

          <p className="text-[11px] text-slate-500 italic">
            {t.selectStateOnMap}
          </p>
        </div>
      </div>
    </section>
  );
};
