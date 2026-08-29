import React, { useEffect, useRef, useState, useCallback, memo } from 'react';
import L from 'leaflet';
import { useSimulationStore } from '../../stores';
import { IncidentType, IncidentSeverity } from '../../types';

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

const ACTIVE_INCIDENTS = [
  {
    id: 'inc-1',
    type: IncidentType.ACCIDENT,
    severity: IncidentSeverity.SEVERE,
    lat: 8.5415,
    lng: 39.2705,
    description: 'Multi-vehicle collision',
    reportedAt: Date.now() - 1000 * 60 * 15,
    assignedUnits: ['Unit-4', 'Ambulance-1'],
    roadId: null,
    estimatedClearanceMinutes: 45
  },
  {
    id: 'inc-2',
    type: IncidentType.ROAD_CLOSURE,
    severity: IncidentSeverity.MODERATE,
    lat: 8.5080,
    lng: 39.2820,
    description: 'Road closure: bridge maintenance',
    reportedAt: Date.now() - 1000 * 60 * 120,
    assignedUnits: ['Eng-Crew-B'],
    roadId: null,
    estimatedClearanceMinutes: 180
  },
  {
    id: 'inc-3',
    type: IncidentType.ACCIDENT,
    severity: IncidentSeverity.CRITICAL,
    lat: 8.5638,
    lng: 39.2905,
    description: 'Emergency: medical response needed',
    reportedAt: Date.now() - 1000 * 60 * 5,
    assignedUnits: ['Ambulance-2', 'Fire-1'],
    roadId: null,
    estimatedClearanceMinutes: 60
  }
];

