import type { BandName } from '../ble/constants';

export interface EEGSample {
  sequenceId: number;
  timestamp: number;
  channels: [number, number, number, number, number];
}

export type BandPowerMap = Record<BandName, number[]>;

export interface SignalQuality {
  horseshoe: [number, number, number, number];
  isGood:    [boolean, boolean, boolean, boolean];
  touchingForehead: boolean;
}

export interface MuseState {
  connected: boolean;
  deviceName: string | null;
  batteryPct: number | null;
  bandPowers: BandPowerMap | null;
  signalQuality: SignalQuality | null;
  rawBuffer: EEGSample[];
}

export interface OscConfig {
  host: string;
  port: number;
  enabled: boolean;
}

export interface SessionRecord {
  id: number;
  startedAt: string;
  durationSec: number;
  pctInState: number;
  longestRunSec: number;
  protocol: string;
}
