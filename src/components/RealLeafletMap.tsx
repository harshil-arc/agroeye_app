'use client';

import React, { useEffect, useRef, useState } from 'react';
import {
  Layers,
  MapPin,
  Navigation,
  ZoomIn,
  ZoomOut,
  Eye,
  Compass,
  RefreshCw,
  AlertTriangle,
  ShieldAlert,
  ShieldCheck,
  Droplets,
  Wind,
  Thermometer,
  CloudRain,
  Sun,
  Flame,
  Waves,
  Sparkles,
  Info,
  ChevronRight,
  Radio,
  Crosshair,
  Check,
  Search,
} from 'lucide-react';
import { LiveWeatherResult, SpatialHazard } from '@/lib/realWeatherApi';

export interface NearbyRegionInfo {
  id: string;
  name: string;
  sub: string;
  lat: number;
  lng: number;
  crop: string;
  soil: string;
  riskLabel?: string;
  severity?: 'Critical' | 'High' | 'Medium' | 'Low' | 'Safe';
}

interface RealLeafletMapProps {
  lat: number;
  lng: number;
  locationName: string;
  onLocationSelect: (lat: number, lng: number, placeName?: string) => void;
  isMarkingFarm?: boolean;
  onToggleMarkFarm?: (active: boolean) => void;
  weatherData?: LiveWeatherResult | null;
  nearbyRegions?: NearbyRegionInfo[];
}

