import React, { useEffect, useState } from 'react';
import { View, Text, ScrollView, StyleSheet, Switch, TouchableOpacity } from 'react-native';
import { useMuseStore } from '../store/museStore';
import { BandChart } from '../components/BandChart';
import { NeurofeedbackGauge } from '../components/NeurofeedbackGauge';
import { SignalDots } from '../components/SignalDots';
import type { BandName } from '../ble/constants';
import { AudioFeedback, StateTransitionDetector } from '../audio/AudioFeedback';
import { ArtifactDetector } from '../ble/ArtifactDetector';
import { C } from '../theme';

const audioFeedback = new AudioFeedback();
const transitionDetector = new StateTransitionDetector(60);
const artifactDetector = new ArtifactDetector();

const HISTORY_MAX = 300;
type BandHistory = Record<BandName, number[]>;
const emptyHistory = (): BandHistory => ({
  delta: [], theta: [], alpha: [], beta: [], gamma: [],
});

function BatteryBadge({ pct }: { pct: number | null }) {
  if (pct === null) return <Text style={styles.batteryUnknown}>🔋 --</Text>;
  const color = pct > 50 ? C.green : pct > 20 ? C.amber : C.red;
  const icon = pct > 50 ? '🔋' : pct > 20 ? '🪫' : '⚠️';
  return <Text style={[styles.battery, { color }]}>{icon} {pct}%</Text>;
}

