import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

export function HistoryScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Session History</Text>
      <Text style={styles.note}>History coming in Task 17</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#111', padding: 16 },
  title:     { fontSize: 22, fontWeight: '700', color: '#fff', marginBottom: 16 },
  note:      { color: '#6b7280' },
});
