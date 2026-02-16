/**
 * General BLE Scanner & Device Manager
 *
 * Scans for ALL nearby Bluetooth Low Energy devices,
 * reads their services/characteristics, and manages connections.
 *
 * Known BLE Service UUIDs for common device types:
 * - 0x180F: Battery Service
 * - 0x180A: Device Information
 * - 0x1800: Generic Access
 * - 0x1801: Generic Attribute
 * - 0x1802: Immediate Alert
 * - 0x1803: Link Loss
 * - 0x1804: Tx Power
 * - 0x180D: Heart Rate
 * - 0x180E: Phone Alert Status
 * - 0x1810: Blood Pressure
 * - 0x1812: Human Interface Device (HID)
 * - 0x1816: Cycling Speed and Cadence
 * - 0x181A: Environmental Sensing
 * - 0x181C: User Data
 * - 0xFE95: Xiaomi Mi
 * - 0xFEAA: Eddystone (Google)
 * - 0xFFF0: Common custom service
 */

// ─── Known Service Names ──────────────────────────────────

export const KNOWN_SERVICES: Record<string, string> = {
  "00001800-0000-1000-8000-00805f9b34fb": "Generic Access",
  "00001801-0000-1000-8000-00805f9b34fb": "Generic Attribute",
  "00001802-0000-1000-8000-00805f9b34fb": "Immediate Alert",
  "00001803-0000-1000-8000-00805f9b34fb": "Link Loss",
  "00001804-0000-1000-8000-00805f9b34fb": "Tx Power",
  "0000180a-0000-1000-8000-00805f9b34fb": "Device Information",
  "0000180d-0000-1000-8000-00805f9b34fb": "Heart Rate",
  "0000180f-0000-1000-8000-00805f9b34fb": "Battery",
  "00001810-0000-1000-8000-00805f9b34fb": "Blood Pressure",
  "00001812-0000-1000-8000-00805f9b34fb": "HID (Keyboard/Mouse)",
  "00001816-0000-1000-8000-00805f9b34fb": "Cycling Speed",
  "0000181a-0000-1000-8000-00805f9b34fb": "Environmental Sensing",
  "0000181c-0000-1000-8000-00805f9b34fb": "User Data",
  "0000fee7-0000-1000-8000-00805f9b34fb": "Tencent",
  "0000feaa-0000-1000-8000-00805f9b34fb": "Eddystone (Google)",
  "0000fe95-0000-1000-8000-00805f9b34fb": "Xiaomi Mi",
  "8fe5b3d5-2e7f-4a98-2a48-7acc60fe0000": "Flipper Zero Serial",
};

// ─── Device Type Detection ────────────────────────────────

export type BleDeviceType =
  | "flipper"
  | "phone"
  | "headphones"
  | "speaker"
  | "watch"
  | "fitness"
  | "keyboard"
  | "mouse"
  | "tv"
  | "iot"
  | "beacon"
  | "unknown";

export function detectDeviceType(name: string, services: string[]): BleDeviceType {
  const n = (name || "").toLowerCase();

  if (n.includes("flipper")) return "flipper";
  if (n.includes("airpods") || n.includes("buds") || n.includes("headphone") || n.includes("earphone") || n.includes("jbl") || n.includes("sony wh") || n.includes("bose")) return "headphones";
  if (n.includes("speaker") || n.includes("soundbar") || n.includes("homepod") || n.includes("echo") || n.includes("sonos")) return "speaker";
  if (n.includes("watch") || n.includes("band") || n.includes("garmin") || n.includes("fitbit")) return "watch";
  if (n.includes("iphone") || n.includes("galaxy") || n.includes("pixel") || n.includes("phone")) return "phone";
  if (n.includes("tv") || n.includes("chromecast") || n.includes("roku") || n.includes("fire")) return "tv";

  if (services.some(s => s.includes("1812"))) return "keyboard"; // HID
  if (services.some(s => s.includes("180d"))) return "fitness"; // Heart Rate
  if (services.some(s => s.includes("feaa"))) return "beacon"; // Eddystone

  return "unknown";
}

