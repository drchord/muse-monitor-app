import udp from 'react-native-udp';
import { encodeBandPower, encodeOscMessage } from './OscEncoder';
import type { BandName } from '../ble/constants';

const OSC_BAND_ADDRESSES: Record<BandName, string> = {
  delta: '/muse/elements/delta_absolute',
  theta: '/muse/elements/theta_absolute',
  alpha: '/muse/elements/alpha_absolute',
  beta:  '/muse/elements/beta_absolute',
  gamma: '/muse/elements/gamma_absolute',
};

export class OscSender {
  private socket: ReturnType<typeof udp.createSocket> | null = null;
  private host = '192.168.1.100';
  private port = 5000;

  configure(host: string, port: number): void {
    this.host = host;
    this.port = port;
  }

  isOpen(): boolean { return this.socket !== null; }

  open(): void {
    if (this.socket) return; // idempotent
    this.socket = udp.createSocket({ type: 'udp4' });
    this.socket.bind(0, undefined, (err?: Error) => { if (err) console.warn('[OSC] bind error:', err.message); });
  }

  close(): void {
    this.socket?.close();
    this.socket = null;
  }

  sendBandPowers(bandPowers: Record<BandName, number[]>): void {
    for (const [band, values] of Object.entries(bandPowers) as [BandName, number[]][]) {
      const packet = encodeBandPower(OSC_BAND_ADDRESSES[band], values);
      this._send(packet);
    }
  }

  sendEEG(values: number[]): void {
    const packet = encodeOscMessage('/muse/eeg', 'f'.repeat(values.length), values);
    this._send(packet);
  }

  sendSignalQuality(horseshoe: number[], isGood: boolean[]): void {
    this._send(encodeOscMessage('/muse/elements/horseshoe', 'iiii', horseshoe));
    this._send(encodeOscMessage('/muse/elements/is_good', 'iiii', isGood.map(b => b ? 1 : 0)));
  }

  sendBattery(pct: number): void {
    this._send(encodeOscMessage('/muse/batt', 'i', [pct]));
  }

  sendAcc(x: number, y: number, z: number): void {
    this._send(encodeOscMessage('/muse/acc', 'fff', [x, y, z]));
  }

  private _send(data: Uint8Array): void {
    if (!this.socket) return;
    this.socket.send(Buffer.from(data), 0, data.length, this.port, this.host, (err) => {
      if (err) console.warn('[OSC] send error:', err.message);
    });
  }
}
