"use client";

// Uploaded dashboard files (PDF / image / exported HTML) live in IndexedDB:
// localStorage tops out around 5 MB and only holds strings, which is too small
// for a dashboard export. The SavedDashboard row itself stays in localStorage
// (lib/store.ts); this module only holds the file body, keyed by dashboard id.
// Like the rest of the mock data layer, it lives in this browser only.

const DB_NAME = "ocean_dss_files";
const STORE = "dashboard_files";

export const MAX_DASHBOARD_FILE_BYTES = 50 * 1024 * 1024;

export type DashboardFileKind = "pdf" | "image" | "html";

const EXTENSIONS: Record<string, DashboardFileKind> = {
  pdf: "pdf",
  png: "image", jpg: "image", jpeg: "image", gif: "image", webp: "image", svg: "image",
  html: "html", htm: "html",
};

export const DASHBOARD_FILE_ACCEPT = Object.keys(EXTENSIONS).map((e) => "." + e).join(",");

export function dashboardFileKind(fileName: string): DashboardFileKind | null {
  const ext = fileName.split(".").pop()?.toLowerCase() ?? "";
  return EXTENSIONS[ext] ?? null;
}

export function formatBytes(n: number): string {
  if (n < 1024) return `${n} B`;
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(0)} KB`;
  return `${(n / 1024 / 1024).toFixed(1)} MB`;
}

function openDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, 1);
    req.onupgradeneeded = () => req.result.createObjectStore(STORE);
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

async function run<T>(mode: IDBTransactionMode, fn: (s: IDBObjectStore) => IDBRequest<T>): Promise<T> {
  const db = await openDb();
  try {
    return await new Promise<T>((resolve, reject) => {
      const tx = db.transaction(STORE, mode);
      const req = fn(tx.objectStore(STORE));
      tx.oncomplete = () => resolve(req.result);
      tx.onerror = () => reject(tx.error);
      tx.onabort = () => reject(tx.error);
    });
  } finally {
    db.close();
  }
}

export function putDashboardFile(id: string, file: Blob) {
  return run("readwrite", (s) => s.put(file, id));
}

export async function getDashboardFile(id: string): Promise<Blob | undefined> {
  return (await run<Blob | undefined>("readonly", (s) => s.get(id))) ?? undefined;
}

export function deleteDashboardFile(id: string) {
  return run("readwrite", (s) => s.delete(id));
}

export function clearDashboardFiles() {
  return run("readwrite", (s) => s.clear());
}
