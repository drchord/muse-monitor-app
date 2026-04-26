import { SOUNDSCAPE_CATALOG } from '../src/audio/SoundscapePlayer';

test('catalog has exactly 15 entries', () => {
  expect(Object.keys(SOUNDSCAPE_CATALOG).length).toBe(15);
});

test('every entry has label, category, and asset', () => {
  for (const [key, entry] of Object.entries(SOUNDSCAPE_CATALOG)) {
    expect(entry.label).toBeTruthy();
    expect(['Nature', 'Sacred', 'Noise']).toContain(entry.category);
    expect(entry.asset).toBeDefined();
  }
});

test('categories are Nature, Sacred, Noise', () => {
  const cats = [...new Set(Object.values(SOUNDSCAPE_CATALOG).map(e => e.category))].sort();
  expect(cats).toEqual(['Nature', 'Noise', 'Sacred']);
});

test('all 15 expected keys present', () => {
  const expected = [
    'rain_gentle','rain_heavy','ocean_waves','forest_birds','wind_trees',
    'fire_crackling','stream_brook','seagulls_beach','tibetan_bowls',
    'om_chant','tibetan_flute','temple_bells','pink_noise','brown_noise','white_noise'
  ];
  expected.forEach(k => expect(SOUNDSCAPE_CATALOG).toHaveProperty(k));
});
