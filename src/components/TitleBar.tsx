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
      onUpdateAvailable: (cb: (info: unknown) => void) => void;
      onUpdateDownloaded: (cb: (info: unknown) => void) => void;
      installUpdate: () => void;
    };
  }
}

export function TitleBar({ title = "Universal POS" }: { title?: string }) {
  const [maximized, setMaximized] = useState(false);
  const [version, setVersion] = useState("");
  const [updateDownloaded, setUpdateDownloaded] = useState(false);
  const [updateAvailable, setUpdateAvailable] = useState(false);

  useEffect(() => {
    if (!isElectron()) return;

    window.electronAPI!.isMaximized().then(setMaximized);
    window.electronAPI!.getVersion().then(setVersion);
    window.electronAPI!.onMaximizeChange(setMaximized);
    window.electronAPI!.onUpdateAvailable(() => setUpdateAvailable(true));
    window.electronAPI!.onUpdateDownloaded(() => {
      setUpdateAvailable(false);
      setUpdateDownloaded(true);
    });

    return () => {
      window.electronAPI!.removeAllListeners("window:maximized");
      window.electronAPI!.removeAllListeners("window:unmaximized");
      window.electronAPI!.removeAllListeners("update:available");
      window.electronAPI!.removeAllListeners("update:downloaded");
    };
  }, []);

  if (!isElectron()) return null;

  return (
    <>
      {/* Window chrome bar */}
      <div
        className="flex items-center h-8 bg-ink-950 border-b border-white/[0.06] select-none shrink-0"
        style={{ WebkitAppRegion: "drag" } as React.CSSProperties}
      >
        {/* Left — identity */}
        <div className="flex items-center gap-2 pl-3">
          {/* POS grid icon */}
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none" className="shrink-0">
            <rect x="1" y="1" width="5" height="5" rx="1.2" fill="#d4892a" />
            <rect x="8" y="1" width="5" height="5" rx="1.2" fill="#d4892a" opacity="0.55" />
            <rect x="1" y="8" width="5" height="5" rx="1.2" fill="#d4892a" opacity="0.55" />
            <rect x="8" y="8" width="5" height="5" rx="1.2" fill="#d4892a" opacity="0.25" />
          </svg>
          <span className="text-[11px] font-medium text-white/50 tracking-wide">{title}</span>
          {version ? (
            <span className="text-[10px] text-white/20 font-mono tabular-nums">v{version}</span>
          ) : null}
        </div>

        {/* Drag zone */}
        <div className="flex-1 h-full" />

        {/* Update available pill */}
        {updateAvailable && !updateDownloaded ? (
          <div
            className="mr-2 flex items-center gap-1 rounded px-2 py-0.5 text-[10px] text-white/40"
            style={{ WebkitAppRegion: "no-drag" } as React.CSSProperties}
          >
            <span className="h-1.5 w-1.5 rounded-full bg-copper-400 animate-pulse" />
            Downloading update…
          </div>
        ) : null}

        {/* Window controls */}
        <div
          className="flex h-full"
          style={{ WebkitAppRegion: "no-drag" } as React.CSSProperties}
        >
          <button
            onClick={() => window.electronAPI!.minimizeWindow()}
            className="w-10 h-full flex items-center justify-center text-white/30 hover:text-white/70 hover:bg-white/5 transition-colors"
            aria-label="Minimize"
          >
            <svg width="10" height="1" viewBox="0 0 10 1" fill="currentColor">
              <rect width="10" height="1" />
            </svg>
          </button>
          <button
            onClick={() => window.electronAPI!.maximizeWindow()}
            className="w-10 h-full flex items-center justify-center text-white/30 hover:text-white/70 hover:bg-white/5 transition-colors"
            aria-label={maximized ? "Restore" : "Maximize"}
          >
            {maximized ? (
              <svg width="10" height="10" viewBox="0 0 10 10" fill="none" stroke="currentColor" strokeWidth="1">
                <rect x="0" y="2" width="8" height="8" />
                <path d="M2 2V0h8v8h-2" />
              </svg>
            ) : (
              <svg width="10" height="10" viewBox="0 0 10 10" fill="none" stroke="currentColor" strokeWidth="1">
                <rect x="0.5" y="0.5" width="9" height="9" />
              </svg>
            )}
          </button>
          <button
            onClick={() => window.electronAPI!.closeWindow()}
            className="w-10 h-full flex items-center justify-center text-white/30 hover:text-white hover:bg-red-600 transition-colors"
            aria-label="Close"
          >
            <svg width="10" height="10" viewBox="0 0 10 10" fill="none" stroke="currentColor" strokeWidth="1.25">
              <path d="M1 1L9 9M9 1L1 9" />
            </svg>
          </button>
        </div>
      </div>

      {/* Update toast — bottom right, outside the titlebar */}
      {updateDownloaded ? (
        <div
          className="fixed bottom-5 right-5 z-[999] flex items-start gap-3 rounded-xl border border-white/10 bg-ink-900 p-4 shadow-2xl"
          style={{ maxWidth: 320 }}
        >
          <div className="mt-0.5 h-2 w-2 shrink-0 rounded-full bg-copper-400" />
          <div className="min-w-0 flex-1">
            <p className="text-sm font-medium text-paper-50">Update ready to install</p>
            <p className="mt-0.5 text-xs text-paper-100/55">
              Restart the app to apply the latest version.
            </p>
          </div>
          <button
            onClick={() => window.electronAPI!.installUpdate()}
            className="shrink-0 rounded-lg bg-copper-500 px-3 py-1.5 text-xs font-medium text-ink-950 hover:bg-copper-400 transition-colors"
          >
            Restart
          </button>
        </div>
      ) : null}
    </>
  );
}
