import { buildSpotifyAuthUrl } from '@/spotify/SpotifyRemote';

test('builds correct Spotify auth URL', () => {
  const url = buildSpotifyAuthUrl('dd746e8ec4e94dd2bc099a66efbe8157', 'muse-monitor://callback');
  expect(url).toContain('accounts.spotify.com/authorize');
  expect(url).toContain('client_id=dd746e8ec4e94dd2bc099a66efbe8157');
  expect(url).toContain('streaming');
});

test('includes all required scopes', () => {
  const url = buildSpotifyAuthUrl('test-client', 'myapp://callback');
  expect(url).toContain('user-read-playback-state');
  expect(url).toContain('user-modify-playback-state');
});
