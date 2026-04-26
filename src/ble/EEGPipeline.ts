import { MuseClient } from './MuseClient';
import { FFTProcessor } from '../dsp/FFTProcessor';
import { extractBandPowers, bandPowerToOscArgs } from '../dsp/BandPower';
import { OscSender } from '../osc/OscSender';
import { useMuseStore } from '../store/museStore';
import type { BandName } from './constants';
import { BAND_RANGES } from './constants';

const SAMPLE_RATE       = 256;
const UPDATE_RATE_HZ    = 10;
const SAMPLES_PER_UPDATE = SAMPLE_RATE / UPDATE_RATE_HZ; // 25.6 → flush every 26 samples

// One FFT processor per electrode channel (TP9, AF7, AF8, TP10)
const processors = [0, 1, 2, 3].map(() => new FFTProcessor(SAMPLE_RATE));
let samplesSinceUpdate = 0;

export function attachPipeline(client: MuseClient, sender: OscSender): void {
  samplesSinceUpdate = 0;

  client.onEEG = (packet) => {
    // Muse S interleaves 4 channels per packet (12 samples total, 3 per channel)
    // Channel order: TP9=0, AF7=1, AF8=2, TP10=3 (verify on device during integration test)
    for (let i = 0; i < packet.samples.length; i++) {
      const ch = i % 4;
      if (ch < 4) processors[ch].pushSamples([packet.samples[i]]);
    }
    samplesSinceUpdate += packet.samples.length / 4;

    if (samplesSinceUpdate >= SAMPLES_PER_UPDATE) {
      samplesSinceUpdate = 0;

      const bandPowersPerCh = processors.map(p => {
        p.pushSamples([]); // trigger PSD without new samples
        return extractBandPowers(new Float32Array(256), SAMPLE_RATE);
      });

      const bandPowerArrays = bandPowerToOscArgs(bandPowersPerCh);
      useMuseStore.getState().setBandPowers(bandPowerArrays);

      const osc = useMuseStore.getState().oscConfig;
      if (osc.enabled) {
        sender.configure(osc.host, osc.port);
        sender.sendBandPowers(bandPowerArrays);
      }
    }
  };

  client.onBattery = (pct) => {
    useMuseStore.getState().setBatteryPct(pct);
    const osc = useMuseStore.getState().oscConfig;
    if (osc.enabled) {
      sender.configure(osc.host, osc.port);
      sender.sendBattery(pct);
    }
  };

  client.onAcc = (x, y, z) => {
    const osc = useMuseStore.getState().oscConfig;
    if (osc.enabled) {
      sender.configure(osc.host, osc.port);
      sender.sendAcc(x, y, z);
    }
  };
}
