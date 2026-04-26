import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

const LABELS = ['TP9', 'AF7', 'AF8', 'TP10'];

interface Props {
  horseshoe: [number, number, number, number];
}

const colorForValue = (v: number) => v === 1 ? '#22c55e' : v === 2 ? '#f59e0b' : '#ef4444';

export function SignalDots({ horseshoe }: Props) {
  return (
    <View style={styles.row}>
      {horseshoe.map((v, i) => (
        <View key={i} style={styles.item}>
          <View style={[styles.dot, { backgroundColor: colorForValue(v) }]} />
          <Text style={styles.label}>{LABELS[i]}</Text>
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  row:   { flexDirection: 'row', justifyContent: 'space-evenly', paddingVertical: 12 },
  item:  { alignItems: 'center', gap: 4 },
  dot:   { width: 24, height: 24, borderRadius: 12 },
  label: { color: '#fff', fontSize: 10 },
});
