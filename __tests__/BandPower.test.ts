import { bandPowersFromPSD, bandPowerToOscArgs } from '../src/dsp/BandPower';
import { FFTProcessor } from '../src/dsp/FFTProcessor';
import { BAND_RANGES } from '../src/ble/constants';

function computePipeline(samples: number[], fs = 256) {
  const proc = new FFTProcessor(fs);
  proc.pushSamples(samples);
  const { freqs, power } = proc.getPSD();
  return bandPowersFromPSD(freqs, power);
}

test('returns all 5 bands', () => {
  const result = computePipeline(new Array(256).fill(0));
  expect(Object.keys(result).sort()).toEqual(Object.keys(BAND_RANGES).sort());
});

test('pure 10Hz sine gives highest power in alpha band', () => {
  const fs = 256;
  const samples = Array.from({ length: 256 }, (_, i) =>
    Math.sin(2 * Math.PI * 10 * i / fs)
  );
  const result = computePipeline(samples, fs);
  const maxBand = (Object.keys(result) as (keyof typeof result)[])
    .reduce((a, b) => result[a] > result[b] ? a : b);
  expect(maxBand).toBe('alpha');
  expect(isFinite(result.alpha)).toBe(true);
});

test('all band power values are finite (not NaN or Infinity)', () => {
  const result = computePipeline(new Array(256).fill(0.1));
  Object.values(result).forEach(v => {
    expect(isFinite(v)).toBe(true);
    expect(isNaN(v)).toBe(false);
  });
});

test('silent signal returns finite floor values', () => {
  const result = computePipeline(new Array(256).fill(0));
  Object.values(result).forEach(v => expect(isFinite(v)).toBe(true));
});

test('bandPowerToOscArgs returns arrays of length 4 per band', () => {
  const mockBP = { delta: -1, theta: -0.5, alpha: -0.3, beta: -0.8, gamma: -1.2 };
  const fourCh = [mockBP, mockBP, mockBP, mockBP];
  const result = bandPowerToOscArgs(fourCh);
  Object.values(result).forEach(arr => expect(arr).toHaveLength(4));
});

test('FFTProcessor.reset() clears stale buffer', () => {
  const proc = new FFTProcessor(256);
  const fs = 256;
  proc.pushSamples(Array.from({ length: 256 }, (_, i) =>
    Math.sin(2 * Math.PI * 10 * i / fs)
  ));
  proc.reset();
  proc.pushSamples(new Array(256).fill(0.001));
  const { freqs, power } = proc.getPSD();
  const result = bandPowersFromPSD(freqs, power);
  // After reset, no band should have 10Hz alpha peak (dominant band shifts)
  const values = Object.values(result);
  const range = Math.max(...values) - Math.min(...values);
  expect(range).toBeLessThan(10);
});
