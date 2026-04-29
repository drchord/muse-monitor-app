import { Audio, InterruptionModeIOS, InterruptionModeAndroid } from 'expo-av';

export type SoundscapeCategory = 'Nature' | 'Sacred' | 'Noise';

interface SoundscapeEntry {
  label:    string;
  category: SoundscapeCategory;
  asset:    number;  // require() returns number in React Native
}

export const SOUNDSCAPE_CATALOG: Record<string, SoundscapeEntry> = {
  rain_gentle:    { label: 'Gentle Rain',          category: 'Nature', asset: require('../../assets/sounds/soundscapes/rain_gentle.mp3') },
  rain_heavy:     { label: 'Thunderstorm',          category: 'Nature', asset: require('../../assets/sounds/soundscapes/rain_heavy.mp3') },
  ocean_waves:    { label: 'Ocean Waves',           category: 'Nature', asset: require('../../assets/sounds/soundscapes/ocean_waves.mp3') },
  forest_birds:   { label: 'Forest & Birds',        category: 'Nature', asset: require('../../assets/sounds/soundscapes/forest_birds.mp3') },
  wind_trees:     { label: 'Wind in Trees',         category: 'Nature', asset: require('../../assets/sounds/soundscapes/wind_trees.mp3') },
  fire_crackling: { label: 'Crackling Fire',        category: 'Nature', asset: require('../../assets/sounds/soundscapes/fire_crackling.mp3') },
  stream_brook:   { label: 'Mountain Stream',       category: 'Nature', asset: require('../../assets/sounds/soundscapes/stream_brook.mp3') },
  seagulls_beach: { label: 'Seagulls & Beach',      category: 'Nature', asset: require('../../assets/sounds/soundscapes/seagulls_beach.mp3') },
  tibetan_bowls:  { label: 'Tibetan Singing Bowls', category: 'Sacred', asset: require('../../assets/sounds/soundscapes/tibetan_bowls.mp3') },
  om_chant:       { label: 'Om Chanting',           category: 'Sacred', asset: require('../../assets/sounds/soundscapes/om_chant.mp3') },
  tibetan_flute:  { label: 'Tibetan Flute',         category: 'Sacred', asset: require('../../assets/sounds/soundscapes/tibetan_flute.mp3') },
  temple_bells:   { label: 'Temple Bells',          category: 'Sacred', asset: require('../../assets/sounds/soundscapes/temple_bells.mp3') },
  pink_noise:     { label: 'Pink Noise',            category: 'Noise',  asset: require('../../assets/sounds/soundscapes/pink_noise.mp3') },
  brown_noise:    { label: 'Brown Noise (Deep)',    category: 'Noise',  asset: require('../../assets/sounds/soundscapes/brown_noise.mp3') },
  white_noise:    { label: 'White Noise',           category: 'Noise',  asset: require('../../assets/sounds/soundscapes/white_noise.mp3') },
};

export class SoundscapePlayer {
  private sound:          any    = null;
  private currentKey:     string | null = null;
  private volume:         number = 0.5;
  private _busy:          boolean = false;
  private _audioModeSet:  boolean = false;
  private _fadeTimer:     ReturnType<typeof setInterval> | null = null;

  private async _ensureAudioMode(): Promise<void> {
    if (this._audioModeSet) return;
    await Audio.setAudioModeAsync({
      allowsRecordingIOS:         false,
      interruptionModeIOS:        InterruptionModeIOS.DoNotMix,
      playsInSilentModeIOS:       true,
      staysActiveInBackground:    true,
      interruptionModeAndroid:    InterruptionModeAndroid.DoNotMix,
      shouldDuckAndroid:          false,
      playThroughEarpieceAndroid: false,
    });
    this._audioModeSet = true;
  }

  async play(key: string): Promise<void> {
    const entry = SOUNDSCAPE_CATALOG[key];
    if (!entry) throw new Error(`Unknown soundscape: ${key}`);
    if (this.currentKey === key) return;
    if (this._busy) return;
    this._busy = true;

    try {
      await this._ensureAudioMode();
      await this._fadeOut();
      if (this.sound) { await this.sound.unloadAsync(); this.sound = null; }

      const { sound } = await Audio.Sound.createAsync(entry.asset, {
        isLooping:      true,
        volume:         0,
        shouldPlay:     true,
        positionMillis: 0,
      });
      this.sound      = sound;
      this.currentKey = key;
      await this._fadeIn();
    } finally {
      this._busy = false;
    }
  }

  async stop(): Promise<void> {
    if (this._busy) return;
    this._busy = true;
    try {
      await this._fadeOut();
      if (this.sound) { await this.sound.unloadAsync(); this.sound = null; }
      this.currentKey = null;
    } finally {
      this._busy = false;
    }
  }

  async setVolume(v: number): Promise<void> {
    this.volume = Math.max(0, Math.min(1, v));
    await this.sound?.setVolumeAsync(this.volume);
  }

  async release(): Promise<void> {
    this._busy = false;
    if (this._fadeTimer) { clearInterval(this._fadeTimer); this._fadeTimer = null; }
    if (this.sound) {
      try { await this.sound.unloadAsync(); } catch {}
      this.sound = null;
    }
    this.currentKey = null;
  }

  getCurrentKey(): string | null { return this.currentKey; }

  private _fadeIn(steps = 20, ms = 500): Promise<void> {
    if (this._fadeTimer) { clearInterval(this._fadeTimer); this._fadeTimer = null; }
    return new Promise(resolve => {
      let step = 0;
      this._fadeTimer = setInterval(async () => {
        step++;
        await this.sound?.setVolumeAsync((step / steps) * this.volume);
        if (step >= steps) { clearInterval(this._fadeTimer!); this._fadeTimer = null; resolve(); }
      }, ms / steps);
    });
  }

  private _fadeOut(steps = 15, ms = 300): Promise<void> {
    if (!this.sound) return Promise.resolve();
    if (this._fadeTimer) { clearInterval(this._fadeTimer); this._fadeTimer = null; }
    return new Promise(resolve => {
      let step = steps;
      this._fadeTimer = setInterval(async () => {
        step--;
        await this.sound?.setVolumeAsync(Math.max(0, (step / steps) * this.volume));
        if (step <= 0) { clearInterval(this._fadeTimer!); this._fadeTimer = null; resolve(); }
      }, ms / steps);
    });
  }
}
