'use client';

import React, { useEffect, useRef, useState } from 'react';
import { MapPin, Crosshair, Search, Loader2, Sparkles, Layers } from 'lucide-react';
import { searchLocation, reverseGeocode } from '../../services/weatherApi';

interface SoilMapPickerProps {
  lat: number;
  lng: number;
  locationName: string;
  onLocationSelect: (lat: number, lng: number, placeName: string) => void;
  lang?: 'en' | 'hi';
}

export const SoilMapPicker: React.FC<SoilMapPickerProps> = ({
  lat,
  lng,
  locationName,
  onLocationSelect,
  lang = 'en',
}) => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<any>(null);
  const markerRef = useRef<any>(null);
  const circleRef = useRef<any>(null);
  const tileLayerRef = useRef<any>(null);
  const LRef = useRef<any>(null);

  const [mapType, setMapType] = useState<'satellite' | 'street'>('street');
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<Array<{ name: string; lat: number; lng: number }>>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [isLocating, setIsLocating] = useState(false);

  const isHi = lang === 'hi';
  const satelliteUrl = 'https://mt{s}.google.com/vt/lyrs=y&x={x}&y={y}&z={z}';
  const streetUrl = 'https://mt{s}.google.com/vt/lyrs=m&x={x}&y={y}&z={z}';

  const createPinIcon = (L: any) => {
    return L.divIcon({
      className: 'soil-farm-pin',
      html: `
        <div style="position: relative; width: 36px; height: 44px; display: flex; flex-direction: column; align-items: center; filter: drop-shadow(0 4px 8px rgba(0,0,0,0.4)); cursor: grab;">
          <svg width="36" height="44" viewBox="0 0 24 30" fill="none">
            <path d="M12 0C5.373 0 0 5.373 0 12c0 9 12 18 12 18s12-9 12-18c0-6.627-5.373-12-12-12z" fill="#059669"/>
            <circle cx="12" cy="11" r="5" fill="#ffffff"/>
            <circle cx="12" cy="11" r="2.5" fill="#047857"/>
          </svg>
        </div>
      `,
      iconSize: [36, 44],
      iconAnchor: [18, 42],
      popupAnchor: [0, -38],
    });
  };

  useEffect(() => {
    if (typeof window === 'undefined') return;
    let isMounted = true;

    import('leaflet').then((leafletModule) => {
      if (!isMounted) return;
      const L = (leafletModule as any).default || leafletModule;
      LRef.current = L;

      if (!mapContainerRef.current) return;
      if (mapInstanceRef.current) {
        mapInstanceRef.current.invalidateSize();
        return;
      }

      const map = L.map(mapContainerRef.current, {
        center: [lat, lng],
        zoom: 12,
        zoomControl: true,
        attributionControl: false,
      });

      const tileLayer = L.tileLayer(mapType === 'satellite' ? satelliteUrl : streetUrl, {
        subdomains: ['0', '1', '2', '3'],
        maxZoom: 19,
      }).addTo(map);
      tileLayerRef.current = tileLayer;

      const pinIcon = createPinIcon(L);
      const marker = L.marker([lat, lng], {
        icon: pinIcon,
        draggable: true,
      }).addTo(map);

      marker.bindPopup(`<b>${locationName}</b><br/>${isHi ? '📍 आपका खेत (पिन खींचें)' : '📍 Marked Farm'}`).openPopup();
      markerRef.current = marker;

      const circle = L.circle([lat, lng], {
        color: '#059669',
        fillColor: '#10b981',
        fillOpacity: 0.1,
        weight: 1.5,
        dashArray: '4, 4',
        radius: 1200,
      }).addTo(map);
      circleRef.current = circle;

      marker.on('dragend', async () => {
        const pos = marker.getLatLng();
        const cLat = +pos.lat.toFixed(4);
        const cLng = +pos.lng.toFixed(4);
        if (circleRef.current) circleRef.current.setLatLng([cLat, cLng]);
        const placeName = await reverseGeocode(cLat, cLng);
        onLocationSelect(cLat, cLng, placeName);
        marker.setPopupContent(`<b>${placeName}</b><br/>${isHi ? '📍 आपका खेत' : '📍 Marked Farm'}`).openPopup();
      });

      map.on('click', async (e: any) => {
        const cLat = +e.latlng.lat.toFixed(4);
        const cLng = +e.latlng.lng.toFixed(4);
        marker.setLatLng([cLat, cLng]);
        if (circleRef.current) circleRef.current.setLatLng([cLat, cLng]);
        const placeName = await reverseGeocode(cLat, cLng);
        onLocationSelect(cLat, cLng, placeName);
        marker.setPopupContent(`<b>${placeName}</b><br/>${isHi ? '📍 आपका खेत' : '📍 Marked Farm'}`).openPopup();
      });

      mapInstanceRef.current = map;
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

  useEffect(() => {
    if (!mapInstanceRef.current || !tileLayerRef.current) return;
    tileLayerRef.current.setUrl(mapType === 'satellite' ? satelliteUrl : streetUrl);
  }, [mapType]);

  useEffect(() => {
    if (!mapInstanceRef.current) return;
    const map = mapInstanceRef.current;
    map.setView([lat, lng], 12);
    if (markerRef.current) {
      markerRef.current.setLatLng([lat, lng]);
      markerRef.current.setPopupContent(`<b>${locationName}</b><br/>${isHi ? '📍 आपका खेत' : '📍 Marked Farm'}`);
    }
    if (circleRef.current) {
      circleRef.current.setLatLng([lat, lng]);
    }
  }, [lat, lng, locationName]);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;
    setIsSearching(true);
    const results = await searchLocation(searchQuery);
    setSearchResults(results);
    setIsSearching(false);
  };

  const handleSelectResult = (res: { name: string; lat: number; lng: number }) => {
    const cleanName = res.name.split(',').slice(0, 2).join(',');
    onLocationSelect(res.lat, res.lng, cleanName);
    setSearchResults([]);
    setSearchQuery('');
  };

  const handleLocateMe = () => {
    if (!navigator.geolocation) {
      alert('Geolocation not supported');
      return;
    }
    setIsLocating(true);
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const cLat = +pos.coords.latitude.toFixed(4);
        const cLng = +pos.coords.longitude.toFixed(4);
        const placeName = await reverseGeocode(cLat, cLng);
        onLocationSelect(cLat, cLng, placeName);
        setIsLocating(false);
      },
      () => {
        setIsLocating(false);
        alert('Could not retrieve GPS position.');
      },
      { timeout: 10000, enableHighAccuracy: true }
    );
  };

  return (
    <div className="rounded-2xl border border-slate-200 overflow-hidden bg-white shadow-sm space-y-2 p-3">
      {/* Controls Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
        <form onSubmit={handleSearch} className="relative flex-1 flex items-center gap-2">
          <div className="relative flex-1">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={isHi ? 'गाँव, तहसील या शहर खोजें...' : 'Search village, town, district...'}
              className="w-full h-9 pl-8 pr-3 rounded-xl bg-slate-50 border border-slate-200 text-xs font-headline focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-3" />
          </div>

          <button
            type="submit"
            disabled={isSearching}
            className="h-9 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-headline font-bold flex items-center gap-1 cursor-pointer flex-shrink-0"
          >
            {isSearching ? <Loader2 className="w-3 h-3 animate-spin" /> : null}
            <span>{isHi ? 'खोजें' : 'Search'}</span>
          </button>

          <button
            type="button"
            onClick={handleLocateMe}
            disabled={isLocating}
            className="h-9 px-2.5 rounded-xl bg-slate-100 hover:bg-emerald-50 text-emerald-800 text-xs font-headline font-bold flex items-center gap-1 border border-emerald-200 cursor-pointer flex-shrink-0"
            title="GPS Locate"
          >
            {isLocating ? <Loader2 className="w-3.5 h-3.5 animate-spin text-emerald-600" /> : <Crosshair className="w-3.5 h-3.5 text-emerald-600" />}
            <span className="hidden sm:inline">GPS</span>
          </button>
        </form>

        <div className="flex items-center gap-2 self-start sm:self-auto flex-shrink-0">
          <div className="inline-flex rounded-lg p-0.5 bg-slate-100 border border-slate-200 text-[11px] font-headline font-bold">
            <button
              type="button"
              onClick={() => setMapType('street')}
              className={`px-2.5 py-1 rounded-md transition-all cursor-pointer ${
                mapType === 'street' ? 'bg-white text-slate-900 shadow-2xs' : 'text-slate-600'
              }`}
            >
              Map
            </button>
            <button
              type="button"
              onClick={() => setMapType('satellite')}
              className={`px-2.5 py-1 rounded-md transition-all cursor-pointer ${
                mapType === 'satellite' ? 'bg-white text-slate-900 shadow-2xs' : 'text-slate-600'
              }`}
            >
              Satellite
            </button>
          </div>
        </div>
      </div>

      {/* Autocomplete dropdown */}
      {searchResults.length > 0 && (
        <div className="bg-white rounded-xl shadow-lg border border-slate-200 divide-y divide-slate-100 max-h-40 overflow-y-auto">
          {searchResults.map((res, idx) => (
            <button
              key={idx}
              type="button"
              onClick={() => handleSelectResult(res)}
              className="w-full text-left p-2 hover:bg-emerald-50 text-xs font-headline text-slate-800 flex items-center gap-2 transition-colors cursor-pointer"
            >
              <MapPin className="w-3.5 h-3.5 text-emerald-600 flex-shrink-0" />
              <span className="truncate">{res.name}</span>
            </button>
          ))}
        </div>
      )}

      {/* Map Canvas */}
      <div className="relative rounded-xl overflow-hidden border border-slate-200 h-52 sm:h-64 w-full bg-slate-900">
        <div ref={mapContainerRef} className="w-full h-full" />
        <div className="absolute top-2 right-2 pointer-events-none z-20">
          <span className="bg-black/75 backdrop-blur-xs text-white text-[10px] px-2.5 py-1 rounded-full font-headline font-semibold flex items-center gap-1.5 shadow-sm">
            <Sparkles className="w-3 h-3 text-emerald-400" />
            <span>{isHi ? 'पिन खींचें या नक्शे पर क्लिक करें' : 'Drag green pin to farm'}</span>
          </span>
        </div>
      </div>
    </div>
  );
};
