/* Exercise demo videos.
   Web: blobs in IndexedDB (localStorage is far too small for video).
   Native: the picker's file URI is kept in AsyncStorage. */
import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

const NATIVE_KEY = 'forge.videos.v1';
const DB_NAME = 'forge-videos';
const STORE = 'videos';

function openDb() {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, 1);
    req.onupgradeneeded = () => req.result.createObjectStore(STORE);
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

function idbRequest(mode, fn) {
  return openDb().then(
    (db) =>
      new Promise((resolve, reject) => {
        const tx = db.transaction(STORE, mode);
        const req = fn(tx.objectStore(STORE));
        tx.oncomplete = () => { db.close(); resolve(req.result); };
        tx.onerror = () => { db.close(); reject(tx.error); };
      })
  );
}

async function nativeMap() {
  const raw = await AsyncStorage.getItem(NATIVE_KEY);
  return raw ? JSON.parse(raw) : {};
}

/** Persist the picked video for an exercise id. */
export async function saveVideo(id, pickedUri) {
  if (Platform.OS === 'web') {
    const blob = await (await fetch(pickedUri)).blob();
    await idbRequest('readwrite', (store) => store.put(blob, id));
  } else {
    const map = await nativeMap();
    map[id] = pickedUri;
    await AsyncStorage.setItem(NATIVE_KEY, JSON.stringify(map));
  }
}

/** Playable URI for an exercise's video, or null. Web URIs are object URLs — one per call. */
export async function getVideoUri(id) {
  if (Platform.OS === 'web') {
    const blob = await idbRequest('readonly', (store) => store.get(id));
    return blob ? URL.createObjectURL(blob) : null;
  }
  return (await nativeMap())[id] || null;
}

export async function deleteVideo(id) {
  if (Platform.OS === 'web') {
    await idbRequest('readwrite', (store) => store.delete(id));
  } else {
    const map = await nativeMap();
    delete map[id];
    await AsyncStorage.setItem(NATIVE_KEY, JSON.stringify(map));
  }
}
