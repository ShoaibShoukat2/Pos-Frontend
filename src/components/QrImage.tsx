"use client";

import { useEffect, useRef, useState } from "react";

export function QrImage({ value, alt = "QR code", size = 240, onReady }: { value: string; alt?: string; size?: number; onReady?: () => void }) {
  const [src, setSrc] = useState("");
  const readyRef = useRef(onReady);
  readyRef.current = onReady;

  useEffect(() => {
    let alive = true;
    import("qrcode")
      .then((mod) => mod.toDataURL(value, { width: size, margin: 1, color: { dark: "#14110e", light: "#ffffff" } }))
      .then((url) => {
        if (!alive) return;
        setSrc(url);
        readyRef.current?.();
      })
      .catch(() => {
        if (!alive) return;
        setSrc(`https://api.qrserver.com/v1/create-qr-code/?size=${size}x${size}&data=${encodeURIComponent(value)}`);
        readyRef.current?.();
      });
    return () => {
      alive = false;
    };
  }, [value, size]);

  if (!src) return <div className="mx-auto aspect-square w-full animate-pulse rounded-xl bg-slate-100" style={{ maxWidth: size }} />;
  return (
    <img
      src={src}
      alt={alt}
      width={size}
      height={size}
      className="mx-auto h-auto w-full rounded-xl bg-white p-2"
      style={{ maxWidth: size }}
    />
  );
}
