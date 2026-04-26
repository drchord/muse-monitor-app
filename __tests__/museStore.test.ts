import { useMuseStore } from '../src/store/museStore';

beforeEach(() => {
  useMuseStore.setState({
    connected: false,
    deviceName: null,
    batteryPct: null,
    bandPowers: null,
    signalQuality: null,
    oscConfig: { host: '192.168.1.100', port: 5000, enabled: false },
  });
});

test('initial state: not connected, no band powers', () => {
  const state = useMuseStore.getState();
  expect(state.connected).toBe(false);
  expect(state.bandPowers).toBeNull();
  expect(state.oscConfig.port).toBe(5000);
});

test('setConnected updates connection state', () => {
  useMuseStore.getState().setConnected(true, 'Muse-Test');
  expect(useMuseStore.getState().connected).toBe(true);
  expect(useMuseStore.getState().deviceName).toBe('Muse-Test');
});

test('setBandPowers stores band data', () => {
  const bp = { delta: [1,1,1,1], theta: [2,2,2,2], alpha: [3,3,3,3], beta: [4,4,4,4], gamma: [0.5,0.5,0.5,0.5] };
  useMuseStore.getState().setBandPowers(bp);
  expect(useMuseStore.getState().bandPowers?.alpha).toEqual([3,3,3,3]);
});

test('setOscConfig merges partial config', () => {
  useMuseStore.getState().setOscConfig({ host: '10.0.0.5' });
  const cfg = useMuseStore.getState().oscConfig;
  expect(cfg.host).toBe('10.0.0.5');
  expect(cfg.port).toBe(5000); // unchanged
  expect(cfg.enabled).toBe(false); // unchanged
});
