'use client';

import React, { useEffect, useRef, useState } from 'react';
import {
  MapPin,
  Crosshair,
  Search,
  Layers,
  CheckCircle,
  AlertTriangle,
  Loader2,
  CloudRain,
} from 'lucide-react';
import { SpatialHazard, Language } from '../../types/weather';
import { searchLocation, reverseGeocode } from '../../services/weatherApi';
import { translations } from '../../i18n/translations';

interface FarmMapProps {
  lat: number;
  lng: number;
  locationName: string;
  onLocationSelect: (lat: number, lng: number, name: string) => void;
  isMarkingFarm: boolean;
  onToggleMarkingFarm: () => void;
  spatialHazards?: SpatialHazard[];
  lang: Language;
}

export const FarmMap: React.FC<FarmMapProps> = ({
  lat,
  lng,
  locationName,
  onLocationSelect,
  isMarkingFarm,
  onToggleMarkingFarm,
  spatialHazards = [],
  lang,
}) => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<any>(null);
  const markerRef = useRef<any>(null);
  const circleRef = useRef<any>(null);
  const hazardLayerGroupRef = useRef<any>(null);
  const tileLayerRef = useRef<any>(null);
  const radarTileLayerRef = useRef<any>(null);
  const LRef = useRef<any>(null);

  const [mapType, setMapType] = useState<'satellite' | 'street'>('satellite');
  const [isRadarActive, setIsRadarActive] = useState<boolean>(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<Array<{ name: string; lat: number; lng: number }>>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [isLocating, setIsLocating] = useState(false);
  const [saveSuccessMsg, setSaveSuccessMsg] = useState(false);
  const [isLeafletReady, setIsLeafletReady] = useState(false);

  const t = translations[lang];

  // Google Maps Tile layer URLs (Street and Satellite Hybrid)
  const satelliteUrl = 'https://mt1.google.com/vt/lyrs=y&x={x}&y={y}&z={z}';
  const streetUrl = 'https://mt1.google.com/vt/lyrs=m&x={x}&y={y}&z={z}';

  // Initialize Map dynamically on client
  useEffect(() => {
    if (typeof window === 'undefined') return;

    let isMounted = true;

    import('leaflet').then((leafletModule) => {
      if (!isMounted) return;
      const L = (leafletModule as any).default || leafletModule;
      LRef.current = L;
      setIsLeafletReady(true);

      if (!mapContainerRef.current) return;
      if (mapInstanceRef.current) return;

      const map = L.map(mapContainerRef.current, {
        center: [lat, lng],
        zoom: 13,
        zoomControl: true,
        attributionControl: false,
      });

      const tileLayer = L.tileLayer(mapType === 'satellite' ? satelliteUrl : streetUrl, {
        maxZoom: 20,
      }).addTo(map);

      tileLayerRef.current = tileLayer;

      // Iconic Google Maps Red Teardrop Pin
      const farmIcon = L.divIcon({
        className: 'google-maps-pin',
        html: `
          <div style="position: relative; width: 36px; height: 44px; display: flex; flex-direction: column; align-items: center; filter: drop-shadow(0 4px 8px rgba(0,0,0,0.5));">
            <svg width="36" height="44" viewBox="0 0 24 30" fill="none">
              <path d="M12 0C5.373 0 0 5.373 0 12c0 9 12 18 12 18s12-9 12-18c0-6.627-5.373-12-12-12z" fill="#ea4335"/>
              <circle cx="12" cy="11" r="5" fill="#ffffff"/>
              <circle cx="12" cy="11" r="2.5" fill="#c5221f"/>
            </svg>
          </div>
        `,
        iconSize: [36, 44],
        iconAnchor: [18, 42],
      });

      const marker = L.marker([lat, lng], { icon: farmIcon, draggable: true }).addTo(map);
      marker.bindPopup(`<b>${locationName}</b><br/>${t.farmPinLabel}`);
      markerRef.current = marker;

      marker.on('dragend', async () => {
        const pos = marker.getLatLng();
        const nLat = +pos.lat.toFixed(4);
        const nLng = +pos.lng.toFixed(4);
        const placeName = await reverseGeocode(nLat, nLng);
        onLocationSelect(nLat, nLng, placeName);
        setSaveSuccessMsg(true);
        setTimeout(() => setSaveSuccessMsg(false), 4000);
      });

      // Plot Boundary & Threat Buffer Circle
      const circle = L.circle([lat, lng], {
        color: '#059669',
        fillColor: '#10b981',
        fillOpacity: 0.12,
        weight: 2,
        dashArray: '4, 4',
        radius: 1200,
      }).addTo(map);
      circleRef.current = circle;

      // Hazard layer group
      const hazardGroup = L.layerGroup().addTo(map);
      hazardLayerGroupRef.current = hazardGroup;

      mapInstanceRef.current = map;

      // Auto resize fix
      setTimeout(() => map.invalidateSize(), 200);
    });

    return () => {
      isMounted = false;
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, []);

  // Update Tile Layer when toggled
  useEffect(() => {
    if (!mapInstanceRef.current || !tileLayerRef.current) return;
    tileLayerRef.current.setUrl(mapType === 'satellite' ? satelliteUrl : streetUrl);
  }, [mapType]);

  // Update Map Center & Marker when lat/lng change
  useEffect(() => {
    if (!mapInstanceRef.current) return;
    const map = mapInstanceRef.current;
    map.setView([lat, lng], 13);

    if (markerRef.current) {
      markerRef.current.setLatLng([lat, lng]);
      markerRef.current.setPopupContent(`<b>${locationName}</b><br/>${t.farmPinLabel}`);
    }
    if (circleRef.current) {
      circleRef.current.setLatLng([lat, lng]);
    }
  }, [lat, lng, locationName, t.farmPinLabel]);

  // Live RainViewer Precipitation Radar Overlay
  useEffect(() => {
    if (!mapInstanceRef.current || !LRef.current) return;
    const map = mapInstanceRef.current;
    const L = LRef.current;

    if (isRadarActive) {
      fetch('https://api.rainviewer.com/public/weather-maps.json')
        .then((r) => r.json())
        .then((data) => {
          if (data && data.radar && data.radar.past && data.radar.past.length > 0) {
            const latest = data.radar.past[data.radar.past.length - 1];
            const radarUrl = `${data.host}${latest.path}/256/{z}/{x}/{y}/2/1_1.png`;
            if (radarTileLayerRef.current) {
              map.removeLayer(radarTileLayerRef.current);
            }
            const radarLayer = L.tileLayer(radarUrl, { opacity: 0.72, zIndex: 25 }).addTo(map);
            radarTileLayerRef.current = radarLayer;
          }
        })
        .catch((e) => console.error('Failed to load radar tiles', e));
    } else {
      if (radarTileLayerRef.current) {
        map.removeLayer(radarTileLayerRef.current);
        radarTileLayerRef.current = null;
      }
    }
  }, [isRadarActive]);

  // Handle Map Click to Pin Location
  useEffect(() => {
    if (!mapInstanceRef.current) return;
    const map = mapInstanceRef.current;

    const handleClick = async (e: any) => {
      if (!isMarkingFarm) return;
      const clickedLat = +e.latlng.lat.toFixed(4);
      const clickedLng = +e.latlng.lng.toFixed(4);

      const placeName = await reverseGeocode(clickedLat, clickedLng);
      onLocationSelect(clickedLat, clickedLng, placeName);
      setSaveSuccessMsg(true);
      setTimeout(() => setSaveSuccessMsg(false), 4000);
      onToggleMarkingFarm();
    };

    map.on('click', handleClick);
    return () => {
      map.off('click', handleClick);
    };
  }, [isMarkingFarm, onLocationSelect, onToggleMarkingFarm]);

  // Render Spatial Calamity Hazards on Map
  useEffect(() => {
    if (!mapInstanceRef.current || !hazardLayerGroupRef.current || !LRef.current) return;
    const hazardGroup = hazardLayerGroupRef.current;
    const L = LRef.current;
    hazardGroup.clearLayers();

    spatialHazards.forEach((hazard) => {
      const isCritical = hazard.severity === 'Critical';
      const isHigh = hazard.severity === 'High';
      const bgColor = isCritical ? '#e11d48' : isHigh ? '#d97706' : '#0284c7';

      const hazardIcon = L.divIcon({
        className: 'custom-hazard-marker',
        html: `
          <div style="display: flex; flex-direction: column; align-items: center; cursor: pointer;">
            <div style="background-color: ${bgColor}; color: #ffffff; padding: 3px 8px; border-radius: 9999px; font-size: 10px; font-weight: 800; text-transform: uppercase; box-shadow: 0 4px 6px rgba(0,0,0,0.3); border: 1.5px solid #ffffff; display: flex; align-items: center; gap: 3px; white-space: nowrap;">
              <span>${hazard.emoji}</span>
              <span>${hazard.title}</span>
            </div>
            <div style="width: 2px; height: 10px; background-color: ${bgColor};"></div>
            <div style="width: 8px; height: 8px; border-radius: 9999px; background-color: ${bgColor}; border: 2px solid #ffffff;"></div>
          </div>
        `,
        iconSize: [120, 40],
        iconAnchor: [60, 38],
      });

      const hazardMarker = L.marker([hazard.lat, hazard.lng], { icon: hazardIcon });
      hazardMarker.bindPopup(`
        <div style="font-family: system-ui, sans-serif; min-width: 180px;">
          <div style="display: flex; align-items: center; gap: 6px; font-weight: bold; color: ${bgColor}; font-size: 13px;">
            <span>${hazard.emoji}</span> <span>${hazard.title}</span>
          </div>
          <div style="font-size: 11px; color: #475569; margin-top: 4px;">
            <b>${hazard.distanceKm} km ${hazard.direction}</b> of your farm
          </div>
          <div style="font-size: 11px; margin-top: 4px; color: #0f172a;">
            ${hazard.description}
          </div>
          <div style="margin-top: 6px; font-size: 10px; background-color: #f1f5f9; padding: 4px 6px; border-radius: 6px; border: 1px solid #cbd5e1;">
            <b>Precaution:</b> ${hazard.precaution}
          </div>
        </div>
      `);
      hazardGroup.addLayer(hazardMarker);
    });
  }, [spatialHazards, isLeafletReady]);

  // Handle Search Execution
  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;
    setIsSearching(true);
    const results = await searchLocation(searchQuery);
    setSearchResults(results);
    setIsSearching(false);
  };

  const handleSelectSearchResult = (result: { name: string; lat: number; lng: number }) => {
    onLocationSelect(result.lat, result.lng, result.name.split(',').slice(0, 2).join(','));
    setSearchResults([]);
    setSearchQuery('');
    setSaveSuccessMsg(true);
    setTimeout(() => setSaveSuccessMsg(false), 4000);
  };

  // Handle Locate My Farm (GPS)
  const handleLocateMe = () => {
    if (!navigator.geolocation) {
      alert('Geolocation is not supported by your browser.');
      return;
    }
    setIsLocating(true);
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const curLat = +pos.coords.latitude.toFixed(4);
        const curLng = +pos.coords.longitude.toFixed(4);
        const placeName = await reverseGeocode(curLat, curLng);
        onLocationSelect(curLat, curLng, placeName);
        setIsLocating(false);
        setSaveSuccessMsg(true);
        setTimeout(() => setSaveSuccessMsg(false), 4000);
      },
      (err) => {
        console.error('Geolocation error:', err);
        setIsLocating(false);
        alert('Could not retrieve GPS coordinates. Please select manually on the map.');
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  return (
    <div className="bg-slate-950 rounded-2xl border border-slate-200 overflow-hidden shadow-md flex flex-col transition-all">
      {/* Map Control Bar */}
      <div className="p-3 bg-slate-900 border-b border-slate-800 flex flex-wrap items-center justify-between gap-2.5 z-20">
        <div className="flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-ping" />
          <span className="font-headline text-xs font-bold text-white uppercase tracking-wider">
            🗺️ {t.mapTitle}
          </span>
        </div>

        {/* Action Controls: Layer toggle, GPS Locate, Mark Pin */}
        <div className="flex items-center gap-2 flex-wrap">
          {/* Satellite vs Street Map Switcher */}
          <button
            type="button"
            onClick={() => setMapType(mapType === 'satellite' ? 'street' : 'satellite')}
            className="h-8 px-2.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-headline font-semibold flex items-center gap-1.5 transition-all border border-slate-700"
            title="Toggle Map Imagery"
          >
            <Layers className="w-3.5 h-3.5 text-emerald-400" />
            <span>{mapType === 'satellite' ? t.satelliteLayer : t.streetLayer}</span>
          </button>

          {/* Live Radar Overlay Button */}
          <button
            type="button"
            onClick={() => setIsRadarActive(!isRadarActive)}
            className={`h-8 px-2.5 rounded-lg text-xs font-headline font-semibold flex items-center gap-1.5 transition-all border ${
              isRadarActive
                ? 'bg-sky-600 text-white border-sky-400 ring-2 ring-sky-300'
                : 'bg-slate-800 hover:bg-slate-700 text-slate-200 border-slate-700'
            }`}
            title="Toggle Live Precipitation Doppler Radar"
          >
            <CloudRain className={`w-3.5 h-3.5 ${isRadarActive ? 'text-white animate-bounce' : 'text-sky-400'}`} />
            <span>{t.radarOverlay}</span>
            {isRadarActive && <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />}
          </button>

          {/* GPS Locate Me Button */}
          <button
            type="button"
            onClick={handleLocateMe}
            disabled={isLocating}
            className="h-8 px-3 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-100 text-xs font-headline font-bold flex items-center gap-1.5 transition-all border border-slate-700 shadow-sm"
            title={t.locateMe}
          >
            {isLocating ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin text-emerald-400" />
            ) : (
              <Crosshair className="w-3.5 h-3.5 text-emerald-400" />
            )}
            <span>{t.locateMe}</span>
          </button>

          {/* Mark Your Farm Pin Mode */}
          <button
            type="button"
            onClick={onToggleMarkingFarm}
            className={`h-8 px-3 rounded-lg font-headline text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 transition-all shadow-sm ${
              isMarkingFarm
                ? 'bg-amber-500 hover:bg-amber-600 text-slate-950 ring-2 ring-amber-300 animate-pulse'
                : 'bg-emerald-600 hover:bg-emerald-700 text-white'
            }`}
          >
            <MapPin className="w-3.5 h-3.5" />
            <span>{isMarkingFarm ? t.tapToSave : t.markFarm}</span>
          </button>
        </div>
      </div>

      {/* Geocoding Search Bar Overlay */}
      <div className="relative p-2.5 bg-slate-900/90 border-b border-slate-800 flex items-center gap-2">
        <form onSubmit={handleSearch} className="flex-1 flex items-center gap-2">
          <div className="relative flex-1">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={t.searchPlaceholder}
              className="w-full h-9 pl-9 pr-3 rounded-xl bg-slate-800 border border-slate-700 text-slate-100 placeholder-slate-400 text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500 font-headline"
            />
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          </div>
          <button
            type="submit"
            disabled={isSearching}
            className="h-9 px-3.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-headline font-bold flex items-center gap-1.5 transition-all flex-shrink-0"
          >
            {isSearching ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : null}
            <span>{isSearching ? t.searching : t.searchBtn}</span>
          </button>
        </form>

        {/* Autocomplete Search Results Dropdown */}
        {searchResults.length > 0 && (
          <div className="absolute top-full left-2 right-2 mt-1 bg-white rounded-xl shadow-2xl border border-slate-200 z-50 overflow-hidden divide-y divide-slate-100 max-h-60 overflow-y-auto">
            {searchResults.map((res, i) => (
              <button
                key={i}
                type="button"
                onClick={() => handleSelectSearchResult(res)}
                className="w-full text-left p-2.5 hover:bg-emerald-50 flex items-center gap-2 text-xs font-headline text-slate-800 transition-colors"
              >
                <MapPin className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                <span className="truncate">{res.name}</span>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Farm Saved Confirmation Toast */}
      {saveSuccessMsg && (
        <div className="p-2.5 bg-emerald-600 text-white flex items-center justify-between text-xs font-headline font-bold px-4 transition-all">
          <div className="flex items-center gap-2">
            <CheckCircle className="w-4 h-4" />
            <span>{t.farmSavedMsg}</span>
          </div>
          <button onClick={() => setSaveSuccessMsg(false)} className="text-white/80 hover:text-white">
            ✕
          </button>
        </div>
      )}

      {/* Map Active Notice when Marking */}
      {isMarkingFarm && (
        <div className="bg-amber-400 text-slate-950 px-4 py-2 text-xs font-headline font-bold flex items-center justify-center gap-2 animate-pulse">
          <AlertTriangle className="w-4 h-4" />
          <span>📍 {t.tapToSave}</span>
        </div>
      )}

      {/* The Leaflet Canvas */}
      <div
        ref={mapContainerRef}
        className="w-full h-80 sm:h-96 md:h-[420px] bg-slate-900 relative"
      />
    </div>
  );
};
