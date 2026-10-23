const dbName = 'HeartMemoriesDB';
const storeName = 'photos';

export interface LegacyPhoto {
  id: string;
  name: string;
  width: number;
  height: number;
  aspectRatio: number;
  thumbnail?: string;
  image?: Blob;
  dataUrl?: string;
  size: number;
  createdAt: number;
}

async function openLegacyDatabase(): Promise<IDBDatabase | null> {
  const factory = indexedDB as IDBFactory & { databases?: () => Promise<Array<{ name?: string }>> };
  const databases = await factory.databases?.();
  if (databases && !databases.some((database) => database.name === dbName)) return null;

  return new Promise((resolve, reject) => {
    const request = indexedDB.open(dbName, 1);
    let wasCreated = false;
    request.onupgradeneeded = (event) => {
      if ((event as IDBVersionChangeEvent).oldVersion === 0) {
        wasCreated = true;
        request.transaction?.abort();
      }
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => {
      if (wasCreated && request.error?.name === 'AbortError') resolve(null);
      else reject(request.error ?? new Error('读取旧相册失败'));
    };
  });
}

class LegacyDatabaseService {
  async getAllPhotos(): Promise<LegacyPhoto[]> {
    const db = await openLegacyDatabase();
    if (!db) return [];
    if (!db.objectStoreNames.contains(storeName)) {
      db.close();
      return [];
    }

    return new Promise((resolve, reject) => {
      const transaction = db.transaction(storeName, 'readonly');
      const request = transaction.objectStore(storeName).getAll();
      transaction.oncomplete = () => { db.close(); resolve(request.result as LegacyPhoto[]); };
      transaction.onerror = () => { db.close(); reject(transaction.error ?? new Error('读取旧相册失败')); };
      transaction.onabort = () => { db.close(); reject(transaction.error ?? new Error('读取旧相册失败')); };
    });
  }

  async count(): Promise<number> {
    const db = await openLegacyDatabase();
    if (!db) return 0;
    if (!db.objectStoreNames.contains(storeName)) {
      db.close();
      return 0;
    }

    return new Promise((resolve, reject) => {
      const transaction = db.transaction(storeName, 'readonly');
      const request = transaction.objectStore(storeName).count();
      transaction.oncomplete = () => { db.close(); resolve(request.result); };
      transaction.onerror = () => { db.close(); reject(transaction.error ?? new Error('读取旧相册失败')); };
      transaction.onabort = () => { db.close(); reject(transaction.error ?? new Error('读取旧相册失败')); };
    });
  }

  async clearAll(): Promise<void> {
    const db = await openLegacyDatabase();
    if (!db || !db.objectStoreNames.contains(storeName)) {
      db?.close();
      return;
    }

    return new Promise((resolve, reject) => {
      const transaction = db.transaction(storeName, 'readwrite');
      transaction.objectStore(storeName).clear();
      transaction.oncomplete = () => { db.close(); resolve(); };
      transaction.onerror = () => { db.close(); reject(transaction.error ?? new Error('清理旧相册失败')); };
      transaction.onabort = () => { db.close(); reject(transaction.error ?? new Error('清理旧相册失败')); };
    });
  }
}

export const legacyDbService = new LegacyDatabaseService();
