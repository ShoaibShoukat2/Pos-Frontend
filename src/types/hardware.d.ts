interface USBDevice {
  productName?: string;
  vendorId: number;
  deviceClass: number;
}

interface USBConnectionEvent extends Event {
  device: USBDevice;
}

interface USB {
  getDevices(): Promise<USBDevice[]>;
  requestDevice(options: { filters: Array<{ classCode?: number; vendorId?: number }> }): Promise<USBDevice>;
  addEventListener(type: "connect" | "disconnect", listener: (event: USBConnectionEvent) => void): void;
  removeEventListener(type: "connect" | "disconnect", listener: (event: USBConnectionEvent) => void): void;
}

interface HIDDevice {
  productName?: string;
}

interface HIDConnectionEvent extends Event {
  device: HIDDevice;
}

interface HID {
  getDevices(): Promise<HIDDevice[]>;
  requestDevice(options: { filters: Array<{ usagePage?: number; vendorId?: number }> }): Promise<HIDDevice[]>;
  addEventListener(type: "connect" | "disconnect", listener: (event: HIDConnectionEvent) => void): void;
  removeEventListener(type: "connect" | "disconnect", listener: (event: HIDConnectionEvent) => void): void;
}

interface SerialPortInfo {
  usbVendorId?: number;
  usbProductId?: number;
}

interface SerialPort {
  getInfo(): SerialPortInfo;
}

interface Serial {
  getPorts(): Promise<SerialPort[]>;
  requestPort(options?: { filters?: Array<{ usbVendorId?: number }> }): Promise<SerialPort>;
  addEventListener(type: "connect" | "disconnect", listener: () => void): void;
  removeEventListener(type: "connect" | "disconnect", listener: () => void): void;
}

interface Navigator {
  usb?: USB;
  hid?: HID;
  serial?: Serial;
}
