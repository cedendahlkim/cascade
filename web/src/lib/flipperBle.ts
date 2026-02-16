/**
 * Flipper Zero BLE Communication Layer
 *
 * Handles Web Bluetooth connection, GATT services, and serial communication
 * with a real Flipper Zero device.
 *
 * BLE Service UUIDs from Flipper Zero firmware:
 * - Serial Service: 8fe5b3d5-2e7f-4a98-2a48-7acc60fe0000
 * - TX Characteristic: 19ed82ae-ed21-4c9d-4145-228e62fe0000 (write to Flipper)
 * - RX Characteristic: 19ed82ae-ed21-4c9d-4145-228e61fe0000 (read from Flipper)
 * - Overflow:          19ed82ae-ed21-4c9d-4145-228e63fe0000
 * - RPC State:         19ed82ae-ed21-4c9d-4145-228e64fe0000
 */

// ─── BLE Service UUIDs ────────────────────────────────────

export const BLE_UUIDS = {
  SERIAL_SERVICE: "8fe5b3d5-2e7f-4a98-2a48-7acc60fe0000",
  TX: "19ed82ae-ed21-4c9d-4145-228e62fe0000",
  RX: "19ed82ae-ed21-4c9d-4145-228e61fe0000",
  OVERFLOW: "19ed82ae-ed21-4c9d-4145-228e63fe0000",
  RPC_STATE: "19ed82ae-ed21-4c9d-4145-228e64fe0000",

  BATTERY_SERVICE: "0000180f-0000-1000-8000-00805f9b34fb",
  BATTERY_LEVEL: "00002a19-0000-1000-8000-00805f9b34fb",
  BATTERY_POWER_STATE: "00002a1a-0000-1000-8000-00805f9b34fb",

  INFO_SERVICE: "0000180a-0000-1000-8000-00805f9b34fb",
  MANUFACTURER: "00002a29-0000-1000-8000-00805f9b34fb",
  HARDWARE_VERSION: "00002a26-0000-1000-8000-00805f9b34fb",
  SOFTWARE_VERSION: "00002a28-0000-1000-8000-00805f9b34fb",
  API_VERSION: "03f6666d-ae5e-47c8-8e1a-5d873eb5a933",
} as const;

// ─── Types ────────────────────────────────────────────────

export interface FlipperDeviceInfo {
  name: string;
  id: string;
  battery: number;
  batteryCharging: boolean;
  firmware: string;
  hardware: string;
  manufacturer: string;
  apiVersion: string;
}

export type FlipperConnectionState = "disconnected" | "scanning" | "connecting" | "connected" | "rpc_active" | "error";

export type FlipperEventType =
  | "state_change"
  | "device_info"
  | "rx_data"
  | "rx_line"
  | "rpc_response"
  | "error"
  | "battery_update"
  | "disconnect";

export interface FlipperEvent {
  type: FlipperEventType;
  data?: unknown;
}

type FlipperListener = (event: FlipperEvent) => void;

// ─── FlipperBLE Class ─────────────────────────────────────

export class FlipperBLE {
  private device: BluetoothDevice | null = null;
  private server: BluetoothRemoteGATTServer | null = null;
  private txChar: BluetoothRemoteGATTCharacteristic | null = null;
  private rxChar: BluetoothRemoteGATTCharacteristic | null = null;
  private rpcStateChar: BluetoothRemoteGATTCharacteristic | null = null;

  private _state: FlipperConnectionState = "disconnected";
  private _deviceInfo: FlipperDeviceInfo | null = null;
  private _rpcActive = false;
  private _commandId = 0;
  private _rxBuffer = "";
  private _listeners: FlipperListener[] = [];
  private _batteryInterval: ReturnType<typeof setInterval> | null = null;

  // ─── Public Getters ───────────────────────────────────

