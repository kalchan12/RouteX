export interface WorldCoord {
  x: number;
  y: number;
  z?: number;
}

export function createENUProjection(centerLat: number, centerLng: number) {
  const R = 6378137; // Earth radius in meters
  const rad = Math.PI / 180;
  
  const centerLatRad = centerLat * rad;
  const centerLngRad = centerLng * rad;
  
  return {
    project(lat: number, lng: number): WorldCoord {
      const latRad = lat * rad;
      const lngRad = lng * rad;
      
      const x = R * (lngRad - centerLngRad) * Math.cos(centerLatRad);
      // Inverted Y so positive is south, matching screen coords usually, or standard ENU
      const y = R * (centerLatRad - latRad);
      
      return { x, y };
    },
    unproject(coord: WorldCoord): { lat: number; lng: number } {
      const { x, y } = coord;
      const dLat = -y / R;
      const dLng = x / (R * Math.cos(centerLatRad));
      
      return {
        lat: (centerLatRad + dLat) / rad,
        lng: (centerLngRad + dLng) / rad
      };
    }
  };
}
