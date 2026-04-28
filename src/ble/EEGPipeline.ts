import { MuseClient } from './MuseClient';
import { FFTProcessor } from '../dsp/FFTProcessor';
import { bandPowersFromPSD, bandPowerToOscArgs } from '../dsp/BandPower';
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

  client.onEEG = (ch, packet) => {
    // Each EEG characteristic (273e0013-0016) sends 12 samples from ONE electrode.
    // Route all 12 directly to the corresponding processor.
    // Channel 0 (TP9) drives the update clock; all 4 channels are synchronized.
    processors[ch].pushSamples(packet.samples);
    if (ch !== 0) return;
    samplesSinceUpdate += packet.samples.length; // 12 per ch0 packet

    if (samplesSinceUpdate >= SAMPLES_PER_UPDATE) {
      samplesSinceUpdate = 0;

      const bandPowersPerCh = processors.map(p => {
        const { freqs, power } = p.getPSD();
        return bandPowersFromPSD(freqs, power);
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
