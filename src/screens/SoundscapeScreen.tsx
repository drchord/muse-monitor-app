import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import Slider from '@react-native-community/slider';
import { SoundscapePlayer } from '../audio/SoundscapePlayer';
import { SoundscapeGrid } from '../components/SoundscapeGrid';

const player = new SoundscapePlayer();

export function SoundscapeScreen() {
  const [activeKey, setActiveKey] = useState<string | null>(null);
  const [volume,    setVolume]    = useState(0.5);

  const handleSelect = async (key: string) => {
    await player.play(key);
    setActiveKey(key);
  };

  const handleStop = async () => {
    await player.stop();
    setActiveKey(null);
  };

  const handleVolume = async (v: number) => {
    setVolume(v);
    await player.setVolume(v);
  };

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>Soundscapes</Text>
      <Text style={styles.note}>Loops continuously. Tap again to stop. Chimes play on top.</Text>

      <View style={styles.volRow}>
        <Text style={styles.label}>Volume</Text>
        <Slider
          style={{ flex: 1, marginLeft: 12 }}
          minimumValue={0}
          maximumValue={1}
          value={volume}
          onValueChange={handleVolume}
          minimumTrackTintColor="#6366f1"
          maximumTrackTintColor="#374151"
        />
        <Text style={styles.volPct}>{Math.round(volume * 100)}%</Text>
      </View>

      <SoundscapeGrid
        activeKey={activeKey}
        onSelect={handleSelect}
        onStop={handleStop}
      />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#111', padding: 16 },
  title:     { fontSize: 22, fontWeight: '700', color: '#fff', marginBottom: 4 },
  note:      { color: '#6b7280', fontSize: 13, marginBottom: 16 },
  volRow:    { flexDirection: 'row', alignItems: 'center', marginBottom: 8 },
  label:     { color: '#9ca3af', fontSize: 14 },
  volPct:    { color: '#9ca3af', fontSize: 12, width: 36, textAlign: 'right' },
});
