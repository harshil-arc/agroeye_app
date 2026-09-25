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
} from 'lucide-react';
import { LiveWeatherResult } from '@/lib/realWeatherApi';

export interface NearbyRegionInfo {
  id: string;
  name: string;
  sub: string;
  lat: number;
  lng: number;
  crop: string;
  soil: string;
  temp?: number;
  condition?: string;
  riskScore?: number;
  riskType?: 'flood' | 'drought' | 'storm' | 'disease' | 'heat' | 'safe';
  riskLabel?: string;
  severity?: 'Critical' | 'High' | 'Moderate' | 'Low' | 'Safe';
}

interface RealLeafletMapProps {
  lat: number;
  lng: number;
  locationName: string;
  onLocationSelect: (lat: number, lng: number, placeName?: string) => void;
  heatmapType: 'precipitation' | 'drought' | 'storm' | 'disease' | 'heat';
  riskScore: number;
  weatherData?: LiveWeatherResult | null;
  nearbyRegions?: NearbyRegionInfo[];
}

export default function RealLeafletMap({
  lat,
  lng,
  locationName,
  onLocationSelect,
  heatmapType,
  riskScore,
  weatherData,
  nearbyRegions = [],
}: RealLeafletMapProps) {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<any>(null);
  const markerRef = useRef<any>(null);
  const circleHeatmapRef = useRef<any>(null);
  const outerCircleRef = useRef<any>(null);
  const nearbyMarkersGroupRef = useRef<any>(null);
  const radarTileLayerRef = useRef<any>(null);
  const tileLayerRef = useRef<any>(null);

  const [mapLayer, setMapLayer] = useState<'satellite' | 'streets' | 'terrain'>('satellite');
  const [showLiveRadar, setShowLiveRadar] = useState<boolean>(true);
  const [isLocating, setIsLocating] = useState<boolean>(false);
  const [showOnMapDetails, setShowOnMapDetails] = useState<boolean>(true);

  const getHeatmapColor = (type = heatmapType) => {
    switch (type) {
      case 'precipitation':
        return '#2563eb'; // blue-600
      case 'drought':
        return '#d97706'; // amber-600
      case 'storm':
        return '#9333ea'; // purple-600
      case 'disease':
        return '#e11d48'; // rose-600
      case 'heat':
        return '#dc2626'; // red-600
      default:
        return '#059669';
    }
  };

  // Initialize Leaflet Map
  useEffect(() => {
    let isMounted = true;

    const initMap = async () => {
      if (typeof window === 'undefined' || !mapContainerRef.current) return;

      const L = (await import('leaflet')).default;

      // Ensure Leaflet CSS is loaded
      if (!document.getElementById('leaflet-css')) {
        const link = document.createElement('link');
        link.id = 'leaflet-css';
        link.rel = 'stylesheet';
        link.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
        document.head.appendChild(link);
      }

      // Cleanup existing map if any
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
                  opacity: 0.7,
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

      // 3. Primary Center Pin with Live Weather Info Popup
      const primaryIcon = L.divIcon({
        className: 'custom-primary-pin',
        html: `
          <div style="position: relative; display: flex; flex-direction: column; align-items: center; transform: translate(-50%, -100%);">
            <div style="background: ${riskScore > 70 ? '#dc2626' : riskScore > 40 ? '#d97706' : '#059669'}; color: white; padding: 4px 10px; border-radius: 9999px; font-weight: 700; font-size: 11px; font-family: system-ui, sans-serif; white-space: nowrap; box-shadow: 0 4px 14px rgba(0,0,0,0.5); border: 2px solid #ffffff; display: flex; align-items: center; gap: 4px;">
              <span>${riskScore > 70 ? '🚨' : riskScore > 40 ? '⚠️' : '🌱'}</span>
              <span>${locationName.split('•')[0]}</span>
              <span style="opacity: 0.9; font-weight: 500;">${weatherData?.current.temperature ? Math.round(weatherData.current.temperature) + '°C' : ''}</span>
            </div>
            <div style="width: 16px; height: 16px; background: ${riskScore > 70 ? '#dc2626' : riskScore > 40 ? '#d97706' : '#059669'}; border: 3px solid #ffffff; border-radius: 50%; box-shadow: 0 2px 8px rgba(0,0,0,0.6); margin-top: 2px;"></div>
          </div>
        `,
        iconSize: [140, 46],
        iconAnchor: [70, 46],
      });

      const marker = L.marker([lat, lng], { icon: primaryIcon }).addTo(map);
      markerRef.current = marker;

      // 4. Primary Inner Hazard Circle (3.5 km)
      const circleColor = getHeatmapColor();
      const circle = L.circle([lat, lng], {
        radius: 3500,
        color: circleColor,
        fillColor: circleColor,
        fillOpacity: 0.32,
        weight: 2,
        dashArray: '5, 5',
      }).addTo(map);
      circleHeatmapRef.current = circle;

      // 5. Outer Warning Perimeter Circle (7.5 km)
      const outerCircle = L.circle([lat, lng], {
        radius: 7500,
        color: circleColor,
        fillColor: circleColor,
        fillOpacity: 0.12,
        weight: 1.5,
        dashArray: '8, 8',
      }).addTo(map);
      outerCircleRef.current = outerCircle;

      // 6. Nearby Region Marker Layer Group
      const nearbyGroup = L.layerGroup().addTo(map);
      nearbyMarkersGroupRef.current = nearbyGroup;

      // Map Click Event
      map.on('click', async (e: any) => {
        const newLat = +e.latlng.lat.toFixed(4);
        const newLng = +e.latlng.lng.toFixed(4);

        marker.setLatLng([newLat, newLng]);
        circle.setLatLng([newLat, newLng]);
        outerCircle.setLatLng([newLat, newLng]);

        let placeName = `Field Location (${newLat}°N, ${newLng}°E)`;
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
          // coordinate fallback
        }

        onLocationSelect(newLat, newLng, placeName);
      });

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

  // Update primary marker, hazard rings & view when lat/lng/heatmapType/weatherData changes
  useEffect(() => {
    if (!mapInstanceRef.current) return;
    const map = mapInstanceRef.current;
    const L = (window as any).L;

    map.setView([lat, lng], map.getZoom() || 12, { animate: true });

    // Update primary marker icon
    if (markerRef.current) {
      markerRef.current.setLatLng([lat, lng]);
      if (L) {
        const newIcon = L.divIcon({
          className: 'custom-primary-pin',
          html: `
            <div style="position: relative; display: flex; flex-direction: column; align-items: center; transform: translate(-50%, -100%);">
              <div style="background: ${riskScore > 70 ? '#dc2626' : riskScore > 40 ? '#d97706' : '#059669'}; color: white; padding: 4px 10px; border-radius: 9999px; font-weight: 700; font-size: 11px; font-family: system-ui, sans-serif; white-space: nowrap; box-shadow: 0 4px 14px rgba(0,0,0,0.5); border: 2px solid #ffffff; display: flex; align-items: center; gap: 4px;">
                <span>${riskScore > 70 ? '🚨' : riskScore > 40 ? '⚠️' : '🌱'}</span>
                <span>${locationName.split('•')[0]}</span>
                <span style="opacity: 0.9; font-weight: 500;">${weatherData?.current.temperature ? Math.round(weatherData.current.temperature) + '°C' : ''}</span>
              </div>
              <div style="width: 16px; height: 16px; background: ${riskScore > 70 ? '#dc2626' : riskScore > 40 ? '#d97706' : '#059669'}; border: 3px solid #ffffff; border-radius: 50%; box-shadow: 0 2px 8px rgba(0,0,0,0.6); margin-top: 2px;"></div>
            </div>
          `,
          iconSize: [140, 46],
          iconAnchor: [70, 46],
        });
        markerRef.current.setIcon(newIcon);
      }
    }

    // Update hazard circles
    const color = getHeatmapColor();
    if (circleHeatmapRef.current) {
      circleHeatmapRef.current.setLatLng([lat, lng]);
      circleHeatmapRef.current.setStyle({ color, fillColor: color });
    }
    if (outerCircleRef.current) {
      outerCircleRef.current.setLatLng([lat, lng]);
      outerCircleRef.current.setStyle({ color, fillColor: color });
    }
  }, [lat, lng, heatmapType, riskScore, locationName, weatherData]);

  // Render Nearby Agricultural Stations & Calamity Points on Map
  useEffect(() => {
    if (!mapInstanceRef.current || !nearbyMarkersGroupRef.current) return;
    const group = nearbyMarkersGroupRef.current;
    group.clearLayers();

    const L = (window as any).L;
    if (!L) return;

    nearbyRegions.forEach((region) => {
      // Don't duplicate primary pin
      if (Math.abs(region.lat - lat) < 0.001 && Math.abs(region.lng - lng) < 0.001) return;

      const sevColor =
        region.severity === 'Critical'
          ? '#dc2626'
          : region.severity === 'High'
          ? '#d97706'
          : region.severity === 'Moderate'
          ? '#2563eb'
          : '#059669';

      const nearbyIcon = L.divIcon({
        className: 'custom-nearby-pin',
        html: `
          <div style="position: relative; display: flex; flex-direction: column; align-items: center; transform: translate(-50%, -100%); cursor: pointer;">
            <div style="background: rgba(15, 23, 42, 0.92); color: white; padding: 3px 8px; border-radius: 8px; font-weight: 700; font-size: 10px; font-family: system-ui, sans-serif; white-space: nowrap; box-shadow: 0 3px 10px rgba(0,0,0,0.4); border: 1.5px solid ${sevColor}; display: flex; align-items: center; gap: 3px;">
              <span style="width: 6px; height: 6px; border-radius: 50%; background: ${sevColor};"></span>
              <span>${region.name.split('•')[0]}</span>
              <span style="color: ${sevColor}; font-weight: 800;">${region.riskLabel || ''}</span>
            </div>
            <div style="width: 10px; height: 10px; background: ${sevColor}; border: 2px solid #ffffff; border-radius: 50%; margin-top: 2px;"></div>
          </div>
        `,
        iconSize: [120, 36],
        iconAnchor: [60, 36],
      });

      const nearMarker = L.marker([region.lat, region.lng], { icon: nearbyIcon });

      // Click to select nearby region
      nearMarker.on('click', (e: any) => {
        L.DomEvent.stopPropagation(e);
        onLocationSelect(region.lat, region.lng, region.name);
      });

      nearMarker.addTo(group);
    });
  }, [nearbyRegions, lat, lng, onLocationSelect]);

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
        onLocationSelect(userLat, userLng, 'My Current Farm Location (GPS)');
        setIsLocating(false);
      },
      (err) => {
        console.warn('Geolocation error:', err);
        setIsLocating(false);
        alert('Could not retrieve GPS location. Please tap directly on the map.');
      },
      { enableHighAccuracy: true, timeout: 8000 }
    );
  };

  const activeAlert = weatherData?.disasterAlerts?.[0];

  return (
    <div className="relative w-full aspect-[16/11] sm:aspect-[21/9] rounded-2xl overflow-hidden bg-slate-950 border border-slate-200 shadow-md">
      {/* Real Map Canvas Container */}
      <div ref={mapContainerRef} className="w-full h-full z-0" />

      {/* TOP-LEFT FLOATING CALAMITY & LIVE WEATHER OVERLAY HUD ON THE MAP */}
      {weatherData && (
        <div className="absolute top-3 left-3 z-[1000] max-w-[280px] sm:max-w-sm pointer-events-auto transition-all">
          <div className="bg-slate-900/95 backdrop-blur-md rounded-2xl border border-slate-700/80 shadow-2xl p-3 text-white space-y-2.5">
            {/* Top Bar with Location and Live Status */}
            <div className="flex items-center justify-between gap-2 border-b border-slate-800 pb-2">
              <div className="flex items-center gap-1.5 truncate">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                <span className="font-headline text-xs font-bold text-slate-100 truncate">
                  {locationName.split('•')[0]}
                </span>
              </div>
              <span className="px-2 py-0.5 rounded-full bg-slate-800 border border-slate-700 font-mono text-[10px] text-emerald-400 font-bold">
                {Math.round(weatherData.current.temperature)}°C • {weatherData.current.weatherCondition}
              </span>
            </div>

            {/* Natural Calamity / Threat Status Banner */}
            {activeAlert ? (
              <div
                className={`p-2.5 rounded-xl border flex items-start gap-2.5 transition-all ${
                  activeAlert.severity === 'Critical'
                    ? 'bg-rose-950/80 border-rose-600/80 text-rose-100'
                    : 'bg-amber-950/80 border-amber-600/80 text-amber-100'
                }`}
              >
                <div
                  className={`w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 font-bold ${
                    activeAlert.severity === 'Critical' ? 'bg-rose-600 text-white' : 'bg-amber-600 text-white'
                  }`}
                >
                  <AlertTriangle className="w-4 h-4" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-1">
                    <span className="text-[10px] font-headline font-bold uppercase tracking-wider text-rose-300">
                      {activeAlert.severity} CALAMITY WARNING
                    </span>
                    <span className="font-headline text-[10px] font-extrabold bg-black/40 px-1.5 py-0.5 rounded text-rose-300">
                      {activeAlert.probability}% Risk
                    </span>
                  </div>
                  <h4 className="font-headline text-xs font-bold leading-tight mt-0.5 truncate text-white">
                    {activeAlert.title}
                  </h4>
                  <p className="text-[10px] text-slate-300 leading-snug mt-1 line-clamp-2">
                    {activeAlert.description}
                  </p>
                </div>
              </div>
            ) : (
              <div className="p-2 rounded-xl bg-emerald-950/60 border border-emerald-600/50 flex items-center gap-2 text-emerald-300 text-xs">
                <ShieldCheck className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                <span className="font-headline font-bold text-[11px]">
                  All Meteorological &amp; Disaster Safety Levels Normal
                </span>
              </div>
            )}

            {/* Quick Live Telemetry Pills */}
            <div className="grid grid-cols-4 gap-1.5 text-center text-[10px] font-medium bg-slate-950/70 p-1.5 rounded-xl border border-slate-800">
              <div className="flex flex-col">
                <span className="text-slate-400">Soil Mois</span>
                <span className="font-bold text-sky-400">{weatherData.current.soilMoisturePercent}%</span>
              </div>
              <div className="flex flex-col">
                <span className="text-slate-400">Humidity</span>
                <span className="font-bold text-sky-300">{weatherData.current.humidity}%</span>
              </div>
              <div className="flex flex-col">
                <span className="text-slate-400">Wind</span>
                <span className="font-bold text-teal-400">{weatherData.current.windSpeed}kph</span>
              </div>
              <div className="flex flex-col">
                <span className="text-slate-400">UV Max</span>
                <span className="font-bold text-amber-400">{weatherData.current.uvIndex}</span>
              </div>
            </div>
          </div>
        </div>
      )}

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
            🛰️ Satellite
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
            🗺️ Street
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
            ⛰️ Terrain
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
          <span className="hidden sm:inline">Radar {showLiveRadar ? 'ON' : 'OFF'}</span>
        </button>

        {/* GPS Locate Me Button */}
        <button
          type="button"
          onClick={handleLocateMe}
          className="h-9 px-3 bg-white/95 backdrop-blur-md hover:bg-white text-slate-900 rounded-xl shadow-lg border border-slate-200 flex items-center justify-center gap-1.5 font-headline text-xs font-bold active:scale-95 transition-all"
          title="Locate my farm using GPS"
        >
          <Navigation className={`w-3.5 h-3.5 text-emerald-600 ${isLocating ? 'animate-spin' : ''}`} />
          <span className="hidden sm:inline">My Farm GPS</span>
        </button>
      </div>

      {/* MAP BOTTOM LEGEND & NEARBY STATIONS HUD */}
      <div className="absolute bottom-3 left-3 right-3 z-[1000] flex flex-wrap items-center justify-between gap-2 pointer-events-none">
        <div className="flex items-center gap-2 bg-slate-900/95 backdrop-blur-md px-3 py-1.5 rounded-xl border border-slate-700 text-white text-xs">
          <MapPin className="w-3.5 h-3.5 text-emerald-400" />
          <span className="font-headline font-bold truncate max-w-[180px] sm:max-w-none">
            {locationName}
          </span>
          <span className="font-mono text-slate-400 text-[11px]">
            ({lat.toFixed(4)}°N, {lng.toFixed(4)}°E)
          </span>
        </div>

        {/* Dynamic Heatmap & Disaster Radius HUD */}
        <div className="flex items-center gap-2 bg-slate-900/95 backdrop-blur-md px-3 py-1.5 rounded-xl border border-slate-700 text-white text-xs font-headline font-bold">
          <span className="text-slate-300 uppercase tracking-wider text-[10px]">
            {heatmapType.toUpperCase()} CALAMITY RADIUS (3.5 km / 7.5 km):
          </span>
          <span
            className={`px-2 py-0.5 rounded text-[10px] font-bold ${
              riskScore > 70
                ? 'bg-red-500 text-white'
                : riskScore > 40
                ? 'bg-amber-500 text-slate-950'
                : 'bg-emerald-500 text-white'
            }`}
          >
            {riskScore}% Hazard Rating
          </span>
        </div>
      </div>
    </div>
  );
}
