"use client";

import { useEffect, useState } from "react";

import { APP_VERSION, isNewerVersion, type AppRelease } from "@/lib/updates";

const API_URL = (process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000").replace(/\/$/, "");

export function UpdateNotice() {
  const [release, setRelease] = useState<AppRelease | null>(null);

  useEffect(() => {
    let stop = false;

    const check = () => {
      fetch(`${API_URL}/api/app-update/`)
        .then((response) => (response.ok ? response.json() : null))
        .then((data: AppRelease | null) => {
          if (stop) return;
          if (!data?.version || !isNewerVersion(String(data.version), APP_VERSION)) {
            setRelease(null);
            return;
          }
          setRelease({
            version: String(data.version),
            message: data.message || "A new version of Universal POS is available. Please update.",
            downloadUrl: data.downloadUrl || "",
          });
        })
        .catch(() => {
          if (!stop) setRelease(null);
        });
    };

    check();
    const timer = window.setInterval(check, 10 * 60 * 1000);
    return () => {
      stop = true;
      window.clearInterval(timer);
    };
  }, []);

  if (!release) return null;

  return (
    <div className="fixed inset-x-0 top-0 z-[80] border-b border-copper-500/40 bg-ink-950 px-4 py-3 text-paper-50 shadow-lg">
      <div className="mx-auto flex max-w-5xl flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-sm">
          <span className="font-medium">Update {release.version} is available.</span>{" "}
          <span className="text-paper-100/80">{release.message}</span>
        </p>
        {release.downloadUrl ? (
          <a
            href={release.downloadUrl}
            className="inline-flex shrink-0 items-center justify-center rounded-lg bg-copper-500 px-3 py-2 text-sm font-medium text-ink-950"
          >
            Update now
          </a>
        ) : null}
      </div>
    </div>
  );
}
