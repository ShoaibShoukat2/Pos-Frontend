"use client";

import { useCallback, useEffect, useState } from "react";
import { useParams } from "next/navigation";

import { CameraScan } from "@/components/CameraScan";
import { ApiError, publicApi } from "@/lib/api";

export default function PhoneScannerPage() {
  const params = useParams<{ token: string }>();
  const token = params.token;
  const [info, setInfo] = useState<{ business: string; branch: string } | null>(null);
  const [error, setError] = useState("");
  const [last, setLast] = useState("");

  useEffect(() => {
    publicApi<{ business: string; branch: string }>(`/api/scanner/sessions/${token}/`)
      .then(setInfo)
      .catch((err) => {
        const body = err instanceof ApiError ? (err.body as { detail?: string }) : null;
        setError(body?.detail || "This QR is not valid. Open a new connect code on the POS.");
      });
  }, [token]);

  const onCode = useCallback(
    async (code: string) => {
      try {
        await publicApi(`/api/scanner/sessions/${token}/push/`, {
          method: "POST",
          body: JSON.stringify({ code }),
        });
        setLast(code);
        setError("");
        if (navigator.vibrate) navigator.vibrate(40);
      } catch (err) {
        const body = err instanceof ApiError ? (err.body as { detail?: string }) : null;
        setError(body?.detail || "Could not send scan to the counter.");
      }
    },
    [token],
  );

  return (
    <div className="mx-auto min-h-screen max-w-md bg-paper-50 px-4 py-6">
      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-copper-600">Universal POS</p>
      <h1 className="mt-1 font-display text-2xl sm:text-3xl">Phone scanner</h1>
      {info ? (
        <p className="mt-1 text-sm text-ink-700/70">
          Connected to {info.business} · {info.branch}
        </p>
      ) : null}
      <div className="mt-5 card p-4">
        {error && !info ? <p className="text-sm text-red-700">{error}</p> : <CameraScan onCode={onCode} onClose={() => window.close()} />}
        {last ? <p className="mt-3 text-sm text-emerald-800">Sent {last}</p> : null}
        {error && info ? <p className="mt-3 text-sm text-red-700">{error}</p> : null}
      </div>
    </div>
  );
}
