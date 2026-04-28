const FFT_SIZE = 256; // must be power of 2

// Hann window coherent power normalization: sum(w²)/N = 3/8
const HANN_POWER_NORM = FFT_SIZE * FFT_SIZE * (3.0 / 8.0);

// Bit-reversal table for N=256 (8 bits), computed once at module load
const BIT_REV = new Uint8Array(FFT_SIZE);
(function () {
  for (let i = 0; i < FFT_SIZE; i++) {
    let x = i, r = 0;
    for (let b = 0; b < 8; b++) { r = (r << 1) | (x & 1); x >>= 1; }
    BIT_REV[i] = r;
  }
})();

// Cooley-Tukey radix-2 in-place FFT (O(N log N))
function fftInPlace(re: Float32Array, im: Float32Array): void {
  const N = re.length;
  for (let i = 1; i < N - 1; i++) {
    const j = BIT_REV[i];
    if (j > i) {
      let t = re[i]; re[i] = re[j]; re[j] = t;
      t = im[i];     im[i] = im[j]; im[j] = t;
    }
  }
  for (let len = 2; len <= N; len <<= 1) {
    const half   = len >> 1;
    const ang    = -2 * Math.PI / len;
    const wbRe   = Math.cos(ang);
    const wbIm   = Math.sin(ang);
    for (let i = 0; i < N; i += len) {
      let tRe = 1, tIm = 0;
      for (let j = 0; j < half; j++) {
        const uRe = re[i + j], uIm = im[i + j];
        const k   = i + j + half;
        const vRe = re[k] * tRe - im[k] * tIm;
        const vIm = re[k] * tIm + im[k] * tRe;
        re[i + j] = uRe + vRe;  im[i + j] = uIm + vIm;
        re[k]     = uRe - vRe;  im[k]     = uIm - vIm;
        const nRe = tRe * wbRe - tIm * wbIm;
        tIm = tRe * wbIm + tIm * wbRe;
        tRe = nRe;
      }
    }
  }
}

export class FFTProcessor {
  private buffer: Float32Array;
  private bufferIdx = 0;
  private readonly fs: number;

  constructor(sampleRate = 256) {
    this.fs     = sampleRate;
    this.buffer = new Float32Array(FFT_SIZE);
  }

  reset(): void {
    this.buffer.fill(0);
    this.bufferIdx = 0;
  }

  pushSamples(samples: number[]): void {
    for (const s of samples) {
      this.buffer[this.bufferIdx % FFT_SIZE] = s;
      this.bufferIdx++;
    }
  }

  getPSD(): { freqs: Float32Array; power: Float32Array } {
    const re = new Float32Array(FFT_SIZE);
    const im = new Float32Array(FFT_SIZE);
    for (let i = 0; i < FFT_SIZE; i++) {
      const w = 0.5 * (1 - Math.cos(2 * Math.PI * i / (FFT_SIZE - 1)));
      re[i] = this.buffer[(this.bufferIdx - FFT_SIZE + i + FFT_SIZE) % FFT_SIZE] * w;
    }
    fftInPlace(re, im);
    const power = new Float32Array(FFT_SIZE / 2);
    const freqs  = new Float32Array(FFT_SIZE / 2);
    for (let k = 0; k < FFT_SIZE / 2; k++) {
      power[k] = (re[k] * re[k] + im[k] * im[k]) / HANN_POWER_NORM;
      freqs[k]  = k * this.fs / FFT_SIZE;
    }
    return { freqs, power };
  }
}
