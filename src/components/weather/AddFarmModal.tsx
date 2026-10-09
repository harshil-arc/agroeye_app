'use client';

import React, { useState, useEffect, useRef } from 'react';
import {
  MapPin,
  Search,
  Crosshair,
  X,
  Loader2,
  CheckCircle,
  Sparkles,
} from 'lucide-react';
import { Language, SoilProfile } from '../../types/weather';
import { searchLocation, reverseGeocode } from '../../services/weatherApi';
import { getSoilProfile, classifySoilByCoordinates } from '../../services/soilService';

interface AddFarmModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAddFarm: (lat: number, lng: number, locationName: string) => void;
  lang: Language;
}

export const AddFarmModal: React.FC<AddFarmModalProps> = ({
  isOpen,
  onClose,
  onAddFarm,
  lang,
}) => {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<Array<{ name: string; lat: number; lng: number }>>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [isLocating, setIsLocating] = useState(false);
  const [mapType, setMapType] = useState<'satellite' | 'street'>('satellite');
  const [selectedCoords, setSelectedCoords] = useState<{ lat: number; lng: number; name: string } | null>(null);
  const [soilProfile, setSoilProfile] = useState<SoilProfile | null>(null);

  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<any>(null);
  const markerRef = useRef<any>(null);
  const circleRef = useRef<any>(null);
  const tileLayerRef = useRef<any>(null);
  const LRef = useRef<any>(null);

  const isHi = lang === 'hi';

  // Reliable Map Tile URLs with subdomains
  const satelliteUrl = 'https://mt{s}.google.com/vt/lyrs=y&x={x}&y={y}&z={z}';
  const streetUrl = 'https://mt{s}.google.com/vt/lyrs=m&x={x}&y={y}&z={z}';

  // Iconic Google Maps Red Teardrop Pin
  const createGooglePin = (L: any) => {
    return L.divIcon({
      className: 'google-maps-farm-pin',
      html: `
        <div style="position: relative; width: 38px; height: 48px; display: flex; flex-direction: column; align-items: center; filter: drop-shadow(0 4px 10px rgba(0,0,0,0.5)); cursor: grab;">
          <svg width="38" height="48" viewBox="0 0 24 30" fill="none">
            <path d="M12 0C5.373 0 0 5.373 0 12c0 9 12 18 12 18s12-9 12-18c0-6.627-5.373-12-12-12z" fill="#ea4335"/>
            <circle cx="12" cy="11" r="5" fill="#ffffff"/>
            <circle cx="12" cy="11" r="2.5" fill="#c5221f"/>
          </svg>
        </div>
      `,
      iconSize: [38, 48],
      iconAnchor: [19, 46],
      popupAnchor: [0, -42],
    });
  };

  // Update soil profile when coordinates change
  const updateSoilInfo = (lat: number, lng: number, placeName: string) => {
    const base = classifySoilByCoordinates(lat, lng, placeName);
    setSoilProfile(base);
    getSoilProfile(lat, lng, placeName).then((enriched) => {
      setSoilProfile(enriched);
    });
  };

  // Initialize Map when modal opens
  useEffect(() => {
    if (!isOpen) return;
    if (typeof window === 'undefined') return;

    let resizeObserver: ResizeObserver | null = null;
    let isMounted = true;

    const timer = setTimeout(() => {
      import('leaflet').then((leafletModule) => {
        if (!isMounted) return;
        const L = (leafletModule as any).default || leafletModule;
        LRef.current = L;

        if (!mapContainerRef.current) return;
        if (mapInstanceRef.current) {
          mapInstanceRef.current.invalidateSize();
          return;
        }

        // Default agricultural center (Udaipur, Rajasthan)
        const initialLat = 24.6128;
        const initialLng = 73.8821;
        const defaultName = isHi ? 'उदयपुर, राजस्थान' : 'Udaipur, Rajasthan';

        setSelectedCoords({ lat: initialLat, lng: initialLng, name: defaultName });
        updateSoilInfo(initialLat, initialLng, defaultName);

        const map = L.map(mapContainerRef.current, {
          center: [initialLat, initialLng],
          zoom: 13,
          zoomControl: true,
          attributionControl: false,
        });

        const tileLayer = L.tileLayer(mapType === 'satellite' ? satelliteUrl : streetUrl, {
          subdomains: ['0', '1', '2', '3'],
          maxZoom: 20,
        }).addTo(map);
        tileLayerRef.current = tileLayer;

        // Google Red Pin Marker with Draggable enabled
        const pinIcon = createGooglePin(L);
        const marker = L.marker([initialLat, initialLng], {
          icon: pinIcon,
          draggable: true,
        }).addTo(map);

        marker.bindPopup(`<b>${defaultName}</b><br/>${isHi ? '📍 आपका खेत (पिन खींचें)' : '📍 Your Farm (Drag pin)'}`).openPopup();
        markerRef.current = marker;

        // Farm boundary circle (1 km perimeter)
        const circle = L.circle([initialLat, initialLng], {
          color: '#059669',
          fillColor: '#10b981',
          fillOpacity: 0.12,
          weight: 2,
          dashArray: '4, 4',
          radius: 1000,
        }).addTo(map);
        circleRef.current = circle;

        // Event 1: Drag Pin
        marker.on('dragend', async () => {
          const pos = marker.getLatLng();
          const cLat = +pos.lat.toFixed(4);
          const cLng = +pos.lng.toFixed(4);
          if (circleRef.current) circleRef.current.setLatLng([cLat, cLng]);
          const placeName = await reverseGeocode(cLat, cLng);
          setSelectedCoords({ lat: cLat, lng: cLng, name: placeName });
          setQuery(placeName);
          updateSoilInfo(cLat, cLng, placeName);
          marker.setPopupContent(`<b>${placeName}</b><br/>${isHi ? '📍 आपका खेत' : '📍 Your Farm'}`).openPopup();
        });

        // Event 2: Click on map to place pin
        map.on('click', async (e: any) => {
          const cLat = +e.latlng.lat.toFixed(4);
          const cLng = +e.latlng.lng.toFixed(4);
          marker.setLatLng([cLat, cLng]);
          if (circleRef.current) circleRef.current.setLatLng([cLat, cLng]);
          const placeName = await reverseGeocode(cLat, cLng);
          setSelectedCoords({ lat: cLat, lng: cLng, name: placeName });
          setQuery(placeName);
          updateSoilInfo(cLat, cLng, placeName);
          marker.setPopupContent(`<b>${placeName}</b><br/>${isHi ? '📍 आपका खेत' : '📍 Your Farm'}`).openPopup();
        });

        mapInstanceRef.current = map;

        // Resize triggers
        setTimeout(() => map.invalidateSize(), 50);
        setTimeout(() => map.invalidateSize(), 150);
        setTimeout(() => map.invalidateSize(), 350);

        if (window.ResizeObserver && mapContainerRef.current) {
          resizeObserver = new ResizeObserver(() => {
            map.invalidateSize();
          });
          resizeObserver.observe(mapContainerRef.current);
        }
      });
    }, 120);

    return () => {
      isMounted = false;
      clearTimeout(timer);
      if (resizeObserver) resizeObserver.disconnect();
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, [isOpen]);

  // Switch Tile Layer between Google Satellite & Street
  useEffect(() => {
    if (!tileLayerRef.current) return;
    tileLayerRef.current.setUrl(mapType === 'satellite' ? satelliteUrl : streetUrl);
  }, [mapType]);

  if (!isOpen) return null;

  // Search location handler
  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim()) return;
    setIsSearching(true);
    const res = await searchLocation(query);
    setResults(res);
    setIsSearching(false);
  };

  // Select Search result
  const handleSelectResult = (item: { name: string; lat: number; lng: number }) => {
    const cleanName = item.name.split(',').slice(0, 2).join(',');
    setSelectedCoords({ lat: item.lat, lng: item.lng, name: cleanName });
    setResults([]);
    setQuery(cleanName);
    updateSoilInfo(item.lat, item.lng, cleanName);

    if (mapInstanceRef.current) {
      mapInstanceRef.current.flyTo([item.lat, item.lng], 14, { duration: 1.2 });
      if (markerRef.current) {
        markerRef.current.setLatLng([item.lat, item.lng]);
        markerRef.current.setPopupContent(`<b>${cleanName}</b><br/>${isHi ? '📍 आपका खेत' : '📍 Your Farm'}`).openPopup();
      }
      if (circleRef.current) {
        circleRef.current.setLatLng([item.lat, item.lng]);
      }
      setTimeout(() => mapInstanceRef.current?.invalidateSize(), 200);
    }
  };

  // GPS Locate Current Position
  const handleLocateMe = () => {
    if (!navigator.geolocation) {
      alert(isHi ? 'आपके ब्राउज़र में GPS सुविधा उपलब्ध नहीं है।' : 'Geolocation is not supported by your browser.');
      return;
    }
    setIsLocating(true);
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const cLat = +pos.coords.latitude.toFixed(4);
        const cLng = +pos.coords.longitude.toFixed(4);
        const placeName = await reverseGeocode(cLat, cLng);
        setSelectedCoords({ lat: cLat, lng: cLng, name: placeName });
        setQuery(placeName);
        updateSoilInfo(cLat, cLng, placeName);

        if (mapInstanceRef.current) {
          mapInstanceRef.current.flyTo([cLat, cLng], 15, { duration: 1.2 });
          if (markerRef.current) {
            markerRef.current.setLatLng([cLat, cLng]);
            markerRef.current.setPopupContent(`<b>${placeName}</b><br/>${isHi ? '📍 आपका खेत' : '📍 Your Farm'}`).openPopup();
          }
          if (circleRef.current) {
            circleRef.current.setLatLng([cLat, cLng]);
          }
          setTimeout(() => mapInstanceRef.current?.invalidateSize(), 200);
        }
        setIsLocating(false);
      },
      (err) => {
        console.error('Geolocation error:', err);
        setIsLocating(false);
        alert(isHi ? 'GPS स्थान नहीं मिल सका। कृपया खोजें या नक्शे पर टैप करें।' : 'Could not retrieve GPS coordinates. Please search or tap on the map.');
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  // Submit and confirm
  const handleConfirm = () => {
    if (selectedCoords) {
      onAddFarm(selectedCoords.lat, selectedCoords.lng, selectedCoords.name);
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 animate-in fade-in">
      <div className="bg-white rounded-3xl shadow-2xl border border-slate-200 max-w-2xl w-full overflow-hidden flex flex-col max-h-[90vh]">
        {/* 1. Modal Header */}
        <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between bg-gradient-to-r from-slate-50 to-white flex-shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-emerald-600 text-white flex items-center justify-center font-headline font-bold text-base shadow-sm">
              <MapPin className="w-5 h-5 text-white" />
            </div>
            <div>
              <h3 className="font-headline text-base sm:text-lg font-extrabold text-slate-900 leading-tight">
                {isHi ? 'गूगल मैप्स पर अपना खेत पिन करें' : 'Pin Your Farm on Google Maps'}
              </h3>
              <span className="text-xs text-slate-500 font-medium">
                {isHi ? 'लाल पिन को खींचें या नक्शे पर कहीं भी टैप करें' : 'Drag the red pin or tap anywhere on the map to mark farm'}
              </span>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-500 hover:text-slate-800 flex items-center justify-center transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* 2. Scrollable Modal Body */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-4">
          {/* Search & Controls Bar */}
          <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200/80 space-y-3">
            <form onSubmit={handleSearch} className="relative">
              <div className="flex items-center gap-2">
                <div className="relative flex-1">
                  <input
                    type="text"
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    placeholder={isHi ? 'गाँव, तहसील, शहर या पिन कोड लिखें...' : 'Search village, town, city or pin code...'}
                    className="w-full h-10 pl-9 pr-3 rounded-xl bg-white border border-slate-300 text-slate-900 placeholder-slate-400 text-xs font-headline focus:outline-none focus:ring-2 focus:ring-emerald-500 shadow-2xs transition-all"
                    autoFocus
                  />
                  <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                </div>

                <button
                  type="submit"
                  disabled={isSearching}
                  className="h-10 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-headline font-bold flex items-center gap-1.5 transition-all flex-shrink-0 shadow-2xs cursor-pointer"
                >
                  {isSearching ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : null}
                  <span>{isHi ? 'खोजें' : 'Search'}</span>
                </button>

                <button
                  type="button"
                  onClick={handleLocateMe}
                  disabled={isLocating}
                  className="h-10 px-3 rounded-xl bg-white hover:bg-emerald-50 text-emerald-800 text-xs font-headline font-bold flex items-center gap-1.5 transition-all border border-emerald-200 flex-shrink-0 shadow-2xs cursor-pointer"
                  title={isHi ? 'वर्तमान GPS स्थान' : 'Locate Current GPS'}
                >
                  {isLocating ? (
                    <Loader2 className="w-4 h-4 animate-spin text-emerald-600" />
                  ) : (
                    <Crosshair className="w-4 h-4 text-emerald-600" />
                  )}
                  <span className="hidden sm:inline">{isHi ? 'GPS स्थान' : 'My GPS'}</span>
                </button>
              </div>

              {/* Auto-suggest dropdown */}
              {results.length > 0 && (
                <div className="absolute top-full left-0 right-0 mt-1 bg-white rounded-xl shadow-2xl border border-slate-200 z-50 divide-y divide-slate-100 max-h-52 overflow-y-auto">
                  {results.map((res, i) => (
                    <button
                      key={i}
                      type="button"
                      onClick={() => handleSelectResult(res)}
                      className="w-full text-left p-2.5 hover:bg-emerald-50 flex items-center gap-2 text-xs font-headline text-slate-800 transition-colors"
                    >
                      <MapPin className="w-3.5 h-3.5 text-emerald-600 flex-shrink-0" />
                      <span className="truncate">{res.name}</span>
                    </button>
                  ))}
                </div>
              )}
            </form>

            {/* Map Layer Mode Switcher & Helper */}
            <div className="flex items-center justify-between gap-2">
              <div className="inline-flex rounded-lg p-0.5 bg-slate-200 border border-slate-300">
                <button
                  type="button"
                  onClick={() => setMapType('street')}
                  className={`px-2.5 py-1 rounded-md text-xs font-headline font-bold transition-all cursor-pointer ${
                    mapType === 'street'
                      ? 'bg-white text-slate-900 shadow-2xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  🗺️ {isHi ? 'गूगल मैप' : 'Google Map'}
                </button>
                <button
                  type="button"
                  onClick={() => setMapType('satellite')}
                  className={`px-2.5 py-1 rounded-md text-xs font-headline font-bold transition-all cursor-pointer ${
                    mapType === 'satellite'
                      ? 'bg-white text-slate-900 shadow-2xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  🛰️ {isHi ? 'सैटेलाइट' : 'Satellite'}
                </button>
              </div>

              <span className="text-[11px] text-slate-500 font-medium flex items-center gap-1">
                <Sparkles className="w-3 h-3 text-emerald-600 flex-shrink-0" />
                <span>{isHi ? 'लाल पिन खींचकर खेत पर रखें' : 'Drag red pin onto your field'}</span>
              </span>
            </div>
          </div>

          {/* Interactive Leaflet Map Container */}
          <div className="relative rounded-2xl overflow-hidden border border-slate-300 shadow-inner bg-slate-900 h-[320px] sm:h-[350px] w-full">
            <div
              ref={mapContainerRef}
              className="w-full h-full"
            />

            {/* Floating Instructions Pill on Map */}
            <div className="absolute top-3 left-3 right-3 sm:left-auto sm:right-3 z-20 pointer-events-none">
              <div className="bg-slate-950/85 backdrop-blur-md text-white text-[11px] px-3 py-1.5 rounded-full font-headline font-semibold shadow-lg border border-slate-800 flex items-center gap-1.5 max-w-xs">
                <span className="w-2 h-2 rounded-full bg-rose-500 animate-ping flex-shrink-0" />
                <span className="truncate">
                  {isHi ? '📍 नक्शे पर टैप करें या लाल पिन खींचें' : '📍 Tap map or drag red pin to mark'}
                </span>
              </div>
            </div>
          </div>

          {/* Pinned Coordinates & Address Summary */}
          {selectedCoords && (
            <div className="px-4 py-3 bg-emerald-50 border border-emerald-200 rounded-2xl flex items-center justify-between gap-3 animate-in fade-in">
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="w-8 h-8 rounded-xl bg-emerald-600 text-white flex items-center justify-center flex-shrink-0 shadow-2xs text-xs font-bold">
                  📍
                </div>
                <div className="truncate">
                  <span className="font-headline text-xs sm:text-sm font-bold text-emerald-950 block truncate">
                    {selectedCoords.name}
                  </span>
                  <span className="text-[11px] text-emerald-700 font-mono">
                    {selectedCoords.lat.toFixed(4)}°N, {selectedCoords.lng.toFixed(4)}°E • Google WGS84
                  </span>
                </div>
              </div>
              <span className="hidden sm:inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-headline font-bold uppercase border border-emerald-300">
                <CheckCircle className="w-3 h-3 text-emerald-600" />
                {isHi ? 'स्थान चिह्नित' : 'Pinned'}
              </span>
            </div>
          )}

          {/* Real-time Detected Soil Type in Selected Region */}
          {soilProfile && (
            <div className="p-4 bg-gradient-to-br from-amber-50/90 via-stone-50 to-white rounded-2xl border border-amber-200/90 shadow-2xs space-y-3 animate-in fade-in">
              <div className="flex items-center justify-between gap-2 border-b border-amber-200/60 pb-2.5">
                <div className="flex items-center gap-2">
                  <div
                    className="w-7 h-7 rounded-lg flex items-center justify-center text-white text-xs font-bold shadow-2xs"
                    style={{ backgroundColor: soilProfile.colorHex }}
                  >
                    🌾
                  </div>
                  <div>
                    <span className="text-[10px] font-headline uppercase font-bold text-amber-800 tracking-wider block">
                      {isHi ? 'चयनित क्षेत्र का मृदा प्रकार (SOIL TYPE)' : 'DETECTED REGIONAL SOIL TYPE'}
                    </span>
                    <h4 className="font-headline text-sm sm:text-base font-extrabold text-stone-900 leading-tight">
                      {isHi ? soilProfile.soilTypeHi : soilProfile.soilType}
                    </h4>
                  </div>
                </div>

                <span className="px-2.5 py-1 rounded-full bg-amber-100 text-amber-900 font-headline text-[10px] font-extrabold border border-amber-300">
                  {soilProfile.ph}
                </span>
              </div>

              {/* Key Soil Telemetry Badges */}
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-xs">
                <div className="p-2 bg-white rounded-xl border border-stone-200 flex flex-col">
                  <span className="text-[10px] text-stone-400 font-medium">{isHi ? 'बनावट (Texture)' : 'Texture'}</span>
                  <span className="font-headline font-bold text-stone-800 text-[11px] truncate">
                    {isHi ? soilProfile.textureHi : soilProfile.texture}
                  </span>
                </div>

                <div className="p-2 bg-white rounded-xl border border-stone-200 flex flex-col">
                  <span className="text-[10px] text-stone-400 font-medium">{isHi ? 'जलधारण क्षमता' : 'Water Retention'}</span>
                  <span className="font-headline font-bold text-emerald-800 text-[11px] truncate">
                    {isHi ? soilProfile.waterRetentionHi : soilProfile.waterRetention}
                  </span>
                </div>

                <div className="p-2 bg-white rounded-xl border border-stone-200 flex flex-col col-span-2 sm:col-span-1">
                  <span className="text-[10px] text-stone-400 font-medium">{isHi ? 'जल निकास (Drainage)' : 'Drainage'}</span>
                  <span className="font-headline font-bold text-sky-800 text-[11px] truncate">
                    {isHi ? soilProfile.drainageHi : soilProfile.drainage}
                  </span>
                </div>
              </div>

              {/* Suitable Crops */}
              <div className="pt-1">
                <span className="text-[10px] font-headline uppercase font-bold text-stone-600 block mb-1">
                  🌱 {isHi ? 'इस मिट्टी हेतु उपयुक्त फसलें:' : 'Highly Recommended Crops:'}
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {(isHi ? soilProfile.suitableCropsHi : soilProfile.suitableCrops).map((crop, idx) => (
                    <span
                      key={idx}
                      className="px-2 py-0.5 rounded-lg bg-emerald-50 text-emerald-800 border border-emerald-200 font-headline text-[10px] font-bold"
                    >
                      {crop}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* 3. Modal Footer */}
        <div className="px-5 py-3.5 bg-slate-50 border-t border-slate-100 flex items-center justify-end gap-2.5 flex-shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="h-10 px-4 rounded-xl bg-white border border-slate-300 text-slate-700 hover:bg-slate-100 text-xs font-headline font-bold transition-all shadow-2xs cursor-pointer"
          >
            {isHi ? 'रद्द करें' : 'Cancel'}
          </button>
          <button
            type="button"
            onClick={handleConfirm}
            disabled={!selectedCoords}
            className={`h-10 px-5 rounded-xl font-headline text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 shadow-sm transition-all active:scale-95 cursor-pointer ${
              selectedCoords
                ? 'bg-emerald-600 hover:bg-emerald-700 text-white'
                : 'bg-slate-200 text-slate-400 cursor-not-allowed'
            }`}
          >
            <CheckCircle className="w-4 h-4" />
            <span>{isHi ? 'खेत सुरक्षित करें' : 'Save Farm Location'}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
