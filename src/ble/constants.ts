export const MUSE_SERVICE_UUID = '0000fe8d-0000-1000-8000-00805f9b34fb';
export const CTRL_CHAR_UUID    = '273e0001-4c4d-454d-96be-f03bac821358';
export const EEG_CHAR_UUID     = '273e0013-4c4d-454d-96be-f03bac821358';
export const ACC_CHAR_UUID     = '273e000a-4c4d-454d-96be-f03bac821358';
export const GYRO_CHAR_UUID    = '273e0009-4c4d-454d-96be-f03bac821358';
export const BATT_CHAR_UUID    = '273e000b-4c4d-454d-96be-f03bac821358';
export const PPG_CHAR_UUIDS    = [
  '273e000f-4c4d-454d-96be-f03bac821358',
  '273e0010-4c4d-454d-96be-f03bac821358',
  '273e0011-4c4d-454d-96be-f03bac821358',
];

export const SCALE_FACTOR_EEG = 0.48828125;

export const CMD_PRESET21  = [0x70, 0x32, 0x31, 0x0a] as const;
export const CMD_START     = [0x73, 0x0a]               as const;
export const CMD_STOP      = [0x64, 0x0a]               as const;
export const CMD_KEEPALIVE = [0x68, 0x0a]               as const;

export const BAND_RANGES = {
  delta: [0.5, 4]   as [number, number],
  theta: [4,   8]   as [number, number],
  alpha: [8,  13]   as [number, number],
  beta:  [13, 30]   as [number, number],
  gamma: [30, 44]   as [number, number],
} as const;

export type BandName = keyof typeof BAND_RANGES;

export const ELECTRODE_LABELS = ['TP9', 'AF7', 'AF8', 'TP10'] as const;
export type ElectrodeLabel = typeof ELECTRODE_LABELS[number];
