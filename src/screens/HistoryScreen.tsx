import React, { useEffect } from 'react';
import { View, Text, FlatList, StyleSheet } from 'react-native';
import { useSessionStore } from '@/store/sessionStore';
import { C } from '../theme';

export function HistoryScreen() {
  const { sessions, loadSessions } = useSessionStore();
  useEffect(() => { loadSessions(); }, []);

  const fmt = (s: number) => {
    const safe = Math.max(0, s);
    return `${Math.floor(safe / 60)}m ${safe % 60}s`;
  };

  const scoreColor = (pct: number) =>
    pct >= 60 ? C.green : pct >= 30 ? C.amber : C.muted;

  return (
    <View style={styles.container}>
      <FlatList
        data={sessions}
        keyExtractor={s => String(s.id)}
        contentContainerStyle={styles.list}
        ListHeaderComponent={
          <Text style={styles.heading}>Session History</Text>
        }
        ListEmptyComponent={
          <View style={styles.emptyWrap}>
            <Text style={styles.emptyIcon}>🧘</Text>
            <Text style={styles.emptyText}>No sessions yet</Text>
            <Text style={styles.emptySub}>Complete a meditation session to see your history here.</Text>
          </View>
        }
        renderItem={({ item }) => (
          <View style={styles.card}>
            <View style={styles.cardTop}>
              <Text style={styles.date}>
                {new Date(item.startedAt).toLocaleDateString('en-US', {
                  weekday: 'short', month: 'short', day: 'numeric',
                })}
              </Text>
              <Text style={[styles.flowBadge, { color: scoreColor(item.pctInState) }]}>
                {Math.round(item.pctInState)}% flow
              </Text>
            </View>
            <View style={styles.statsRow}>
              <StatPill icon="⏱" label={fmt(item.durationSec)} />
              <StatPill icon="🏆" label={`best ${fmt(item.longestRunSec)}`} />
            </View>
            <Text style={styles.protocol}>{item.protocol}</Text>
          </View>
        )}
      />
    </View>
  );
}

function StatPill({ icon, label }: { icon: string; label: string }) {
  return (
    <View style={styles.pill}>
      <Text style={styles.pillIcon}>{icon}</Text>
      <Text style={styles.pillLabel}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container:  { flex: 1, backgroundColor: C.bg },
  list:       { padding: 16, paddingBottom: 32 },
  heading:    { fontSize: 24, fontWeight: '800', color: C.white, marginBottom: 16, letterSpacing: 0.3 },
  emptyWrap:  { alignItems: 'center', marginTop: 60, gap: 8 },
  emptyIcon:  { fontSize: 48 },
  emptyText:  { color: C.white, fontSize: 18, fontWeight: '700' },
  emptySub:   { color: C.muted, fontSize: 13, textAlign: 'center', maxWidth: 240 },
  card:       {
    backgroundColor: C.surface, borderWidth: 1, borderColor: C.border,
    borderRadius: 12, padding: 16, marginBottom: 10,
  },
  cardTop:    { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
  date:       { color: C.white, fontWeight: '700', fontSize: 15 },
  flowBadge:  { fontSize: 13, fontWeight: '700' },
  statsRow:   { flexDirection: 'row', gap: 8, marginBottom: 8 },
  pill:       {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    backgroundColor: C.surfaceAlt, borderRadius: 8, paddingHorizontal: 10, paddingVertical: 5,
  },
  pillIcon:   { fontSize: 12 },
  pillLabel:  { color: C.dim, fontSize: 12 },
  protocol:   { color: C.accent, fontSize: 11, letterSpacing: 0.5 },
});
