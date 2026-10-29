"use client";

import { useEffect, useState } from "react";
import { X } from "lucide-react";

import { APP_VERSION, isNewerVersion, type AppRelease } from "@/lib/updates";

const API_URL = (process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000").replace(/\/$/, "");

export function UpdateNotice() {
  const [release, setRelease] = useState<AppRelease | null>(null);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    let stop = false;

    const check = () => {
      fetch(`${API_URL}/api/app-update/`)
        .then((r) => (r.ok ? r.json() : null))
        .then((data: AppRelease | null) => {
          if (stop) return;
          if (!data?.version || !isNewerVersion(String(data.version), APP_VERSION)) {
            setRelease(null);
            return;
          }
          setRelease({
            version: String(data.version),
            message: data.message || "",
            downloadUrl: data.downloadUrl || "",
          });
          setDismissed(false);
        })
        .catch(() => {
          if (!stop) setRelease(null);
        });
    };

    check();
    const timer = window.setInterval(check, 10 * 60 * 1000);
    return () => { stop = true; window.clearInterval(timer); };
  }, []);

  if (!release || dismissed) return null;

  return (
    <div className="fixed bottom-5 right-5 z-[80] flex w-[320px] items-start gap-3 rounded-xl border border-copper-500/25 bg-ink-950 p-4 shadow-2xl">
      {/* Accent dot */}
      <div className="mt-1 h-2 w-2 shrink-0 rounded-full bg-copper-400" />

      <div className="min-w-0 flex-1">
        <p className="text-sm font-medium text-paper-50">
          Version {release.version} available
        </p>
        {release.message ? (
          <p className="mt-0.5 text-xs leading-relaxed text-paper-100/50">{release.message}</p>
        ) : null}
        {release.downloadUrl ? (
          <a
            href={release.downloadUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-3 inline-flex items-center rounded-lg bg-copper-500 px-3 py-1.5 text-xs font-medium text-ink-950 hover:bg-copper-400 transition-colors"
          >
            Download update
          </a>
        ) : null}
      </div>

      <button
        type="button"
        onClick={() => setDismissed(true)}
        className="shrink-0 text-white/20 hover:text-white/60 transition-colors"
        aria-label="Dismiss"
      >
        <X size={14} />
      </button>
    </div>
  );
}
