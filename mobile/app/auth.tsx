import { useState } from 'react'
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert } from 'react-native'
import { useRouter } from 'expo-router'

export default function AuthScreen() {
  const router = useRouter()
  const [tab, setTab] = useState<'login' | 'signup'>('login')
  const [phone, setPhone] = useState('')
  const [pass, setPass] = useState('')
  const [name, setName] = useState('')

  function handleLogin() {
    if (phone === '0244987654' && pass === '123456') {
      router.replace('/(tabs)/jobs')
    } else {
      Alert.alert('Demo Login', 'Use Rider demo: 0244987654 / 123456')
    }
  }

  function handleSignup() {
    const otp = '123456'
    Alert.prompt('OTP Verification', `Enter OTP sent to ${phone} (demo: 123456)`, [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Verify', onPress: (code) => {
        if (code === otp) {
          Alert.alert('Success', 'Account created! Welcome to WDS Rider')
          router.replace('/(tabs)/jobs')
        } else {
          Alert.alert('Invalid OTP', 'Use 123456 for demo')
        }
      }}
    ])
  }

  return (
    <View style={styles.container}>
      <View style={styles.card}>
        <View style={styles.logoRow}><View style={styles.logo}><Text style={styles.logoText}>W</Text></View><Text style={styles.logoTitle}>WDS Rider</Text></View>
        <Text style={styles.title}>{tab === 'login' ? 'Welcome back' : 'Join WDS Rider Team'}</Text>
        <Text style={styles.sub}>Accra • Motor • Bicycle • Car • Earn with MoMo</Text>

        <View style={styles.tabs}>
          <TouchableOpacity style={[styles.tab, tab==='login' && styles.tabActive]} onPress={() => setTab('login')}><Text style={[styles.tabText, tab==='login' && styles.tabTextActive]}>Log in</Text></TouchableOpacity>
          <TouchableOpacity style={[styles.tab, tab==='signup' && styles.tabActive]} onPress={() => setTab('signup')}><Text style={[styles.tabText, tab==='signup' && styles.tabTextActive]}>Sign up</Text></TouchableOpacity>
        </View>

        {tab === 'login' ? (
          <>
            <TextInput value={phone} onChangeText={setPhone} placeholder="Phone 0244 123 456" style={styles.input} keyboardType="phone-pad" />
            <TextInput value={pass} onChangeText={setPass} placeholder="Password" style={styles.input} secureTextEntry />
            <TouchableOpacity style={styles.primaryBtn} onPress={handleLogin}><Text style={styles.primaryText}>Log in to WDS</Text></TouchableOpacity>
            <Text style={styles.demo}>Demo Rider: 0244987654 / 123456</Text>
          </>
        ) : (
          <>
            <TextInput value={name} onChangeText={setName} placeholder="Full Name" style={styles.input} />
            <TextInput value={phone} onChangeText={setPhone} placeholder="Phone 0244..." style={styles.input} keyboardType="phone-pad" />
            <TextInput value={pass} onChangeText={setPass} placeholder="Password min 6" style={styles.input} secureTextEntry />
            <TouchableOpacity style={styles.yellowBtn} onPress={handleSignup}><Text style={styles.yellowText}>Create Account & Send OTP →</Text></TouchableOpacity>
            <Text style={styles.demo}>OTP for demo: 123456 • Supabase phone OTP in prod</Text>
          </>
        )}
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F5F5F7', alignItems: 'center', justifyContent: 'center', padding: 20 },
  card: { backgroundColor: '#fff', borderRadius: 32, padding: 24, width: '100%', maxWidth: 400 },
  logoRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 20 },
  logo: { width: 32, height: 32, backgroundColor: '#000', borderRadius: 8, alignItems: 'center', justifyContent: 'center' },
  logoText: { color: '#FFC700', fontWeight: '800' },
  logoTitle: { fontWeight: '700' },
  title: { fontSize: 22, fontWeight: '800' },
  sub: { fontSize: 12, color: '#999', marginTop: 4 },
  tabs: { flexDirection: 'row', backgroundColor: '#F5F5F7', borderRadius: 20, padding: 4, marginTop: 20, marginBottom: 16 },
  tab: { flex: 1, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center' },
  tabActive: { backgroundColor: '#fff' },
  tabText: { fontSize: 13, fontWeight: '600', color: '#999' },
  tabTextActive: { color: '#000' },
  input: { height: 48, backgroundColor: '#F5F5F7', borderRadius: 16, paddingHorizontal: 16, marginBottom: 12, fontSize: 14 },
  primaryBtn: { height: 52, backgroundColor: '#000', borderRadius: 26, alignItems: 'center', justifyContent: 'center', marginTop: 8 },
  primaryText: { color: '#fff', fontWeight: '700' },
  yellowBtn: { height: 52, backgroundColor: '#FFC700', borderRadius: 26, alignItems: 'center', justifyContent: 'center', marginTop: 8 },
  yellowText: { color: '#000', fontWeight: '800' },
  demo: { fontSize: 11, color: '#999', textAlign: 'center', marginTop: 12 },
})
