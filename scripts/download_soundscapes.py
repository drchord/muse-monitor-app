#!/usr/bin/env python3
"""
Download free CC0 soundscape audio from freesound.org previews.
Requirements: pip install requests
Usage: python scripts/download_soundscapes.py

These are 30-second preview clips (CC0 licensed).
Run once before EAS Build. Files go into assets/sounds/soundscapes/
"""
import os, requests, time

OUT = "assets/sounds/soundscapes"
os.makedirs(OUT, exist_ok=True)

# freesound.org preview URLs (MP3, 30s clips, CC0)
SOUNDS = {
    "rain_gentle":    "https://freesound.org/data/previews/346/346642_5121236-lq.mp3",
    "rain_heavy":     "https://freesound.org/data/previews/243/243629_4284968-lq.mp3",
    "ocean_waves":    "https://freesound.org/data/previews/398/398937_5121236-lq.mp3",
    "forest_birds":   "https://freesound.org/data/previews/416/416529_7095621-lq.mp3",
    "wind_trees":     "https://freesound.org/data/previews/458/458873_9497060-lq.mp3",
    "fire_crackling": "https://freesound.org/data/previews/476/476178_9497060-lq.mp3",
    "stream_brook":   "https://freesound.org/data/previews/339/339019_5121236-lq.mp3",
    "seagulls_beach": "https://freesound.org/data/previews/344/344529_3797507-lq.mp3",
    "tibetan_bowls":  "https://freesound.org/data/previews/432/432778_9457552-lq.mp3",
    "om_chant":       "https://freesound.org/data/previews/411/411090_7715839-lq.mp3",
    "tibetan_flute":  "https://freesound.org/data/previews/464/464518_9497060-lq.mp3",
    "temple_bells":   "https://freesound.org/data/previews/391/391539_7095621-lq.mp3",
}

for name, url in SOUNDS.items():
    out_path = f"{OUT}/{name}.mp3"
    if os.path.exists(out_path) and os.path.getsize(out_path) > 1000:
        print(f"✓ {name} (exists)")
        continue
    try:
        r = requests.get(url, timeout=30)
        if r.status_code == 200:
            with open(out_path, 'wb') as f:
                f.write(r.content)
            print(f"✓ {name} ({len(r.content)//1024}KB)")
        else:
            print(f"✗ {name} — HTTP {r.status_code}")
    except Exception as e:
        print(f"✗ {name} — {e}")
    time.sleep(0.5)

print("\nManually download any failed files from freesound.org")
print("Place as assets/sounds/soundscapes/<name>.mp3")