export default function RealLeafletMap({
  lat,
  lng,
  locationName,
  onLocationSelect,
  isMarkingFarm = false,
  onToggleMarkFarm,
  weatherData,
  nearbyRegions = [],
}: RealLeafletMapProps) {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<any>(null);
  const farmMarkerRef = useRef<any>(null);
  const spatialHazardGroupRef = useRef<any>(null);
  const nearbyMarkersGroupRef = useRef<any>(null);
  const radarTileLayerRef = useRef<any>(null);
  const tileLayerRef = useRef<any>(null);
  const hazardLinesGroupRef = useRef<any>(null);

  const [mapLayer, setMapLayer] = useState<'satellite' | 'streets' | 'terrain'>('satellite');
  const [showLiveRadar, setShowLiveRadar] = useState<boolean>(true);
  const [isLocating, setIsLocating] = useState<boolean>(false);
  const [activeHazardPopup, setActiveHazardPopup] = useState<SpatialHazard | null>(null);
  const [searchLocationQuery, setSearchLocationQuery] = useState<string>('');
  const [isSearching, setIsSearching] = useState<boolean>(false);

  // Initialize Leaflet Map
  useEffect(() => {
    let isMounted = true;

    const initMap = async () => {
      if (typeof window === 'undefined' || !mapContainerRef.current) return;

      const L = (await import('leaflet')).default;

      // Ensure Leaflet CSS
      if (!document.getElementById('leaflet-css')) {
        const link = document.createElement('link');
        link.id = 'leaflet-css';
        link.rel = 'stylesheet';
        link.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
        document.head.appendChild(link);
      }

      // Cleanup existing map
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }

      if (!isMounted || !mapContainerRef.current) return;

      const map = L.map(mapContainerRef.current, {
        center: [lat, lng],
        zoom: 12,
        zoomControl: false,
      });

      // 1. Satellite Base Layer (Esri World Imagery)
      const satelliteTile = L.tileLayer(
        'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
        {
          attribution: 'Tiles &copy; Esri &mdash; High-Res Satellite GIS Imagery',
          maxZoom: 18,
        }
      );
      satelliteTile.addTo(map);
      tileLayerRef.current = satelliteTile;

      // 2. Real-Time RainViewer Radar Tile Layer
      try {
        fetch('https://api.rainviewer.com/public/weather-maps.json')
          .then((res) => res.json())
          .then((radarData) => {
            if (!isMounted || !mapInstanceRef.current) return;
            const pastFrames = radarData?.radar?.past;
            if (pastFrames && pastFrames.length > 0) {
              const latestPath = pastFrames[pastFrames.length - 1].path;
              const radarTile = L.tileLayer(
                `https://tilecache.rainviewer.com${latestPath}/256/{z}/{x}/{y}/2/1_1.png`,
                {
                  opacity: 0.65,
                  maxZoom: 18,
                  zIndex: 400,
                  attribution: 'Live Radar &copy; RainViewer',
                }
              );
              radarTile.addTo(map);
              radarTileLayerRef.current = radarTile;
            }
          })
          .catch((err) => console.log('Radar tile load fallback:', err));
      } catch (err) {
        // radar optional
      }

      // 3. YOUR FARM Landmark Pin
      const farmIcon = L.divIcon({
        className: 'custom-farm-pin',
        html: `
          <div style="position: relative; display: flex; flex-direction: column; align-items: center; transform: translate(-50%, -100%);">
            <div style="background: linear-gradient(135deg, #059669, #047857); color: white; padding: 5px 12px; border-radius: 9999px; font-weight: 800; font-size: 11px; font-family: system-ui, sans-serif; white-space: nowrap; box-shadow: 0 4px 16px rgba(0,0,0,0.6); border: 2.5px solid #ffffff; display: flex; align-items: center; gap: 5px; text-transform: uppercase; letter-spacing: 0.5px;">
              <span style="font-size: 13px;">📍</span>
              <span>YOUR FARM</span>
              <span style="background: rgba(255,255,255,0.25); padding: 1px 5px; border-radius: 4px; font-size: 10px;">${weatherData?.current?.temperature ? Math.round(weatherData.current.temperature) + '°C' : ''}</span>
            </div>
            <div style="width: 18px; height: 18px; background: #059669; border: 3px solid #ffffff; border-radius: 50%; box-shadow: 0 2px 10px rgba(0,0,0,0.7); margin-top: 3px;"></div>
          </div>
        `,
        iconSize: [160, 50],
        iconAnchor: [80, 50],
      });

      const marker = L.marker([lat, lng], { icon: farmIcon, draggable: true }).addTo(map);
      farmMarkerRef.current = marker;

      // Handle marker drag
      marker.on('dragend', async () => {
        const position = marker.getLatLng();
        const newLat = +position.lat.toFixed(4);
        const newLng = +position.lng.toFixed(4);
        resolveReverseGeocode(newLat, newLng);
      });

      // 4. Layer groups for spatial hazards and lines
      const hazardLinesGroup = L.layerGroup().addTo(map);
      hazardLinesGroupRef.current = hazardLinesGroup;

      const spatialGroup = L.layerGroup().addTo(map);
      spatialHazardGroupRef.current = spatialGroup;

      const nearbyGroup = L.layerGroup().addTo(map);
      nearbyMarkersGroupRef.current = nearbyGroup;

      // Map Click Event: Relocate farm pin
      map.on('click', async (e: any) => {
        const newLat = +e.latlng.lat.toFixed(4);
        const newLng = +e.latlng.lng.toFixed(4);
        marker.setLatLng([newLat, newLng]);
        resolveReverseGeocode(newLat, newLng);
      });

      const resolveReverseGeocode = async (newLat: number, newLng: number) => {
        let placeName = `Field Coordinates (${newLat}°N, ${newLng}°E)`;
        try {
          const geoRes = await fetch(
            `https://nominatim.openstreetmap.org/reverse?lat=${newLat}&lon=${newLng}&format=json`
          );
          if (geoRes.ok) {
            const geoData = await geoRes.json();
            if (geoData && geoData.display_name) {
              const parts = geoData.display_name.split(',');
              placeName = `${parts[0] || 'Farm Field'}, ${parts[1] || 'Rajasthan'}`;
            }
          }
        } catch {
          // fallback
        }
        onLocationSelect(newLat, newLng, placeName);
      };

      mapInstanceRef.current = map;
    };

    initMap();

    return () => {
      isMounted = false;
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, []);

  // Update center & farm pin when lat/lng changes
  useEffect(() => {
    if (!mapInstanceRef.current) return;
    const map = mapInstanceRef.current;
    const L = (window as any).L;

    map.setView([lat, lng], map.getZoom() || 12, { animate: true });

    if (farmMarkerRef.current) {
      farmMarkerRef.current.setLatLng([lat, lng]);
      if (L) {
        const newIcon = L.divIcon({
          className: 'custom-farm-pin',
          html: `
            <div style="position: relative; display: flex; flex-direction: column; align-items: center; transform: translate(-50%, -100%);">
              <div style="background: linear-gradient(135deg, #059669, #047857); color: white; padding: 5px 12px; border-radius: 9999px; font-weight: 800; font-size: 11px; font-family: system-ui, sans-serif; white-space: nowrap; box-shadow: 0 4px 16px rgba(0,0,0,0.6); border: 2.5px solid #ffffff; display: flex; align-items: center; gap: 5px; text-transform: uppercase; letter-spacing: 0.5px;">
                <span style="font-size: 13px;">📍</span>
                <span>YOUR FARM</span>
                <span style="background: rgba(255,255,255,0.25); padding: 1px 5px; border-radius: 4px; font-size: 10px;">${weatherData?.current?.temperature ? Math.round(weatherData.current.temperature) + '°C' : ''}</span>
              </div>
              <div style="width: 18px; height: 18px; background: #059669; border: 3px solid #ffffff; border-radius: 50%; box-shadow: 0 2px 10px rgba(0,0,0,0.7); margin-top: 3px;"></div>
            </div>
          `,
          iconSize: [160, 50],
          iconAnchor: [80, 50],
        });
        farmMarkerRef.current.setIcon(newIcon);
      }
    }
  }, [lat, lng, locationName, weatherData]);

  // Render Spatial Hazard Markers around the Farm
  useEffect(() => {
    if (!mapInstanceRef.current || !spatialHazardGroupRef.current || !hazardLinesGroupRef.current) return;
    const spatialGroup = spatialHazardGroupRef.current;
    const linesGroup = hazardLinesGroupRef.current;
    spatialGroup.clearLayers();
    linesGroup.clearLayers();

    const L = (window as any).L;
    if (!L || !weatherData?.spatialHazards) return;

    weatherData.spatialHazards.forEach((hazard) => {
      const isCrit = hazard.severity === 'Critical';
      const isHigh = hazard.severity === 'High';
      const badgeBg = isCrit ? '#dc2626' : isHigh ? '#d97706' : '#2563eb';

      // 1. Hazard Marker Pin
      const hazardIcon = L.divIcon({
        className: `custom-hazard-pin-${hazard.id}`,
        html: `
          <div style="position: relative; display: flex; flex-direction: column; align-items: center; transform: translate(-50%, -100%); cursor: pointer;">
            <div style="background: rgba(15, 23, 42, 0.95); color: white; padding: 4px 9px; border-radius: 10px; font-weight: 700; font-size: 11px; font-family: system-ui, sans-serif; white-space: nowrap; box-shadow: 0 4px 14px rgba(0,0,0,0.6); border: 2px solid ${badgeBg}; display: flex; align-items: center; gap: 4px;">
              <span style="font-size: 12px;">${hazard.emoji}</span>
              <span>${hazard.title}</span>
              <span style="background: ${badgeBg}; color: white; padding: 1px 5px; border-radius: 4px; font-size: 9px; font-weight: 800; text-transform: uppercase;">${hazard.severity}</span>
            </div>
            <div style="font-size: 9px; color: #94a3b8; background: rgba(0,0,0,0.8); padding: 1px 4px; border-radius: 4px; margin-top: 2px; font-weight: 600;">
              ${hazard.distanceKm}km ${hazard.direction}
            </div>
            <div style="width: 12px; height: 12px; background: ${badgeBg}; border: 2px solid #ffffff; border-radius: 50%; margin-top: 2px; box-shadow: 0 0 8px ${badgeBg};"></div>
          </div>
        `,
        iconSize: [160, 52],
        iconAnchor: [80, 52],
      });

      const hMarker = L.marker([hazard.lat, hazard.lng], { icon: hazardIcon });

      // Click to view on-map hazard details modal
      hMarker.on('click', (e: any) => {
        L.DomEvent.stopPropagation(e);
        setActiveHazardPopup(hazard);
      });

      hMarker.addTo(spatialGroup);

      // 2. Dashed Spatial Proximity Vector Line connecting to YOUR FARM
      const polyline = L.polyline(
        [
          [lat, lng],
          [hazard.lat, hazard.lng],
        ],
        {
          color: badgeBg,
          weight: 2,
          opacity: 0.65,
          dashArray: '4, 8',
        }
      );
      polyline.addTo(linesGroup);
    });
  }, [weatherData?.spatialHazards, lat, lng]);

  // Search Location by Name / GPS
  const handleSearchSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchLocationQuery.trim()) return;
    setIsSearching(true);
    try {
      const res = await fetch(
        `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(searchLocationQuery)}&format=json&limit=1`
      );
      if (res.ok) {
        const results = await res.json();
        if (results && results.length > 0) {
          const newLat = parseFloat(results[0].lat);
          const newLng = parseFloat(results[0].lon);
          const name = results[0].display_name.split(',')[0] || searchLocationQuery;
          onLocationSelect(newLat, newLng, name);
          setSearchLocationQuery('');
        } else {
          alert('Location not found. Please try entering a nearby village, district, or GPS coordinates.');
        }
      }
    } catch {
      alert('Error searching location.');
    } finally {
      setIsSearching(false);
    }
  };

  // Switch Tile Layer
  const changeTileLayer = async (layerType: 'satellite' | 'streets' | 'terrain') => {
    if (!mapInstanceRef.current) return;
    const L = (await import('leaflet')).default;
    const map = mapInstanceRef.current;

    if (tileLayerRef.current) {
      map.removeLayer(tileLayerRef.current);
    }

    let url = 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}';
    let attribution = 'Tiles &copy; Esri &mdash; High-Res Satellite';

    if (layerType === 'streets') {
      url = 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png';
      attribution = '&copy; OpenStreetMap contributors';
    } else if (layerType === 'terrain') {
      url = 'https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png';
      attribution = 'Map data: &copy; OpenStreetMap, SRTM | OpenTopoMap';
    }

    const newTile = L.tileLayer(url, { maxZoom: 18, attribution }).addTo(map);
    tileLayerRef.current = newTile;
    setMapLayer(layerType);
  };

  // Toggle Live Radar Overlay
  const toggleLiveRadar = () => {
    if (!mapInstanceRef.current || !radarTileLayerRef.current) return;
    const map = mapInstanceRef.current;
    if (showLiveRadar) {
      map.removeLayer(radarTileLayerRef.current);
      setShowLiveRadar(false);
    } else {
      radarTileLayerRef.current.addTo(map);
      setShowLiveRadar(true);
    }
  };

  // GPS Locate Me
  const handleLocateMe = () => {
    if (!navigator.geolocation) {
      alert('Geolocation is not supported by your browser.');
      return;
    }
    setIsLocating(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const userLat = +pos.coords.latitude.toFixed(4);
        const userLng = +pos.coords.longitude.toFixed(4);
        onLocationSelect(userLat, userLng, 'My Farm Location (GPS)');
        setIsLocating(false);
      },
      (err) => {
        console.warn('Geolocation error:', err);
        setIsLocating(false);
        alert('Could not retrieve GPS location. Please tap directly on the map to pin your farm.');
      },
      { enableHighAccuracy: true, timeout: 8000 }
    );
  };

  return (
    <div className="relative w-full aspect-[16/11] sm:aspect-[21/9] rounded-2xl overflow-hidden bg-slate-950 border border-slate-200 shadow-md">
      {/* Real Map Canvas Container */}
      <div ref={mapContainerRef} className="w-full h-full z-0 cursor-crosshair" />

      {/* TOP INSTRUCTION & SEARCH OVERLAY BAR */}
      <div className="absolute top-3 left-3 right-16 sm:right-auto z-[1000] flex flex-col sm:flex-row items-stretch sm:items-center gap-2 pointer-events-auto">
        {/* Search Farm Location Input */}
        <form onSubmit={handleSearchSubmit} className="relative flex items-center">
          <input
            type="text"
            placeholder="Search farm village, tehsil or district..."
            value={searchLocationQuery}
            onChange={(e) => setSearchLocationQuery(e.target.value)}
            className="w-full sm:w-72 h-9 pl-8 pr-3 rounded-xl bg-slate-900/95 backdrop-blur-md border border-slate-700 text-white placeholder:text-slate-400 text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500 shadow-xl"
          />
          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          {isSearching && (
            <RefreshCw className="w-3.5 h-3.5 text-emerald-400 animate-spin absolute right-2.5 top-1/2 -translate-y-1/2" />
          )}
        </form>

        {/* Interactive Mode Badge */}
        <div className="hidden md:flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-900/90 backdrop-blur-md border border-slate-700 text-slate-200 text-xs shadow-lg">
          <Crosshair className="w-3.5 h-3.5 text-emerald-400 animate-pulse" />
          <span>Tap or drag anywhere to position <strong>YOUR FARM</strong></span>
        </div>
      </div>

      {/* FLOATING MAP CONTROLS TOOLBAR (TOP-RIGHT) */}
      <div className="absolute top-3 right-3 z-[1000] flex flex-col gap-2">
        {/* Layer Switcher */}
        <div className="bg-slate-900/95 backdrop-blur-md rounded-xl shadow-xl border border-slate-700 p-1 flex flex-col gap-1">
          <button
            type="button"
            onClick={() => changeTileLayer('satellite')}
            className={`px-2.5 py-1 rounded-lg text-xs font-headline font-bold transition-all ${
              mapLayer === 'satellite'
                ? 'bg-emerald-600 text-white shadow-xs'
                : 'text-slate-300 hover:bg-slate-800'
            }`}
            title="Satellite Imagery"
          >
            🛰️ Sat
          </button>
          <button
            type="button"
            onClick={() => changeTileLayer('streets')}
            className={`px-2.5 py-1 rounded-lg text-xs font-headline font-bold transition-all ${
              mapLayer === 'streets'
                ? 'bg-emerald-600 text-white shadow-xs'
                : 'text-slate-300 hover:bg-slate-800'
            }`}
            title="OpenStreetMap Street View"
          >
            🗺️ Map
          </button>
          <button
            type="button"
            onClick={() => changeTileLayer('terrain')}
            className={`px-2.5 py-1 rounded-lg text-xs font-headline font-bold transition-all ${
              mapLayer === 'terrain'
                ? 'bg-emerald-600 text-white shadow-xs'
                : 'text-slate-300 hover:bg-slate-800'
            }`}
            title="Topographic Terrain"
          >
            ⛰️ Ter
          </button>
        </div>

        {/* Live Radar Toggle */}
        <button
          type="button"
          onClick={toggleLiveRadar}
          className={`h-9 px-2.5 rounded-xl shadow-lg border flex items-center justify-center gap-1.5 font-headline text-xs font-bold transition-all ${
            showLiveRadar
              ? 'bg-blue-600 border-blue-400 text-white ring-2 ring-blue-400/40'
              : 'bg-slate-900/90 border-slate-700 text-slate-300 hover:bg-slate-800'
          }`}
          title="Toggle Real-Time Weather Precipitation Radar Layer"
        >
          <Radio className={`w-3.5 h-3.5 ${showLiveRadar ? 'animate-pulse' : ''}`} />
          <span className="hidden sm:inline">Radar</span>
        </button>

        {/* GPS Locate Me Button */}
        <button
          type="button"
          onClick={handleLocateMe}
          className="h-9 px-3 bg-white hover:bg-slate-100 text-slate-900 rounded-xl shadow-lg border border-slate-200 flex items-center justify-center gap-1.5 font-headline text-xs font-bold active:scale-95 transition-all"
          title="Locate my farm using GPS"
        >
          <Navigation className={`w-3.5 h-3.5 text-emerald-600 ${isLocating ? 'animate-spin' : ''}`} />
          <span className="hidden sm:inline">GPS</span>
        </button>
      </div>

      {/* POPUP MODAL FOR CLICKED SPATIAL HAZARD PIN */}
      {activeHazardPopup && (
        <div className="absolute inset-x-3 bottom-14 sm:inset-x-auto sm:bottom-14 sm:left-4 z-[1001] max-w-sm bg-slate-900/95 backdrop-blur-md rounded-2xl border border-slate-700 shadow-2xl p-4 text-white animate-in fade-in slide-in-from-bottom-3">
          <div className="flex items-start justify-between gap-2 border-b border-slate-800 pb-2.5">
            <div className="flex items-center gap-2">
              <span className="text-xl">{activeHazardPopup.emoji}</span>
              <div>
                <span className="text-[10px] uppercase font-headline font-bold text-amber-400 tracking-wider">
                  {activeHazardPopup.distanceKm} km {activeHazardPopup.direction} of Your Farm
                </span>
                <h4 className="font-headline text-sm font-bold text-white leading-tight">
                  {activeHazardPopup.title}
                </h4>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setActiveHazardPopup(null)}
              className="text-slate-400 hover:text-white text-xs p-1 rounded-lg bg-slate-800"
            >
              ✕
            </button>
          </div>

          <div className="mt-2.5 space-y-2 text-xs">
            <div className="flex items-center justify-between p-2 rounded-xl bg-slate-950/80 border border-slate-800">
              <span className="text-slate-400">Threat Metric:</span>
              <strong className="text-amber-300 font-headline">{activeHazardPopup.metric}</strong>
            </div>
            <p className="text-slate-300 text-xs leading-relaxed">
              {activeHazardPopup.description}
            </p>
            <div className="p-2 rounded-xl bg-emerald-950/70 border border-emerald-700/60 text-emerald-300 text-[11px]">
              <strong>🛡️ Precaution:</strong> {activeHazardPopup.precaution}
            </div>
          </div>
        </div>
      )}

      {/* MAP BOTTOM LEGEND HUD */}
      <div className="absolute bottom-3 left-3 right-3 z-[1000] flex flex-wrap items-center justify-between gap-2 pointer-events-none">
        <div className="flex items-center gap-2 bg-slate-900/95 backdrop-blur-md px-3 py-1.5 rounded-xl border border-slate-700 text-white text-xs">
          <MapPin className="w-3.5 h-3.5 text-emerald-400" />
          <span className="font-headline font-bold truncate max-w-[160px] sm:max-w-none">
            {locationName}
          </span>
          <span className="font-mono text-slate-400 text-[11px]">
            ({lat.toFixed(4)}°N, {lng.toFixed(4)}°E)
          </span>
        </div>

        <div className="flex items-center gap-1.5 bg-slate-900/95 backdrop-blur-md px-3 py-1.5 rounded-xl border border-slate-700 text-white text-xs font-headline font-bold">
          <span className="text-slate-300 uppercase tracking-wider text-[10px]">
            SPATIAL HAZARDS AROUND FARM:
          </span>
          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-500 text-slate-950">
            {weatherData?.spatialHazards?.length || 6} Active Corridors
          </span>
        </div>
      </div>
    </div>
  );
}