  get state(): FlipperConnectionState { return this._state; }
  get deviceInfo(): FlipperDeviceInfo | null { return this._deviceInfo; }
  get isConnected(): boolean { return this._state === "connected" || this._state === "rpc_active"; }
  get isRpcActive(): boolean { return this._rpcActive; }

  // ─── Event System ─────────────────────────────────────

  on(listener: FlipperListener): () => void {
    this._listeners.push(listener);
    return () => {
      this._listeners = this._listeners.filter(l => l !== listener);
    };
  }

  private emit(event: FlipperEvent) {
    for (const listener of this._listeners) {
      try { listener(event); } catch (e) { console.error("[flipper-ble] Listener error:", e); }
    }
  }

  private setState(state: FlipperConnectionState) {
    this._state = state;
    this.emit({ type: "state_change", data: state });
  }

  // ─── Check Web Bluetooth Support ──────────────────────

  static isSupported(): boolean {
    return typeof navigator !== "undefined" && "bluetooth" in navigator;
  }

  // ─── Scan & Connect ───────────────────────────────────

  async scan(): Promise<BluetoothDevice | null> {
    if (!FlipperBLE.isSupported()) {
      this.emit({ type: "error", data: "Web Bluetooth stöds inte i denna webbläsare. Använd Chrome eller Edge på Android." });
      return null;
    }

    this.setState("scanning");

    try {
      // Request device with Flipper Zero's BLE services
      const device = await navigator.bluetooth.requestDevice({
        // acceptAllDevices with battery_service filter to show all BLE devices
        // but we also request Flipper-specific optional services
        acceptAllDevices: true,
        optionalServices: [
          BLE_UUIDS.SERIAL_SERVICE,
          BLE_UUIDS.BATTERY_SERVICE,
          BLE_UUIDS.INFO_SERVICE,
        ],
      });

      this.device = device;

      // Listen for disconnect
      device.addEventListener("gattserverdisconnected", () => {
        this.handleDisconnect();
      });

      this.setState("disconnected");
      return device;
    } catch (err) {
      // User cancelled the picker or BLE error
      const msg = err instanceof Error ? err.message : String(err);
      if (msg.includes("cancelled") || msg.includes("canceled")) {
        this.setState("disconnected");
        return null;
      }
      this.setState("error");
      this.emit({ type: "error", data: `BLE-sökning misslyckades: ${msg}` });
      return null;
    }
  }

  async connect(): Promise<boolean> {
    if (!this.device) {
      this.emit({ type: "error", data: "Ingen enhet vald. Sök först." });
      return false;
    }

    this.setState("connecting");

    try {
      // Connect to GATT server
      this.server = await this.device.gatt!.connect();

      // Read device information
      await this.readDeviceInfo();

      // Setup serial service
      await this.setupSerial();

      // Start battery polling
      this.startBatteryPolling();

      this.setState("connected");
      return true;
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      this.setState("error");
      this.emit({ type: "error", data: `Anslutning misslyckades: ${msg}` });
      return false;
    }
  }

  async disconnect(): Promise<void> {
    this.stopBatteryPolling();
    this._rpcActive = false;

    if (this.rxChar) {
      try { await this.rxChar.stopNotifications(); } catch { /* ok */ }
    }

    if (this.server?.connected) {
      this.server.disconnect();
    }

    this.device = null;
    this.server = null;
    this.txChar = null;
    this.rxChar = null;
    this.rpcStateChar = null;
    this._deviceInfo = null;
    this._rxBuffer = "";
    this._commandId = 0;

    this.setState("disconnected");
  }

  private handleDisconnect() {
    this.stopBatteryPolling();
    this._rpcActive = false;
    this.txChar = null;
    this.rxChar = null;
    this.rpcStateChar = null;
    this._rxBuffer = "";

    this.setState("disconnected");
    this.emit({ type: "disconnect" });
  }

  // ─── Read Device Info ─────────────────────────────────

