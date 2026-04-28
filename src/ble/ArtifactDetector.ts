import type { BandPowerMap } from '../types/muse';

// Frontal channels: index 1 = left forehead (EEG2), index 2 = right forehead (EEG3)
// Blink   → frontal delta spike  (large slow-wave artifact)
// Jaw     → all-channel gamma spike (high-freq muscle artifact)
const BLINK_DELTA_BELS  = 0.6;  // ~4× linear increase over baseline
const JAW_GAMMA_BELS    = 0.5;  // ~3× linear increase over baseline
const BASELINE_WINDOW   = 10;   // samples (~10s at 1Hz update rate)
const MIN_BASELINE      = 3;    // need at least 3 samples before firing

export class ArtifactDetector {
  private deltaHist: number[] = [];
  private gammaHist: number[] = [];

  update(bp: BandPowerMap): { blink: boolean; jawClench: boolean } {
    const frontDelta = (bp.delta[1] + bp.delta[2]) / 2;
    const avgGamma   = bp.gamma.reduce((a, b) => a + b, 0) / bp.gamma.length;

    this.deltaHist = [...this.deltaHist.slice(-(BASELINE_WINDOW - 1)), frontDelta];
    this.gammaHist = [...this.gammaHist.slice(-(BASELINE_WINDOW - 1)), avgGamma];

    if (this.deltaHist.length < MIN_BASELINE) return { blink: false, jawClench: false };

    const prev = (arr: number[]) => arr.slice(0, -1);
    const mean = (arr: number[]) => arr.reduce((a, b) => a + b, 0) / arr.length;

    const deltaBaseline = mean(prev(this.deltaHist));
    const gammaBaseline = mean(prev(this.gammaHist));

    return {
      blink:     frontDelta - deltaBaseline > BLINK_DELTA_BELS,
      jawClench: avgGamma   - gammaBaseline > JAW_GAMMA_BELS,
    };
  }

  reset(): void {
    this.deltaHist = [];
    this.gammaHist = [];
  }
}
