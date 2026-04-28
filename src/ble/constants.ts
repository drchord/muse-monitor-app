export const MUSE_SERVICE_UUID = '0000fe8d-0000-1000-8000-00805f9b34fb';
export const CTRL_CHAR_UUID    = '273e0001-4c4d-454d-96be-f03bac821358';
// Muse 2 / Muse S: one characteristic per electrode (TP9, AF7, AF8, TP10)
export const EEG_CHAR_UUIDS = [
  '273e0013-4c4d-454d-96be-f03bac821358', // ch0 TP9
  '273e0014-4c4d-454d-96be-f03bac821358', // ch1 AF7
  '273e0015-4c4d-454d-96be-f03bac821358', // ch2 AF8
  '273e0016-4c4d-454d-96be-f03bac821358', // ch3 TP10
] as const;
export const EEG_CHAR_UUID = EEG_CHAR_UUIDS[0]; // back-compat alias
export const ACC_CHAR_UUID     = '273e000a-4c4d-454d-96be-f03bac821358';
export const GYRO_CHAR_UUID    = '273e0009-4c4d-454d-96be-f03bac821358';
export const BATT_CHAR_UUID    = '273e000b-4c4d-454d-96be-f03bac821358';
export const PPG_CHAR_UUIDS    = [
  '273e000f-4c4d-454d-96be-f03bac821358',
  '273e0010-4c4d-454d-96be-f03bac821358',
  '273e0011-4c4d-454d-96be-f03bac821358',
];

export const SCALE_FACTOR_EEG = 0.48828125;

// Commands derived from muselsl muse.py (alexandrebarachant/muse-lsl)
// All use _write_cmd_str format: [len+1, ...ascii_bytes, 0x0a]
// muselsl always writes WITHOUT response (wait_for_response=False)
export const CMD_PRESET21  = [0x04, 0x70, 0x32, 0x31, 0x0a] as const; // 'p21\n' — select preset
export const CMD_RESUME    = [0x02, 0x64, 0x0a]              as const; // 'd\n'   — start/resume stream
export const CMD_STOP      = [0x02, 0x68, 0x0a]              as const; // 'h\n'   — halt/stop stream
export const CMD_KEEPALIVE = [0x02, 0x6b, 0x0a]              as const; // 'k\n'   — keepalive

// Aliases kept for callers that may reference old names
/** @deprecated use CMD_RESUME */
export const CMD_START = CMD_RESUME;
/** @deprecated CMD_CONTROL ('c') not used by muselsl; use CMD_PRESET21 then CMD_RESUME */
export const CMD_CONTROL = CMD_PRESET21;

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