export const DEVICE_TYPE_ICONS: Record<BleDeviceType, string> = {
  flipper: "📡",
  phone: "📱",
  headphones: "🎧",
  speaker: "🔊",
  watch: "⌚",
  fitness: "💪",
  keyboard: "⌨️",
  mouse: "🖱️",
  tv: "📺",
  iot: "🏠",
  beacon: "📍",
  unknown: "📶",
};

// ─── Types ────────────────────────────────────────────────

export interface ScannedDevice {
  id: string;
  name: string;
  type: BleDeviceType;
  connected: boolean;
  gattConnected: boolean;
  rssi: number | null;
  services: string[];
  serviceNames: string[];
  battery: number | null;
  manufacturer: string | null;
  firmware: string | null;
  characteristics: CharacteristicInfo[];
  rawDevice: BluetoothDevice;
  lastSeen: number;
}

export interface CharacteristicInfo {
  service: string;
  serviceName: string;
  uuid: string;
  properties: string[];
  value?: string;
}

export type ScannerEventType =
  | "device_found"
  | "device_updated"
  | "device_connected"
  | "device_disconnected"
  | "characteristic_read"
  | "notification"
  | "error";

export interface ScannerEvent {
  type: ScannerEventType;
  deviceId?: string;
  data?: unknown;
}

type ScannerListener = (event: ScannerEvent) => void;

// ─── BLE Scanner Class ───────────────────────────────────

export class BleScanner {
  private _devices: Map<string, ScannedDevice> = new Map();
  private _listeners: ScannerListener[] = [];
  private _scanning = false;

  get devices(): ScannedDevice[] {
    return Array.from(this._devices.values()).sort((a, b) => b.lastSeen - a.lastSeen);
  }

  get scanning(): boolean { return this._scanning; }

  // ─── Events ─────────────────────────────────────────────

  on(listener: ScannerListener): () => void {
    this._listeners.push(listener);
    return () => { this._listeners = this._listeners.filter(l => l !== listener); };
  }

  private emit(event: ScannerEvent) {
    for (const l of this._listeners) {
      try { l(event); } catch (e) { console.error("[ble-scanner] Listener error:", e); }
    }
  }

  // ─── Scan ───────────────────────────────────────────────

  static isSupported(): boolean {
    return typeof navigator !== "undefined" && "bluetooth" in navigator;
  }

  /**
   * Scan for a BLE device. Web Bluetooth requires user gesture,
   * so each call opens the device picker. The user selects a device.
   * Call this repeatedly to find multiple devices.
   */
  async scanOne(): Promise<ScannedDevice | null> {
    if (!BleScanner.isSupported()) {
      this.emit({ type: "error", data: "Web Bluetooth stöds inte. Använd Chrome/Edge på Android." });
      return null;
    }

    this._scanning = true;

    try {
      const device = await navigator.bluetooth.requestDevice({
        acceptAllDevices: true,
        optionalServices: [
          "battery_service",
          "device_information",
          "generic_access",
          "human_interface_device",
          "heart_rate",
          "environmental_sensing",
          "tx_power",
          "immediate_alert",
          "link_loss",
          // Flipper Zero
          "8fe5b3d5-2e7f-4a98-2a48-7acc60fe0000",
        ],
      });

      const scanned: ScannedDevice = {
        id: device.id,
        name: device.name || "Okänd enhet",
        type: "unknown",
        connected: false,
        gattConnected: false,
        rssi: null,
        services: [],
        serviceNames: [],
        battery: null,
        manufacturer: null,
        firmware: null,
        characteristics: [],
        rawDevice: device,
        lastSeen: Date.now(),
      };

      // Listen for disconnect
      device.addEventListener("gattserverdisconnected", () => {
        const dev = this._devices.get(device.id);
        if (dev) {
          dev.connected = false;
          dev.gattConnected = false;
          this._devices.set(device.id, { ...dev });
          this.emit({ type: "device_disconnected", deviceId: device.id });
        }
      });

      this._devices.set(device.id, scanned);
      this.emit({ type: "device_found", deviceId: device.id, data: scanned });

      this._scanning = false;
      return scanned;
    } catch (err) {
      this._scanning = false;
      const msg = err instanceof Error ? err.message : String(err);
      if (!msg.includes("cancel")) {
        this.emit({ type: "error", data: `Sökning misslyckades: ${msg}` });
      }
      return null;
    }
  }

