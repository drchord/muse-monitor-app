import { encodeOscMessage, encodeBandPower } from '../src/osc/OscEncoder';

test('encodes address string padded to 4-byte boundary', () => {
  const msg = encodeOscMessage('/muse/batt', 'f', [50.0]);
  // '/muse/batt' = 10 chars + null = 11 bytes → padded to 12
  expect(String.fromCharCode(...msg.slice(0, 10))).toBe('/muse/batt');
  expect(msg[10]).toBe(0); // null terminator
  expect(msg.length % 4).toBe(0); // total length multiple of 4
});

test('encodes float32 big-endian correctly', () => {
  const msg = encodeOscMessage('/x', 'f', [1.0]);
  // float32 1.0 = 0x3F800000
  const floatStart = msg.length - 4;
  const view = new DataView(msg.buffer, msg.byteOffset + floatStart, 4);
  expect(view.getFloat32(0, false)).toBeCloseTo(1.0, 4);
});

test('encodes 4 floats (band power message)', () => {
  const vals = [1.5, 2.5, 0.5, 1.0];
  const msg = encodeOscMessage('/muse/elements/alpha_absolute', 'ffff', vals);
  expect(msg.length).toBeGreaterThan(40);
  expect(msg.length % 4).toBe(0);
});

test('encodeBandPower convenience wrapper encodes correct number of floats', () => {
  const msg = encodeBandPower('/muse/elements/theta_absolute', [1.0, 2.0, 3.0, 4.0]);
  // Should have 4 float args = 16 bytes at the end
  expect(msg.length % 4).toBe(0);
  const view = new DataView(msg.buffer, msg.byteOffset);
  // Last 4 bytes = 4th float = 4.0
  expect(view.getFloat32(msg.length - 4, false)).toBeCloseTo(4.0, 4);
});

test('type tag string starts with comma', () => {
  const msg = encodeOscMessage('/test', 'if', [42, 3.14]);
  // Find the comma byte
  let commaIdx = -1;
  for (let i = 0; i < msg.length; i++) {
    if (msg[i] === 0x2c) { commaIdx = i; break; }
  }
  expect(commaIdx).toBeGreaterThan(0);
  expect(msg[commaIdx + 1]).toBe(0x69); // 'i'
  expect(msg[commaIdx + 2]).toBe(0x66); // 'f'
});
