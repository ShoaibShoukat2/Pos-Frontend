"use client";

import { useEffect, useId, useRef, useState } from "react";
import { Camera, RotateCcw, Upload } from "lucide-react";

function fitPhoto(img: CanvasImageSource, width: number, height: number) {
  const maxW = 720;
  const scale = width > maxW ? maxW / width : 1;
  const canvas = document.createElement("canvas");
  canvas.width = Math.max(1, Math.round(width * scale));
  canvas.height = Math.max(1, Math.round(height * scale));
  const ctx = canvas.getContext("2d");
  if (!ctx) return "";
  ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
  return canvas.toDataURL("image/jpeg", 0.72);
}

export function ImageCapture({
  label,
  hint,
  value,
  onChange,
  facing = "user",
}: {
  label: string;
  hint: string;
  value: string;
  onChange: (dataUrl: string) => void;
  facing?: "user" | "environment";
}) {
  const fileId = useId();
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const [open, setOpen] = useState(false);
  const [error, setError] = useState("");
  const [devices, setDevices] = useState<MediaDeviceInfo[]>([]);
  const [deviceId, setDeviceId] = useState("");
  const [streamTick, setStreamTick] = useState(0);

  function stop() {
    streamRef.current?.getTracks().forEach((track) => track.stop());
    streamRef.current = null;
  }

  useEffect(() => {
    const video = videoRef.current;
    const stream = streamRef.current;
    if (!open || !video || !stream) return;
    video.srcObject = stream;
    video.play().catch(() => {});
  }, [open, deviceId, streamTick]);

  useEffect(() => () => stop(), []);

  async function start(nextId?: string) {
    setError("");
    stop();
    setOpen(true);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: false,
        video: nextId
          ? { deviceId: { exact: nextId } }
          : { facingMode: { ideal: facing }, width: { ideal: 1280 }, height: { ideal: 720 } },
      });
      streamRef.current = stream;
      const active = stream.getVideoTracks()[0]?.getSettings().deviceId || nextId || "";
      setDeviceId(active);
      setStreamTick((tick) => tick + 1);
      const all = await navigator.mediaDevices.enumerateDevices();
      setDevices(all.filter((item) => item.kind === "videoinput"));
    } catch {
      stop();
      setOpen(false);
      setError("Allow the camera, or upload a photo.");
    }
  }

  function capture() {
    const video = videoRef.current;
    if (!video || !video.videoWidth) return;
    const shot = fitPhoto(video, video.videoWidth, video.videoHeight);
    if (shot) onChange(shot);
    stop();
    setOpen(false);
  }

  function closeCamera() {
    stop();
    setOpen(false);
  }

  function onFile(file: File | undefined) {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      const img = new Image();
      img.onload = () => {
        const shot = fitPhoto(img, img.width, img.height);
        if (shot) onChange(shot);
      };
      img.src = String(reader.result || "");
    };
    reader.readAsDataURL(file);
  }

  return (
    <div className="rounded-xl border border-dashed border-slate-300 bg-slate-50 p-3">
      <p className="text-xs font-semibold uppercase tracking-widest text-slate-500">{label}</p>
      <p className="mt-1 text-[11px] leading-snug text-slate-400">{hint}</p>
      {value && !open ? (
        <img src={value} alt={label} className="mt-3 h-28 w-full rounded-lg bg-white object-contain" />
      ) : null}
      {open ? (
        <div className="mt-3 space-y-2">
          <video ref={videoRef} className="aspect-video w-full rounded-lg bg-slate-900 object-cover" muted playsInline />
          {devices.length > 1 ? (
            <select
              value={deviceId}
              onChange={(event) => start(event.target.value)}
              className="w-full rounded-lg border border-slate-200 bg-white px-2 py-1.5 text-xs text-slate-700"
            >
              {devices.map((item) => (
                <option key={item.deviceId} value={item.deviceId}>
                  {item.label || "Camera"}
                </option>
              ))}
            </select>
          ) : null}
          <div className="flex gap-2">
            <button
              type="button"
              onClick={capture}
              className="flex-1 rounded-lg bg-indigo-600 px-3 py-2 text-xs font-semibold text-white hover:bg-indigo-700"
            >
              Capture
            </button>
            <button
              type="button"
              onClick={closeCamera}
              className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs text-slate-500"
            >
              Cancel
            </button>
          </div>
        </div>
      ) : (
        <div className="mt-3 flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => start()}
            className="inline-flex items-center gap-1.5 rounded-lg bg-slate-900 px-3 py-2 text-xs font-medium text-white hover:bg-slate-800"
          >
            <Camera size={13} />
            {value ? "Retake" : "Open camera"}
          </button>
          <label
            htmlFor={fileId}
            className="inline-flex cursor-pointer items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-medium text-slate-600 hover:bg-slate-100"
          >
            <Upload size={13} />
            Upload
          </label>
          <input
            id={fileId}
            type="file"
            accept="image/*"
            capture={facing}
            className="sr-only"
            onChange={(event) => {
              onFile(event.target.files?.[0]);
              event.target.value = "";
            }}
          />
          {value ? (
            <button
              type="button"
              onClick={() => onChange("")}
              className="inline-flex items-center gap-1 rounded-lg px-2 py-2 text-xs text-slate-400 hover:text-red-500"
            >
              <RotateCcw size={12} />
              Clear
            </button>
          ) : null}
        </div>
      )}
      {error ? <p className="mt-2 text-xs text-red-600">{error}</p> : null}
    </div>
  );
}
