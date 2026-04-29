import { attachPipeline } from '../src/ble/EEGPipeline';
import { useMuseStore } from '../src/store/museStore';

class FakeClient {
  onEEG: (ch: number, pkt: { sequenceId: number; samples: number[] }) => void = () => {};
  onBattery: (pct: number) => void = () => {};
  onAcc: (x: number, y: number, z: number) => void = () => {};
}

const fakeSender = {
  configure:      () => {},
  sendBandPowers: () => {},
  sendBattery:    () => {},
  sendAcc:        () => {},
};

function pkt(seq: number): { sequenceId: number; samples: number[] } {
  return { sequenceId: seq, samples: new Array(12).fill(0) };
}

beforeEach(() => {
  useMuseStore.setState({
    bandPowers: null,
    batteryPct: null,
    oscConfig: { enabled: false, host: '127.0.0.1', port: 9000 },
  } as any);
});

test('no update fires before SAMPLES_PER_UPDATE (25.6) samples accumulate', () => {
  const client = new FakeClient();
  attachPipeline(client as any, fakeSender as any);
  // 2 packets × 12 = 24 samples < 25.6
  client.onEEG(0, pkt(0));
  client.onEEG(0, pkt(1));
  expect(useMuseStore.getState().bandPowers).toBeNull();
});

test('first update fires once 3 ch0 packets arrive (36 samples > 25.6)', () => {
  const client = new FakeClient();
  attachPipeline(client as any, fakeSender as any);
  client.onEEG(0, pkt(0));
  client.onEEG(0, pkt(1));
  client.onEEG(0, pkt(2));
  expect(useMuseStore.getState().bandPowers).not.toBeNull();
});

test('non-ch0 packets do not drive update clock', () => {
  const client = new FakeClient();
  attachPipeline(client as any, fakeSender as any);
  // 10 packets on ch1-3 should not fire any update — clock runs on ch0 only
  for (let i = 0; i < 10; i++) {
    client.onEEG(1, pkt(i));
    client.onEEG(2, pkt(i));
    client.onEEG(3, pkt(i));
  }
  expect(useMuseStore.getState().bandPowers).toBeNull();
});

test('fractional carry: 54 ch0 packets produce 25 store updates (not 18)', () => {
  // SAMPLES_PER_UPDATE = 256/10 = 25.6, 12 samples per packet
  // With carry    (-= 25.6): floor(54×12 / 25.6) = floor(648/25.6) = 25 updates
  // Without carry (= 0):     1 update per 3 packets                = 18 updates
  const client = new FakeClient();
  attachPipeline(client as any, fakeSender as any);

  let updateCount = 0;
  const unsub = useMuseStore.subscribe((_state, prevState) => {
    if (_state.bandPowers !== prevState.bandPowers) updateCount++;
  });

  for (let i = 0; i < 54; i++) client.onEEG(0, pkt(i));

  unsub();
  expect(updateCount).toBe(25);
});

test('sequence gap on ch0 resets update clock', () => {
  const client = new FakeClient();
  attachPipeline(client as any, fakeSender as any);

  // Accumulate 24 samples (not yet enough)
  client.onEEG(0, pkt(0));
  client.onEEG(0, pkt(1));
  expect(useMuseStore.getState().bandPowers).toBeNull();

  // Gap: seq 3 expected 2 → clock resets to 0, then adds 12 from this packet
  client.onEEG(0, pkt(3));
  expect(useMuseStore.getState().bandPowers).toBeNull(); // only 12 samples since reset

  // Need 2 more packets to cross 25.6 again
  client.onEEG(0, pkt(4));
  expect(useMuseStore.getState().bandPowers).toBeNull(); // 24 samples
  client.onEEG(0, pkt(5));
  expect(useMuseStore.getState().bandPowers).not.toBeNull(); // 36 samples → update
});