  // ─── Connect & Enumerate ────────────────────────────────

  async connectAndRead(deviceId: string): Promise<ScannedDevice | null> {
    const dev = this._devices.get(deviceId);
    if (!dev) return null;

    try {
      const server = await dev.rawDevice.gatt!.connect();
      dev.gattConnected = true;
      dev.connected = true;

      // Discover services
      const services = await server.getPrimaryServices();
      dev.services = services.map(s => s.uuid);
      dev.serviceNames = services.map(s => KNOWN_SERVICES[s.uuid] || s.uuid.slice(4, 8).toUpperCase());
      dev.type = detectDeviceType(dev.name, dev.services);

      // Read characteristics from each service
      const chars: CharacteristicInfo[] = [];
      for (const service of services) {
        const serviceName = KNOWN_SERVICES[service.uuid] || service.uuid;
        try {
          const characteristics = await service.getCharacteristics();
          for (const char of characteristics) {
            const props: string[] = [];
            if (char.properties.read) props.push("read");
            if (char.properties.write) props.push("write");
            if (char.properties.notify) props.push("notify");
            if (char.properties.indicate) props.push("indicate");
            if (char.properties.broadcast) props.push("broadcast");
            if (char.properties.writeWithoutResponse) props.push("writeNoResp");

            let value: string | undefined;
            if (char.properties.read) {
              try {
                const val = await char.readValue();
                value = decodeCharacteristicValue(char.uuid, val);
              } catch { /* some chars fail to read */ }
            }

            chars.push({
              service: service.uuid,
              serviceName,
              uuid: char.uuid,
              properties: props,
              value,
            });
          }
        } catch { /* service enumeration can fail */ }
      }
      dev.characteristics = chars;

      // Read battery if available
      try {
        const battService = await server.getPrimaryService("battery_service");
        const battChar = await battService.getCharacteristic("battery_level");
        const battVal = await battChar.readValue();
        dev.battery = battVal.getUint8(0);
      } catch { /* no battery service */ }

      // Read device info if available
      try {
        const infoService = await server.getPrimaryService("device_information");
        try {
          const mfgChar = await infoService.getCharacteristic("manufacturer_name_string");
          const mfgVal = await mfgChar.readValue();
          dev.manufacturer = new TextDecoder().decode(mfgVal);
        } catch { /* ok */ }
        try {
          const fwChar = await infoService.getCharacteristic("firmware_revision_string");
          const fwVal = await fwChar.readValue();
          dev.firmware = new TextDecoder().decode(fwVal);
        } catch {
          try {
            const swChar = await infoService.getCharacteristic("software_revision_string");
            const swVal = await swChar.readValue();
            dev.firmware = new TextDecoder().decode(swVal);
          } catch { /* ok */ }
        }
      } catch { /* no device info service */ }

      dev.lastSeen = Date.now();
      this._devices.set(deviceId, { ...dev });
      this.emit({ type: "device_connected", deviceId, data: dev });

      return dev;
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      this.emit({ type: "error", data: `Anslutning till ${dev.name} misslyckades: ${msg}` });
      return null;
    }
  }

  // ─── Subscribe to Notifications ─────────────────────────

  async subscribeToNotifications(deviceId: string, serviceUuid: string, charUuid: string): Promise<boolean> {
    const dev = this._devices.get(deviceId);
    if (!dev?.rawDevice.gatt?.connected) return false;

    try {
      const service = await dev.rawDevice.gatt.getPrimaryService(serviceUuid);
      const char = await service.getCharacteristic(charUuid);

      await char.startNotifications();
      char.addEventListener("characteristicvaluechanged", (event: Event) => {
        const target = event.target as BluetoothRemoteGATTCharacteristic;
        const dataView = target.value;
        if (!dataView) return;

        const bytes = new Uint8Array(dataView.buffer, dataView.byteOffset, dataView.byteLength);
        const decoded = decodeCharacteristicValue(charUuid, dataView);

        this.emit({
          type: "notification",
          deviceId,
          data: { serviceUuid, charUuid, bytes, decoded },
        });
      });

      return true;
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      this.emit({ type: "error", data: `Notification-prenumeration misslyckades: ${msg}` });
      return false;
    }
  }

