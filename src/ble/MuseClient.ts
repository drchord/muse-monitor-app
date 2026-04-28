/**
 * MuseClient.ts
 *
 * BLE client for Muse S EEG headband using react-native-ble-plx v3.
 *
 * Write method: ALWAYS writeWithoutResponse.
 *   - 273e0001 (CTRL) exposes only WRITE_WITHOUT_RESPONSE in its GATT properties.
 *   - CoreBluetooth will reject writeWithResponse on such a characteristic.
 *   - muselsl (alexandrebarachant/muse-lsl) always uses wait_for_response=False.
 *
 * Init sequence (matches muselsl connect()):
 *   1. Connect + discoverAllServicesAndCharacteristics
 *   2. writeWithoutResponse: CMD_PRESET21 ('p21\n')   — must happen BEFORE subscribing
 *   3. monitorCharacteristic on CTRL, EEG, ACC, GYRO, BATT
 *   4. Short settle delay
 *   5. writeWithoutResponse: CMD_RESUME ('d\n')        — start streaming
 *   6. Keepalive every 5 s: CMD_KEEPALIVE ('k\n')
 *
 * Stop sequence:
 *   writeWithoutResponse: CMD_STOP ('h\n'), then cancelConnection.
 *
 * Command byte format (muselsl _write_cmd_str):
 *   [len(str)+1, ...ascii_bytes_of_str, 0x0a]
 *   e.g. 'p21\n' => [0x04, 0x70, 0x32, 0x31, 0x0a]
 */

import { BleManager, Device, Subscription } from 'react-native-ble-plx';
import { Buffer } from 'buffer';
import {
  MUSE_SERVICE_UUID,
  CTRL_CHAR_UUID,
  EEG_CHAR_UUIDS,
  ACC_CHAR_UUID,
  GYRO_CHAR_UUID,
  BATT_CHAR_UUID,
  CMD_PRESET21,
  CMD_RESUME,
  CMD_STOP,
  CMD_KEEPALIVE,
} from './constants';
import { parseEEGPacket, RawEEGPacket } from './EEGParser';

export type EEGCallback     = (ch: number, packet: RawEEGPacket) => void;
export type MotionCallback  = (x: number, y: number, z: number) => void;
export type BatteryCallback = (pct: number) => void;

export class MuseClient {
  private manager   = new BleManager();
  private device:    Device | null = null;
  private keepaliveTimer:  ReturnType<typeof setInterval> | null = null;
  private subscriptions:   Subscription[] = [];
  private _stateChangeSub: Subscription | null = null;

  onEEG:     EEGCallback     = () => {};
  onAcc:     MotionCallback  = () => {};
  onGyro:    MotionCallback  = () => {};
  onBattery: BatteryCallback = () => {};
  onStatus: (msg: string) => void = () => {};

  // ─── BLE state ────────────────────────────────────────────────────────────

  private async _waitForPoweredOn(): Promise<void> {
    return new Promise((resolve, reject) => {
      this._stateChangeSub = this.manager.onStateChange(state => {
        if (state === 'PoweredOn') {
          this._stateChangeSub?.remove(); this._stateChangeSub = null; resolve();
        }
        if (
          state === 'PoweredOff' ||
          state === 'Unauthorized' ||
          state === 'Unsupported'
        ) {
          this._stateChangeSub?.remove(); this._stateChangeSub = null;
          reject(new Error(`Bluetooth unavailable: ${state}`));
        }
      }, true);
    });
  }

  // ─── Scan ─────────────────────────────────────────────────────────────────

  async scan(timeoutMs = 10000): Promise<Device[]> {
    await this._waitForPoweredOn();
    return new Promise((resolve, reject) => {
      const found: Device[] = [];
      const timer = setTimeout(() => {
        this.manager.stopDeviceScan();
        resolve(found);
      }, timeoutMs);

      const seen = new Set<string>();
      this.manager.startDeviceScan(
        null,
        { allowDuplicates: false },
        (error, device) => {
          if (error) {
            clearTimeout(timer);
            this.manager.stopDeviceScan();
            reject(error);
            return;
          }
          if (device?.name?.toLowerCase().includes('muse') && !seen.has(device.id)) {
            seen.add(device.id);
            found.push(device);
          }
        },
      );
    });
  }

  // ─── Connect ──────────────────────────────────────────────────────────────

  async connect(deviceId: string): Promise<void> {
    this.manager.stopDeviceScan();

    // Cancel any stale connection (ignore errors — device may already be disconnected)
    try { await this.manager.cancelDeviceConnection(deviceId); } catch {}
    await this._delay(200);

    this.onStatus('Connecting…');
    this.device = await this.manager.connectToDevice(deviceId, {
      timeout: 15000,
      // Larger MTU helps on iOS; 247 is BLE 4.2 max over LE
      requestMTU: 247,
    });

    this.onStatus('Discovering services…');
    await this.device.discoverAllServicesAndCharacteristics();

    // ── Step 1: select preset BEFORE subscribing (matches muselsl order) ──
    this.onStatus('Selecting preset p21…');
    await this._sendCommand(CMD_PRESET21);
    await this._delay(300);

    // ── Step 2: subscribe to all characteristics ───────────────────────────
    this.onStatus('Subscribing…');
    this._subscribeAll();
    await this._delay(500);

    // ── Step 3: start streaming ────────────────────────────────────────────
    this.onStatus('Starting EEG stream…');
    await this._sendCommand(CMD_RESUME);

    // ── Step 4: keepalive every 5 s ───────────────────────────────────────
    this.keepaliveTimer = setInterval(
      () => this._sendCommand(CMD_KEEPALIVE),
      5000,
    );

    this.onStatus('Streaming');
  }