export const MapView: React.FC<MapViewProps> = memo(({ onSelectRegion }) => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const baseTileLayerRef = useRef<L.TileLayer | null>(null);
  const labelsLayerRef = useRef<L.TileLayer | null>(null);
  const operatorMarkerRef = useRef<L.Marker | null>(null);
  const operatorCircleRef = useRef<L.Circle | null>(null);
  const onSelectRegionRef = useRef(onSelectRegion);

  useEffect(() => {
    onSelectRegionRef.current = onSelectRegion;
  }, [onSelectRegion]);

  const {
    setSelectedRoadId,
    setSelectedVehicleId,
    mapLayerType,
    setMapLayerType,
    operatorId,
    operatorLocation,
    setOperatorLocation,
  } = useSimulationStore();

  const [gpsStatus, setGpsStatus] = useState<'acquiring' | 'locked' | 'simulated'>('acquiring');

  // Switch tile layers without destroying the map
  const applyTileLayer = useCallback((layerType: 'dark' | 'satellite' | 'hybrid') => {
    const map = mapInstanceRef.current;
    if (!map) return;

    if (baseTileLayerRef.current) {
      map.removeLayer(baseTileLayerRef.current);
      baseTileLayerRef.current = null;
    }
    if (labelsLayerRef.current) {
      map.removeLayer(labelsLayerRef.current);
      labelsLayerRef.current = null;
    }

    if (layerType === 'dark') {
      baseTileLayerRef.current = L.tileLayer(
        'https://tile.openstreetmap.org/{z}/{x}/{y}.png',
        {
          maxZoom: 19,
          className: 'cyber-dark-tiles',
        }
      ).addTo(map);
    } else if (layerType === 'satellite') {
      baseTileLayerRef.current = L.tileLayer(
        'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
        {
          maxZoom: 19,
          className: 'satellite-tiles',
        }
      ).addTo(map);
    } else if (layerType === 'hybrid') {
      baseTileLayerRef.current = L.tileLayer(
        'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
        {
          maxZoom: 19,
          className: 'satellite-tiles',
        }
      ).addTo(map);

      labelsLayerRef.current = L.tileLayer(
        'https://tile.openstreetmap.org/{z}/{x}/{y}.png',
        {
          maxZoom: 19,
          opacity: 0.65,
          className: 'hybrid-labels',
        }
      ).addTo(map);
    }
  }, []);

  // Initialize Map ONCE on mount
  useEffect(() => {
    if (!mapContainerRef.current || mapInstanceRef.current) return;

    const adamaCenter: L.LatLngTuple = [8.5400, 39.2700];
    const southWest = L.latLng(8.4600, 39.1800);
    const northEast = L.latLng(8.6200, 39.3600);
    const adamaBounds = L.latLngBounds(southWest, northEast);

    const map = L.map(mapContainerRef.current, {
      center: adamaCenter,
      zoom: 13,
      minZoom: 12,
      maxZoom: 18,
      maxBounds: adamaBounds,
      maxBoundsViscosity: 1.0,
      zoomControl: false,
      attributionControl: false,
    });

    mapInstanceRef.current = map;

    // Apply initial layer
    applyTileLayer(mapLayerType);

    // Ensure map tiles size correctly on mount
    setTimeout(() => {
      map.invalidateSize();
    }, 150);

    // Glowing Neon Traffic Arterials
    L.polyline([
      [8.5800, 39.2200],
      [8.5620, 39.2450],
      [8.5490, 39.2610],
      [8.5415, 39.2705],
    ], {
      color: '#4cd7f6',
      weight: 4,
      opacity: 0.9,
      dashArray: '8, 8',
    }).addTo(map);

    L.polyline([
      [8.5415, 39.2705],
      [8.5280, 39.2750],
      [8.5080, 39.2820],
      [8.4850, 39.2900],
    ], {
      color: '#ffb873',
      weight: 4,
      opacity: 0.85,
    }).addTo(map);

    L.polyline([
      [8.5415, 39.2705],
      [8.5480, 39.2780],
      [8.5560, 39.2840],
      [8.5638, 39.2905],
      [8.5750, 39.3100],
    ], {
      color: '#b4c5ff',
      weight: 3.5,
      opacity: 0.9,
    }).addTo(map);

    L.polyline([
      [8.5415, 39.2705],
      [8.5360, 39.2650],
      [8.5320, 39.2610],
    ], {
      color: '#f472b6',
      weight: 4,
      opacity: 0.9,
    }).addTo(map);

    // Create Checkpoint Markers
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
        onSelectRegionRef.current(cp.scenarioId, cp.name);
      });
    });

    // Create Incident Markers
    ACTIVE_INCIDENTS.forEach((incident) => {
      const customHtml = `
        <div class="group flex flex-col items-center justify-center -translate-x-1/2 -translate-y-1/2 cursor-pointer select-none">
          <div class="w-5 h-5 rounded-full map-pulse bg-error text-error border-2 border-background shadow-lg mb-1.5 flex items-center justify-center">
            <span class="material-symbols-outlined text-[12px] text-on-primary">warning</span>
          </div>
          <div class="bg-[#12131a]/95 backdrop-blur-md border border-error px-2.5 py-1 rounded text-center shadow-xl group-hover:bg-error/10 group-hover:scale-105 transition-all min-w-[150px]">
            <div class="font-mono text-[11px] font-bold text-error flex items-center justify-center gap-1">
              ${incident.description}
            </div>
            <div class="text-[10px] text-error mt-0.5">CLICK TO SIMULATE</div>
          </div>
        </div>
      `;

      const markerIcon = L.divIcon({
        html: customHtml,
        className: 'custom-incident-marker z-30',
        iconSize: [160, 60],
        iconAnchor: [80, 30],
      });

      const marker = L.marker([incident.lat, incident.lng], { icon: markerIcon }).addTo(map);

      marker.on('click', () => {
        setSelectedRoadId(null);
        setSelectedVehicleId(null);
        useSimulationStore.getState().enterIncidentSimulation(incident);
      });
    });

    // Detect Operator GPS Location
    if ('geolocation' in navigator) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const lat = pos.coords.latitude;
          const lng = pos.coords.longitude;
          const accuracy = pos.coords.accuracy || 15;

          const isNearAdama = lat >= 8.46 && lat <= 8.62 && lng >= 39.18 && lng <= 39.36;
          const opLat = isNearAdama ? lat : 8.5410;
          const opLng = isNearAdama ? lng : 39.2690;

          setOperatorLocation({
            lat: opLat,
            lng: opLng,
            accuracy,
            source: isNearAdama ? 'gps' : 'simulated',
          });
          setGpsStatus(isNearAdama ? 'locked' : 'simulated');
        },
        () => {
          setOperatorLocation({
            lat: 8.5410,
            lng: 39.2690,
            accuracy: 25,
            source: 'simulated',
          });
          setGpsStatus('simulated');
        },
        { enableHighAccuracy: true, timeout: 5000 }
      );
    } else {
      setOperatorLocation({
        lat: 8.5410,
        lng: 39.2690,
        accuracy: 25,
        source: 'simulated',
      });
      setGpsStatus('simulated');
    }

    return () => {
      map.remove();
      mapInstanceRef.current = null;
      baseTileLayerRef.current = null;
      labelsLayerRef.current = null;
      operatorMarkerRef.current = null;
      operatorCircleRef.current = null;
    };
  }, []); // Run ONLY once on mount!

  // Update map tile layers when mapLayerType changes
  useEffect(() => {
    if (mapInstanceRef.current) {
      applyTileLayer(mapLayerType);
    }
  }, [mapLayerType, applyTileLayer]);

  // Update Operator Glowing Blue Dot Marker whenever operatorLocation changes
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map || !operatorLocation) return;

    if (operatorMarkerRef.current) {
      map.removeLayer(operatorMarkerRef.current);
    }
    if (operatorCircleRef.current) {
      map.removeLayer(operatorCircleRef.current);
    }

    // Glowing Blue Dot Icon with Concentric Radar Wave
    const blueDotHtml = `
      <div class="relative flex items-center justify-center -translate-x-1/2 -translate-y-1/2 cursor-pointer group">
        <div class="absolute w-8 h-8 rounded-full bg-[#00e5ff]/30 animate-ping"></div>
        <div class="absolute w-5 h-5 rounded-full bg-[#00e5ff]/40 shadow-[0_0_12px_#00e5ff]"></div>
        <div class="w-3.5 h-3.5 rounded-full bg-[#00e5ff] border-2 border-white shadow-[0_0_16px_#00e5ff]"></div>
      </div>
    `;

    const blueDotIcon = L.divIcon({
      html: blueDotHtml,
      className: 'operator-blue-dot',
      iconSize: [32, 32],
      iconAnchor: [16, 16],
    });

    const marker = L.marker([operatorLocation.lat, operatorLocation.lng], {
      icon: blueDotIcon,
      zIndexOffset: 1000,
    }).addTo(map);

    marker.bindPopup(`
      <div style="background: #12131a; color: #e3e1ec; padding: 6px; font-family: 'JetBrains Mono', monospace; font-size: 11px; border-radius: 4px; border: 1px solid #3d494c;">
        <div style="color: #4cd7f6; font-weight: bold; margin-bottom: 2px;">OPERATOR POSITION [GPS]</div>
        <div>Badge: #${operatorId}</div>
        <div>Coords: ${operatorLocation.lat.toFixed(4)}°N, ${operatorLocation.lng.toFixed(4)}°E</div>
        <div style="color: #869397; font-size: 10px; margin-top: 2px;">Accuracy: ±${Math.round(operatorLocation.accuracy || 10)}m</div>
      </div>
    `);

    const circle = L.circle([operatorLocation.lat, operatorLocation.lng], {
      radius: operatorLocation.accuracy || 40,
      color: '#00e5ff',
      fillColor: '#00e5ff',
      fillOpacity: 0.1,
      weight: 1,
      dashArray: '3, 3',
    }).addTo(map);

    operatorMarkerRef.current = marker;
    operatorCircleRef.current = circle;
  }, [operatorLocation, operatorId]);

  const handleLayerChange = (type: 'dark' | 'satellite' | 'hybrid') => {
    setMapLayerType(type);
  };

  const handleRecenterAdama = () => {
    mapInstanceRef.current?.setView([8.5400, 39.2700], 13);
  };

  const handleLocateOperator = () => {
    if (operatorLocation && mapInstanceRef.current) {
      mapInstanceRef.current.flyTo([operatorLocation.lat, operatorLocation.lng], 15, {
        duration: 1.2,
      });
      operatorMarkerRef.current?.openPopup();
    }
  };

  const handleZoomIn = () => {
    mapInstanceRef.current?.zoomIn();
  };

  const handleZoomOut = () => {
    mapInstanceRef.current?.zoomOut();
  };

  return (
    <div className="relative w-full h-full bg-[#0a0a0f] overflow-hidden select-none">
      {/* Real Map Container */}
      <div ref={mapContainerRef} className="w-full h-full z-0" />

      {/* Top Header Region & Operator Telemetry HUD */}
      <div className="absolute top-md left-md z-20 bg-surface-container/90 backdrop-blur-md border border-outline-variant px-md py-sm rounded flex items-center gap-3 shadow-lg pointer-events-auto">
        <div className="flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full bg-[#00e5ff] glow-cyan animate-ping" />
          <span className="font-label-caps text-label-caps text-primary">MUNICIPAL SURVEILLANCE GRID</span>
        </div>
        <div className="w-px h-4 bg-outline-variant" />
        <div className="font-data-sm text-[12px] text-on-surface flex items-center gap-1 font-mono">
          <span className="text-tertiary">ADAMA CITY</span> (Nazret) • 8.54°N, 39.27°E
        </div>
        <div className="w-px h-4 bg-outline-variant" />
        <div className="flex items-center gap-1 text-[11px] font-mono">
          <span className={`w-2 h-2 rounded-full ${gpsStatus === 'locked' ? 'bg-[#00e5ff] shadow-[0_0_6px_#00e5ff]' : 'bg-emerald-400'}`} />
          <span className="text-[#00e5ff] font-bold">OP #{operatorId}</span>
          <span className="text-on-surface-variant">({gpsStatus.toUpperCase()})</span>
        </div>
      </div>

      {/* Floating Map Layer Switcher (Dark / Satellite / Hybrid) */}
      <div className="absolute top-md left-1/2 -translate-x-1/2 z-20 bg-surface-container/95 backdrop-blur-md border border-outline-variant rounded p-1 shadow-2xl flex items-center gap-1 font-data-sm text-[12px] font-mono">
        <button
          onClick={() => handleLayerChange('dark')}
          className={`px-3 py-1 rounded flex items-center gap-1.5 transition-all ${
            mapLayerType === 'dark'
              ? 'bg-primary text-on-primary font-bold shadow-[0_0_8px_rgba(76,215,246,0.5)]'
              : 'text-on-surface-variant hover:text-on-surface hover:bg-surface-variant'
          }`}
          title="High-contrast Dark Street Map"
        >
          <span className="material-symbols-outlined text-[14px]">dark_mode</span>
          Dark
        </button>
        <button
          onClick={() => handleLayerChange('satellite')}
          className={`px-3 py-1 rounded flex items-center gap-1.5 transition-all ${
            mapLayerType === 'satellite'
              ? 'bg-primary text-on-primary font-bold shadow-[0_0_8px_rgba(76,215,246,0.5)]'
              : 'text-on-surface-variant hover:text-on-surface hover:bg-surface-variant'
          }`}
          title="Satellite Imagery"
        >
          <span className="material-symbols-outlined text-[14px]">satellite_alt</span>
          Satellite
        </button>
        <button
          onClick={() => handleLayerChange('hybrid')}
          className={`px-3 py-1 rounded flex items-center gap-1.5 transition-all ${
            mapLayerType === 'hybrid'
              ? 'bg-primary text-on-primary font-bold shadow-[0_0_8px_rgba(76,215,246,0.5)]'
              : 'text-on-surface-variant hover:text-on-surface hover:bg-surface-variant'
          }`}
          title="Satellite with Road & Street Labels"
        >
          <span className="material-symbols-outlined text-[14px]">layers</span>
          Hybrid
        </button>
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
        <div className="w-full h-px bg-outline-variant/60 my-0.5" />
        <button
          onClick={handleLocateOperator}
          className="p-1.5 text-[#00e5ff] hover:bg-surface-variant rounded transition-colors flex items-center justify-center"
          title="Locate Operator (GPS)"
        >
          <span className="material-symbols-outlined text-[18px]">person_pin_circle</span>
        </button>
      </div>

      {/* Bottom Adama Dispatch Legend Banner */}
      <div className="absolute bottom-md left-md z-10 bg-surface-container/85 backdrop-blur-md border border-outline-variant rounded px-md py-sm max-w-md shadow-lg pointer-events-none font-mono">
        <div className="font-label-caps text-label-caps text-primary flex items-center gap-1.5">
          <span className="material-symbols-outlined text-[15px]">lock</span>
          ADAMA JURISDICTION LOCK // OPERATOR #{operatorId}
        </div>
        <p className="text-[12px] text-on-surface-variant mt-1 leading-relaxed">
          Active tactical grid locked to Adama municipal limits. Blue beacon indicates current operator telemetry fix. Click any checkpoint (ASTU, Expressway Toll, Posta Bet, Wonji) to launch simulation.
        </p>
      </div>
    </div>
  );
});

MapView.displayName = 'MapView';
