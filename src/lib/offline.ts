import { api, NetworkError } from "./api";
import type { PosSalePayload, PosSnapshot } from "./types";

const DB_NAME = "upos-offline";
const DB_VERSION = 1;

function openDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VERSION);
    req.onupgradeneeded = () => {
      const db = req.result;
      if (!db.objectStoreNames.contains("meta")) db.createObjectStore("meta");
      if (!db.objectStoreNames.contains("pending")) db.createObjectStore("pending", { keyPath: "client_uuid" });
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

function req<T>(request: IDBRequest<T>): Promise<T> {
  return new Promise((resolve, reject) => {
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

export async function saveSnapshot(branchId: string, data: PosSnapshot) {
  const db = await openDb();
  const tx = db.transaction("meta", "readwrite");
  tx.objectStore("meta").put({ ...data, saved_at: new Date().toISOString() }, `snapshot:${branchId}`);
  await new Promise((resolve, reject) => {
    tx.oncomplete = () => resolve(null);
    tx.onerror = () => reject(tx.error);
  });
}

export async function loadSnapshot(branchId: string): Promise<PosSnapshot | null> {
  const db = await openDb();
  return req(db.transaction("meta").objectStore("meta").get(`snapshot:${branchId}`));
}

export async function queueSale(payload: PosSalePayload) {
  const db = await openDb();
  const tx = db.transaction("pending", "readwrite");
  tx.objectStore("pending").put({ ...payload, queued_at: new Date().toISOString(), status: "pending" });
  await new Promise((resolve, reject) => {
    tx.oncomplete = () => resolve(null);
    tx.onerror = () => reject(tx.error);
  });
}

export async function listPending(): Promise<PosSalePayload[]> {
  const db = await openDb();
  const rows = await req(db.transaction("pending").objectStore("pending").getAll());
  return (rows || []).filter((row: { status?: string }) => row.status !== "synced");
}

export async function removePending(clientUuid: string) {
  const db = await openDb();
  db.transaction("pending", "readwrite").objectStore("pending").delete(clientUuid);
}

export async function markSynced(clientUuid: string) {
  const db = await openDb();
  const store = db.transaction("pending", "readwrite").objectStore("pending");
  const row = await req(store.get(clientUuid));
  if (row) store.put({ ...row, status: "synced" });
}

export async function pendingCount() {
  return (await listPending()).length;
}

export async function syncPending() {
  const pending = await listPending();
  if (!pending.length) return { synced: 0, failed: 0 };
  try {
    const res = await api<{ results: { client_uuid: string; ok: boolean; error?: string }[] }>("/api/pos/sync/", {
      method: "POST",
      body: JSON.stringify({ sales: pending }),
    });
    let synced = 0;
    let failed = 0;
    for (const row of res.results) {
      if (row.ok) {
        await markSynced(row.client_uuid);
        synced += 1;
      } else failed += 1;
    }
    return { synced, failed };
  } catch (err) {
    if (err instanceof NetworkError) return { synced: 0, failed: 0 };
    throw err;
  }
}