  // ─── Disconnect ───────────────────────────────────────────────────────────

  async disconnect(): Promise<void> {
    // Cancel pending BLE state subscription
    this._stateChangeSub?.remove();
    this._stateChangeSub = null;

    // Remove all characteristic subscriptions
    this.subscriptions.forEach(s => s.remove());
    this.subscriptions = [];

    if (this.keepaliveTimer) {
      clearInterval(this.keepaliveTimer);
      this.keepaliveTimer = null;
    }
    if (this.device) {
      try { await this._sendCommand(CMD_STOP); } catch {}
      await this._delay(200);
      try { await this.device.cancelConnection(); } catch {}
      this.device = null;
    }
  }

  // ─── Write ────────────────────────────────────────────────────────────────

  /**
   * Write a command to 273e0001 (CTRL) using WriteWithoutResponse ONLY.
   *
   * Why: The CTRL characteristic declares only WRITE_WITHOUT_RESPONSE in its
   * GATT properties (verified via muselsl char_write_handle(..., False) and
   * the GATT handle comment: 0x000d declaration, 0x000e value).
   * CoreBluetooth (iOS) returns CBATTErrorWriteNotPermitted when you attempt
   * writeWithResponse on a characteristic that lacks the WRITE property bit.
   *
   * react-native-ble-plx v3: writeCharacteristicWithoutResponseForService
   * maps to [peripheral writeValue:type:CBCharacteristicWriteWithoutResponse].
   */
  private async _sendCommand(cmd: readonly number[]): Promise<void> {
    if (!this.device) return;
    const b64 = Buffer.from(cmd as number[]).toString('base64');
    await this.device.writeCharacteristicWithoutResponseForService(
      MUSE_SERVICE_UUID,
      CTRL_CHAR_UUID,
      b64,
    );
  }

  // ─── Subscribe ────────────────────────────────────────────────────────────

  private _subscribeAll(): void {
    if (!this.device) return;

    // CTRL notifications — enables the Muse to send back status/control msgs
    this.subscriptions.push(
      this.device.monitorCharacteristicForService(
        MUSE_SERVICE_UUID,
        CTRL_CHAR_UUID,
        (_err, _char) => { /* control messages received here if needed */ },
      )
    );

    // EEG — Muse S sends one characteristic per electrode (TP9=0013, AF7=0014, AF8=0015, TP10=0016)
    EEG_CHAR_UUIDS.forEach((uuid, ch) => {
      this.subscriptions.push(
        this.device!.monitorCharacteristicForService(
          MUSE_SERVICE_UUID,
          uuid,
          (err, char) => {
            if (err || !char?.value) return;
            const bytes = new Uint8Array(Buffer.from(char.value, 'base64'));
            try { this.onEEG(ch, parseEEGPacket(bytes)); } catch {}
          },
        )
      );
    });

    // Battery / telemetry (273e000b)
    this.subscriptions.push(
      this.device.monitorCharacteristicForService(
        MUSE_SERVICE_UUID,
        BATT_CHAR_UUID,
        (err, char) => {
          if (err || !char?.value) return;
          const bytes = new Uint8Array(Buffer.from(char.value, 'base64'));
          // bytes[1..2] = battery level in mV, /512 = percentage
          const pct = ((bytes[1] << 8) | bytes[2]) / 512;
          this.onBattery(Math.min(100, Math.round(pct)));
        },
      )
    );

    // Accelerometer (273e000a) — MUSE_ACCELEROMETER_SCALE_FACTOR = 0.0000610352
    this.subscriptions.push(
      this.device.monitorCharacteristicForService(
        MUSE_SERVICE_UUID,
        ACC_CHAR_UUID,
        (err, char) => {
          if (err || !char?.value) return;
          const bytes = new Uint8Array(Buffer.from(char.value, 'base64'));
          const view = new DataView(bytes.buffer, 2);
          const x = view.getInt16(0, false) * 0.0000610352;
          const y = view.getInt16(2, false) * 0.0000610352;
          const z = view.getInt16(4, false) * 0.0000610352;
          this.onAcc(x, y, z);
        },
      )
    );

    // Gyroscope (273e0009) — MUSE_GYRO_SCALE_FACTOR = 0.0074768
    this.subscriptions.push(
      this.device.monitorCharacteristicForService(
        MUSE_SERVICE_UUID,
        GYRO_CHAR_UUID,
        (err, char) => {
          if (err || !char?.value) return;
          const bytes = new Uint8Array(Buffer.from(char.value, 'base64'));
          const view = new DataView(bytes.buffer, 2);
          const x = view.getInt16(0, false) * 0.0074768;
          const y = view.getInt16(2, false) * 0.0074768;
          const z = view.getInt16(4, false) * 0.0074768;
          this.onGyro(x, y, z);
        },
      )
    );
  }

  // ─── Helpers ──────────────────────────────────────────────────────────────

  private _delay(ms: number): Promise<void> {
    return new Promise(r => setTimeout(r, ms));
  }
}
