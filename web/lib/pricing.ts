import { PackageType } from './supabase'

export interface PricingSettings {
  base: number
  perKm: number
  fees: Record<PackageType, number>
  express: number
  commission: number
}

export const defaultPricing: PricingSettings = {
  base: 15,
  perKm: 2.5,
  fees: {
    document: 3,
    food: 5,
    medicine: 6,
    parcel: 7,
    grocery: 7,
    other: 7,
  },
  express: 8,
  commission: 0.2, // 20% WDS, 80% rider
}

export function calcPrice(
  distanceKm: number,
  packageType: PackageType,
  express: boolean,
  settings: PricingSettings = defaultPricing
): { total: number; breakdown: { base: number; distance: number; packageFee: number; express: number } } {
  const base = settings.base
  const distance = distanceKm * settings.perKm
  const packageFee = settings.fees[packageType] || 7
  const expressFee = express ? settings.express : 0
  const total = Math.round(base + distance + packageFee + expressFee)
  
  return {
    total,
    breakdown: {
      base,
      distance: Math.round(distance * 10) / 10,
      packageFee,
      express: expressFee,
    }
  }
}

export function calcRiderPayout(totalPrice: number, commission: number = 0.2): { rider: number; wds: number } {
  const wds = Math.round(totalPrice * commission * 100) / 100
  const rider = Math.round((totalPrice - wds) * 100) / 100
  return { rider, wds }
}

// Haversine distance for MVP (no Google API)
export function haversineDistance(
  lat1: number, lon1: number,
  lat2: number, lon2: number
): number {
  const R = 6371 // Earth radius km
  const dLat = (lat2 - lat1) * Math.PI / 180
  const dLon = (lon2 - lon1) * Math.PI / 180
  const a = 
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon/2) * Math.sin(dLon/2)
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a))
  return R * c
}
