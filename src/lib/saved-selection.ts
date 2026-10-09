import type { DrawnPolygon, FeatureId } from '@/lib/map/draw-features';

/**
 * The selection on disk, so a reload does not lose it: the areas on the map, the one
 * picked for analysis and the parcels the user flipped. One IndexedDB record under one
 * key — IndexedDB rather than localStorage because an uploaded shapefile is megabytes of
 * coordinates, over localStorage's string cap, and because the write is off the main
 * thread. Every function here degrades to a no-op where storage is missing or refuses
 * (private windows, blocked site data, quota): the app then behaves as if nothing had
 * been saved.
 */
export type SavedSelection = {
  polygons: DrawnPolygon[];
  analysisId: FeatureId | null;
  toggledParcelIds: string[];
};

const DB_NAME = 'parcels';
const STORE_NAME = 'selection';
const RECORD_KEY = 'current';
const DB_VERSION = 1;

function available(): boolean {
  return typeof indexedDB !== 'undefined';
}

function openDatabase(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = () => {
      request.result.createObjectStore(STORE_NAME);
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
    request.onblocked = () => reject(new Error('IndexedDB open blocked'));
  });
}

/** One transaction, one request; the result is handed over once the transaction commits. */
async function transact<T>(
  mode: IDBTransactionMode,
  operation: (store: IDBObjectStore) => IDBRequest<T>,
): Promise<T> {
  const database = await openDatabase();

  return new Promise<T>((resolve, reject) => {
    const transaction = database.transaction(STORE_NAME, mode);
    const request = operation(transaction.objectStore(STORE_NAME));

    transaction.oncomplete = () => {
      database.close();
      resolve(request.result);
    };
    transaction.onerror = () => {
      database.close();
      reject(transaction.error);
    };
    transaction.onabort = transaction.onerror;
  });
}

function isFeatureId(value: unknown): value is FeatureId {
  return typeof value === 'string' || typeof value === 'number';
}

function isPolygon(value: unknown): value is DrawnPolygon {
  if (typeof value !== 'object' || value === null) return false;

  const feature = value as { id?: unknown; type?: unknown; geometry?: { type?: unknown } };

  return (
    isFeatureId(feature.id) && feature.type === 'Feature' && feature.geometry?.type === 'Polygon'
  );
}

/** A record written by an older build, or tampered with, is treated as nothing saved. */
export function isSavedSelection(value: unknown): value is SavedSelection {
  if (typeof value !== 'object' || value === null) return false;

  const record = value as Partial<SavedSelection>;

  return (
    Array.isArray(record.polygons) &&
    record.polygons.every(isPolygon) &&
    (record.analysisId === null || isFeatureId(record.analysisId)) &&
    Array.isArray(record.toggledParcelIds) &&
    record.toggledParcelIds.every((id) => typeof id === 'string')
  );
}

/** The saved selection, or `null` when there is none or storage is unusable. */
export async function readSavedSelection(): Promise<SavedSelection | null> {
  if (!available()) return null;

  try {
    const record: unknown = await transact('readonly', (store) => store.get(RECORD_KEY));

    return isSavedSelection(record) ? record : null;
  } catch {
    return null;
  }
}

/** Saves the selection; an empty one removes the record instead. Failures are swallowed. */
export async function writeSavedSelection(selection: SavedSelection): Promise<void> {
  if (!available()) return;

  try {
    if (selection.polygons.length === 0) {
      await transact('readwrite', (store) => store.delete(RECORD_KEY));
    } else {
      await transact('readwrite', (store) => store.put(selection, RECORD_KEY));
    }
  } catch {
    // Nothing to do: the next write retries, and a reload simply restores nothing.
  }
}
