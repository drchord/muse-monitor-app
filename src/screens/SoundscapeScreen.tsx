import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import Slider from '@react-native-community/slider';
import { SoundscapePlayer } from '../audio/SoundscapePlayer';
import { SoundscapeGrid } from '../components/SoundscapeGrid';
import { SpotifyController, TrackInfo } from '@/spotify/SpotifyRemote';

const player  = new SoundscapePlayer();
const spotify = new SpotifyController();

export function SoundscapeScreen() {
  const [activeKey,        setActiveKey]        = useState<string | null>(null);
  const [volume,           setVolume]           = useState(0.5);
  const [spotifyConnected, setSpotifyConnected] = useState(false);
  const [trackInfo,        setTrackInfo]        = useState<TrackInfo | null>(null);

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

  const handleSpotifyConnect = async () => {
    const ok = await spotify.connect();
    setSpotifyConnected(ok);
    if (ok) {
      const track = await spotify.getTrack();
      setTrackInfo(track);
    }
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

      <View style={styles.spotifySection}>
        <Text style={styles.catHeader}>Spotify</Text>
        {!spotifyConnected ? (
          <TouchableOpacity
            style={[styles.tile, { width: '100%', justifyContent: 'center' }]}
            onPress={handleSpotifyConnect}
          >
            <Text style={styles.tileText}>Connect Spotify (Premium)</Text>
          </TouchableOpacity>
        ) : (
          <View>
            {trackInfo && (
              <Text style={styles.trackInfo}>
                {trackInfo.name} — {trackInfo.artistName}
              </Text>
            )}
            <View style={styles.spotifyControls}>
              <TouchableOpacity style={styles.ctrlBtn} onPress={() => spotify.pause()}>
                <Text style={styles.ctrlIcon}>⏸</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.ctrlBtn} onPress={() => spotify.resume()}>
                <Text style={styles.ctrlIcon}>▶️</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.ctrlBtn} onPress={() => spotify.skipNext()}>
                <Text style={styles.ctrlIcon}>⏭</Text>
              </TouchableOpacity>
            </View>
            <Text style={styles.spotifyNote}>
              Play any meditation playlist in Spotify, then return here.
              OSC streaming and chimes continue regardless.
            </Text>
          </View>
        )}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container:       { flex: 1, backgroundColor: '#111', padding: 16 },
  title:           { fontSize: 22, fontWeight: '700', color: '#fff', marginBottom: 4 },
  note:            { color: '#6b7280', fontSize: 13, marginBottom: 16 },
  volRow:          { flexDirection: 'row', alignItems: 'center', marginBottom: 8 },
  label:           { color: '#9ca3af', fontSize: 14 },
  volPct:          { color: '#9ca3af', fontSize: 12, width: 36, textAlign: 'right' },
  spotifySection:  { marginTop: 24, borderTopWidth: 1, borderTopColor: '#1f2937', paddingTop: 16 },
  catHeader:       { fontSize: 16, fontWeight: '600', color: '#fff', marginBottom: 12 },
  tile:            { backgroundColor: '#1f2937', borderRadius: 8, padding: 14, marginBottom: 8 },
  tileText:        { color: '#fff', fontSize: 14, fontWeight: '500' },
  spotifyControls: { flexDirection: 'row', gap: 12, marginVertical: 12 },
  ctrlBtn:         { backgroundColor: '#1db954', padding: 12, borderRadius: 24, width: 48, height: 48, alignItems: 'center', justifyContent: 'center' },
  ctrlIcon:        { fontSize: 20 },
  trackInfo:       { color: '#1db954', fontSize: 13, marginBottom: 8 },
  spotifyNote:     { color: '#6b7280', fontSize: 11, lineHeight: 16, marginTop: 4 },
});
