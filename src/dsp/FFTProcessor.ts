const FFT_SIZE = 256;

export class FFTProcessor {
  private buffer: Float32Array;
  private bufferIdx = 0;
  private readonly fs: number;

  constructor(sampleRate = 256) {
    this.fs     = sampleRate;
    this.buffer = new Float32Array(FFT_SIZE);
  }

  pushSamples(samples: number[]): void {
    for (const s of samples) {
      this.buffer[this.bufferIdx % FFT_SIZE] = s;
      this.bufferIdx++;
    }
  }

  getPSD(): { freqs: Float32Array; power: Float32Array } {
    const windowed = new Float32Array(FFT_SIZE);
    for (let i = 0; i < FFT_SIZE; i++) {
      const w = 0.5 * (1 - Math.cos(2 * Math.PI * i / (FFT_SIZE - 1)));
      windowed[i] = this.buffer[(this.bufferIdx - FFT_SIZE + i + FFT_SIZE) % FFT_SIZE] * w;
    }

    const power = new Float32Array(FFT_SIZE / 2);
    const freqs  = new Float32Array(FFT_SIZE / 2);

    for (let k = 0; k < FFT_SIZE / 2; k++) {
      let re = 0, im = 0;
      for (let n = 0; n < FFT_SIZE; n++) {
        const angle = 2 * Math.PI * k * n / FFT_SIZE;
        re += windowed[n] * Math.cos(angle);
        im -= windowed[n] * Math.sin(angle);
      }
      power[k] = (re * re + im * im) / (FFT_SIZE * FFT_SIZE);
      freqs[k]  = k * this.fs / FFT_SIZE;
    }
    return { freqs, power };
  }
}
