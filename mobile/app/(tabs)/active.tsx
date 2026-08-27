import { useState } from 'react'
import { View, Text, TouchableOpacity, StyleSheet, Alert } from 'react-native'

export default function ActiveScreen() {
  const [job, setJob] = useState<any>({
    id: 'WDS-90',
    from: 'Kaneshie Market',
    to: 'Dansoman',
    fee: 'GHS 52',
    customer: 'Ama Mensah • 0244 567 890',
    status: 'accepted',
  })

  function updateStatus(newStatus: string) {
    setJob({ ...job, status: newStatus })
    Alert.alert('Status Updated', `Order ${job.id} is now ${newStatus}. Customer will see this live via Supabase Realtime.`)
    // In production: supabase.from('orders').update({ status: newStatus }).eq('id', job.id)
    // Also update rider_locations
  }

  if (!job) {
    return (
      <View style={styles.emptyContainer}>
        <Text style={styles.emptyTitle}>No active delivery</Text>
        <Text style={styles.emptySub}>Accept a job from Jobs tab to start delivering</Text>
      </View>
    )
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>My Active Delivery</Text>
        <View style={styles.statusBadge}><Text style={styles.statusText}>{job.status.toUpperCase()}</Text></View>
      </View>

      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <Text style={styles.cardId}>{job.id} • {job.fee}</Text>
          <Text style={styles.cardRoute}>{job.from} → {job.to}</Text>
          <Text style={styles.cardCustomer}>{job.customer}</Text>
        </View>

        <View style={styles.actions}>
          <TouchableOpacity style={[styles.actionBtn, styles.actionPrimary]} onPress={() => updateStatus('picked_up')}><Text style={styles.actionText}>Picked up</Text></TouchableOpacity>
          <TouchableOpacity style={[styles.actionBtn, styles.actionYellow]} onPress={() => updateStatus('on_the_way')}><Text style={[styles.actionText, { color: '#000' }]}>On the way</Text></TouchableOpacity>
          <TouchableOpacity style={[styles.actionBtn, styles.actionGreen]} onPress={() => updateStatus('delivered')}><Text style={styles.actionText}>Delivered</Text></TouchableOpacity>
        </View>

        <View style={styles.secondaryActions}>
          <TouchableOpacity style={styles.secondaryBtn}><Text style={styles.secondaryText}>📞 Call Customer</Text></TouchableOpacity>
          <TouchableOpacity style={styles.secondaryBtn}><Text style={styles.secondaryText}>🧭 Navigate</Text></TouchableOpacity>
        </View>

        <View style={styles.mapPlaceholder}>
          <Text style={styles.mapText}>Map • {job.from} → {job.to}</Text>
          <Text style={styles.mapSub}>Live tracking • Supabase rider_locations</Text>
        </View>
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F5F5F7', padding: 16, paddingTop: 60 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  headerTitle: { fontSize: 20, fontWeight: '800' },
  statusBadge: { backgroundColor: '#FFC700', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20 },
  statusText: { fontSize: 11, fontWeight: '800' },
  card: { backgroundColor: '#fff', borderRadius: 24, padding: 20, borderWidth: 1, borderColor: 'rgba(0,0,0,0.05)' },
  cardHeader: { marginBottom: 20 },
  cardId: { fontSize: 12, fontWeight: '700', backgroundColor: '#FFC700', alignSelf: 'flex-start', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12, overflow: 'hidden' },
  cardRoute: { fontSize: 16, fontWeight: '700', marginTop: 12 },
  cardCustomer: { fontSize: 12, color: '#999', marginTop: 4 },
  actions: { flexDirection: 'row', gap: 8 },
  actionBtn: { flex: 1, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center' },
  actionPrimary: { backgroundColor: '#0A0A0A' },
  actionYellow: { backgroundColor: '#FFC700' },
  actionGreen: { backgroundColor: '#16a34a' },
  actionText: { color: '#fff', fontSize: 12, fontWeight: '700' },
  secondaryActions: { flexDirection: 'row', gap: 8, marginTop: 12 },
  secondaryBtn: { flex: 1, height: 40, backgroundColor: '#F5F5F7', borderRadius: 20, alignItems: 'center', justifyContent: 'center' },
  secondaryText: { fontSize: 12, fontWeight: '600' },
  mapPlaceholder: { marginTop: 20, height: 200, backgroundColor: '#F5F5F7', borderRadius: 16, alignItems: 'center', justifyContent: 'center' },
  mapText: { fontSize: 13, fontWeight: '700' },
  mapSub: { fontSize: 11, color: '#999', marginTop: 4 },
  emptyContainer: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: '#F5F5F7', padding: 20 },
  emptyTitle: { fontSize: 18, fontWeight: '700' },
  emptySub: { fontSize: 13, color: '#999', marginTop: 8, textAlign: 'center' },
})
