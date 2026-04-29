const InterruptionModeIOS = { DoNotMix: 0, DuckOthers: 2, MixWithOthers: 1 };
const InterruptionModeAndroid = { DoNotMix: 1, DuckOthers: 0 };

const mockSound = {
  setVolumeAsync: jest.fn().mockResolvedValue(undefined),
  replayAsync:    jest.fn().mockResolvedValue(undefined),
  unloadAsync:    jest.fn().mockResolvedValue(undefined),
  stopAsync:      jest.fn().mockResolvedValue(undefined),
  playAsync:      jest.fn().mockResolvedValue(undefined),
};

const Audio = {
  setAudioModeAsync: jest.fn().mockResolvedValue(undefined),
  Sound: {
    createAsync: jest.fn().mockResolvedValue({ sound: mockSound }),
  },
};

module.exports = { Audio, InterruptionModeIOS, InterruptionModeAndroid };
