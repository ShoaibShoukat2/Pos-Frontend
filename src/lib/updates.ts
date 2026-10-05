export const APP_VERSION = process.env.NEXT_PUBLIC_APP_VERSION || "1.0.0";

export type AppRelease = {
  version: string;
  message: string;
  downloadUrl: string;
};

export function compareVersions(left: string, right: string) {
  const a = left.split(".").map((part) => parseInt(part, 10) || 0);
  const b = right.split(".").map((part) => parseInt(part, 10) || 0);
  const length = Math.max(a.length, b.length);
  for (let i = 0; i < length; i += 1) {
    const diff = (a[i] || 0) - (b[i] || 0);
    if (diff !== 0) return diff;
  }
  return 0;
}

export function isNewerVersion(remote: string, local: string) {
  return compareVersions(remote, local) > 0;
}
