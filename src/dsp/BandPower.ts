import { BAND_RANGES, BandName } from '../ble/constants';

export function bandPowersFromPSD(
  freqs: Float32Array,
  power: Float32Array
): Record<BandName, number> {
  const df = freqs.length > 1 ? freqs[1] - freqs[0] : 1; // bin width in Hz
  const result = {} as Record<BandName, number>;
  for (const [band, [lo, hi]] of Object.entries(BAND_RANGES) as [BandName, [number, number]][]) {
    let sum = 0, count = 0;
    for (let i = 0; i < freqs.length; i++) {
      if (freqs[i] >= lo && freqs[i] < hi) { sum += power[i]; count++; }
    }
    // Rectangular integration (power in band, µV²·Hz) — comparable across bands of different widths
    const bandPower = count > 0 ? sum * df : 1e-12;
    result[band] = Math.log10(Math.max(bandPower, 1e-12));
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