export function DashboardScreen({ navigation }: any) {
  // Individual selectors — each re-renders only when its own slice changes
  const bandPowers    = useMuseStore(s => s.bandPowers);
  const signalQuality = useMuseStore(s => s.signalQuality);
  const batteryPct    = useMuseStore(s => s.batteryPct);
  const connected     = useMuseStore(s => s.connected);
  const blink         = useMuseStore(s => s.blink);
  const jawClench     = useMuseStore(s => s.jawClench);
  const setArtifacts  = useMuseStore(s => s.setArtifacts);
  const oscConfig     = useMuseStore(s => s.oscConfig);
  const setOscConfig  = useMuseStore(s => s.setOscConfig);

  const [history,    setHistory]    = useState<BandHistory>(emptyHistory());
  const [depthScore, setDepthScore] = useState(0);
  const [inState,    setInState]    = useState(false);

  useEffect(() => {
    audioFeedback.load().catch(() => {});
    return () => { audioFeedback.unload(); };
  }, []);

  useEffect(() => {
    transitionDetector.reset();
    artifactDetector.reset();
    setHistory(emptyHistory());
    setDepthScore(0);
    setInState(false);
  }, [connected]);

  useEffect(() => {
    if (!bandPowers) return;
    setHistory(prev => {
      const next = { ...prev } as BandHistory;
      for (const band of Object.keys(bandPowers) as BandName[]) {
        const vals = bandPowers[band];
        const avg = vals.reduce((a, b) => a + b, 0) / vals.length;
        next[band] = [...prev[band].slice(-HISTORY_MAX + 1), avg];
      }
      return next;
    });
    const avgBand = (b: BandName) => {
      const vals = bandPowers[b];
      return vals.reduce((a, x) => a + x, 0) / vals.length;
    };
    // Theta+alpha relative power vs beta+gamma — standard neurofeedback relaxation index.
    // Old formula (10^(delta+theta) / sum_all) scored alert states >60 because
    // delta is always large regardless of mental state (artifacts, slow drift).
    const toLin = (b: BandName) => Math.pow(10, avgBand(b));
    const relaxNum   = toLin('theta') + toLin('alpha');
    const relaxDenom = relaxNum + toLin('beta') + toLin('gamma');
    const score  = Math.min(100, Math.round(relaxNum / relaxDenom * 100));
    setDepthScore(score);
    setInState(score > 60);
    const transition = transitionDetector.update(score);
    if (transition === 'enter') audioFeedback.playReward();
    if (transition === 'drift')  audioFeedback.playDrift();

    const { blink: blinkNow, jawClench: jawNow } = artifactDetector.update(bandPowers);
    if (blinkNow || jawNow) {
      setArtifacts(blinkNow, jawNow);
      setTimeout(() => setArtifacts(false, false), 800);
    }
  }, [bandPowers]);

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {/* State badge */}
      <View style={[styles.stateBadge, inState ? styles.stateBadgeOn : styles.stateBadgeOff]}>
        <Text style={styles.stateDot}>{inState ? '●' : '○'}</Text>
        <Text style={styles.stateText}>{inState ? 'IN FLOW STATE' : 'TRACKING…'}</Text>
      </View>

      {/* Artifact badges */}
      {(blink || jawClench) && (
        <View style={styles.artifactRow}>
          {blink     && <View style={styles.artifactBadge}><Text style={styles.artifactText}>👁 BLINK</Text></View>}
          {jawClench && <View style={styles.artifactBadge}><Text style={styles.artifactText}>😬 JAW</Text></View>}
        </View>
      )}

      {/* Gauge + info */}
      <View style={styles.topRow}>
        <NeurofeedbackGauge score={depthScore} inState={inState} />
        <View style={styles.infoCol}>
          <BatteryBadge pct={batteryPct ?? null} />
          {signalQuality && (
            <View style={styles.signalWrap}>
              <Text style={styles.sectionLabel}>Signal</Text>
              <SignalDots horseshoe={signalQuality.horseshoe} />
            </View>
          )}
          <TouchableOpacity
            onPress={() => navigation.navigate('Soundscape')}
            style={styles.navBtn}
          >
            <Text style={styles.navBtnText}>🎵  Soundscapes</Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => navigation.navigate('History')}
            style={styles.navBtn}
          >
            <Text style={styles.navBtnText}>📊  Sessions</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* EEG chart */}
      <View style={styles.card}>
        <Text style={styles.sectionLabel}>EEG Band Powers</Text>
        <BandChart history={history} windowSize={60} />
      </View>

      {/* OSC control */}
      <View style={styles.card}>
        <View style={styles.oscRow}>
          <Text style={styles.sectionLabel}>OSC Stream</Text>
          <Switch
            value={oscConfig.enabled}
            onValueChange={v => setOscConfig({ enabled: v })}
            trackColor={{ false: C.border, true: C.accentDeep }}
            thumbColor={oscConfig.enabled ? C.accent : C.dim}
          />
        </View>
        <TouchableOpacity onPress={() => navigation.navigate('Stream')}>
          <Text style={styles.oscInfo}>→ {oscConfig.host}:{oscConfig.port}  (tap to configure)</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container:       { flex: 1, backgroundColor: C.bg },
  content:         { padding: 16, paddingBottom: 32 },
  stateBadge:      {
    flexDirection: 'row', alignItems: 'center', alignSelf: 'center',
    paddingHorizontal: 18, paddingVertical: 7, borderRadius: 20,
    marginBottom: 16, gap: 6,
  },
  stateBadgeOn:    { backgroundColor: '#052e16', borderWidth: 1, borderColor: C.green },
  stateBadgeOff:   { backgroundColor: C.surface, borderWidth: 1, borderColor: C.border },
  stateDot:        { fontSize: 10 },
  stateText:       { fontSize: 12, fontWeight: '700', letterSpacing: 1.2, color: C.white },
  topRow:          { flexDirection: 'row', alignItems: 'flex-start', marginBottom: 12 },
  infoCol:         { flex: 1, marginLeft: 10, gap: 8 },
  battery:         { fontSize: 14, fontWeight: '600' },
  batteryUnknown:  { fontSize: 14, color: C.muted },
  signalWrap:      { gap: 4 },
  sectionLabel:    { color: C.dim, fontSize: 11, fontWeight: '600', letterSpacing: 0.8, textTransform: 'uppercase', marginBottom: 4 },
  navBtn:          {
    backgroundColor: C.surface, borderWidth: 1, borderColor: C.border,
    padding: 10, borderRadius: 10,
  },
  navBtnText:      { color: C.white, fontSize: 13, fontWeight: '500' },
  card:            {
    backgroundColor: C.surface, borderWidth: 1, borderColor: C.border,
    borderRadius: 12, padding: 14, marginBottom: 12,
  },
  oscRow:          { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 },
  oscInfo:         { color: C.muted, fontSize: 12 },
  artifactRow:     { flexDirection: 'row', justifyContent: 'center', gap: 8, marginBottom: 8 },
  artifactBadge:   {
    backgroundColor: '#1a1a2e', borderWidth: 1, borderColor: C.amber,
    paddingHorizontal: 12, paddingVertical: 4, borderRadius: 12,
  },
  artifactText:    { color: C.amber, fontSize: 11, fontWeight: '700', letterSpacing: 0.8 },
});
