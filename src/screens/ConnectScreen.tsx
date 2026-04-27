import React, { useState, useEffect, useRef } from 'react';
import {
  View, Text, FlatList, TouchableOpacity,
  ActivityIndicator, StyleSheet, Animated,
} from 'react-native';
import { Device } from 'react-native-ble-plx';
import { MuseClient } from '../ble/MuseClient';
import { SignalDots } from '../components/SignalDots';
import { useMuseStore } from '../store/museStore';
import { attachPipeline } from '../ble/EEGPipeline';
import { OscSender } from '../osc/OscSender';
import { C } from '../theme';

const client = new MuseClient();
const sender = new OscSender();

export function ConnectScreen({ navigation }: any) {
  const [scanning,  setScanning]  = useState(false);
  const [devices,   setDevices]   = useState<Device[]>([]);
  const [status,    setStatus]    = useState('');
  const setConnected  = useMuseStore(s => s.setConnected);
  const signalQuality = useMuseStore(s => s.signalQuality);

  const pulse = useRef(new Animated.Value(1)).current;
  const glow  = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, { toValue: 1.22, duration: 950, useNativeDriver: true }),
        Animated.timing(pulse, { toValue: 1,    duration: 950, useNativeDriver: true }),
      ])
    ).start();
    Animated.loop(
      Animated.sequence([
        Animated.timing(glow, { toValue: 1, duration: 1300, useNativeDriver: true }),
        Animated.timing(glow, { toValue: 0, duration: 1300, useNativeDriver: true }),
      ])
    ).start();
  }, []);

  const ringOpacity = glow.interpolate({ inputRange: [0, 1], outputRange: [0.12, 0.4] });

  const startScan = async () => {
    setScanning(true);
    setDevices([]);
    setStatus('Scanning for Muse headband...');
    const found = await client.scan(8000);
    setDevices(found);
    setScanning(false);
    setStatus(
      found.length === 0
        ? 'No devices found. Is Muse powered on?'
        : `Found ${found.length} device${found.length > 1 ? 's' : ''}`
    );
  };

  const connectTo = async (device: Device) => {
    setStatus(`Connecting to ${device.name}...`);
    client.onStatus = setStatus;
    try {
      sender.open();
      await client.connect(device.id);
      setConnected(true, device.name ?? 'Muse');
      attachPipeline(client, sender);
      navigation.navigate('Dashboard');
    } catch (e: any) {
      setStatus(`Connection failed: ${e.message}`);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.hero}>
        <Text style={styles.brainIcon}>🧠</Text>
        <Text style={styles.appName}>Muse Plus</Text>
        <Text style={styles.tagline}>Real-time EEG  ·  Neurofeedback  ·  Flow</Text>
      </View>

      <View style={styles.scanWrapper}>
        <Animated.View
          style={[styles.pulseRing, { opacity: ringOpacity, transform: [{ scale: pulse }] }]}
        />
        <TouchableOpacity
          style={[styles.scanBtn, scanning && styles.scanBtnActive]}
          onPress={startScan}
          disabled={scanning}
        >
          {scanning
            ? <ActivityIndicator color={C.white} size="large" />
            : <Text style={styles.scanIcon}>⚡</Text>
          }
          <Text style={styles.scanLabel}>{scanning ? 'Scanning…' : 'Scan for Muse'}</Text>
        </TouchableOpacity>
      </View>

      {!!status && (
        <Text style={[styles.status, devices.length > 0 && { color: C.cyan }]}>{status}</Text>
      )}

      <FlatList
        data={devices}
        keyExtractor={d => d.id}
        style={styles.list}
        renderItem={({ item }) => (
          <TouchableOpacity style={styles.deviceCard} onPress={() => connectTo(item)}>
            <View style={styles.deviceLeft}>
              <Text style={styles.deviceIcon}>📡</Text>
              <View>
                <Text style={styles.deviceName}>{item.name ?? 'Muse Device'}</Text>
                <Text style={styles.deviceId}>{item.id.slice(0, 20)}…</Text>
              </View>
            </View>
            <Text style={styles.connectArrow}>Connect →</Text>
          </TouchableOpacity>
        )}
      />

      {signalQuality && (
        <View style={styles.signalRow}>
          <SignalDots horseshoe={signalQuality.horseshoe} />
        </View>
      )}

      <Text style={styles.hint}>Bluetooth must be on · Muse must be powered</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container:     { flex: 1, backgroundColor: C.bg, padding: 24 },
  hero:          { alignItems: 'center', marginTop: 28, marginBottom: 36 },
  brainIcon:     { fontSize: 60, marginBottom: 10 },
  appName:       { fontSize: 36, fontWeight: '800', color: C.white, letterSpacing: 0.4 },
  tagline:       { fontSize: 12, color: C.muted, marginTop: 6, letterSpacing: 1 },
  scanWrapper:   { alignItems: 'center', marginBottom: 28 },
  pulseRing:     {
    position: 'absolute',
    width: 148, height: 148, borderRadius: 74,
    backgroundColor: C.accent,
  },
  scanBtn: {
    width: 124, height: 124, borderRadius: 62,
    backgroundColor: C.accentDeep,
    alignItems: 'center', justifyContent: 'center',
    shadowColor: C.accent, shadowOpacity: 0.5,
    shadowRadius: 18, shadowOffset: { width: 0, height: 0 },
    elevation: 12,
  },
  scanBtnActive: { backgroundColor: C.surfaceAlt },
  scanIcon:      { fontSize: 30, marginBottom: 4 },
  scanLabel:     { color: C.white, fontSize: 11, fontWeight: '700', letterSpacing: 0.6 },
  status:        { color: C.dim, textAlign: 'center', fontSize: 14, marginBottom: 16 },
  list:          { flex: 1 },
  deviceCard: {
    backgroundColor: C.surface, borderWidth: 1, borderColor: C.border,
    borderRadius: 12, padding: 16, marginBottom: 10,
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
  },
  deviceLeft:    { flexDirection: 'row', alignItems: 'center', gap: 12 },
  deviceIcon:    { fontSize: 22 },
  deviceName:    { color: C.white, fontSize: 16, fontWeight: '600' },
  deviceId:      { color: C.muted, fontSize: 11, marginTop: 2 },
  connectArrow:  { color: C.accent, fontSize: 13, fontWeight: '700' },
  signalRow:     { alignItems: 'center', marginVertical: 8 },
  hint:          { color: C.muted, fontSize: 11, textAlign: 'center', marginBottom: 8, letterSpacing: 0.3 },
});
