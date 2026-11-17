"use client";

import { useEffect, useId, useRef, useState } from "react";
import { RotateCcw, Upload } from "lucide-react";

interface Props {
  label: string;
  onSave: (dataUrl: string) => void;
  savedUrl?: string | null;
}

export function SignaturePad({ label, onSave, savedUrl }: Props) {
  const fileId = useId();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [drawing, setDrawing] = useState(false);
  const [isEmpty, setIsEmpty] = useState(!savedUrl);
  const lastPos = useRef<{ x: number; y: number } | null>(null);

  function paintBlank() {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (!canvas || !ctx) return;
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.strokeStyle = "#0f172a";
    ctx.lineWidth = 2.4;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
  }

  useEffect(() => {
    paintBlank();
    if (!savedUrl) return;
    const image = new Image();
    image.onload = () => {
      const canvas = canvasRef.current;
      const ctx = canvas?.getContext("2d");
      if (!canvas || !ctx) return;
      paintBlank();
      const scale = Math.min(canvas.width / image.width, canvas.height / image.height);
      const width = image.width * scale;
      const height = image.height * scale;
      ctx.drawImage(image, (canvas.width - width) / 2, (canvas.height - height) / 2, width, height);
      setIsEmpty(false);
    };
    image.src = savedUrl;
  }, [savedUrl]);

  function getPos(event: React.MouseEvent | React.TouchEvent) {
    const canvas = canvasRef.current!;
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    if ("touches" in event) {
      return {
        x: (event.touches[0].clientX - rect.left) * scaleX,
        y: (event.touches[0].clientY - rect.top) * scaleY,
      };
    }
    return {
      x: (event.clientX - rect.left) * scaleX,
      y: (event.clientY - rect.top) * scaleY,
    };
  }

  function startDraw(event: React.MouseEvent | React.TouchEvent) {
    event.preventDefault();
    setDrawing(true);
    setIsEmpty(false);
    lastPos.current = getPos(event);
  }

  function draw(event: React.MouseEvent | React.TouchEvent) {
    event.preventDefault();
    if (!drawing) return;
    const canvas = canvasRef.current!;
    const ctx = canvas.getContext("2d")!;
    const pos = getPos(event);
    if (lastPos.current) {
      ctx.beginPath();
      ctx.moveTo(lastPos.current.x, lastPos.current.y);
      ctx.lineTo(pos.x, pos.y);
      ctx.stroke();
    }
    lastPos.current = pos;
  }

  function endDraw(event: React.MouseEvent | React.TouchEvent) {
    event.preventDefault();
    if (!drawing) return;
    setDrawing(false);
    lastPos.current = null;
    onSave(canvasRef.current!.toDataURL("image/png"));
  }

  function clear() {
    paintBlank();
    setIsEmpty(true);
    onSave("");
  }

  function upload(file: File) {
    const reader = new FileReader();
    reader.onload = () => {
      const image = new Image();
      image.onload = () => {
        const canvas = canvasRef.current;
        const ctx = canvas?.getContext("2d");
        if (!canvas || !ctx) return;
        paintBlank();
        const scale = Math.min(canvas.width / image.width, canvas.height / image.height);
        const width = image.width * scale;
        const height = image.height * scale;
        ctx.drawImage(image, (canvas.width - width) / 2, (canvas.height - height) / 2, width, height);
        setIsEmpty(false);
        onSave(canvas.toDataURL("image/png"));
      };
      image.src = String(reader.result || "");
    };
    reader.readAsDataURL(file);
  }

  return (
    <div>
      <div className="mb-1.5 flex items-center justify-between gap-2">
        <p className="text-xs font-semibold uppercase tracking-widest text-slate-500">{label}</p>
        <div className="flex items-center gap-3">
          <label htmlFor={fileId} className="flex cursor-pointer items-center gap-1 text-xs font-medium text-slate-500 hover:text-slate-800">
            <Upload size={12} />
            Upload photo
          </label>
          <input id={fileId} type="file" accept="image/*" className="sr-only" onChange={(event) => {
            const file = event.target.files?.[0];
            event.target.value = "";
            if (file) upload(file);
          }} />
          {!isEmpty ? (
            <button type="button" onClick={clear} className="flex items-center gap-1 text-xs text-slate-400 hover:text-red-500">
              <RotateCcw size={11} />
              Clear
            </button>
          ) : null}
        </div>
      </div>
      <div className="relative overflow-hidden rounded-xl border-2 border-dashed border-slate-300 bg-white">
        {isEmpty ? (
          <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
            <p className="select-none text-sm text-slate-300">Sign here with finger or mouse</p>
          </div>
        ) : null}
        <canvas
          ref={canvasRef}
          width={640}
          height={180}
          className="h-36 w-full cursor-crosshair touch-none"
          onMouseDown={startDraw}
          onMouseMove={draw}
          onMouseUp={endDraw}
          onMouseLeave={endDraw}
          onTouchStart={startDraw}
          onTouchMove={draw}
          onTouchEnd={endDraw}
        />
      </div>
      <p className="mt-1 text-[11px] text-slate-400">Draw on the screen, or upload a picture of the signed paper.</p>
      {!isEmpty ? <p className="mt-1 text-[10px] text-royal-700">Signature captured</p> : null}
    </div>
  );
}
