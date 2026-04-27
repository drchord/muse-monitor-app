import { BleManager, Device, Characteristic } from 'react-native-ble-plx';
import { Buffer } from 'buffer';
import {
  MUSE_SERVICE_UUID, CTRL_CHAR_UUID, EEG_CHAR_UUID,
  ACC_CHAR_UUID, GYRO_CHAR_UUID, BATT_CHAR_UUID,
  CMD_PRESET21, CMD_START, CMD_STOP, CMD_KEEPALIVE,
} from './constants';
import { parseEEGPacket, RawEEGPacket } from './EEGParser';

export type EEGCallback     = (packet: RawEEGPacket) => void;
export type MotionCallback  = (x: number, y: number, z: number) => void;
export type BatteryCallback = (pct: number) => void;

export class MuseClient {
  private manager   = new BleManager();
  private device:    Device | null = null;
  private keepaliveTimer: ReturnType<typeof setInterval> | null = null;

  onEEG:     EEGCallback     = () => {};
  onAcc:     MotionCallback  = () => {};
  onGyro:    MotionCallback  = () => {};
  onBattery: BatteryCallback = () => {};

  private async _waitForPoweredOn(): Promise<void> {
    return new Promise((resolve, reject) => {
      const sub = this.manager.onStateChange(state => {
        if (state === 'PoweredOn')  { sub.remove(); resolve(); }
        if (state === 'PoweredOff' || state === 'Unauthorized' || state === 'Unsupported') {
          sub.remove();
          reject(new Error(`Bluetooth unavailable: ${state}`));
        }
      }, true);
    });
  }

  async scan(timeoutMs = 10000): Promise<Device[]> {
    await this._waitForPoweredOn();
    return new Promise((resolve, reject) => {
      const found: Device[] = [];
      const timer = setTimeout(() => {
        this.manager.stopDeviceScan();
        resolve(found);
      }, timeoutMs);

      this.manager.startDeviceScan(null, { allowDuplicates: false }, (error, device) => {
        if (error) { clearTimeout(timer); reject(error); return; }
        if (device?.name?.toLowerCase().includes('muse')) {
          found.push(device);
        }
      });
    });
  }

  async connect(deviceId: string): Promise<void> {
    this.manager.stopDeviceScan();
    this.device = await this.manager.connectToDevice(deviceId, { timeout: 15000 });
    await this.device.discoverAllServicesAndCharacteristics();
    await this._sendCommand(CMD_PRESET21);
    await this._sendCommand(CMD_START);
    await this._subscribeAll();
    this.keepaliveTimer = setInterval(() => this._sendCommand(CMD_KEEPALIVE), 5000);
  }

  async disconnect(): Promise<void> {
    if (this.keepaliveTimer) clearInterval(this.keepaliveTimer);
    if (this.device) {
      await this._sendCommand(CMD_STOP);
      await this.device.cancelConnection();
      this.device = null;
    }
  }

  private async _sendCommand(cmd: readonly number[]): Promise<void> {
    if (!this.device) return;
    const b64 = Buffer.from(cmd as number[]).toString('base64');
    await this.device.writeCharacteristicWithoutResponseForService(
      MUSE_SERVICE_UUID, CTRL_CHAR_UUID, b64
    );
  }

  private async _subscribeAll(): Promise<void> {
    if (!this.device) return;

    this.device.monitorCharacteristicForService(
      MUSE_SERVICE_UUID, EEG_CHAR_UUID,
      (err, char) => {
        if (err || !char?.value) return;
        const bytes = new Uint8Array(Buffer.from(char.value, 'base64'));
        try { this.onEEG(parseEEGPacket(bytes)); } catch {}
      }
    );

    this.device.monitorCharacteristicForService(
      MUSE_SERVICE_UUID, BATT_CHAR_UUID,
      (err, char) => {
        if (err || !char?.value) return;
        const bytes = new Uint8Array(Buffer.from(char.value, 'base64'));
        const pct = ((bytes[1] << 8) | bytes[2]) / 512;
        this.onBattery(Math.min(100, Math.round(pct)));
      }
    );

    this.device.monitorCharacteristicForService(
      MUSE_SERVICE_UUID, ACC_CHAR_UUID,
      (err, char) => {
        if (err || !char?.value) return;
        const bytes = new Uint8Array(Buffer.from(char.value, 'base64'));
        const view = new DataView(bytes.buffer, 2);
        const x = view.getInt16(0, false) * 0.0001;
        const y = view.getInt16(2, false) * 0.0001;
        const z = view.getInt16(4, false) * 0.0001;
        this.onAcc(x, y, z);
      }
    );

    this.device.monitorCharacteristicForService(
      MUSE_SERVICE_UUID, GYRO_CHAR_UUID,
      (err, char) => {
        if (err || !char?.value) return;
        const bytes = new Uint8Array(Buffer.from(char.value, 'base64'));
        const view = new DataView(bytes.buffer, 2);
        const x = view.getInt16(0, false) * 0.0001;
        const y = view.getInt16(2, false) * 0.0001;
        const z = view.getInt16(4, false) * 0.0001;
        this.onGyro(x, y, z);
      }
    );
  }
}
