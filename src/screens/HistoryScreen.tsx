// src/screens/HistoryScreen.tsx
import React, { useEffect } from 'react';
import { View, Text, FlatList, StyleSheet } from 'react-native';
import { useSessionStore } from '@/store/sessionStore';

export function HistoryScreen() {
  const { sessions, loadSessions } = useSessionStore();
  useEffect(() => { loadSessions(); }, []);

  const fmt = (s: number) => {
    const safe = Math.max(0, s);
    return `${Math.floor(safe / 60)}m ${safe % 60}s`;
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Session History</Text>
      <FlatList
        data={sessions}
        keyExtractor={s => String(s.id)}
        ListEmptyComponent={
          <Text style={styles.empty}>No sessions recorded yet. Complete a meditation session to see history here.</Text>
        }
        renderItem={({ item }) => (
          <View style={styles.card}>
            <Text style={styles.date}>{new Date(item.startedAt).toLocaleDateString()}</Text>
            <Text style={styles.stats}>
              {fmt(item.durationSec)} · {Math.round(item.pctInState)}% in state · best run {fmt(item.longestRunSec)}
            </Text>
            <Text style={styles.protocol}>{item.protocol}</Text>
          </View>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#111', padding: 16 },
  title:     { fontSize: 22, fontWeight: '700', color: '#fff', marginBottom: 16 },
  empty:     { color: '#6b7280', fontSize: 14, textAlign: 'center', marginTop: 40 },
  card:      { backgroundColor: '#1f2937', padding: 16, borderRadius: 8, marginBottom: 8 },
  date:      { color: '#fff', fontWeight: '600', fontSize: 15 },
  stats:     { color: '#9ca3af', fontSize: 13, marginTop: 4 },
  protocol:  { color: '#6366f1', fontSize: 11, marginTop: 4 },
});
