"use client";

import { useEffect, useRef, useState } from "react";

type DetectorResult = { rawValue: string };

export function CameraScan({
  onCode,
  onClose,
  hintText = "Point the camera at a product QR or barcode.",
}: {
  onCode: (code: string) => void;
  onClose: () => void;
  hintText?: string;
}) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [hint, setHint] = useState("Starting camera…");

  useEffect(() => {
    const node = videoRef.current;
    if (!node) return;
    const video: HTMLVideoElement = node;
    let stream: MediaStream | null = null;
    let timer: number | undefined;
    let last = "";
    let lastAt = 0;

    async function start() {
      try {
        stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: { ideal: "environment" } },
          audio: false,
        });
        video.srcObject = stream;
        await video.play();
      } catch {
        setHint("Camera permission is needed to scan.");
        return;
      }

      const Detector = (window as unknown as { BarcodeDetector?: new (opts: { formats: string[] }) => { detect: (src: HTMLVideoElement) => Promise<DetectorResult[]> } }).BarcodeDetector;
      if (!Detector) {
        setHint("Use Chrome or Edge for camera scanning. A USB barcode scanner still works in the search box.");
        return;
      }
      const detector = new Detector({
        formats: ["qr_code", "ean_13", "ean_8", "code_128", "code_39", "upc_a", "upc_e", "codabar"],
      });
      setHint(hintText);
      timer = window.setInterval(async () => {
        if (video.readyState < 2) return;
        try {
          const codes = await detector.detect(video);
          const value = codes[0]?.rawValue?.trim();
          if (!value) return;
          const now = Date.now();
          if (value === last && now - lastAt < 1600) return;
          last = value;
          lastAt = now;
          onCode(value);
        } catch {
          /* keep scanning */
        }
      }, 280);
    }

    start();
    return () => {
      if (timer) window.clearInterval(timer);
      stream?.getTracks().forEach((track) => track.stop());
    };
  }, [onCode]);

  return (
    <div className="space-y-3">
      <video ref={videoRef} className="aspect-video w-full rounded-xl bg-surface-900 object-cover" muted playsInline />
      <p className="text-sm text-surface-400">{hint}</p>
      <button type="button" className="btn btn-ghost w-full" onClick={onClose}>
        Close camera
      </button>
    </div>
  );
}