  // ─── Write to Characteristic ────────────────────────────

  async writeCharacteristic(deviceId: string, serviceUuid: string, charUuid: string, data: Uint8Array): Promise<boolean> {
    const dev = this._devices.get(deviceId);
    if (!dev?.rawDevice.gatt?.connected) return false;

    try {
      const service = await dev.rawDevice.gatt.getPrimaryService(serviceUuid);
      const char = await service.getCharacteristic(charUuid);
      await char.writeValue(data as unknown as BufferSource);
      return true;
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      this.emit({ type: "error", data: `Skrivning misslyckades: ${msg}` });
      return false;
    }
  }

  // ─── Disconnect ─────────────────────────────────────────

  disconnect(deviceId: string) {
    const dev = this._devices.get(deviceId);
    if (dev?.rawDevice.gatt?.connected) {
      dev.rawDevice.gatt.disconnect();
    }
  }

  disconnectAll() {
    for (const dev of this._devices.values()) {
      if (dev.rawDevice.gatt?.connected) {
        dev.rawDevice.gatt.disconnect();
      }
    }
  }

  removeDevice(deviceId: string) {
    this.disconnect(deviceId);
    this._devices.delete(deviceId);
  }
}

// ─── Decode Characteristic Values ─────────────────────────

function decodeCharacteristicValue(uuid: string, dataView: DataView): string {
  const short = uuid.slice(4, 8).toLowerCase();

  try {
    switch (short) {
      // Battery Level
      case "2a19":
        return `${dataView.getUint8(0)}%`;

      // Device Name, Manufacturer, Model, Serial, Firmware, Hardware, Software
      case "2a00": case "2a29": case "2a24": case "2a25":
      case "2a26": case "2a27": case "2a28":
        return new TextDecoder().decode(dataView);

      // Heart Rate Measurement
      case "2a37": {
        const flags = dataView.getUint8(0);
        const is16bit = flags & 0x01;
        const hr = is16bit ? dataView.getUint16(1, true) : dataView.getUint8(1);
        return `${hr} BPM`;
      }

      // Tx Power Level
      case "2a07":
        return `${dataView.getInt8(0)} dBm`;

      // Temperature
      case "2a6e":
        return `${(dataView.getInt16(0, true) / 100).toFixed(1)}°C`;

      // Humidity
      case "2a6f":
        return `${(dataView.getUint16(0, true) / 100).toFixed(1)}%`;

      default: {
        // Try text first
        const bytes = new Uint8Array(dataView.buffer, dataView.byteOffset, dataView.byteLength);
        const isPrintable = bytes.every(b => (b >= 0x20 && b <= 0x7E) || b === 0x0A || b === 0x0D);
        if (isPrintable && bytes.length > 0 && bytes.length < 200) {
          return new TextDecoder().decode(dataView);
        }
        // Hex dump
        return Array.from(bytes).map(b => b.toString(16).padStart(2, "0")).join(" ");
      }
    }
  } catch {
    const bytes = new Uint8Array(dataView.buffer, dataView.byteOffset, dataView.byteLength);
    return Array.from(bytes).map(b => b.toString(16).padStart(2, "0")).join(" ");
  }
}

// ─── Audio Capture (via Web Audio API + getUserMedia) ─────

export interface AudioCaptureState {
  active: boolean;
  deviceLabel: string;
  sampleRate: number;
  channels: number;
  level: number; // 0-1 RMS level
  duration: number; // seconds
  chunks: Blob[];
}

export class AudioCapture {
  private _stream: MediaStream | null = null;
  private _audioCtx: AudioContext | null = null;
  private _analyser: AnalyserNode | null = null;
  private _recorder: MediaRecorder | null = null;
  private _chunks: Blob[] = [];
  private _startTime = 0;
  private _levelInterval: ReturnType<typeof setInterval> | null = null;
  private _onLevel: ((level: number) => void) | null = null;
  private _onChunk: ((chunk: Blob) => void) | null = null;

