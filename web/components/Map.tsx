'use client'

import { useEffect, useState } from 'react'
import { MapContainer, TileLayer, Marker, Polyline, useMap } from 'react-leaflet'
import L from 'leaflet'
import { LatLng } from '@/lib/maps'

// Fix Leaflet icon issue in Next.js
if (typeof window !== 'undefined') {
  delete (L.Icon.Default.prototype as any)._getIconUrl
  L.Icon.Default.mergeOptions({
    iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
    iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
    shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
  })
}

interface MapProps {
  pickup?: LatLng
  dropoff?: LatLng
  rider?: LatLng
  className?: string
  height?: string
}

function FitBounds({ pickup, dropoff, rider }: { pickup?: LatLng, dropoff?: LatLng, rider?: LatLng }) {
  const map = useMap()
  useEffect(() => {
    const points: [number, number][] = []
    if (pickup) points.push([pickup.lat, pickup.lng])
    if (dropoff) points.push([dropoff.lat, dropoff.lng])
    if (rider) points.push([rider.lat, rider.lng])
    if (points.length > 0) {
      map.fitBounds(points as any, { padding: [30, 30] })
    }
  }, [pickup, dropoff, rider, map])
  return null
}

export default function Map({ pickup, dropoff, rider, className = '', height = '260px' }: MapProps) {
  const [isClient, setIsClient] = useState(false)

  useEffect(() => {
    setIsClient(true)
  }, [])

  if (!isClient) {
    return <div className={`bg-[#F5F5F7] rounded-[24px] flex items-center justify-center text-[13px] text-black/50 ${className}`} style={{ height }}>Loading map...</div>
  }

  const center: [number, number] = pickup ? [pickup.lat, pickup.lng] : [5.6037, -0.1870]

  const pickupIcon = L.divIcon({
    html: '<div class="w-3 h-3 bg-[#FFC700] border-2 border-white rounded-full shadow"></div>',
    className: '',
  })

  const dropoffIcon = L.divIcon({
    html: '<div class="w-3 h-3 bg-black border-2 border-white rounded-full shadow"></div>',
    className: '',
  })

  const riderIcon = L.divIcon({
    html: '<div class="relative"><div class="w-10 h-10 bg-black rounded-full flex items-center justify-center text-white shadow-lg">🏍️</div><div class="absolute -inset-1 bg-[#FFC700] rounded-full -z-10 pulse-ring"></div></div>',
    className: '',
  })

  return (
    <div className={`${className} rounded-[24px] overflow-hidden`} style={{ height }}>
      <MapContainer
        center={center}
        zoom={12}
        style={{ height: '100%', width: '100%' }}
        zoomControl={false}
      >
        <TileLayer
          url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png"
          attribution=""
        />
        {pickup && <Marker position={[pickup.lat, pickup.lng]} icon={pickupIcon} />}
        {dropoff && <Marker position={[dropoff.lat, dropoff.lng]} icon={dropoffIcon} />}
        {rider && <Marker position={[rider.lat, rider.lng]} icon={riderIcon} />}
        {pickup && dropoff && (
          <>
            <Polyline positions={[[pickup.lat, pickup.lng], [dropoff.lat, dropoff.lng]]} pathOptions={{ color: '#0A0A0A', weight: 5, opacity: 0.15 }} />
            <Polyline positions={[[pickup.lat, pickup.lng], [dropoff.lat, dropoff.lng]]} pathOptions={{ color: '#FFC700', weight: 4 }} />
          </>
        )}
        <FitBounds pickup={pickup} dropoff={dropoff} rider={rider} />
      </MapContainer>
    </div>
  )
}
