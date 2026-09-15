"use client";

import { useCallback, useEffect, useRef, useState } from "react";

export type DeviceKind = "printer" | "scanner";

export type HardwareDevice = {
  name: string;
  connected: boolean;
};

type Toast = {
  id: number;
  kind: DeviceKind;
  title: string;
  detail: string;
  tone: "good" | "warn";
};

const PRINTER_KEY = "upos_printer_name";
const SCANNER_KEY = "upos_scanner_name";

function usb(): USB | undefined {
  return typeof navigator !== "undefined" ? navigator.usb : undefined;
}

function hid(): HID | undefined {
  return typeof navigator !== "undefined" ? navigator.hid : undefined;
}

function serial(): Serial | undefined {
  return typeof navigator !== "undefined" ? navigator.serial : undefined;
}

function deviceName(value?: string | null) {
  return (value || "").trim() || "USB device";
}

function looksLikePrinter(name: string, classCode?: number) {
  const n = name.toLowerCase();
  return (
    classCode === 7 ||
    /print|thermal|receipt|epson|xprinter|pos[- ]?80|star mic|citizen|bixolon|rongta|gprinter/.test(n)
  );
}

function looksLikeScanner(name: string, classCode?: number, isHid = false) {
  const n = name.toLowerCase();
  return (
    isHid ||
    classCode === 3 ||
    /scan|barcode|honeywell|symbol|zebra|datalogic|cipher|newland|sunmi|inateck/.test(n)
  );
}

function readSaved(key: string) {
  if (typeof window === "undefined") return "";
  return localStorage.getItem(key) || "";
}

