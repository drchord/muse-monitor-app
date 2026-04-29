import { StateTransitionDetector, AudioFeedback } from '../src/audio/AudioFeedback';

test('detects ENTER transition when score crosses threshold upward', () => {
  const det = new StateTransitionDetector(60);
  det.update(55);
  det.update(58);
  const t1 = det.update(63); // crosses UP past threshold+hysteresis (63 > 60+3)
  expect(t1).toBe('enter');
  const t2 = det.update(65);
  expect(t2).toBeNull();
});

test('detects DRIFT transition when score crosses threshold downward', () => {
  const det = new StateTransitionDetector(60);
  det.update(70);
  const t1 = det.update(56); // crosses DOWN past threshold-hysteresis (56 < 60-3)
  expect(t1).toBe('drift');
  const t2 = det.update(50);
  expect(t2).toBeNull();
});

test('no transition when score stays below threshold', () => {
  const det = new StateTransitionDetector(60);
  expect(det.update(30)).toBeNull();
  expect(det.update(40)).toBeNull();
  expect(det.update(50)).toBeNull();
});

test('hysteresis prevents re-trigger at exact threshold', () => {
  const det = new StateTransitionDetector(60, 3);
  det.update(70); // in state
  det.update(56); // below threshold-hysteresis (56 <= 60-3=57) → drift
  const t1 = det.update(61); // above threshold but below threshold+hysteresis → no re-enter
  expect(t1).toBeNull();
  const t2 = det.update(64); // above threshold+hysteresis → enter
  expect(t2).toBe('enter');
});

test('transitionCount increments on each transition', () => {
  const det = new StateTransitionDetector(60);
  det.update(65); // enter
  det.update(55); // drift
  det.update(65); // enter
  expect(det.transitionCount).toBe(3);
});

// ─── AudioFeedback load / unload ─────────────────────────────────────────────

describe('AudioFeedback', () => {
  let Audio: any;

  beforeEach(() => {
    jest.clearAllMocks();
    Audio = require('expo-av').Audio;
  });

  test('load() creates two audio resources and sets audio mode', async () => {
    const af = new AudioFeedback();
    await af.load();
    expect(Audio.Sound.createAsync).toHaveBeenCalledTimes(2);
    expect(Audio.setAudioModeAsync).toHaveBeenCalledTimes(1);
  });

  test('load() remount guard: second call is a no-op', async () => {
    const af = new AudioFeedback();
    await af.load();
    await af.load();
    expect(Audio.Sound.createAsync).toHaveBeenCalledTimes(2); // not 4
  });

  test('unload() completes without throwing even if sounds are null', async () => {
    const af = new AudioFeedback();
    await expect(af.unload()).resolves.toBeUndefined();
  });

  test('unload() after load() calls unloadAsync on both sounds', async () => {
    const af = new AudioFeedback();
    await af.load();
    // The mock always returns the same sound object for both createAsync calls
    const { sound: mockSound } = await Audio.Sound.createAsync.mock.results[0].value;
    jest.clearAllMocks();
    await af.unload();
    // rewardSound.unloadAsync() + driftSound.unloadAsync() — same object, called twice
    expect(mockSound.unloadAsync).toHaveBeenCalledTimes(2);
  });

  test('load() works again after unload() — handles were nulled correctly', async () => {
    const af = new AudioFeedback();
    await af.load();
    await af.unload();
    jest.clearAllMocks();
    await af.load();
    expect(Audio.Sound.createAsync).toHaveBeenCalledTimes(2); // loaded fresh
  });
});
