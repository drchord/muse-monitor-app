import { parseEEGPacket } from '../src/ble/EEGParser';
import { SCALE_FACTOR_EEG } from '../src/ble/constants';

test('decodes sequence number from first two bytes', () => {
  const packet = new Uint8Array(20);
  packet[0] = 0x00;
  packet[1] = 0x05;
  const result = parseEEGPacket(packet);
  expect(result.sequenceId).toBe(5);
});

test('decodes 12 samples from 18 payload bytes', () => {
  const packet = new Uint8Array(20).fill(0);
  const result = parseEEGPacket(packet);
  expect(result.samples).toHaveLength(12);
});

test('applies scale factor to convert to microvolts', () => {
  const packet = new Uint8Array(20).fill(0xff);
  const result = parseEEGPacket(packet);
  result.samples.forEach(v => {
    expect(Math.abs(v)).toBeLessThan(2000);
  });
});

test('zero packet gives zero samples', () => {
  const packet = new Uint8Array(20).fill(0);
  const result = parseEEGPacket(packet);
  result.samples.forEach(v => expect(v).toBeCloseTo(0));
});

test('throws on packet shorter than 20 bytes', () => {
  expect(() => parseEEGPacket(new Uint8Array(10))).toThrow();
});
