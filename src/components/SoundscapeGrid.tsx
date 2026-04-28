import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { SOUNDSCAPE_CATALOG, SoundscapeCategory } from '../audio/SoundscapePlayer';

const CATEGORY_ICONS: Record<SoundscapeCategory, string> = {
  Nature: '🌿',
  Sacred: '🔔',
  Noise:  '〰️',
};

// Computed once at module load — SOUNDSCAPE_CATALOG is static
const BY_CATEGORY = Object.entries(SOUNDSCAPE_CATALOG).reduce(
  (acc, [key, val]) => {
    (acc[val.category] ??= []).push({ key, ...val });
    return acc;
  },
  {} as Record<string, Array<{ key: string; label: string; category: SoundscapeCategory; asset: number }>>
);

interface Props {
  activeKey: string | null;
  onSelect:  (key: string) => void;
  onStop:    () => void;
}

export function SoundscapeGrid({ activeKey, onSelect, onStop }: Props) {
  return (
    <View>
      {(['Nature', 'Sacred', 'Noise'] as SoundscapeCategory[]).map(cat => (
        <View key={cat}>
          <Text style={styles.catHeader}>{CATEGORY_ICONS[cat]}  {cat}</Text>
          <View style={styles.grid}>
            {BY_CATEGORY[cat]?.map(item => (
              <TouchableOpacity
                key={item.key}
                style={[styles.tile, activeKey === item.key && styles.tileActive]}
                onPress={() => activeKey === item.key ? onStop() : onSelect(item.key)}
              >
                <Text style={[styles.tileText, activeKey === item.key && styles.tileTextActive]}>
                  {item.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  catHeader:      { color: '#9ca3af', fontSize: 12, fontWeight: '600', marginTop: 16, marginBottom: 8, textTransform: 'uppercase', letterSpacing: 1 },
  grid:           { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  tile:           { backgroundColor: '#1f2937', paddingVertical: 10, paddingHorizontal: 14, borderRadius: 20, borderWidth: 1, borderColor: '#374151' },
  tileActive:     { backgroundColor: '#4338ca', borderColor: '#6366f1' },
  tileText:       { color: '#9ca3af', fontSize: 13 },
  tileTextActive: { color: '#fff', fontWeight: '600' },
});
