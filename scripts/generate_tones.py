#!/usr/bin/env python3
"""
Run this script once to generate the reward and drift chime audio files.
Requirements: Python 3.8+, no extra packages needed (uses stdlib wave module).
Output: assets/sounds/reward.wav, assets/sounds/drift.wav
Then convert to mp3 if needed (or use .wav directly — expo-av supports both).
"""
import wave, struct, math, os

def write_tone(filename, freq, duration_s, sample_rate=44100, attack=0.05, decay=0.15):
    os.makedirs(os.path.dirname(filename), exist_ok=True)
    n = int(sample_rate * duration_s)
    with wave.open(filename, 'w') as f:
        f.setnchannels(1)
        f.setsampwidth(2)
        f.setframerate(sample_rate)
        for i in range(n):
            t = i / sample_rate
            # Envelope: attack + sustain + decay
            if t < attack:
                env = t / attack
            elif t > duration_s - decay:
                env = max(0.0, (duration_s - t) / decay)
            else:
                env = 1.0
            v = int(32767 * env * 0.7 * math.sin(2 * math.pi * freq * t))
            f.writeframes(struct.pack('<h', v))
    print(f"Written: {filename}")

# 528 Hz = solfeggio MI tone (calm, uplifting) — reward chime
write_tone("assets/sounds/reward.wav", freq=528, duration_s=1.2)

# 220 Hz = low warm tone — drift alert
write_tone("assets/sounds/drift.wav",  freq=220, duration_s=0.8)

print("Done. Copy to assets/sounds/reward.mp3 and drift.mp3 (or rename .wav to use directly).")
