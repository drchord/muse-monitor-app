// src/audio/AudioFeedback.ts

export type StateTransition = 'enter' | 'drift' | null;

export class StateTransitionDetector {
  private inState    = false;
  private readonly threshold: number;
  private readonly hysteresis: number;
  public  transitionCount = 0;

  constructor(threshold = 60, hysteresis = 3) {
    this.threshold  = threshold;
    this.hysteresis = hysteresis;
  }

  update(score: number): StateTransition {
    if (!this.inState && score >= this.threshold + this.hysteresis) {
      this.inState = true;
      this.transitionCount++;
      return 'enter';
    }
    if (this.inState && score <= this.threshold - this.hysteresis) {
      this.inState = false;
      this.transitionCount++;
      return 'drift';
    }
    return null;
  }

  reset(): void {
    this.inState = false;
    this.transitionCount = 0;
  }
}

export class AudioFeedback {
  private rewardSound: any = null;
  private driftSound:  any = null;
  private volume = 0.7;
  private enabled = true;

  async load(): Promise<void> {
    // Dynamic import to avoid Jest issues with expo-av native module
    const { Audio } = await import('expo-av');
    await Audio.setAudioModeAsync({
      playsInSilentModeIOS:    true,
      allowsRecordingIOS:      false,
      staysActiveInBackground: true,
    });

    const [r, d] = await Promise.all([
      Audio.Sound.createAsync(require('../../assets/sounds/reward.mp3')),
      Audio.Sound.createAsync(require('../../assets/sounds/drift.mp3')),
    ]);
    this.rewardSound = r.sound;
    this.driftSound  = d.sound;

    await this.rewardSound.setVolumeAsync(this.volume);
    await this.driftSound.setVolumeAsync(this.volume * 0.8);
  }

  async playReward(): Promise<void> {
    if (!this.enabled || !this.rewardSound) return;
    await this.rewardSound.replayAsync();
    const { default: Haptics } = await import('expo-haptics');
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  }

  async playDrift(): Promise<void> {
    if (!this.enabled || !this.driftSound) return;
    await this.driftSound.replayAsync();
    const { default: Haptics } = await import('expo-haptics');
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
  }

  setVolume(v: number): void {
    this.volume = Math.max(0, Math.min(1, v));
    this.rewardSound?.setVolumeAsync(this.volume);
    this.driftSound?.setVolumeAsync(this.volume * 0.8);
  }

  setEnabled(v: boolean): void { this.enabled = v; }

  async unload(): Promise<void> {
    await this.rewardSound?.unloadAsync();
    await this.driftSound?.unloadAsync();
  }
}
