import React from 'react';
import { View, Text, TextInput, Switch, StyleSheet, TouchableOpacity, Alert } from 'react-native';
import { useMuseStore } from '../store/museStore';

export function StreamScreen() {
  const { oscConfig, setOscConfig } = useMuseStore();

  const validate = () => {
    const parts = oscConfig.host.split('.');
    if (parts.length !== 4 || parts.some(p => isNaN(Number(p)))) {
      Alert.alert('Invalid IP', 'Enter a valid IPv4 address for your laptop');
      return;
    }
    if (oscConfig.port < 1024 || oscConfig.port > 65535) {
      Alert.alert('Invalid Port', 'Port must be 1024–65535');
      return;
    }
    Alert.alert('Config saved', `Streaming to ${oscConfig.host}:${oscConfig.port}`);
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>OSC Stream Settings</Text>
      <Text style={styles.label}>Laptop IP Address</Text>
      <TextInput
        style={styles.input}
        value={oscConfig.host}
        onChangeText={host => setOscConfig({ host })}
        keyboardType="decimal-pad"
        placeholder="192.168.1.100"
        placeholderTextColor="#6b7280"
      />
      <Text style={styles.label}>Port</Text>
      <TextInput
        style={styles.input}
        value={String(oscConfig.port)}
        onChangeText={p => setOscConfig({ port: Number(p) || 5000 })}
        keyboardType="number-pad"
      />
      <View style={styles.row}>
        <Text style={styles.label}>Enable OSC Streaming</Text>
        <Switch
          value={oscConfig.enabled}
          onValueChange={v => setOscConfig({ enabled: v })}
        />
      </View>
      <TouchableOpacity style={styles.btn} onPress={validate}>
        <Text style={styles.btnText}>Save & Test</Text>
      </TouchableOpacity>
      <Text style={styles.note}>
        Find your laptop IP: run ipconfig on Windows.{'\n'}
        Firewall rule "Muse OSC UDP 5000 All" already exists on your laptop.{'\n'}
        iPhone and laptop must be on the same WiFi network.
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#111', padding: 24 },
  title:     { fontSize: 22, fontWeight: '700', color: '#fff', marginBottom: 24 },
  label:     { color: '#9ca3af', fontSize: 14, marginBottom: 4 },
  input:     { backgroundColor: '#1f2937', color: '#fff', padding: 12, borderRadius: 8, marginBottom: 16, fontSize: 16 },
  row:       { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 },
  btn:       { backgroundColor: '#6366f1', padding: 16, borderRadius: 12, alignItems: 'center' },
  btnText:   { color: '#fff', fontWeight: '600', fontSize: 16 },
  note:      { color: '#6b7280', fontSize: 12, marginTop: 16, lineHeight: 18 },
});
