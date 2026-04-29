import { SpotifyController } from '../src/spotify/SpotifyRemote';

// SpotifyController native methods (connect/play/etc.) require react-native-spotify-remote
// which cannot be unit-tested in Jest. Only pure-state methods are tested here.

test('SpotifyController: initial state is not connected', () => {
  const ctrl = new SpotifyController();
  expect(ctrl.isConnected()).toBe(false);
});
