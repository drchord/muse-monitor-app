module.exports = {
  __esModule: true,
  auth: {
    authorize: jest.fn().mockResolvedValue({ accessToken: 'mock-token' }),
    endSession: jest.fn().mockResolvedValue(undefined),
    getSession: jest.fn().mockResolvedValue(undefined),
  },
  remote: {
    connect: jest.fn().mockResolvedValue(undefined),
    disconnect: jest.fn().mockResolvedValue(undefined),
    playUri: jest.fn().mockResolvedValue(undefined),
    pause: jest.fn().mockResolvedValue(undefined),
    resume: jest.fn().mockResolvedValue(undefined),
    skipToNext: jest.fn().mockResolvedValue(undefined),
    getPlayerState: jest.fn().mockResolvedValue({
      track: { name: 'Test Track', artist: { name: 'Test Artist' }, album: { name: 'Test Album' } },
      isPaused: false,
    }),
  },
};