  get isActive(): boolean { return this._stream !== null; }

  /**
   * List available audio input devices (microphones, BT headsets, etc.)
   */
  static async listAudioDevices(): Promise<MediaDeviceInfo[]> {
    try {
      // Need to request permission first to get device labels
      const tempStream = await navigator.mediaDevices.getUserMedia({ audio: true });
      tempStream.getTracks().forEach(t => t.stop());

      const devices = await navigator.mediaDevices.enumerateDevices();
      return devices.filter(d => d.kind === "audioinput");
    } catch {
      return [];
    }
  }

  /**
   * Start capturing audio from a specific device or default.
   */
  async start(deviceId?: string, onLevel?: (level: number) => void, onChunk?: (chunk: Blob) => void): Promise<{ deviceLabel: string; sampleRate: number; channels: number } | null> {
    this._onLevel = onLevel || null;
    this._onChunk = onChunk || null;

    try {
      const constraints: MediaStreamConstraints = {
        audio: deviceId
          ? { deviceId: { exact: deviceId }, echoCancellation: false, noiseSuppression: false, autoGainControl: false }
          : { echoCancellation: false, noiseSuppression: false, autoGainControl: false },
      };

      this._stream = await navigator.mediaDevices.getUserMedia(constraints);
      const track = this._stream.getAudioTracks()[0];
      const settings = track.getSettings();

      // Audio context for level metering
      this._audioCtx = new AudioContext();
      const source = this._audioCtx.createMediaStreamSource(this._stream);
      this._analyser = this._audioCtx.createAnalyser();
      this._analyser.fftSize = 256;
      source.connect(this._analyser);

      // Level metering
      const dataArray = new Uint8Array(this._analyser.frequencyBinCount);
      this._levelInterval = setInterval(() => {
        if (!this._analyser) return;
        this._analyser.getByteTimeDomainData(dataArray);
        let sum = 0;
        for (let i = 0; i < dataArray.length; i++) {
          const v = (dataArray[i] - 128) / 128;
          sum += v * v;
        }
        const rms = Math.sqrt(sum / dataArray.length);
        if (this._onLevel) this._onLevel(rms);
      }, 100);

      // MediaRecorder for capturing audio data
      this._recorder = new MediaRecorder(this._stream, {
        mimeType: MediaRecorder.isTypeSupported("audio/webm;codecs=opus")
          ? "audio/webm;codecs=opus"
          : "audio/webm",
      });
      this._chunks = [];
      this._recorder.ondataavailable = (e) => {
        if (e.data.size > 0) {
          this._chunks.push(e.data);
          if (this._onChunk) this._onChunk(e.data);
        }
      };
      this._recorder.start(1000); // Chunk every second
      this._startTime = Date.now();

      return {
        deviceLabel: track.label || "Okänd mikrofon",
        sampleRate: settings.sampleRate || this._audioCtx.sampleRate,
        channels: settings.channelCount || 1,
      };
    } catch (err) {
      this.stop();
      throw err;
    }
  }

  stop(): Blob | null {
    if (this._levelInterval) {
      clearInterval(this._levelInterval);
      this._levelInterval = null;
    }

    if (this._recorder && this._recorder.state !== "inactive") {
      this._recorder.stop();
    }
    this._recorder = null;

    if (this._stream) {
      this._stream.getTracks().forEach(t => t.stop());
      this._stream = null;
    }

    if (this._audioCtx) {
      this._audioCtx.close().catch(() => {});
      this._audioCtx = null;
    }
    this._analyser = null;

    if (this._chunks.length > 0) {
      const blob = new Blob(this._chunks, { type: "audio/webm" });
      this._chunks = [];
      return blob;
    }
    return null;
  }

  getDuration(): number {
    return this._startTime > 0 ? (Date.now() - this._startTime) / 1000 : 0;
  }

  getChunks(): Blob[] {
    return [...this._chunks];
  }
}

// ─── Singleton Instances ──────────────────────────────────

export const bleScanner = new BleScanner();
export const audioCapture = new AudioCapture();
