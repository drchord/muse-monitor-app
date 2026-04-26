import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

interface Props {
  score: number;
  inState: boolean;
}

export function NeurofeedbackGauge({ score, inState }: Props) {
  const pct = Math.round(score);
  const color = inState ? '#22c55e' : '#6366f1';

  return (
    <View style={styles.container}>
      <View style={[styles.circle, { borderColor: color }]}>
        <Text style={[styles.score, { color }]}>{pct}</Text>
        <Text style={styles.label}>{inState ? 'In State' : 'Training'}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { alignItems: 'center', justifyContent: 'center', padding: 12 },
  circle:    { width: 140, height: 140, borderRadius: 70, borderWidth: 6, alignItems: 'center', justifyContent: 'center' },
  score:     { fontSize: 40, fontWeight: '700' },
  label:     { fontSize: 11, color: '#9ca3af', marginTop: 2 },
});
