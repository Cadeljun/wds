import { View, Text, StyleSheet, ScrollView } from 'react-native'

export default function EarningsScreen() {
  const today = { trips: 7, distance: '42km', earnings: 286, rating: 4.9 }
  const history = [
    { id: 'WDS-90', route: 'Kaneshie → Dansoman', fee: 'GHS 52', payout: 'GHS 41.6', time: 'Today 9:18am' },
    { id: 'WDS-88', route: 'Osu → Airport', fee: 'GHS 28', payout: 'GHS 22.4', time: 'Today 8:00am' },
    { id: 'WDS-87', route: 'East Legon → Madina', fee: 'GHS 38', payout: 'GHS 30.4', time: 'Yesterday' },
  ]

  return (
    <ScrollView style={styles.container} contentContainerStyle={{ padding: 16, paddingTop: 60 }}>
      <Text style={styles.title}>Earnings</Text>
      
      <View style={styles.summaryCard}>
        <View style={styles.summaryHeader}><Text style={styles.summaryLabel}>Today's Summary</Text><Text style={styles.summaryDate}>Aug 24 • Accra</Text></View>
        <View style={styles.summaryGrid}>
          <View style={styles.summaryItem}><Text style={styles.summaryValue}>{today.trips}</Text><Text style={styles.summaryUnit}>Trips</Text></View>
          <View style={styles.summaryItem}><Text style={styles.summaryValue}>{today.distance}</Text><Text style={styles.summaryUnit}>Distance</Text></View>
          <View style={[styles.summaryItem, styles.summaryHighlight]}><Text style={[styles.summaryValue, { color: '#000' }]}>{today.rating}</Text><Text style={[styles.summaryUnit, { color: '#000' }]}>Rating</Text></View>
        </View>
        <View style={styles.earningsRow}><Text style={styles.earningsLabel}>Total Earnings Today</Text><Text style={styles.earningsValue}>GHS {today.earnings}</Text></View>
        <Text style={styles.commissionText}>WDS Commission 20% • You get 80% • Payout via MoMo daily at 6pm</Text>
      </View>

      <Text style={styles.sectionTitle}>Recent Deliveries</Text>
      {history.map(h => (
        <View key={h.id} style={styles.historyCard}>
          <View><Text style={styles.historyId}>{h.id} • {h.route}</Text><Text style={styles.historyTime}>{h.time}</Text></View>
          <View style={{ alignItems: 'flex-end' }}><Text style={styles.historyFee}>{h.fee}</Text><Text style={styles.historyPayout}>{h.payout} payout</Text></View>
        </View>
      ))}

      <View style={styles.payoutCard}>
        <Text style={styles.payoutTitle}>Payout Methods</Text>
        <Text style={styles.payoutText}>• MTN MoMo: 0244 123 456 (Default) • Vodafone Cash • Bank Transfer</Text>
        <Text style={styles.payoutText}>• Instant payout after delivery (Paystack Transfer API)</Text>
      </View>
    </ScrollView>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F5F5F7' },
  title: { fontSize: 24, fontWeight: '800', marginBottom: 16 },
  summaryCard: { backgroundColor: '#0A0A0A', borderRadius: 24, padding: 20 },
  summaryHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 16 },
  summaryLabel: { color: '#fff', fontSize: 14, fontWeight: '700' },
  summaryDate: { color: 'rgba(255,255,255,0.5)', fontSize: 12 },
  summaryGrid: { flexDirection: 'row', gap: 12 },
  summaryItem: { flex: 1, backgroundColor: 'rgba(255,255,255,0.1)', borderRadius: 16, padding: 12, alignItems: 'center' },
  summaryHighlight: { backgroundColor: '#FFC700' },
  summaryValue: { color: '#fff', fontSize: 20, fontWeight: '800' },
  summaryUnit: { color: 'rgba(255,255,255,0.5)', fontSize: 10, fontWeight: '700', textTransform: 'uppercase', marginTop: 2 },
  earningsRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 20, paddingTop: 16, borderTopWidth: 1, borderTopColor: 'rgba(255,255,255,0.1)' },
  earningsLabel: { color: 'rgba(255,255,255,0.6)', fontSize: 13 },
  earningsValue: { color: '#FFC700', fontSize: 24, fontWeight: '800' },
  commissionText: { color: 'rgba(255,255,255,0.4)', fontSize: 11, marginTop: 8 },
  sectionTitle: { fontSize: 16, fontWeight: '700', marginTop: 24, marginBottom: 12 },
  historyCard: { backgroundColor: '#fff', borderRadius: 16, padding: 16, flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8, borderWidth: 1, borderColor: 'rgba(0,0,0,0.05)' },
  historyId: { fontSize: 13, fontWeight: '700' },
  historyTime: { fontSize: 11, color: '#999', marginTop: 2 },
  historyFee: { fontSize: 14, fontWeight: '800' },
  historyPayout: { fontSize: 11, color: '#16a34a', fontWeight: '600', marginTop: 2 },
  payoutCard: { backgroundColor: '#fff', borderRadius: 16, padding: 16, marginTop: 16, borderWidth: 1, borderColor: 'rgba(0,0,0,0.05)' },
  payoutTitle: { fontSize: 14, fontWeight: '700', marginBottom: 8 },
  payoutText: { fontSize: 12, color: '#666', marginBottom: 4 },
})
