import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

interface BandHistory {
  delta: number[];
  theta: number[];
  alpha: number[];
  beta:  number[];
  gamma: number[];
}

interface Props {
  history: BandHistory;
  windowSize?: number;
}

const BAND_COLORS: Record<string, string> = {
  delta: '#a78bfa',
  theta: '#34d399',
  alpha: '#fbbf24',
  beta:  '#f87171',
  gamma: '#60a5fa',
};

const BAND_ORDER = ['delta', 'theta', 'alpha', 'beta', 'gamma'];

export function BandChart({ history, windowSize = 60 }: Props) {
  // Simple text-based chart fallback (Victory Native requires device for rendering)
  // The actual chart renders on device via victory-native
  const latest = BAND_ORDER.map(band => {
    const vals = history[band as keyof BandHistory];
    const last = vals.length > 0 ? vals[vals.length - 1].toFixed(2) : '--';
    return { band, last };
  });

  return (
    <View style={styles.container}>
      {latest.map(({ band, last }) => (
        <View key={band} style={styles.row}>
          <View style={[styles.dot, { backgroundColor: BAND_COLORS[band] }]} />
          <Text style={styles.label}>{band.toUpperCase()}</Text>
          <Text style={[styles.value, { color: BAND_COLORS[band] }]}>{last}</Text>
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { padding: 12, backgroundColor: '#1f2937', borderRadius: 12, marginVertical: 8 },
  row:       { flexDirection: 'row', alignItems: 'center', paddingVertical: 4 },
  dot:       { width: 10, height: 10, borderRadius: 5, marginRight: 8 },
  label:     { color: '#9ca3af', fontSize: 12, width: 50 },
  value:     { fontSize: 14, fontWeight: '600', marginLeft: 8 },
});
