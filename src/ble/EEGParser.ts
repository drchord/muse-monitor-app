import { SCALE_FACTOR_EEG } from './constants';

export interface RawEEGPacket {
  sequenceId: number;
  samples: number[];
}

export function parseEEGPacket(data: Uint8Array): RawEEGPacket {
  if (data.length < 20) throw new Error(`EEG packet too short: ${data.length}`);

  const sequenceId = (data[0] << 8) | data[1];
  const samples: number[] = [];

  for (let i = 0; i < 12; i++) {
    const byteOffset = 2 + Math.floor(i * 12 / 8);
    const bitOffset  = (i * 12) % 8;

    let raw: number;
    if (bitOffset === 0) {
      raw = (data[byteOffset] << 4) | (data[byteOffset + 1] >> 4);
    } else {
      raw = ((data[byteOffset] & 0x0f) << 8) | data[byteOffset + 1];
    }

    const signed = raw > 2047 ? raw - 4096 : raw;
    samples.push(signed * SCALE_FACTOR_EEG);
  }

  return { sequenceId, samples };
}
