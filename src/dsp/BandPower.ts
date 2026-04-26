import { BAND_RANGES, BandName } from '../ble/constants';
import { FFTProcessor } from './FFTProcessor';

const processor = new FFTProcessor(256);

export function extractBandPowers(
  samples: Float32Array,
  sampleRate = 256
): Record<BandName, number> {
  processor.pushSamples(Array.from(samples));
  const { freqs, power } = processor.getPSD();

  const result = {} as Record<BandName, number>;

  for (const [band, [lo, hi]] of Object.entries(BAND_RANGES) as [BandName, [number, number]][]) {
    let sum   = 0;
    let count = 0;
    for (let i = 0; i < freqs.length; i++) {
      if (freqs[i] >= lo && freqs[i] < hi) {
        sum += power[i];
        count++;
      }
    }
    const avgPower = count > 0 ? sum / count : 1e-12;
    result[band] = Math.log10(Math.max(avgPower, 1e-12));
  }
  return result;
}

export function bandPowerToOscArgs(
  bandPowers: Record<BandName, number>[]
): Record<BandName, number[]> {
  const out = {} as Record<BandName, number[]>;
  for (const band of Object.keys(BAND_RANGES) as BandName[]) {
    out[band] = bandPowers.map(bp => bp[band]);
  }
  return out;
}
