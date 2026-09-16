// WDS - Firestore Implementation - Alternative to Supabase
// Use Firestore for database if preferred over Supabase Postgres
// Switch via env: NEXT_PUBLIC_DB_PROVIDER=firestore or supabase

import { initializeApp, getApps, getApp } from 'firebase/app'
import { 
  getFirestore, 
  collection, 
  doc, 
  getDoc, 
  getDocs, 
  setDoc, 
  updateDoc, 
  deleteDoc, 
  query, 
  where, 
  orderBy, 
  limit,
  onSnapshot,
  Timestamp,
  GeoPoint,
  serverTimestamp
} from 'firebase/firestore'
import { 
  getAuth, 
  signInWithPhoneNumber, 
  RecaptchaVerifier,
  signOut as firebaseSignOut,
  onAuthStateChanged,
  User as FirebaseUser
} from 'firebase/auth'

// Firebase config - from .env
const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
}

function isFirestoreConfigured(): boolean {
  return !!(
    firebaseConfig.apiKey &&
    firebaseConfig.projectId &&
    firebaseConfig.apiKey !== 'placeholder' &&
    !firebaseConfig.apiKey.includes('xxx')
  )
}

// Initialize Firebase (singleton)
let app: any
let db: any
let auth: any

if (typeof window !== 'undefined' && isFirestoreConfigured()) {
  app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp()
  db = getFirestore(app)
  auth = getAuth(app)
} else if (isFirestoreConfigured()) {
  // Server-side
  app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp()
  db = getFirestore(app)
  auth = getAuth(app)
}

export { db, auth, isFirestoreConfigured }

// Types - Same as Supabase version for easy swap
export type UserRole = 'customer' | 'rider' | 'admin'
export type PackageType = 'parcel' | 'food' | 'grocery' | 'medicine' | 'document' | 'other'
export type OrderStatus = 'pending' | 'accepted' | 'picked_up' | 'on_the_way' | 'delivered' | 'cancelled'
export type PaymentMethod = 'momo_mtn' | 'momo_vodafone' | 'momo_airteltigo' | 'card' | 'cash' | 'wallet'

export interface WDSUser {
  id: string
  phone: string
  full_name: string
  role: UserRole
  created_at: string
}

export interface Rider {
  id: string
  vehicle_type: 'motor' | 'bicycle' | 'car' | 'van'
  license_plate: string
  status: 'offline' | 'online' | 'delivering'
  rating: number
  total_deliveries: number
  total_earnings: number
  is_approved: boolean
  current_lat?: number
  current_lng?: number
  last_seen: string
  user?: WDSUser
}

export interface Order {
  id: string
  order_code: string
  customer_id: string
  rider_id?: string
  pickup_address: string
  pickup_lat: number
  pickup_lng: number
  dropoff_address: string
  dropoff_lat: number
  dropoff_lng: number
  package_type: PackageType
  description?: string
  recipient_name?: string
  recipient_phone?: string
  distance_km: number
  price: number
  payment_method: PaymentMethod
  payment_status: 'pending' | 'paid' | 'failed' | 'cash_on_delivery'
  paystack_ref?: string
  status: OrderStatus
  express: boolean
  proof_photo_url?: string
  created_at: string
  delivered_at?: string
}

// ===========================================
// Firestore Collections Helpers
// ===========================================

export const collections = {
  users: () => collection(db, 'users'),
  riders: () => collection(db, 'riders'),
  orders: () => collection(db, 'orders'),
  payments: () => collection(db, 'payments'),
  rider_locations: () => collection(db, 'rider_locations'),
  settings: () => collection(db, 'settings'),
  enquiries: () => collection(db, 'enquiries'),
  user_roles: () => collection(db, 'user_roles'),
}

// ===========================================
// Auth - Firebase Phone OTP (Ghana)
// ===========================================

export async function signInWithPhone(phone: string, recaptchaVerifier: RecaptchaVerifier) {
  if (!isFirestoreConfigured() || !auth) {
    return { data: null, error: { message: 'Firestore not configured - using demo mode' } }
  }

  // Normalize Ghana phone to +233 format
  let normalizedPhone = phone
  const digits = phone.replace(/\D/g, '')
  if (digits.startsWith('0') && digits.length === 10) {
    normalizedPhone = '+233' + digits.substring(1)
  } else if (digits.length === 9) {
    normalizedPhone = '+233' + digits
  } else if (!phone.startsWith('+')) {
    normalizedPhone = '+233' + digits
  }

  try {
    const confirmationResult = await signInWithPhoneNumber(auth, normalizedPhone, recaptchaVerifier)
    return { data: confirmationResult, error: null }
  } catch (error: any) {
    return { data: null, error }
  }
}

export async function verifyOtp(confirmationResult: any, otpCode: string) {
  try {
    const result = await confirmationResult.confirm(otpCode)
    return { data: result.user, error: null }
  } catch (error: any) {
    return { data: null, error }
  }
}

export async function signOut() {
  if (auth) {
    await firebaseSignOut(auth)
  }
  return { error: null }
}

export function onAuthChange(callback: (user: FirebaseUser | null) => void) {
  if (!auth) return () => {}
  return onAuthStateChanged(auth, callback)
}

export async function getCurrentUser(): Promise<WDSUser | null> {
  if (!auth || !auth.currentUser) return null

  const userDoc = await getDoc(doc(db, 'users', auth.currentUser.uid))
  if (!userDoc.exists()) return null

  return userDoc.data() as WDSUser
}

