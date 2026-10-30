"use client";

import { useEffect, useState } from "react";

export function isElectron(): boolean {
  return typeof window !== "undefined" && typeof window.electronAPI !== "undefined";
}

declare global {
  interface Window {
    electronAPI?: {
      minimizeWindow: () => void;
      maximizeWindow: () => void;
      closeWindow: () => void;
      isMaximized: () => Promise<boolean>;
      getVersion: () => Promise<string>;
      onMaximizeChange: (cb: (maximized: boolean) => void) => void;
      removeAllListeners: (channel: string) => void;
      checkForUpdates: () => void;
      installUpdate: () => void;
      onUpdateAvailable:  (cb: (info: { version: string }) => void) => void;
      onUpdateProgress:   (cb: (data: { percent: number }) => void) => void;
      onUpdateDownloaded: (cb: (info: { version: string }) => void) => void;
      onUpdateError:      (cb: (data: { message: string }) => void) => void;
    };
  }
}

type UpdateState =
  | { stage: "idle" }
  | { stage: "available"; version: string }
  | { stage: "downloading"; percent: number; version: string }
  | { stage: "downloaded"; version: string }
  | { stage: "error"; message: string };

export function TitleBar({ title = "Universal POS" }: { title?: string }) {
  const [maximized, setMaximized]   = useState(false);
  const [version, setVersion]       = useState("");
  const [update, setUpdate]         = useState<UpdateState>({ stage: "idle" });
  const [toastDismissed, setToastDismissed] = useState(false);

  useEffect(() => {
    if (!isElectron()) return;
    const api = window.electronAPI!;

    api.isMaximized().then(setMaximized);
    api.getVersion().then(setVersion);
    api.onMaximizeChange(setMaximized);

    api.onUpdateAvailable((info) => {
      setUpdate({ stage: "available", version: info.version });
      setToastDismissed(false);
    });

    api.onUpdateProgress((data) => {
      setUpdate((prev) => ({
        stage: "downloading",
        percent: data.percent,
        version: prev.stage === "available" || prev.stage === "downloading"
          ? (prev as { version: string }).version
          : "",
      }));
    });

    api.onUpdateDownloaded((info) => {
      setUpdate({ stage: "downloaded", version: info.version });
      setToastDismissed(false);
    });

    api.onUpdateError((data) => {
      setUpdate({ stage: "error", message: data.message });
    });

    return () => {
      api.removeAllListeners("window:maximized");
      api.removeAllListeners("window:unmaximized");
      api.removeAllListeners("update:available");
      api.removeAllListeners("update:progress");
      api.removeAllListeners("update:downloaded");
      api.removeAllListeners("update:error");
    };
  }, []);

  if (!isElectron()) return null;

  const showToast = !toastDismissed && (
    update.stage === "available" ||
    update.stage === "downloading" ||
    update.stage === "downloaded"
  );

  return (
    <>
      {/* ── Titlebar ── */}
      <div
        className="flex h-8 shrink-0 select-none items-center bg-ink-950 border-b border-white/[0.06]"
        style={{ WebkitAppRegion: "drag" } as React.CSSProperties}
      >
        {/* Left — identity */}
        <div className="flex items-center gap-2 pl-3">
          <svg width="13" height="13" viewBox="0 0 14 14" fill="none" className="shrink-0">
            <rect x="1" y="1" width="5" height="5" rx="1.2" fill="#d4892a" />
            <rect x="8" y="1" width="5" height="5" rx="1.2" fill="#d4892a" opacity="0.55" />
            <rect x="1" y="8" width="5" height="5" rx="1.2" fill="#d4892a" opacity="0.55" />
            <rect x="8" y="8" width="5" height="5" rx="1.2" fill="#d4892a" opacity="0.25" />
          </svg>
          <span className="text-[11px] font-medium tracking-wide text-white/40">{title}</span>
          {version ? (
            <span className="font-mono text-[10px] tabular-nums text-white/20">v{version}</span>
          ) : null}
        </div>

        {/* Drag zone */}
        <div className="h-full flex-1" />

        {/* Download progress bar in titlebar */}
        {update.stage === "downloading" ? (
          <div
            className="mr-3 flex items-center gap-2"
            style={{ WebkitAppRegion: "no-drag" } as React.CSSProperties}
          >
            <div className="h-1 w-20 overflow-hidden rounded-full bg-white/10">
              <div
                className="h-full rounded-full bg-copper-400 transition-all duration-300"
                style={{ width: `${update.percent}%` }}
              />
            </div>
            <span className="text-[10px] tabular-nums text-white/30">
              {update.percent}%
            </span>
          </div>
        ) : null}

        {/* Update dot indicator */}
        {(update.stage === "available" || update.stage === "downloaded") ? (
          <div
            className="mr-3 flex items-center gap-1.5"
            style={{ WebkitAppRegion: "no-drag" } as React.CSSProperties}
          >
            <span
              className={`h-1.5 w-1.5 rounded-full ${
                update.stage === "downloaded" ? "bg-emerald-400" : "animate-pulse bg-copper-400"
              }`}
            />
            <span className="text-[10px] text-white/30">
              {update.stage === "downloaded" ? "Ready" : "Update"}
            </span>
          </div>
        ) : null}

        {/* Window controls */}
        <div
          className="flex h-full"
          style={{ WebkitAppRegion: "no-drag" } as React.CSSProperties}
        >
          <button
            onClick={() => window.electronAPI!.minimizeWindow()}
            className="flex h-full w-10 items-center justify-center text-white/25 transition-colors hover:bg-white/5 hover:text-white/60"
            aria-label="Minimize"
          >
            <svg width="10" height="1" viewBox="0 0 10 1" fill="currentColor">
              <rect width="10" height="1" />
            </svg>
          </button>
          <button
            onClick={() => window.electronAPI!.maximizeWindow()}
            className="flex h-full w-10 items-center justify-center text-white/25 transition-colors hover:bg-white/5 hover:text-white/60"
            aria-label={maximized ? "Restore" : "Maximize"}
          >
            {maximized ? (
              <svg width="10" height="10" viewBox="0 0 10 10" fill="none" stroke="currentColor" strokeWidth="1">
                <rect x="0" y="2" width="8" height="8" /><path d="M2 2V0h8v8h-2" />
              </svg>
            ) : (
              <svg width="10" height="10" viewBox="0 0 10 10" fill="none" stroke="currentColor" strokeWidth="1">
                <rect x="0.5" y="0.5" width="9" height="9" />
              </svg>
            )}
          </button>
          <button
            onClick={() => window.electronAPI!.closeWindow()}
            className="flex h-full w-10 items-center justify-center text-white/25 transition-colors hover:bg-red-600 hover:text-white"
            aria-label="Close"
          >
            <svg width="10" height="10" viewBox="0 0 10 10" fill="none" stroke="currentColor" strokeWidth="1.25">
              <path d="M1 1L9 9M9 1L1 9" />
            </svg>
          </button>
        </div>
      </div>

      {/* ── Update toast — bottom right ── */}
      {showToast ? (
        <div className="fixed bottom-5 right-5 z-[999] w-[300px] overflow-hidden rounded-xl border border-white/10 bg-ink-950 shadow-2xl">
          {/* Progress bar at top */}
          {update.stage === "downloading" ? (
            <div className="h-0.5 bg-white/10">
              <div
                className="h-full bg-copper-400 transition-all duration-300"
                style={{ width: `${update.percent}%` }}
              />
            </div>
          ) : null}

          <div className="flex items-start gap-3 p-4">
            {/* Status icon */}
            <div className="mt-0.5 shrink-0">
              {update.stage === "downloaded" ? (
                <div className="flex h-7 w-7 items-center justify-center rounded-full bg-emerald-500/15">
                  <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                    <path d="M2 6l3 3 5-5" stroke="#34d399" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </div>
              ) : (
                <div className="flex h-7 w-7 items-center justify-center rounded-full bg-copper-500/15">
                  <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                    <path d="M6 2v5M6 9v1" stroke="#d4892a" strokeWidth="1.5" strokeLinecap="round" />
                  </svg>
                </div>
              )}
            </div>

            <div className="min-w-0 flex-1">
              {update.stage === "available" && (
                <>
                  <p className="text-sm font-medium text-paper-50">
                    v{update.version} available
                  </p>
                  <p className="mt-0.5 text-xs text-paper-100/45">
                    Downloading in the background…
                  </p>
                </>
              )}
              {update.stage === "downloading" && (
                <>
                  <p className="text-sm font-medium text-paper-50">
                    Downloading v{update.version}
                  </p>
                  <p className="mt-0.5 text-xs text-paper-100/45">
                    {update.percent}% complete
                  </p>
                </>
              )}
              {update.stage === "downloaded" && (
                <>
                  <p className="text-sm font-medium text-paper-50">
                    v{update.version} ready
                  </p>
                  <p className="mt-0.5 text-xs text-paper-100/45">
                    Restart to apply the update.
                  </p>
                  <button
                    onClick={() => window.electronAPI!.installUpdate()}
                    className="mt-3 w-full rounded-lg bg-copper-500 py-1.5 text-xs font-medium text-ink-950 transition-colors hover:bg-copper-400"
                  >
                    Restart and install
                  </button>
                </>
              )}
            </div>

            {/* Dismiss */}
            {update.stage !== "downloaded" ? (
              <button
                onClick={() => setToastDismissed(true)}
                className="shrink-0 text-white/20 transition-colors hover:text-white/50"
                aria-label="Dismiss"
              >
                <svg width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.5">
                  <path d="M2 2l8 8M10 2l-8 8" />
                </svg>
              </button>
            ) : null}
          </div>
        </div>
      ) : null}
    </>
  );
}
