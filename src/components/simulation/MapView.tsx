import React, { useEffect, useRef } from 'react';
import L from 'leaflet';
import { useSimulationStore } from '../../stores';

interface MapViewProps {
  onSelectRegion: (scenarioId: string, regionName: string) => void;
}

interface AdamaCheckpoint {
  id: string;
  scenarioId: string;
  name: string;
  category: string;
  status: string;
  color: 'primary' | 'tertiary' | 'secondary' | 'error' | 'pink';
  icon: string;
  lat: number;
  lng: number;
}

const ADAMA_CHECKPOINTS: AdamaCheckpoint[] = [
  {
    id: 'astu',
    scenarioId: 'normal',
    name: 'ASTU Tech Hub',
    category: 'Science & Tech University',
    status: 'Autonomous Pilot Zone',
    color: 'primary',
    icon: 'school',
    lat: 8.5638,
    lng: 39.2905,
  },
  {
    id: 'expressway',
    scenarioId: 'rush_hour',
    name: 'Addis-Adama Toll Gate',
    category: 'Expressway Ingress',
    status: 'Freight Flow: Heavy',
    color: 'secondary',
    icon: 'toll',
    lat: 8.5620,
    lng: 39.2450,
  },
  {
    id: 'posta_bet',
    scenarioId: 'accident',
    name: 'Posta Bet Roundabout',
    category: 'City Center Hub',
    status: 'Gridlock Risk: High',
    color: 'tertiary',
    icon: 'traffic',
    lat: 8.5415,
    lng: 39.2705,
  },
  {
    id: 'hospital',
    scenarioId: 'emergency',
    name: 'Adama General Hospital',
    category: 'Medical Center',
    status: 'Emergency Corridor',
    color: 'pink',
    icon: 'local_hospital',
    lat: 8.5320,
    lng: 39.2610,
  },
  {
    id: 'wonji',
    scenarioId: 'road_closure',
    name: 'Wonji Freight Corridor',
    category: 'Industrial South',
    status: 'Detour Active',
    color: 'error',
    icon: 'factory',
    lat: 8.5080,
    lng: 39.2820,
  },
  {
    id: 'geda_plaza',
    scenarioId: 'normal',
    name: 'Aba Geda Commercial Plaza',
    category: 'Commercial Hub',
    status: 'Flow: Optimal',
    color: 'primary',
    icon: 'storefront',
    lat: 8.5480,
    lng: 39.2780,
  },
  {
    id: 'franco',
    scenarioId: 'rush_hour',
    name: 'Franco Transit Depot',
    category: 'Railway Junction',
    status: 'Multimodal Transit',
    color: 'secondary',
    icon: 'train',
    lat: 8.5360,
    lng: 39.2850,
  },
];

