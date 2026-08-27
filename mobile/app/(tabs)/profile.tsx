import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native'

export default function ProfileScreen() {
  const user = { name: 'Kwame Asare', phone: '0244987654', vehicle: 'Motorbike', plate: 'AB 1234-23', rating: 4.9, deliveries: 312, earnings: 12450 }

  return (
    <ScrollView style={styles.container} contentContainerStyle={{ padding: 16, paddingTop: 60 }}>
      <View style={styles.header}>
        <View style={styles.avatar}><Text style={styles.avatarText}>{user.name.charAt(0)}</Text></View>
        <Text style={styles.name}>{user.name}</Text>
        <Text style={styles.phone}>{user.phone} • {user.vehicle} • {user.plate}</Text>
        <View style={styles.badge}><Text style={styles.badgeText}>★ {user.rating} • {user.deliveries} deliveries • Level 4</Text></View>
      </View>

      <View style={styles.stats}>
        <View style={styles.stat}><Text style={styles.statValue}>GHS {user.earnings}</Text><Text style={styles.statLabel}>Total Earnings</Text></View>
        <View style={styles.stat}><Text style={styles.statValue}>{user.deliveries}</Text><Text style={styles.statLabel}>Deliveries</Text></View>
        <View style={styles.stat}><Text style={styles.statValue}>{user.rating}</Text><Text style={styles.statLabel}>Rating</Text></View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Account</Text>
        <TouchableOpacity style={styles.row}><Text style={styles.rowLabel}>📱 Phone</Text><Text style={styles.rowValue}>{user.phone}</Text></TouchableOpacity>
        <TouchableOpacity style={styles.row}><Text style={styles.rowLabel}>🏍️ Vehicle</Text><Text style={styles.rowValue}>{user.vehicle} • {user.plate}</Text></TouchableOpacity>
        <TouchableOpacity style={styles.row}><Text style={styles.rowLabel}>💳 Payout</Text><Text style={styles.rowValue}>MTN MoMo • 0244...</Text></TouchableOpacity>
        <TouchableOpacity style={styles.row}><Text style={styles.rowLabel}>📄 Documents</Text><Text style={styles.rowValue}>Verified ✓</Text></TouchableOpacity>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Support</Text>
        <TouchableOpacity style={styles.row}><Text style={styles.rowLabel}>💬 Contact Support</Text><Text style={styles.rowValue}>→</Text></TouchableOpacity>
        <TouchableOpacity style={styles.row}><Text style={styles.rowLabel}>📖 Rider Guide</Text><Text style={styles.rowValue}>→</Text></TouchableOpacity>
        <TouchableOpacity style={styles.row}><Text style={styles.rowLabel}>⚙️ Settings</Text><Text style={styles.rowValue}>→</Text></TouchableOpacity>
      </View>

      <TouchableOpacity style={styles.logoutBtn}><Text style={styles.logoutText}>Log out</Text></TouchableOpacity>

      <Text style={styles.footer}>WDS Rider v2.0 • Supabase • Expo • Accra, Ghana</Text>
    </ScrollView>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F5F5F7' },
  header: { alignItems: 'center', backgroundColor: '#fff', borderRadius: 24, padding: 24, borderWidth: 1, borderColor: 'rgba(0,0,0,0.05)' },
  avatar: { width: 80, height: 80, borderRadius: 40, backgroundColor: '#FFC700', alignItems: 'center', justifyContent: 'center' },
  avatarText: { fontSize: 32, fontWeight: '800' },
  name: { fontSize: 20, fontWeight: '800', marginTop: 12 },
  phone: { fontSize: 13, color: '#999', marginTop: 4 },
  badge: { backgroundColor: '#0A0A0A', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20, marginTop: 12 },
  badgeText: { color: '#FFC700', fontSize: 12, fontWeight: '700' },
  stats: { flexDirection: 'row', gap: 12, marginTop: 16 },
  stat: { flex: 1, backgroundColor: '#fff', borderRadius: 16, padding: 16, alignItems: 'center', borderWidth: 1, borderColor: 'rgba(0,0,0,0.05)' },
  statValue: { fontSize: 18, fontWeight: '800' },
  statLabel: { fontSize: 10, color: '#999', fontWeight: '700', textTransform: 'uppercase', marginTop: 4 },
  section: { backgroundColor: '#fff', borderRadius: 16, padding: 16, marginTop: 16, borderWidth: 1, borderColor: 'rgba(0,0,0,0.05)' },
  sectionTitle: { fontSize: 13, fontWeight: '700', marginBottom: 12, textTransform: 'uppercase', color: '#999' },
  row: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#F5F5F7' },
  rowLabel: { fontSize: 14, fontWeight: '500' },
  rowValue: { fontSize: 13, color: '#999', fontWeight: '600' },
  logoutBtn: { backgroundColor: '#0A0A0A', borderRadius: 24, height: 52, alignItems: 'center', justifyContent: 'center', marginTop: 24 },
  logoutText: { color: '#fff', fontSize: 14, fontWeight: '700' },
  footer: { fontSize: 11, color: '#999', textAlign: 'center', marginTop: 24, marginBottom: 40 },
})
