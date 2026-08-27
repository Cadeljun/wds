import { useState, useEffect } from 'react'
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, Alert } from 'react-native'
import { createClient } from '@supabase/supabase-js'
import * as Location from 'expo-location'

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co'
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || 'placeholder'
const supabase = createClient(supabaseUrl, supabaseAnonKey)

const mockJobs = [
  { id: 'WDS-89', from: 'Osu, Oxford St', to: 'Airport Residential', fee: 'GHS 28', dist: '3.2km', type: 'Document', urgent: true },
  { id: 'WDS-93', from: 'East Legon, Bawaleshie', to: 'Madina, Zongo', fee: 'GHS 38', dist: '6.1km', type: 'Parcel', urgent: false },
  { id: 'WDS-94', from: 'Kaneshie Market', to: 'Dansoman', fee: 'GHS 52', dist: '8.4km', type: 'Grocery', urgent: false },
  { id: 'WDS-95', from: 'Labone, Coffee Shop', to: 'Ridge, Hospital', fee: 'GHS 31', dist: '4.5km', type: 'Medicine', urgent: true },
]

export default function JobsScreen() {
  const [jobs, setJobs] = useState(mockJobs)
  const [online, setOnline] = useState(true)
  const [location, setLocation] = useState<any>(null)

  useEffect(() => {
    (async () => {
      const { status } = await Location.requestForegroundPermissionsAsync()
      if (status === 'granted') {
        const loc = await Location.getCurrentPositionAsync({})
        setLocation(loc.coords)
        // In production, send to Supabase rider_locations table every 10s
        // supabase.from('rider_locations').insert({ rider_id, lat: loc.coords.latitude, lng: loc.coords.longitude })
      }
    })()

    // Realtime subscription for pending orders (when Supabase configured)
    if (supabaseUrl !== 'https://placeholder.supabase.co') {
      const channel = supabase.channel('pending-jobs').on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'orders', filter: 'status=eq.pending' }, payload => {
        console.log('New job', payload.new)
        // Add to jobs list
      }).subscribe()
      return () => { supabase.removeChannel(channel) }
    }
  }, [])

  function acceptJob(job: any) {
    Alert.alert('Accept Job', `Accept ${job.id} ${job.from} → ${job.to} for ${job.fee}?`, [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Accept', onPress: () => {
        // In production: supabase.from('orders').update({ rider_id, status: 'accepted' }).eq('id', job.id)
        Alert.alert('Job Accepted', `You accepted ${job.id}. Go to Active tab.`)
      }}
    ])
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View>
          <Text style={styles.headerTitle}>Available Jobs</Text>
          <Text style={styles.headerSub}>{jobs.length} near you • Accra • {online ? 'Online' : 'Offline'}</Text>
        </View>
        <TouchableOpacity style={[styles.onlineBtn, online && styles.onlineBtnActive]} onPress={() => setOnline(!online)}>
          <Text style={[styles.onlineText, online && styles.onlineTextActive]}>{online ? 'Online' : 'Offline'}</Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.list} contentContainerStyle={{ padding: 16, gap: 12 }}>
        {jobs.map(job => (
          <View key={job.id} style={[styles.card, job.urgent && styles.cardUrgent]}>
            <View style={styles.cardIcon}><Text style={styles.cardIconText}>{job.type[0]}</Text></View>
            <View style={styles.cardContent}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                <Text style={styles.cardId}>{job.id}</Text>
                {job.urgent && <View style={styles.urgentBadge}><Text style={styles.urgentText}>URGENT</Text></View>}
                <Text style={styles.cardMeta}>{job.dist} • {job.type}</Text>
              </View>
              <Text style={styles.cardRoute}>{job.from} → {job.to}</Text>
              <Text style={styles.cardCustomer}>Customer: 0244 567 890 • Cash + MoMo</Text>
            </View>
            <View style={styles.cardRight}>
              <Text style={styles.cardFee}>{job.fee}</Text>
              <TouchableOpacity style={styles.acceptBtn} onPress={() => acceptJob(job)}><Text style={styles.acceptText}>Accept</Text></TouchableOpacity>
            </View>
          </View>
        ))}
      </ScrollView>
    </View>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F5F5F7' },
  header: { backgroundColor: '#0A0A0A', padding: 20, paddingTop: 60, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  headerTitle: { color: '#fff', fontSize: 20, fontWeight: '800' },
  headerSub: { color: 'rgba(255,255,255,0.6)', fontSize: 12, marginTop: 2 },
  onlineBtn: { backgroundColor: 'rgba(255,255,255,0.1)', paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20 },
  onlineBtnActive: { backgroundColor: '#22c55e' },
  onlineText: { color: '#fff', fontSize: 12, fontWeight: '700' },
  onlineTextActive: { color: '#fff' },
  list: { flex: 1 },
  card: { backgroundColor: '#fff', borderRadius: 22, padding: 16, flexDirection: 'row', alignItems: 'center', gap: 12, borderWidth: 1, borderColor: 'rgba(0,0,0,0.05)' },
  cardUrgent: { borderColor: '#FFC700' },
  cardIcon: { width: 48, height: 48, borderRadius: 16, backgroundColor: '#F5F5F7', alignItems: 'center', justifyContent: 'center' },
  cardIconText: { fontSize: 11, fontWeight: '700' },
  cardContent: { flex: 1 },
  cardId: { fontSize: 12, fontWeight: '700' },
  urgentBadge: { backgroundColor: '#ef4444', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 8 },
  urgentText: { color: '#fff', fontSize: 8, fontWeight: '800' },
  cardMeta: { fontSize: 11, color: '#999' },
  cardRoute: { fontSize: 13, fontWeight: '600', marginTop: 4 },
  cardCustomer: { fontSize: 11, color: '#999', marginTop: 2 },
  cardRight: { alignItems: 'flex-end' },
  cardFee: { fontSize: 16, fontWeight: '800' },
  acceptBtn: { marginTop: 8, backgroundColor: '#0A0A0A', paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20 },
  acceptText: { color: '#fff', fontSize: 12, fontWeight: '700' },
})