export function useHardware() {
  const [printer, setPrinter] = useState<HardwareDevice>({ name: "", connected: false });
  const [scanner, setScanner] = useState<HardwareDevice>({ name: "", connected: false });
  const [toasts, setToasts] = useState<Toast[]>([]);
  const [busy, setBusy] = useState<DeviceKind | null>(null);
  const [help, setHelp] = useState<DeviceKind | null>(null);
  const toastId = useRef(1);
  const lastScanKey = useRef(0);
  const burst = useRef(0);

  const pushToast = useCallback((kind: DeviceKind, title: string, detail: string, tone: Toast["tone"] = "good") => {
    const id = toastId.current++;
    setToasts((rows) => [...rows.slice(-2), { id, kind, title, detail, tone }]);
    window.setTimeout(() => setToasts((rows) => rows.filter((row) => row.id !== id)), 4500);
  }, []);

  const markPrinter = useCallback(
    (name: string, connected: boolean, announce = true) => {
      const label = deviceName(name);
      setPrinter({ name: label, connected });
      if (connected) localStorage.setItem(PRINTER_KEY, label);
      if (!announce) return;
      pushToast(
        "printer",
        connected ? "Printer connected" : "Printer disconnected",
        connected ? `${label} ready for bills.` : `${label} unplugged.`,
        connected ? "good" : "warn",
      );
    },
    [pushToast],
  );

  const markScanner = useCallback(
    (name: string, connected: boolean, announce = true) => {
      const label = deviceName(name);
      setScanner({ name: label, connected });
      if (connected) localStorage.setItem(SCANNER_KEY, label);
      if (!announce) return;
      pushToast(
        "scanner",
        connected ? "Barcode reader connected" : "Barcode reader disconnected",
        connected ? `${label} is live. Scan a product.` : `${label} unplugged.`,
        connected ? "good" : "warn",
      );
    },
    [pushToast],
  );

  const applyUsb = useCallback(
    (name: string, classCode: number | undefined, connected: boolean) => {
      if (looksLikePrinter(name, classCode)) markPrinter(name, connected);
      else if (looksLikeScanner(name, classCode)) markScanner(name, connected);
      else if (connected) {
        pushToast("printer", "USB device connected", `${deviceName(name)} — choose Printer or Barcode below.`, "good");
      }
    },
    [markPrinter, markScanner, pushToast],
  );

  useEffect(() => {
    const savedPrinter = readSaved(PRINTER_KEY);
    const savedScanner = readSaved(SCANNER_KEY);
    if (savedPrinter) setPrinter({ name: savedPrinter, connected: false });
    if (savedScanner) setScanner({ name: savedScanner, connected: false });

    const u = usb();
    const h = hid();
    const s = serial();

    u?.getDevices()
      .then((devices) => {
        devices.forEach((device) => {
          const name = deviceName(device.productName);
          if (looksLikePrinter(name, device.deviceClass)) markPrinter(name, true, false);
          if (looksLikeScanner(name, device.deviceClass)) markScanner(name, true, false);
        });
      })
      .catch(() => {});
    h?.getDevices()
      .then((devices) => {
        if (devices[0]) markScanner(deviceName(devices[0].productName), true, false);
      })
      .catch(() => {});
    s?.getPorts()
      .then((ports) => {
        const info = ports[0]?.getInfo();
        if (ports[0]) markPrinter(savedPrinter || `Serial printer ${info?.usbProductId || ""}`.trim(), true, false);
      })
      .catch(() => {});

    function onUsbConnect(event: USBConnectionEvent) {
      applyUsb(deviceName(event.device.productName), event.device.deviceClass, true);
    }
    function onUsbDisconnect(event: USBConnectionEvent) {
      applyUsb(deviceName(event.device.productName), event.device.deviceClass, false);
    }
    function onHidConnect(event: HIDConnectionEvent) {
      markScanner(deviceName(event.device.productName), true);
    }
    function onHidDisconnect(event: HIDConnectionEvent) {
      markScanner(deviceName(event.device.productName), false);
    }
    function onSerialConnect() {
      markPrinter(readSaved(PRINTER_KEY) || "Receipt printer", true);
    }
    function onSerialDisconnect() {
      markPrinter(readSaved(PRINTER_KEY) || "Receipt printer", false);
    }

    u?.addEventListener("connect", onUsbConnect);
    u?.addEventListener("disconnect", onUsbDisconnect);
    h?.addEventListener("connect", onHidConnect);
    h?.addEventListener("disconnect", onHidDisconnect);
    s?.addEventListener("connect", onSerialConnect);
    s?.addEventListener("disconnect", onSerialDisconnect);
    return () => {
      u?.removeEventListener("connect", onUsbConnect);
      u?.removeEventListener("disconnect", onUsbDisconnect);
      h?.removeEventListener("connect", onHidConnect);
      h?.removeEventListener("disconnect", onHidDisconnect);
      s?.removeEventListener("connect", onSerialConnect);
      s?.removeEventListener("disconnect", onSerialDisconnect);
    };
  }, [applyUsb, markPrinter, markScanner]);

  const connectPrinter = useCallback(async () => {
    setBusy("printer");
    try {
      if (usb()) {
        const device = await usb()!.requestDevice({
          filters: [{ classCode: 7 }, { classCode: 255 }, { classCode: 0 }],
        });
        markPrinter(deviceName(device.productName), true);
        setHelp(null);
        return;
      }
      if (serial()) {
        const port = await serial()!.requestPort();
        const info = port.getInfo();
        markPrinter(readSaved(PRINTER_KEY) || `Receipt printer ${info.usbProductId || ""}`.trim(), true);
        setHelp(null);
        return;
      }
      pushToast("printer", "Use Chrome or Edge", "Open this page in Chrome or Edge, plug in the USB cable, then try again.", "warn");
    } catch (err) {
      if (err instanceof DOMException && err.name === "NotFoundError") return;
      pushToast("printer", "Printer not selected", "Choose the printer from the list, or check the USB cable.", "warn");
    } finally {
      setBusy(null);
    }
  }, [markPrinter, pushToast]);

  const connectScanner = useCallback(async () => {
    setBusy("scanner");
    try {
      if (hid()) {
        const devices = await hid()!.requestDevice({
          filters: [{ usagePage: 0x01 }, { usagePage: 0x08 }, { usagePage: 0x0c }, { usagePage: 0x8c }],
        });
        const device = devices[0];
        if (device) {
          markScanner(deviceName(device.productName), true);
          setHelp(null);
          return;
        }
      }
      if (usb()) {
        const device = await usb()!.requestDevice({
          filters: [{ classCode: 3 }, { classCode: 255 }],
        });
        markScanner(deviceName(device.productName), true);
        setHelp(null);
        return;
      }
      pushToast("scanner", "Scan to confirm", "Plug in the barcode reader and scan any barcode. Status will turn Live.", "good");
    } catch (err) {
      if (err instanceof DOMException && err.name === "NotFoundError") return;
      pushToast("scanner", "Reader not selected", "Choose the barcode reader from the list, or scan a barcode to confirm.", "warn");
    } finally {
      setBusy(null);
    }
  }, [markScanner, pushToast]);

  const noteScanKey = useCallback(() => {
    const now = Date.now();
    if (now - lastScanKey.current < 50) burst.current += 1;
    else burst.current = 1;
    lastScanKey.current = now;
    if (burst.current >= 6 && !scanner.connected) {
      markScanner(readSaved(SCANNER_KEY) || "USB barcode reader", true);
    }
  }, [markScanner, scanner.connected]);

  const dismissToast = useCallback((id: number) => {
    setToasts((rows) => rows.filter((row) => row.id !== id));
  }, []);

  return {
    printer,
    scanner,
    toasts,
    busy,
    help,
    setHelp,
    connectPrinter,
    connectScanner,
    noteScanKey,
    dismissToast,
  };
}