export const MapView: React.FC<MapViewProps> = ({ onSelectRegion }) => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const { setSelectedRoadId, setSelectedVehicleId } = useSimulationStore();

  useEffect(() => {
    if (!mapContainerRef.current) return;

    // Adama City Center coordinates
    const adamaCenter: L.LatLngTuple = [8.5400, 39.2700];

    // Bounding Box strictly locking map to Adama City limits
    const southWest = L.latLng(8.4600, 39.1800);
    const northEast = L.latLng(8.6200, 39.3600);
    const adamaBounds = L.latLngBounds(southWest, northEast);

    const map = L.map(mapContainerRef.current, {
      center: adamaCenter,
      zoom: 13,
      minZoom: 12,
      maxZoom: 17,
      maxBounds: adamaBounds,
      maxBoundsViscosity: 1.0, // Hard bounce prevention: cannot pan outside Adama
      zoomControl: false,
      attributionControl: false,
    });

    mapInstanceRef.current = map;

    // Dark Matter tile layer for cyberpunk satellite street grid
    L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
      subdomains: 'abcd',
      maxZoom: 19,
    }).addTo(map);

    // Glowing Neon Traffic Arterials overlay on real Adama roads
    // 1. Addis-Adama Expressway corridor
    L.polyline([
      [8.5800, 39.2200],
      [8.5620, 39.2450],
      [8.5490, 39.2610],
      [8.5415, 39.2705],
    ], {
      color: '#4cd7f6',
      weight: 4,
      opacity: 0.85,
      dashArray: '8, 8',
    }).addTo(map);

    // 2. Wonji Road corridor (South)
    L.polyline([
      [8.5415, 39.2705],
      [8.5280, 39.2750],
      [8.5080, 39.2820],
      [8.4850, 39.2900],
    ], {
      color: '#ffb873',
      weight: 4,
      opacity: 0.8,
    }).addTo(map);

    // 3. ASTU / Dire Dawa Highway East Arterial
    L.polyline([
      [8.5415, 39.2705],
      [8.5480, 39.2780],
      [8.5560, 39.2840],
      [8.5638, 39.2905],
      [8.5750, 39.3100],
    ], {
      color: '#b4c5ff',
      weight: 3.5,
      opacity: 0.85,
    }).addTo(map);

    // 4. Hospital Emergency Spur
    L.polyline([
      [8.5415, 39.2705],
      [8.5360, 39.2650],
      [8.5320, 39.2610],
    ], {
      color: '#f472b6',
      weight: 4,
      opacity: 0.9,
    }).addTo(map);

    // Create interactive markers for Adama checkpoints
    ADAMA_CHECKPOINTS.forEach((cp) => {
      const pulseColorClass = cp.color === 'primary' 
        ? 'map-pulse bg-primary text-primary border-primary' 
        : cp.color === 'tertiary' 
        ? 'map-pulse-amber bg-tertiary text-tertiary border-tertiary' 
        : cp.color === 'secondary'
        ? 'map-pulse-secondary bg-secondary text-secondary border-secondary'
        : cp.color === 'pink'
        ? 'map-pulse bg-[#f472b6] text-[#f472b6] border-[#f472b6]'
        : 'map-pulse bg-error text-error border-error';

      const customHtml = `
        <div class="group flex flex-col items-center justify-center -translate-x-1/2 -translate-y-1/2 cursor-pointer select-none">
          <div class="w-4 h-4 rounded-full ${pulseColorClass} mb-1.5 border-2 border-background shadow-lg"></div>
          <div class="bg-[#12131a]/95 backdrop-blur-md border border-outline-variant px-2.5 py-1 rounded text-center shadow-xl group-hover:border-primary group-hover:scale-105 transition-all min-w-[130px]">
            <div class="font-mono text-[11px] font-bold text-on-surface flex items-center justify-center gap-1">
              <span class="material-symbols-outlined text-[13px] ${cp.color === 'primary' ? 'text-primary' : cp.color === 'tertiary' ? 'text-tertiary' : cp.color === 'pink' ? 'text-[#f472b6]' : 'text-secondary'}">${cp.icon}</span>
              ${cp.name}
            </div>
            <div class="text-[10px] text-on-surface-variant mt-0.5">${cp.status}</div>
          </div>
        </div>
      `;

      const markerIcon = L.divIcon({
        html: customHtml,
        className: 'custom-adama-marker',
        iconSize: [140, 50],
        iconAnchor: [70, 25],
      });

      const marker = L.marker([cp.lat, cp.lng], { icon: markerIcon }).addTo(map);

      marker.on('click', () => {
        setSelectedRoadId(null);
        setSelectedVehicleId(null);
        onSelectRegion(cp.scenarioId, cp.name);
      });
    });

    return () => {
      map.remove();
      mapInstanceRef.current = null;
    };
  }, [onSelectRegion, setSelectedRoadId, setSelectedVehicleId]);

  const handleRecenterAdama = () => {
    mapInstanceRef.current?.setView([8.5400, 39.2700], 13);
  };

  const handleZoomIn = () => {
    mapInstanceRef.current?.zoomIn();
  };

  const handleZoomOut = () => {
    mapInstanceRef.current?.zoomOut();
  };

  return (
    <div className="relative w-full h-full bg-[#12131a] overflow-hidden select-none">
      {/* Real Leaflet Map Container */}
      <div ref={mapContainerRef} className="w-full h-full z-0" />

      {/* Top Header Region Telemetry HUD */}
      <div className="absolute top-md left-md z-20 bg-surface-container/90 backdrop-blur-md border border-outline-variant px-md py-sm rounded flex items-center gap-3 shadow-lg pointer-events-auto">
        <div className="flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full bg-primary glow-cyan animate-ping" />
          <span className="font-label-caps text-label-caps text-primary">MUNICIPAL SURVEILLANCE GRID</span>
        </div>
        <div className="w-px h-4 bg-outline-variant" />
        <div className="font-data-sm text-[12px] text-on-surface flex items-center gap-1 font-mono">
          <span className="text-tertiary">ADAMA CITY</span> (Nazret), Oromia • 8.54°N, 39.27°E
        </div>
      </div>

      {/* Floating Map Navigation Toolbar */}
      <div className="absolute top-md right-md flex flex-col gap-xs z-20 bg-surface-container/90 backdrop-blur-md border border-outline-variant rounded p-1 shadow-[0_4px_16px_rgba(0,0,0,0.6)]">
        <button
          onClick={handleZoomIn}
          className="p-1.5 text-on-surface hover:text-primary rounded hover:bg-surface-variant transition-colors flex items-center justify-center"
          title="Zoom In"
        >
          <span className="material-symbols-outlined text-[18px]">add</span>
        </button>
        <div className="w-full h-px bg-outline-variant/60 my-0.5" />
        <button
          onClick={handleZoomOut}
          className="p-1.5 text-on-surface hover:text-primary rounded hover:bg-surface-variant transition-colors flex items-center justify-center"
          title="Zoom Out"
        >
          <span className="material-symbols-outlined text-[18px]">remove</span>
        </button>
        <div className="w-full h-px bg-outline-variant/60 my-0.5" />
        <button
          onClick={handleRecenterAdama}
          className="p-1.5 text-on-surface hover:text-primary rounded hover:bg-surface-variant transition-colors flex items-center justify-center"
          title="Recenter Adama Metro"
        >
          <span className="material-symbols-outlined text-[18px]">my_location</span>
        </button>
      </div>

      {/* Bottom Adama Dispatch Legend Banner */}
      <div className="absolute bottom-md left-md z-10 bg-surface-container/85 backdrop-blur-md border border-outline-variant rounded px-md py-sm max-w-md shadow-lg pointer-events-none">
        <div className="font-label-caps text-label-caps text-primary flex items-center gap-1.5">
          <span className="material-symbols-outlined text-[15px]">lock</span>
          ADAMA CITY BOUNDARY LOCK: ACTIVE
        </div>
        <p className="text-[12px] text-on-surface-variant mt-1 leading-relaxed">
          The simulation is locked to the Adama metropolitan grid. Select checkpoints (ASTU, Expressway Toll, Posta Bet, Wonji, Hospital) to launch real-time vehicle flow optimization and emergency routing.
        </p>
      </div>
    </div>
  );
};
