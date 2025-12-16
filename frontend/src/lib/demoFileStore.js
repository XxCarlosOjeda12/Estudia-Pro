const DB_NAME = 'estudia-pro-demo-files';
const STORE_NAME = 'files';
const DB_VERSION = 1;

const isIndexedDbAvailable = () => typeof indexedDB !== 'undefined';

const requestToPromise = (request) =>
  new Promise((resolve, reject) => {
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });

const openDb = async () => {
  const request = indexedDB.open(DB_NAME, DB_VERSION);
  request.onupgradeneeded = () => {
    const db = request.result;
    if (!db.objectStoreNames.contains(STORE_NAME)) {
      db.createObjectStore(STORE_NAME, { keyPath: 'id' });
    }
  };
  return requestToPromise(request);
};

const transactionDone = (tx) =>
  new Promise((resolve, reject) => {
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
    tx.onabort = () => reject(tx.error);
  });

const generateId = () => {
  try {
    return crypto.randomUUID();
  } catch {
    return `file-${Date.now()}-${Math.random().toString(16).slice(2)}`;
  }
};

export const putDemoFile = async (fileOrBlob) => {
  if (!isIndexedDbAvailable()) {
    throw new Error('IndexedDB no está disponible en este navegador.');
  }
  const db = await openDb();
  const tx = db.transaction(STORE_NAME, 'readwrite');
  const store = tx.objectStore(STORE_NAME);

  const id = generateId();
  const name = fileOrBlob?.name || 'archivo';
  const type = fileOrBlob?.type || 'application/octet-stream';

  await requestToPromise(
    store.put({
      id,
      blob: fileOrBlob,
      name,
      type,
      createdAt: Date.now()
    })
  );
  await transactionDone(tx);
  db.close();
  return id;
};

export const getDemoFile = async (id) => {
  if (!isIndexedDbAvailable()) return null;
  const db = await openDb();
  const tx = db.transaction(STORE_NAME, 'readonly');
  const store = tx.objectStore(STORE_NAME);
  const result = await requestToPromise(store.get(id));
  await transactionDone(tx);
  db.close();
  return result || null;
};

export const deleteDemoFile = async (id) => {
  if (!isIndexedDbAvailable()) return;
  const db = await openDb();
  const tx = db.transaction(STORE_NAME, 'readwrite');
  const store = tx.objectStore(STORE_NAME);
  await requestToPromise(store.delete(id));
  await transactionDone(tx);
  db.close();
};

