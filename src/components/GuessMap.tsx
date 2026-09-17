import React, { useEffect, useRef, useState, useCallback } from 'react';
import L from 'leaflet';
import { TRANSLATIONS, Language } from '../utils/i18n';
import { 
  Maximize2, 
  Minimize2, 
  Layers, 
  MapPin, 
  CheckCircle2,
  Crosshair
} from 'lucide-react';

interface GuessMapProps {
  lang: Language;
  selectedGuess: { lat: number; lng: number } | null;
  onSelectGuess: (coords: { lat: number; lng: number }) => void;
  onSubmitGuess: () => void;
  disabled?: boolean;
  actualLocation?: { lat: number; lng: number; title: string } | null;
  showResult?: boolean;
  initialCenter?: [number, number];
  initialZoom?: number;
}

export const GuessMap: React.FC<GuessMapProps> = ({
  lang,
  selectedGuess,
  onSelectGuess,
  onSubmitGuess,
  disabled = false,
  actualLocation = null,
  showResult = false,
  initialCenter = [31.7917, -7.0926], // Center of Morocco
  initialZoom = 6
}) => {
  const t = TRANSLATIONS[lang];
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<L.Map | null>(null);
  const guessMarkerRef = useRef<L.Marker | null>(null);
  const actualMarkerRef = useRef<L.Marker | null>(null);
  const polylineRef = useRef<L.Polyline | null>(null);

  const [isExpanded, setIsExpanded] = useState(false);
  const [mapType, setMapType] = useState<'streets' | 'satellite'>('streets');

  // Custom icons
  const createGuessIcon = useCallback(() => {
    return L.divIcon({
      className: 'custom-guess-marker',
      html: `
        <div style="position: relative; display: flex; align-items: center; justify-content: center;">
          <div style="position: absolute; width: 34px; height: 34px; border-radius: 50%; background: rgba(239, 68, 68, 0.3); animation: marker-pulse 1.8s infinite ease-in-out;"></div>
          <div style="width: 24px; height: 24px; border-radius: 50%; background: #ef4444; border: 3px solid #ffffff; box-shadow: 0 4px 12px rgba(0,0,0,0.5); display: flex; align-items: center; justify-content: center;">
            <div style="width: 6px; height: 6px; border-radius: 50%; background: #ffffff;"></div>
          </div>
        </div>
      `,
      iconSize: [34, 34],
      iconAnchor: [17, 17]
    });
  }, []);

  const createActualIcon = useCallback(() => {
    return L.divIcon({
      className: 'custom-actual-marker',
      html: `
        <div style="position: relative; display: flex; align-items: center; justify-content: center;">
          <div style="position: absolute; width: 36px; height: 36px; border-radius: 50%; background: rgba(16, 185, 129, 0.35); animation: marker-pulse 1.8s infinite ease-in-out;"></div>
          <div style="width: 26px; height: 26px; border-radius: 50%; background: #059669; border: 3px solid #ffffff; box-shadow: 0 4px 12px rgba(0,0,0,0.5); display: flex; align-items: center; justify-content: center; color: #ffffff; font-size: 13px; font-weight: bold;">
            ★
          </div>
        </div>
      `,
      iconSize: [36, 36],
      iconAnchor: [18, 18]
    });
  }, []);

  // Initialize Map
  useEffect(() => {
    if (!mapContainerRef.current) return;

    const map = L.map(mapContainerRef.current, {
      center: initialCenter,
      zoom: initialZoom,
      zoomControl: false,
      attributionControl: false,
      maxBounds: [
        [20.5, -17.5], // Southwest of Morocco
        [36.5, -0.5]   // Northeast of Morocco
      ],
      minZoom: 5,
      maxZoom: 18
    });

    mapRef.current = map;

    // Default tile layer: CartoDB Positron / Voyager or OSM
    const streetLayer = L.tileLayer('https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png', {
      maxZoom: 19,
      subdomains: 'abcd'
    });
    streetLayer.addTo(map);

    // Map click handler
    map.on('click', (e: L.LeafletMouseEvent) => {
      if (disabled || showResult) return;
      onSelectGuess({ lat: e.latlng.lat, lng: e.latlng.lng });
    });

    return () => {
      map.remove();
      mapRef.current = null;
    };
  }, []);

  // Update Tile Layer when mapType changes
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    // Remove existing tile layers
    map.eachLayer((layer) => {
      if (layer instanceof L.TileLayer) {
        map.removeLayer(layer);
      }
    });

    if (mapType === 'satellite') {
      const satLayer = L.tileLayer(
        'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
        { maxZoom: 19 }
      );
      satLayer.addTo(map);
    } else {
      const streetLayer = L.tileLayer(
        'https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png',
        { maxZoom: 19, subdomains: 'abcd' }
      );
      streetLayer.addTo(map);
    }
  }, [mapType]);

  // Update Guess Marker
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    if (selectedGuess) {
      if (guessMarkerRef.current) {
        guessMarkerRef.current.setLatLng([selectedGuess.lat, selectedGuess.lng]);
      } else {
        guessMarkerRef.current = L.marker([selectedGuess.lat, selectedGuess.lng], {
          icon: createGuessIcon()
        }).addTo(map);
      }
    } else {
      if (guessMarkerRef.current) {
        map.removeLayer(guessMarkerRef.current);
        guessMarkerRef.current = null;
      }
    }
  }, [selectedGuess, createGuessIcon]);

  // Handle Result View (Show Actual Location + Line + Fit Bounds)
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    if (showResult && actualLocation) {
      // Add actual marker
      if (!actualMarkerRef.current) {
        actualMarkerRef.current = L.marker([actualLocation.lat, actualLocation.lng], {
          icon: createActualIcon()
        }).addTo(map);
      } else {
        actualMarkerRef.current.setLatLng([actualLocation.lat, actualLocation.lng]);
      }

      // If guess exists, draw polyline between guess and actual
      if (selectedGuess) {
        const latlngs: [number, number][] = [
          [selectedGuess.lat, selectedGuess.lng],
          [actualLocation.lat, actualLocation.lng]
        ];

        if (polylineRef.current) {
          polylineRef.current.setLatLngs(latlngs);
        } else {
          polylineRef.current = L.polyline(latlngs, {
            color: '#ef4444',
            weight: 3,
            dashArray: '6, 8',
            opacity: 0.85
          }).addTo(map);
        }

        // Fit bounds to show both pins comfortably
        const bounds = L.latLngBounds(latlngs);
        map.fitBounds(bounds, { padding: [50, 50], maxZoom: 15 });
      } else {
        map.setView([actualLocation.lat, actualLocation.lng], 13);
      }
    } else {
      // Clean up result layers when starting next round
      if (actualMarkerRef.current) {
        map.removeLayer(actualMarkerRef.current);
        actualMarkerRef.current = null;
      }
      if (polylineRef.current) {
        map.removeLayer(polylineRef.current);
        polylineRef.current = null;
      }
    }
  }, [showResult, actualLocation, selectedGuess, createActualIcon]);

  // Invalidate map size on expand/collapse
  useEffect(() => {
    const timer = setTimeout(() => {
      mapRef.current?.invalidateSize();
    }, 220);
    return () => clearTimeout(timer);
  }, [isExpanded]);

  const handleResetCenter = () => {
    mapRef.current?.setView(initialCenter, initialZoom);
  };

  return (
    <div 
      className={`relative transition-all duration-300 ease-out z-30 shadow-2xl rounded-2xl overflow-hidden border-2 border-zinc-800 hover:border-amber-500/40 bg-[#0c0f17] ${
        showResult
          ? 'w-full h-full border-none'
          : isExpanded
            ? 'w-[90vw] sm:w-[540px] md:w-[620px] h-[55vh] sm:h-[480px]'
            : 'w-[280px] sm:w-[340px] h-[220px] sm:h-[250px]'
      }`}
    >
      {/* Map DOM */}
      <div 
        ref={mapContainerRef} 
        id="guess-map-canvas" 
        className="w-full h-full"
      />

      {/* Floating Map Controls */}
      <div className="absolute top-3 left-3 z-[400] flex items-center gap-1.5 bg-[#0e121d]/90 backdrop-blur-md p-1.5 rounded-xl border border-zinc-700/70 shadow-lg">
        {/* Toggle Map / Satellite */}
        <button
          id="map-style-toggle-btn"
          onClick={() => setMapType(m => m === 'streets' ? 'satellite' : 'streets')}
          className="p-1.5 rounded-lg text-zinc-300 hover:text-amber-400 hover:bg-zinc-800/80 transition"
          title={t.streetSatelliteToggle}
        >
          <Layers className="w-4 h-4" />
        </button>

        {/* Reset Morocco Center */}
        <button
          id="map-recenter-btn"
          onClick={handleResetCenter}
          className="p-1.5 rounded-lg text-zinc-300 hover:text-amber-400 hover:bg-zinc-800/80 transition"
          title={t.allMorocco}
        >
          <Crosshair className="w-4 h-4" />
        </button>

        {/* Expand / Minimize toggle */}
        {!showResult && (
          <button
            id="map-expand-btn"
            onClick={() => setIsExpanded(e => !e)}
            className="p-1.5 rounded-lg text-zinc-300 hover:text-amber-400 hover:bg-zinc-800/80 transition"
            title={isExpanded ? t.collapseMap : t.expandMap}
          >
            {isExpanded ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
          </button>
        )}
      </div>

      {/* Map Layer Tag Indicator */}
      <div className="absolute top-3 right-3 z-[400] bg-[#0e121d]/90 backdrop-blur-md px-2.5 py-1 rounded-lg border border-amber-500/30 text-[11px] font-extrabold text-amber-400 pointer-events-none shadow-sm">
        {mapType === 'streets' ? (lang === 'ar' ? 'خريطة الشوارع' : 'Street Map') : (lang === 'ar' ? 'قمر اصطناعي' : 'Satellite')}
      </div>

      {/* Bottom Action Bar inside Map (Confirm Guess Button) */}
      {!showResult && (
        <div className="absolute inset-x-0 bottom-0 z-[400] p-3 bg-gradient-to-t from-[#0a0d14]/95 via-[#0a0d14]/75 to-transparent flex flex-col items-center pointer-events-auto">
          {selectedGuess ? (
            <button
              id="confirm-guess-btn"
              onClick={onSubmitGuess}
              disabled={disabled}
              className="w-full py-2.5 px-4 rounded-xl bg-gradient-to-r from-emerald-600 via-emerald-500 to-teal-500 hover:from-emerald-500 hover:to-teal-400 active:scale-[0.98] text-white font-black text-sm sm:text-base flex items-center justify-center gap-2 shadow-xl shadow-emerald-950/80 transition border border-emerald-400/50"
            >
              <CheckCircle2 className="w-5 h-5" />
              <span>{t.confirmGuess}</span>
            </button>
          ) : (
            <div className="flex items-center gap-2 text-xs font-bold text-zinc-200 bg-[#121622]/95 py-2 px-3.5 rounded-xl border border-zinc-700/80 shadow-lg">
              <MapPin className="w-4 h-4 text-rose-500 animate-bounce" />
              <span>{t.placePinHint}</span>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
