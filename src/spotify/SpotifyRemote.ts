const CLIENT_ID    = 'dd746e8ec4e94dd2bc099a66efbe8157';
const REDIRECT_URI = 'muse-monitor://callback';
const SCOPES       = [
  'streaming',
  'user-read-playback-state',
  'user-modify-playback-state',
  'playlist-read-private',
];

// Pure-TS helper (testable in Jest — no native imports)
export function buildSpotifyAuthUrl(clientId: string, redirectUri: string): string {
  const params = new URLSearchParams({
    response_type: 'token',
    client_id:     clientId,
    scope:         SCOPES.join(','),
    redirect_uri:  redirectUri,
  });
  return `https://accounts.spotify.com/authorize?${params}`;
}

export interface TrackInfo {
  name:        string;
  artistName:  string;
  albumName:   string;
  isPaused:    boolean;
}

export class SpotifyController {
  private connected = false;

  async connect(): Promise<boolean> {
    try {
      const { auth, remote } = await import('react-native-spotify-remote');
      const session = await auth.authorize({
        clientID:    CLIENT_ID,
        redirectURL: REDIRECT_URI,
        scopes:      SCOPES as any,
      });
      await remote.connect(session.accessToken);
      this.connected = true;
      return true;
    } catch (e) {
      console.error('Spotify connect failed:', e);
      return false;
    }
  }

  async disconnect(): Promise<void> {
    const { remote } = await import('react-native-spotify-remote');
    await remote.disconnect();
    this.connected = false;
  }

  isConnected(): boolean { return this.connected; }

  async play(uri: string): Promise<void> {
    if (!this.connected) throw new Error('Not connected to Spotify');
    const { remote } = await import('react-native-spotify-remote');
    await remote.playUri(uri);
  }

  async pause(): Promise<void> {
    const { remote } = await import('react-native-spotify-remote');
    await remote.pause();
  }

  async resume(): Promise<void> {
    const { remote } = await import('react-native-spotify-remote');
    await remote.resume();
  }

  async skipNext(): Promise<void> {
    const { remote } = await import('react-native-spotify-remote');
    await remote.skipToNext();
  }

  async setVolume(_v: number): Promise<void> {
    // SpotifyRemoteApi does not expose setVolume; no-op for now
  }

  async getTrack(): Promise<TrackInfo | null> {
    try {
      const { remote } = await import('react-native-spotify-remote');
      const state = await remote.getPlayerState();
      return {
        name:       state.track.name,
        artistName: state.track.artist.name,
        albumName:  state.track.album.name,
        isPaused:   state.isPaused,
      };
    } catch {
      return null;
    }
  }
}
