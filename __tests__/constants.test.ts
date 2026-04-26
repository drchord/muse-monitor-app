import {
  MUSE_SERVICE_UUID,
  CTRL_CHAR_UUID,
  EEG_CHAR_UUID,
  SCALE_FACTOR_EEG
} from '../src/ble/constants';

test('GATT UUIDs are correct format', () => {
  expect(MUSE_SERVICE_UUID).toMatch(/^[0-9a-f-]{36}$/i);
  expect(CTRL_CHAR_UUID).toMatch(/273e0001/);
  expect(EEG_CHAR_UUID).toMatch(/273e0013/);
});

test('EEG scale factor is correct', () => {
  expect(SCALE_FACTOR_EEG).toBeCloseTo(0.48828125);
});