  private async readDeviceInfo(): Promise<void> {
    if (!this.server) return;

    const info: FlipperDeviceInfo = {
      name: this.device?.name || "Flipper Zero",
      id: this.device?.id || "",
      battery: 0,
      batteryCharging: false,
      firmware: "unknown",
      hardware: "unknown",
      manufacturer: "unknown",
      apiVersion: "unknown",
    };

    // Battery
    try {
      const battService = await this.server.getPrimaryService(BLE_UUIDS.BATTERY_SERVICE);
      const battChar = await battService.getCharacteristic(BLE_UUIDS.BATTERY_LEVEL);
      const battValue = await battChar.readValue();
      info.battery = battValue.getUint8(0);

      try {
        const powerChar = await battService.getCharacteristic(BLE_UUIDS.BATTERY_POWER_STATE);
        const powerValue = await powerChar.readValue();
        const state = powerValue.getUint8(0);
        info.batteryCharging = (state & 0b0011_0000) !== 0;
      } catch { /* power state not available on all firmware */ }
    } catch (e) {
      console.warn("[flipper-ble] Battery service not available:", e);
    }

    // Device Information
    try {
      const infoService = await this.server.getPrimaryService(BLE_UUIDS.INFO_SERVICE);

      const readString = async (uuid: string): Promise<string> => {
        try {
          const char = await infoService.getCharacteristic(uuid);
          const value = await char.readValue();
          return new TextDecoder().decode(value);
        } catch { return "unknown"; }
      };

      info.firmware = await readString(BLE_UUIDS.SOFTWARE_VERSION);
      info.hardware = await readString(BLE_UUIDS.HARDWARE_VERSION);
      info.manufacturer = await readString(BLE_UUIDS.MANUFACTURER);
      info.apiVersion = await readString(BLE_UUIDS.API_VERSION);
    } catch (e) {
      console.warn("[flipper-ble] Info service not available:", e);
    }

    this._deviceInfo = info;
    this.emit({ type: "device_info", data: info });
  }

  // ─── Battery Polling ──────────────────────────────────

  private startBatteryPolling() {
    this.stopBatteryPolling();
    this._batteryInterval = setInterval(async () => {
      if (!this.server?.connected) return;
      try {
        const battService = await this.server.getPrimaryService(BLE_UUIDS.BATTERY_SERVICE);
        const battChar = await battService.getCharacteristic(BLE_UUIDS.BATTERY_LEVEL);
        const value = await battChar.readValue();
        const level = value.getUint8(0);
        if (this._deviceInfo) {
          this._deviceInfo.battery = level;
          this.emit({ type: "battery_update", data: level });
        }
      } catch { /* ignore polling errors */ }
    }, 30000); // Every 30 seconds
  }

  private stopBatteryPolling() {
    if (this._batteryInterval) {
      clearInterval(this._batteryInterval);
      this._batteryInterval = null;
    }
  }

  // ─── Serial Service Setup ─────────────────────────────

  private async setupSerial(): Promise<void> {
    if (!this.server) return;

    try {
      const serialService = await this.server.getPrimaryService(BLE_UUIDS.SERIAL_SERVICE);

      this.txChar = await serialService.getCharacteristic(BLE_UUIDS.TX);
      this.rxChar = await serialService.getCharacteristic(BLE_UUIDS.RX);

      try {
        this.rpcStateChar = await serialService.getCharacteristic(BLE_UUIDS.RPC_STATE);
      } catch { /* RPC state char may not be available */ }

      // Subscribe to RX notifications
      await this.rxChar.startNotifications();
      this.rxChar.addEventListener("characteristicvaluechanged", (event: Event) => {
        const target = event.target as BluetoothRemoteGATTCharacteristic;
        const dataView = target.value;
        if (!dataView) return;

        const bytes = new Uint8Array(dataView.buffer, dataView.byteOffset, dataView.byteLength);
        this.handleRxData(bytes);
      });

      // Log TX characteristic properties for debugging
      const props = this.txChar.properties;
      console.log(`[flipper-ble] Serial service ready. TX props: write=${props.write}, writeNoResp=${props.writeWithoutResponse}, notify=${props.notify}`);
      console.log(`[flipper-ble] RX notifications started`);
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      console.warn("[flipper-ble] Serial service not available:", msg);
      this.emit({ type: "error", data: `Flipper Serial-tjänst ej tillgänglig: ${msg}` });
    }
  }

