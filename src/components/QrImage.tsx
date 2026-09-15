"use client";

import { useEffect, useState } from "react";

export function QrImage({ value }: { value: string }) {
  const [src, setSrc] = useState("");

  useEffect(() => {
    let alive = true;
    import("qrcode")
      .then((mod) => mod.toDataURL(value, { width: 240, margin: 1, color: { dark: "#14110e", light: "#ffffff" } }))
      .then((url) => {
        if (alive) setSrc(url);
      })
      .catch(() => {
        if (alive) {
          setSrc(`https://api.qrserver.com/v1/create-qr-code/?size=240x240&data=${encodeURIComponent(value)}`);
        }
      });
    return () => {
      alive = false;
    };
  }, [value]);

  if (!src) return <div className="mx-auto aspect-square w-full max-w-[240px] animate-pulse rounded-xl bg-paper-100" />;
  return (
    <img
      src={src}
      alt="Scanner QR"
      width={240}
      height={240}
      className="mx-auto h-auto w-full max-w-[240px] rounded-xl bg-white p-2"
    />
  );
}
