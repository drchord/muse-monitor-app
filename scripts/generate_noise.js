#!/usr/bin/env node
/**
 * Generates pink noise, brown noise, and white noise as WAV files.
 * No dependencies — pure Node.js stdlib.
 * Run: node scripts/generate_noise.js
 */
const fs = require('fs');
const path = require('path');

const OUT = path.join(__dirname, '..', 'assets', 'sounds', 'soundscapes');
fs.mkdirSync(OUT, { recursive: true });

function writeWav(filename, samples, sampleRate = 44100) {
  const numSamples = samples.length;
  const buffer = Buffer.alloc(44 + numSamples * 2);

  // WAV header
  buffer.write('RIFF', 0);
  buffer.writeUInt32LE(36 + numSamples * 2, 4);
  buffer.write('WAVE', 8);
  buffer.write('fmt ', 12);
  buffer.writeUInt32LE(16, 16);          // chunk size
  buffer.writeUInt16LE(1, 20);           // PCM
  buffer.writeUInt16LE(1, 22);           // mono
  buffer.writeUInt32LE(sampleRate, 24);
  buffer.writeUInt32LE(sampleRate * 2, 28);
  buffer.writeUInt16LE(2, 32);           // block align
  buffer.writeUInt16LE(16, 34);          // bits per sample
  buffer.write('data', 36);
  buffer.writeUInt32LE(numSamples * 2, 40);

  for (let i = 0; i < numSamples; i++) {
    const v = Math.max(-1, Math.min(1, samples[i]));
    buffer.writeInt16LE(Math.round(v * 32767), 44 + i * 2);
  }

  fs.writeFileSync(filename, buffer);
}

const SR = 44100;
const DUR = 30; // 30 seconds
const N = SR * DUR;

// White noise
console.log('Generating white noise...');
const white = Array.from({ length: N }, () => (Math.random() * 2 - 1) * 0.5);
writeWav(path.join(OUT, 'white_noise.wav'), white);

// Pink noise (Voss-McCartney)
console.log('Generating pink noise...');
const pink = new Array(N);
const rows = new Array(16).fill(0);
let runningSum = 0;
for (let i = 0; i < N; i++) {
  let key = i & -i; // lowest set bit
  let bit = 0;
  while (key > 1) { key >>= 1; bit++; }
  if (bit < 16) {
    runningSum -= rows[bit];
    rows[bit] = (Math.random() * 2 - 1) * 0.1;
    runningSum += rows[bit];
  }
  pink[i] = Math.max(-1, Math.min(1, runningSum * 0.3));
}
writeWav(path.join(OUT, 'pink_noise.wav'), pink);

// Brown noise (integrated white)
console.log('Generating brown noise...');
const brown = new Array(N);
let v = 0;
for (let i = 0; i < N; i++) {
  v += (Math.random() * 2 - 1) * 0.02;
  v = Math.max(-1, Math.min(1, v));
  brown[i] = v * 0.7;
}
writeWav(path.join(OUT, 'brown_noise.wav'), brown);

console.log('Done. WAV files in assets/sounds/soundscapes/');
console.log('Note: Use the .wav files directly — expo-av supports WAV format.');
console.log('Update SoundscapePlayer.ts require() calls from .mp3 to .wav for noise tracks if needed.');