  // ─── RX Data Handler ──────────────────────────────────

  private handleRxData(bytes: Uint8Array) {
    // Emit raw data
    this.emit({ type: "rx_data", data: bytes });

    if (this._rpcActive) {
      // In RPC mode, data is protobuf-encoded
      this.emit({ type: "rpc_response", data: bytes });
    } else {
      // In CLI mode, data is text
      const text = new TextDecoder().decode(bytes);
      this._rxBuffer += text;

      // Emit complete lines
      const lines = this._rxBuffer.split("\n");
      this._rxBuffer = lines.pop() || "";
      for (const line of lines) {
        const trimmed = line.replace(/\r$/, "");
        if (trimmed.length > 0) {
          this.emit({ type: "rx_line", data: trimmed });
        }
      }
    }
  }

  // ─── Send Data ────────────────────────────────────────

  async sendRaw(data: Uint8Array): Promise<void> {
    if (!this.txChar) {
      const err = "Inte ansluten — TX-karaktäristik saknas";
      console.error("[flipper-ble]", err);
      this.emit({ type: "error", data: err });
      throw new Error(err);
    }

    // BLE MTU for Flipper Zero is typically small (20-512 bytes)
    // Use conservative chunk size
    const MTU = 128;
    for (let i = 0; i < data.length; i += MTU) {
      const chunk = data.slice(i, i + MTU);
      try {
        // Flipper Zero TX uses writeWithoutResponse
        if (this.txChar.properties.writeWithoutResponse) {
          await this.txChar.writeValueWithoutResponse(chunk.buffer as ArrayBuffer);
        } else {
          await this.txChar.writeValueWithResponse(chunk.buffer as ArrayBuffer);
        }
        console.log(`[flipper-ble] TX sent ${chunk.length} bytes`);
      } catch (e) {
        const msg = e instanceof Error ? e.message : String(e);
        console.error("[flipper-ble] TX write failed:", msg);
        this.emit({ type: "error", data: `BLE TX misslyckades: ${msg}` });
        throw e;
      }
      // Small delay between chunks
      if (i + MTU < data.length) {
        await new Promise(r => setTimeout(r, 30));
      }
    }
  }

  async sendText(text: string): Promise<void> {
    console.log(`[flipper-ble] Sending text: ${JSON.stringify(text)}`);
    const encoded = new TextEncoder().encode(text);
    await this.sendRaw(encoded);
  }

  // ─── CLI Commands (before RPC session) ────────────────

  async sendCliCommand(command: string): Promise<void> {
    if (!this.txChar) {
      const err = "Inte ansluten — kan inte skicka CLI-kommando";
      console.error("[flipper-ble]", err);
      this.emit({ type: "error", data: err });
      throw new Error(err);
    }
    console.log(`[flipper-ble] CLI command: ${command}`);
    // Flipper CLI uses \r as line ending
    await this.sendText(command + "\r");
  }

  // ─── RPC Session ──────────────────────────────────────

  async startRpcSession(): Promise<boolean> {
    if (!this.txChar) return false;

    try {
      // Send the magic command to start RPC
      await this.sendText("start_rpc_session\r");

      // Wait a bit for Flipper to switch to RPC mode
      await new Promise(r => setTimeout(r, 500));

      // Check RPC state if available
      if (this.rpcStateChar) {
        const stateValue = await this.rpcStateChar.readValue();
        const state = new Uint8Array(stateValue.buffer);
        console.log("[flipper-ble] RPC State after start:", state);
      }

      this._rpcActive = true;
      this._commandId = 0;
      this.setState("rpc_active");
      return true;
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      this.emit({ type: "error", data: `Kunde inte starta RPC-session: ${msg}` });
      return false;
    }
  }