// ===========================================
// Orders - Firestore CRUD with IDOR Protection
// ===========================================

export async function createOrder(orderData: Omit<Order, 'id' | 'order_code' | 'created_at'>): Promise<{ data: Order | null; error: any }> {
  if (!isFirestoreConfigured() || !db) {
    return { data: null, error: { message: 'Firestore not configured' } }
  }

  try {
    const orderRef = doc(collections.orders())
    const orderCode = 'WDS-' + Math.random().toString(36).substring(2, 8).toUpperCase()
    
    const newOrder: Order = {
      id: orderRef.id,
      order_code: orderCode,
      ...orderData,
      created_at: new Date().toISOString(),
    }

    await setDoc(orderRef, {
      ...newOrder,
      created_at: serverTimestamp(),
    })

    return { data: newOrder, error: null }
  } catch (error) {
    return { data: null, error }
  }
}

export async function getOrdersByCustomer(customerId: string): Promise<{ data: Order[]; error: any }> {
  if (!isFirestoreConfigured() || !db) return { data: [], error: null }

  try {
    const q = query(
      collections.orders(),
      where('customer_id', '==', customerId),
      orderBy('created_at', 'desc'),
      limit(50)
    )
    const snapshot = await getDocs(q)
    const orders = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Order))
    return { data: orders, error: null }
  } catch (error) {
    return { data: [], error }
  }
}

export async function getPendingOrders(): Promise<{ data: Order[]; error: any }> {
  if (!isFirestoreConfigured() || !db) return { data: [], error: null }

  try {
    const q = query(
      collections.orders(),
      where('status', '==', 'pending'),
      orderBy('created_at', 'desc'),
      limit(20)
    )
    const snapshot = await getDocs(q)
    const orders = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Order))
    return { data: orders, error: null }
  } catch (error) {
    return { data: [], error }
  }
}

export async function getOrderById(orderId: string): Promise<{ data: Order | null; error: any }> {
  if (!isFirestoreConfigured() || !db) return { data: null, error: null }

  try {
    const orderDoc = await getDoc(doc(db, 'orders', orderId))
    if (!orderDoc.exists()) return { data: null, error: { message: 'Order not found' } }
    return { data: { id: orderDoc.id, ...orderDoc.data() } as Order, error: null }
  } catch (error) {
    return { data: null, error }
  }
}

export async function updateOrderStatus(orderId: string, status: OrderStatus, proofUrl?: string): Promise<{ error: any }> {
  if (!isFirestoreConfigured() || !db) return { error: null }

  try {
    const updates: any = { status }
    if (proofUrl) updates.proof_photo_url = proofUrl
    if (status === 'delivered') updates.delivered_at = serverTimestamp()

    await updateDoc(doc(db, 'orders', orderId), updates)
    return { error: null }
  } catch (error) {
    return { error }
  }
}

// Realtime subscription for orders
export function subscribeToOrders(customerId: string, callback: (orders: Order[]) => void) {
  if (!isFirestoreConfigured() || !db) return () => {}

  const q = query(
    collections.orders(),
    where('customer_id', '==', customerId),
    orderBy('created_at', 'desc')
  )

  return onSnapshot(q, (snapshot) => {
    const orders = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Order))
    callback(orders)
  })
}

export function subscribeToPendingOrders(callback: (orders: Order[]) => void) {
  if (!isFirestoreConfigured() || !db) return () => {}

  const q = query(
    collections.orders(),
    where('status', '==', 'pending'),
    orderBy('created_at', 'desc')
  )

  return onSnapshot(q, (snapshot) => {
    const orders = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Order))
    callback(orders)
  })
}

export function subscribeToOrder(orderId: string, callback: (order: Order | null) => void) {
  if (!isFirestoreConfigured() || !db) return () => {}

  return onSnapshot(doc(db, 'orders', orderId), (doc) => {
    if (!doc.exists()) callback(null)
    else callback({ id: doc.id, ...doc.data() } as Order)
  })
}

// ===========================================
// Riders - Firestore
// ===========================================

export async function getOnlineRiders(): Promise<{ data: Rider[]; error: any }> {
  if (!isFirestoreConfigured() || !db) return { data: [], error: null }

  try {
    const q = query(
      collections.riders(),
      where('status', '==', 'online'),
      where('is_approved', '==', true),
      orderBy('rating', 'desc'),
      limit(10)
    )
    const snapshot = await getDocs(q)
    const riders = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Rider))
    return { data: riders, error: null }
  } catch (error) {
    return { data: [], error }
  }
}

// ===========================================
// Settings - Pricing
// ===========================================

export async function getPricing(): Promise<{ data: any; error: any }> {
  if (!isFirestoreConfigured() || !db) {
    return { data: { base: 15, perKm: 2.5, fees: { document: 3, food: 5, medicine: 6, parcel: 7, grocery: 7, other: 7 }, express: 8, commission: 0.2 }, error: null }
  }

  try {
    const docSnap = await getDoc(doc(db, 'settings', 'pricing'))
    if (!docSnap.exists()) {
      return { data: { base: 15, perKm: 2.5, fees: { document: 3, food: 5, medicine: 6, parcel: 7, grocery: 7, other: 7 }, express: 8, commission: 0.2 }, error: null }
    }
    return { data: docSnap.data(), error: null }
  } catch (error) {
    return { data: null, error }
  }
}
