import React, { useEffect, useState } from 'react';
import { View, Text, ScrollView, StyleSheet, Switch, TouchableOpacity } from 'react-native';
import { useMuseStore } from '../store/museStore';
import { BandChart } from '../components/BandChart';
import { NeurofeedbackGauge } from '../components/NeurofeedbackGauge';
import { SignalDots } from '../components/SignalDots';
import type { BandName } from '../ble/constants';
import { AudioFeedback, StateTransitionDetector } from '../audio/AudioFeedback';

const audioFeedback = new AudioFeedback();
const transitionDetector = new StateTransitionDetector(60);

const HISTORY_MAX = 300;

type BandHistory = Record<BandName, number[]>;

const emptyHistory = (): BandHistory => ({
  delta: [], theta: [], alpha: [], beta: [], gamma: [],
});

export function DashboardScreen({ navigation }: any) {
  const { bandPowers, signalQuality, batteryPct, oscConfig, setOscConfig } = useMuseStore();
  const [history,    setHistory]    = useState<BandHistory>(emptyHistory());
  const [depthScore, setDepthScore] = useState(0);
  const [inState,    setInState]    = useState(false);

  // Load audio on mount, unload on unmount
  useEffect(() => {
    audioFeedback.load().catch(() => {}); // silently fail if expo-av not ready
    return () => { audioFeedback.unload(); };
  }, []);

  useEffect(() => {
    if (!bandPowers) return;

    setHistory(prev => {
      const next = { ...prev } as BandHistory;
      for (const band of Object.keys(bandPowers) as BandName[]) {
        const avg = bandPowers[band].reduce((a, b) => a + b, 0) / bandPowers[band].length;
        next[band] = [...prev[band].slice(-HISTORY_MAX + 1), avg];
      }
      return next;
    });

    const avgBand = (b: BandName) =>
      bandPowers[b].reduce((a, x) => a + x, 0) / 4;
    const target = avgBand('theta') + avgBand('delta');
    const total  = (['delta','theta','alpha','beta','gamma'] as BandName[])
      .reduce((s, b) => s + Math.pow(10, avgBand(b)), 0);
    const score  = Math.min(100, Math.round(Math.pow(10, target) / total * 100));
    setDepthScore(score);
    setInState(score > 60);

    const transition = transitionDetector.update(score);
    if (transition === 'enter') audioFeedback.playReward();
    if (transition === 'drift')  audioFeedback.playDrift();
  }, [bandPowers]);

  return (
    <ScrollView style={styles.container}>
      <View style={styles.topRow}>
        <NeurofeedbackGauge score={depthScore} inState={inState} />
        <View style={styles.infoCol}>
          <Text style={styles.label}>Battery: {batteryPct ?? '--'}%</Text>
          {signalQuality && <SignalDots horseshoe={signalQuality.horseshoe} />}
          <TouchableOpacity onPress={() => navigation.navigate('Soundscape')} style={styles.navBtn}>
            <Text style={styles.navBtnText}>🎵 Soundscapes</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={() => navigation.navigate('History')} style={styles.navBtn}>
            <Text style={styles.navBtnText}>📊 History</Text>
          </TouchableOpacity>
        </View>
      </View>

      <BandChart history={history} windowSize={60} />

      <View style={styles.oscRow}>
        <Text style={styles.label}>OSC Stream to Laptop</Text>
        <Switch
          value={oscConfig.enabled}
          onValueChange={v => setOscConfig({ enabled: v })}
        />
      </View>
      <TouchableOpacity onPress={() => navigation.navigate('Stream')}>
        <Text style={styles.oscInfo}>→ {oscConfig.host}:{oscConfig.port}  (tap to configure)</Text>
      </TouchableOpacity>

      <View style={styles.oscRow}>
        <Text style={styles.label}>Chime Volume</Text>
        <View style={{ flex: 1, marginLeft: 12 }}>
          {/* Simple text display — full slider in Task 15b with @react-native-community/slider */}
          <Text style={{ color: '#6366f1' }}>70%</Text>
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#111', padding: 16 },
  topRow:    { flexDirection: 'row', alignItems: 'flex-start', marginBottom: 8 },
  infoCol:   { flex: 1, marginLeft: 8 },
  label:     { color: '#9ca3af', fontSize: 14, marginBottom: 4 },
  oscRow:    { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 16 },
  oscInfo:   { color: '#6b7280', fontSize: 12, marginTop: 4 },
  navBtn:    { backgroundColor: '#1f2937', padding: 10, borderRadius: 8, marginTop: 6 },
  navBtnText:{ color: '#9ca3af', fontSize: 13 },
});
