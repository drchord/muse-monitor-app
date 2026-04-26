import React, { useState, useRef } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import Slider from '@react-native-community/slider';
import { SoundscapePlayer } from '../audio/SoundscapePlayer';
import { SoundscapeGrid } from '../components/SoundscapeGrid';
import { SpotifyController, TrackInfo } from '@/spotify/SpotifyRemote';
import { C } from '../theme';

const player = new SoundscapePlayer();

export function SoundscapeScreen() {
  const spotifyRef = useRef<SpotifyController>(new SpotifyController());
  const spotify = spotifyRef.current;

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
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.heading}>Soundscapes</Text>
      <Text style={styles.subheading}>Loops continuously · Chimes play on top · Tap again to stop</Text>

      {/* Volume */}
      <View style={styles.card}>
        <View style={styles.volRow}>
          <Text style={styles.label}>🔊  Volume</Text>
          <Text style={styles.volPct}>{Math.round(volume * 100)}%</Text>
        </View>
        <Slider
          style={{ width: '100%', height: 36 }}
          minimumValue={0}
          maximumValue={1}
          value={volume}
          onValueChange={handleVolume}
          minimumTrackTintColor={C.accent}
          maximumTrackTintColor={C.border}
          thumbTintColor={C.accent}
        />
      </View>

      {/* Grid */}
      <SoundscapeGrid
        activeKey={activeKey}
        onSelect={handleSelect}
        onStop={handleStop}
      />

      {/* Spotify */}
      <View style={styles.spotifyCard}>
        <View style={styles.spotifyHeader}>
          <Text style={styles.spotifyLogo}>🎵</Text>
          <Text style={styles.spotifyTitle}>Spotify</Text>
          {spotifyConnected && (
            <View style={styles.connectedBadge}>
              <Text style={styles.connectedText}>● Connected</Text>
            </View>
          )}
        </View>

        {!spotifyConnected ? (
          <TouchableOpacity style={styles.spotifyBtn} onPress={handleSpotifyConnect}>
            <Text style={styles.spotifyBtnText}>Connect Spotify Premium →</Text>
          </TouchableOpacity>
        ) : (
          <View style={styles.playerWrap}>
            {trackInfo && (
              <View style={styles.trackWrap}>
                <Text style={styles.trackName} numberOfLines={1}>{trackInfo.name}</Text>
                <Text style={styles.trackArtist} numberOfLines={1}>{trackInfo.artistName}</Text>
              </View>
            )}
            <View style={styles.controls}>
              <TouchableOpacity style={styles.ctrlBtn} onPress={() => { spotify.pause().catch(console.error); }}>
                <Text style={styles.ctrlIcon}>⏸</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.ctrlBtnMain} onPress={() => { spotify.resume().catch(console.error); }}>
                <Text style={styles.ctrlIcon}>▶</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.ctrlBtn} onPress={() => { spotify.skipNext().catch(console.error); }}>
                <Text style={styles.ctrlIcon}>⏭</Text>
              </TouchableOpacity>
            </View>
            <Text style={styles.spotifyNote}>
              Start any meditation playlist in Spotify, then return here. OSC and chimes continue regardless.
            </Text>
          </View>
        )}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container:      { flex: 1, backgroundColor: C.bg },
  content:        { padding: 16, paddingBottom: 40 },
  heading:        { fontSize: 26, fontWeight: '800', color: C.white, letterSpacing: 0.3, marginBottom: 4 },
  subheading:     { color: C.muted, fontSize: 12, marginBottom: 20, letterSpacing: 0.3 },
  card:           {
    backgroundColor: C.surface, borderWidth: 1, borderColor: C.border,
    borderRadius: 12, padding: 14, marginBottom: 16,
  },
  volRow:         { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  label:          { color: C.dim, fontSize: 14, fontWeight: '500' },
  volPct:         { color: C.accent, fontSize: 14, fontWeight: '700' },
  spotifyCard:    {
    backgroundColor: '#0d1f12', borderWidth: 1, borderColor: '#1a3322',
    borderRadius: 12, padding: 16, marginTop: 8,
  },
  spotifyHeader:  { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 14 },
  spotifyLogo:    { fontSize: 20 },
  spotifyTitle:   { color: C.white, fontSize: 18, fontWeight: '700', flex: 1 },
  connectedBadge: { backgroundColor: '#052e16', paddingHorizontal: 10, paddingVertical: 3, borderRadius: 12, borderWidth: 1, borderColor: C.spotify },
  connectedText:  { color: C.spotify, fontSize: 11, fontWeight: '700' },
  spotifyBtn:     {
    backgroundColor: C.spotify, borderRadius: 10,
    padding: 14, alignItems: 'center',
  },
  spotifyBtnText: { color: '#000', fontWeight: '800', fontSize: 14 },
  playerWrap:     { gap: 12 },
  trackWrap:      { backgroundColor: '#0a1a0f', borderRadius: 8, padding: 10 },
  trackName:      { color: C.white, fontWeight: '700', fontSize: 15 },
  trackArtist:    { color: C.spotify, fontSize: 12, marginTop: 2 },
  controls:       { flexDirection: 'row', gap: 12, justifyContent: 'center' },
  ctrlBtn:        {
    backgroundColor: '#1a3322', padding: 14, borderRadius: 30,
    width: 52, height: 52, alignItems: 'center', justifyContent: 'center',
  },
  ctrlBtnMain:    {
    backgroundColor: C.spotify, padding: 14, borderRadius: 30,
    width: 56, height: 56, alignItems: 'center', justifyContent: 'center',
  },
  ctrlIcon:       { fontSize: 18, color: C.white },
  spotifyNote:    { color: C.muted, fontSize: 11, lineHeight: 16, textAlign: 'center' },
});
