// Maps abstraction - works with Leaflet OSM (free) or Google Maps (prod)
export interface LatLng {
  lat: number
  lng: number
}

export interface DistanceResult {
  km: number
  mins: number
}

// Accra spots for demo geocoding (when no API)
export const accraSpots: Record<string, LatLng> = {
  'east legon': { lat: 5.6365, lng: -0.1645 },
  'osu': { lat: 5.5560, lng: -0.1760 },
  'kaneshie': { lat: 5.5700, lng: -0.2330 },
  'madina': { lat: 5.6680, lng: -0.1660 },
  'airport': { lat: 5.6030, lng: -0.1770 },
  'circle': { lat: 5.5600, lng: -0.2050 },
  'tema': { lat: 5.6690, lng: 0.0000 },
  'dansoman': { lat: 5.5400, lng: -0.2680 },
  'legon': { lat: 5.6500, lng: -0.1860 },
  'teshie': { lat: 5.5800, lng: -0.1000 },
  'labone': { lat: 5.5800, lng: -0.1700 },
  'ridge': { lat: 5.5700, lng: -0.2000 },
  'spintex': { lat: 5.6200, lng: -0.1200 },
}

export function getMapProvider(): 'leaflet' | 'google' {
  return (process.env.NEXT_PUBLIC_MAP_PROVIDER as any) || 'leaflet'
}

// Geocode address to lat/lng
export async function geocode(address: string): Promise<LatLng> {
  const provider = getMapProvider()
  
  if (provider === 'google' && process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY) {
    try {
      const res = await fetch(
        `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(address + ', Accra, Ghana')}&key=${process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY}`
      )
      const data = await res.json()
      if (data.results && data.results[0]) {
        return {
          lat: data.results[0].geometry.location.lat,
          lng: data.results[0].geometry.location.lng,
        }
      }
    } catch (e) {
      console.error('Google geocode failed', e)
    }
  }
  
  // Fallback: OSM Nominatim (free, no key)
  try {
    const res = await fetch(
      `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(address + ', Accra, Ghana')}&limit=1`,
      { headers: { 'Accept-Language': 'en' } }
    )
    const data = await res.json()
    if (data && data[0]) {
      return { lat: parseFloat(data[0].lat), lng: parseFloat(data[0].lon) }
    }
  } catch (e) {
    console.error('OSM geocode failed', e)
  }
  
  // Final fallback: hardcoded Accra spots
  const lower = address.toLowerCase()
  for (const key in accraSpots) {
    if (lower.includes(key)) return accraSpots[key]
  }
  
  // Random around Accra
  return {
    lat: 5.6037 + (Math.random() - 0.5) * 0.2,
    lng: -0.1870 + (Math.random() - 0.5) * 0.2,
  }
}

// Get distance between two points
export async function getDistance(from: LatLng, to: LatLng): Promise<DistanceResult> {
  const provider = getMapProvider()
  
  if (provider === 'google' && process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY) {
    try {
      const res = await fetch(
        `https://maps.googleapis.com/maps/api/distancematrix/json?origins=${from.lat},${from.lng}&destinations=${to.lat},${to.lng}&key=${process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY}`
      )
      const data = await res.json()
      if (data.rows && data.rows[0] && data.rows[0].elements[0]) {
        const el = data.rows[0].elements[0]
        return {
          km: el.distance.value / 1000,
          mins: Math.round(el.duration.value / 60),
        }
      }
    } catch (e) {
      console.error('Google distance failed', e)
    }
  }
  
  // Fallback: Haversine
  const { haversineDistance } = await import('./pricing')
  const km = haversineDistance(from.lat, from.lng, to.lat, to.lng)
  const mins = Math.round(km * 2.2 + 8) // 2.2 min per km + 8 min buffer
  return { km: Math.max(2, Math.min(35, Math.round(km * 10) / 10)), mins }
}

// For client-side map component - returns Leaflet or Google Maps config
export function getMapConfig() {
  return {
    provider: getMapProvider(),
    center: { lat: 5.6037, lng: -0.1870 }, // Accra
    zoom: 12,
    tileUrl: getMapProvider() === 'google' 
      ? undefined 
      : 'https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png',
  }
}
