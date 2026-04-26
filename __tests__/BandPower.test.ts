import { extractBandPowers } from '../src/dsp/BandPower';
import { BAND_RANGES } from '../src/ble/constants';

test('returns all 5 bands', () => {
  const samples = new Float32Array(256).fill(0);
  const result = extractBandPowers(samples, 256);
  expect(Object.keys(result).sort()).toEqual(Object.keys(BAND_RANGES).sort());
});

test('pure sine at 10Hz (alpha) gives finite log-bel values', () => {
  const fs = 256;
  const samples = new Float32Array(256);
  for (let i = 0; i < 256; i++) {
    samples[i] = Math.sin(2 * Math.PI * 10 * i / fs);
  }
  const result = extractBandPowers(samples, fs);
  Object.values(result).forEach(v => expect(isFinite(v)).toBe(true));
});

test('all values are finite log-bel numbers (not NaN or Infinity)', () => {
  const samples = new Float32Array(256).fill(0.1);
  const result = extractBandPowers(samples, 256);
  Object.values(result).forEach(v => {
    expect(isFinite(v)).toBe(true);
    expect(isNaN(v)).toBe(false);
  });
});

test('bandPowerToOscArgs returns arrays of length 4 per band', () => {
  const { bandPowerToOscArgs } = require('../src/dsp/BandPower');
  const mockBP = { delta: -1, theta: -0.5, alpha: -0.3, beta: -0.8, gamma: -1.2 };
  const fourCh = [mockBP, mockBP, mockBP, mockBP];
  const result = bandPowerToOscArgs(fourCh);
  Object.values(result).forEach((arr: any) => expect(arr).toHaveLength(4));
});
