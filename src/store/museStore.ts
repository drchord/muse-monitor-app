import { create } from 'zustand';
import type { BandPowerMap, SignalQuality, OscConfig } from '../types/muse';

interface MuseStoreState {
  connected:     boolean;
  deviceName:    string | null;
  batteryPct:    number | null;
  bandPowers:    BandPowerMap | null;
  signalQuality: SignalQuality | null;
  oscConfig:     OscConfig;
  blink:         boolean;
  jawClench:     boolean;

  setConnected:     (v: boolean, name?: string | null) => void;
  setBatteryPct:    (pct: number)                      => void;
  setBandPowers:    (bp: BandPowerMap)                 => void;
  setSignalQuality: (sq: SignalQuality)                => void;
  setOscConfig:     (cfg: Partial<OscConfig>)          => void;
  setArtifacts:     (blink: boolean, jaw: boolean)     => void;
}

export const useMuseStore = create<MuseStoreState>((set) => ({
  connected:     false,
  deviceName:    null,
  batteryPct:    null,
  bandPowers:    null,
  signalQuality: null,
  oscConfig:     { host: '192.168.1.100', port: 5000, enabled: false },
  blink:         false,
  jawClench:     false,

  setConnected:     (v, name = null)  => set({ connected: v, deviceName: name }),
  setBatteryPct:    (pct)             => set({ batteryPct: pct }),
  setBandPowers:    (bp)              => set({ bandPowers: bp }),
  setSignalQuality: (sq)             => set({ signalQuality: sq }),
  setOscConfig:     (cfg)             => set(s => ({ oscConfig: { ...s.oscConfig, ...cfg } })),
  setArtifacts:     (blink, jaw)      => set({ blink, jawClench: jaw }),
}));