  /**
   * Send a simple RPC ping to verify the connection.
   * Note: Full protobuf encoding requires the flipper protobuf definitions.
   * This is a minimal implementation that encodes a basic ping request.
   */
  async sendRpcPing(): Promise<void> {
    if (!this._rpcActive) {
      throw new Error("RPC-session inte aktiv");
    }

    this._commandId++;

    // Minimal protobuf encoding for PB.Main with systemPingRequest
    // Field 1 (command_id): varint
    // Field 2 (command_status): varint (0 = OK)
    // Field 3 (has_next): varint (0 = false)
    // Field 31 (system_ping_request): length-delimited (empty)
    const msg = new Uint8Array([
      // command_id = this._commandId (field 1, varint)
      0x08, this._commandId & 0x7F,
      // command_status = 0 (field 2, varint)
      0x10, 0x00,
      // has_next = false (field 3, varint)
      0x18, 0x00,
      // system_ping_request = {} (field 31, length-delimited, length 0)
      0xFA, 0x01, 0x00,
    ]);

    // Protobuf delimited: prefix with length
    const lenByte = msg.length;
    const delimited = new Uint8Array(1 + msg.length);
    delimited[0] = lenByte;
    delimited.set(msg, 1);

    await this.sendRaw(delimited);
  }

  /**
   * Send RPC request to get device info (system_device_info_request).
   * Field 32 in PB.Main.
   */
  async sendRpcDeviceInfo(): Promise<void> {
    if (!this._rpcActive) {
      throw new Error("RPC-session inte aktiv");
    }

    this._commandId++;

    const msg = new Uint8Array([
      0x08, this._commandId & 0x7F,
      0x10, 0x00,
      0x18, 0x00,
      // system_device_info_request = {} (field 32, length-delimited, length 0)
      0x82, 0x02, 0x00,
    ]);

    const lenByte = msg.length;
    const delimited = new Uint8Array(1 + msg.length);
    delimited[0] = lenByte;
    delimited.set(msg, 1);

    await this.sendRaw(delimited);
  }

  /**
   * Send RPC request to list storage (storage_list_request).
   * Field 28 in PB.Main.
   */
  async sendRpcStorageList(path: string): Promise<void> {
    if (!this._rpcActive) {
      throw new Error("RPC-session inte aktiv");
    }

    this._commandId++;

    // Encode path as protobuf string (field 1 of StorageListRequest)
    const pathBytes = new TextEncoder().encode(path);
    const pathField = new Uint8Array(2 + pathBytes.length);
    pathField[0] = 0x0A; // field 1, length-delimited
    pathField[1] = pathBytes.length;
    pathField.set(pathBytes, 2);

    // Main message
    const header = new Uint8Array([
      0x08, this._commandId & 0x7F,
      0x10, 0x00,
      0x18, 0x00,
    ]);

    // storage_list_request = pathField (field 28, length-delimited)
    const fieldTag = new Uint8Array([0xE2, 0x01]); // field 28
    const fieldLen = new Uint8Array([pathField.length]);

    const msg = new Uint8Array(header.length + fieldTag.length + fieldLen.length + pathField.length);
    let offset = 0;
    msg.set(header, offset); offset += header.length;
    msg.set(fieldTag, offset); offset += fieldTag.length;
    msg.set(fieldLen, offset); offset += fieldLen.length;
    msg.set(pathField, offset);

    const delimited = new Uint8Array(1 + msg.length);
    delimited[0] = msg.length;
    delimited.set(msg, 1);

    await this.sendRaw(delimited);
  }

  // ─── Convenience: Get next command ID ─────────────────

  get nextCommandId(): number {
    return ++this._commandId;
  }
}

// ─── Singleton Instance ───────────────────────────────────

export const flipperBle = new FlipperBLE();
