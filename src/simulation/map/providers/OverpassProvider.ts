export interface OSMElement {
  type: 'node' | 'way' | 'relation';
  id: number;
  lat?: number;
  lon?: number;
  tags?: Record<string, string>;
  nodes?: number[];
  members?: { type: string; ref: number; role: string }[];
}

export interface OSMResponse {
  elements: OSMElement[];
}

export async function fetchOSMData(
  lat: number,
  lng: number,
  radiusMeters: number = 800
): Promise<OSMResponse> {
  const query = `
    [out:json][timeout:25];
    (
      way["highway"](around:${radiusMeters},${lat},${lng});
      way["building"](around:${radiusMeters},${lat},${lng});
      node["highway"="traffic_signals"](around:${radiusMeters},${lat},${lng});
      node["highway"="crossing"](around:${radiusMeters},${lat},${lng});
      way["leisure"="park"](around:${radiusMeters},${lat},${lng});
      way["landuse"="grass"](around:${radiusMeters},${lat},${lng});
      node["natural"="tree"](around:${radiusMeters},${lat},${lng});
      way["natural"="water"](around:${radiusMeters},${lat},${lng});
    );
    out body;
    >;
    out skel qt;
  `;

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 25000);

  try {
    const response = await fetch('https://overpass-api.de/api/interpreter', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: `data=${encodeURIComponent(query)}`,
      signal: controller.signal
    });

    if (!response.ok) {
      throw new Error(`Overpass API error: ${response.status} ${response.statusText}`);
    }

    return await response.json();
  } finally {
    clearTimeout(timeoutId);
  }
}
