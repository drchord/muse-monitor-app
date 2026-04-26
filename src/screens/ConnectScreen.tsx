import React, { useState } from 'react';
import { View, Text, FlatList, TouchableOpacity, ActivityIndicator, StyleSheet } from 'react-native';
import { Device } from 'react-native-ble-plx';
import { MuseClient } from '../ble/MuseClient';
import { SignalDots } from '../components/SignalDots';
import { useMuseStore } from '../store/museStore';
import { attachPipeline } from '../ble/EEGPipeline';
import { OscSender } from '../osc/OscSender';

const client = new MuseClient();
const sender = new OscSender();

export function ConnectScreen({ navigation }: any) {
  const [scanning,  setScanning]  = useState(false);
  const [devices,   setDevices]   = useState<Device[]>([]);
  const [status,    setStatus]    = useState('');
  const setConnected   = useMuseStore(s => s.setConnected);
  const signalQuality  = useMuseStore(s => s.signalQuality);

  const startScan = async () => {
    setScanning(true);
    setDevices([]);
    setStatus('Scanning...');
    const found = await client.scan(8000);
    setDevices(found);
    setScanning(false);
    setStatus(found.length === 0 ? 'No Muse devices found' : `Found ${found.length} device(s)`);
  };

  const connectTo = async (device: Device) => {
    setStatus(`Connecting to ${device.name}...`);
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
      <Text style={styles.title}>Muse Monitor</Text>
      <TouchableOpacity style={styles.button} onPress={startScan} disabled={scanning}>
        {scanning
          ? <ActivityIndicator color="#fff" />
          : <Text style={styles.btnText}>Scan for Muse</Text>
        }
      </TouchableOpacity>
      <Text style={styles.status}>{status}</Text>
      <FlatList
        data={devices}
        keyExtractor={d => d.id}
        renderItem={({ item }) => (
          <TouchableOpacity style={styles.device} onPress={() => connectTo(item)}>
            <Text style={styles.deviceName}>{item.name ?? 'Unknown'}</Text>
            <Text style={styles.deviceId}>{item.id}</Text>
          </TouchableOpacity>
        )}
      />
      {signalQuality && (
        <SignalDots horseshoe={signalQuality.horseshoe} />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container:  { flex: 1, backgroundColor: '#111', padding: 24 },
  title:      { fontSize: 28, fontWeight: '700', color: '#fff', marginBottom: 24 },
  button:     { backgroundColor: '#6366f1', padding: 16, borderRadius: 12, alignItems: 'center' },
  btnText:    { color: '#fff', fontWeight: '600', fontSize: 16 },
  status:     { color: '#9ca3af', marginVertical: 12, textAlign: 'center' },
  device:     { backgroundColor: '#1f2937', padding: 16, borderRadius: 8, marginVertical: 4 },
  deviceName: { color: '#fff', fontSize: 16, fontWeight: '600' },
  deviceId:   { color: '#6b7280', fontSize: 11 },
});
