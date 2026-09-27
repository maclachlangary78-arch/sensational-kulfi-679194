import { Capacitor } from '@capacitor/core';
import { newId } from './id';

// Web builds call the API on the same origin. Native (App Store / Google Play) builds
// are served from capacitor://localhost, so they must call the deployed site directly.
export const API_BASE = Capacitor.isNativePlatform()
  ? (import.meta.env.VITE_API_BASE_URL || 'https://sensational-kulfi-679194.netlify.app')
  : '';

const DEVICE_KEY = 'lurerater.deviceId';
const CACHE_KEY = 'lurerater.cache';
const PENDING_KEY = 'lurerater.pendingStrikes';

export function getDeviceId() {
  let id = localStorage.getItem(DEVICE_KEY);
  if (!id) {
    id = newId();
    localStorage.setItem(DEVICE_KEY, id);
  }
  return id;
}

const readJSON = (key, fallback) => {
  try {
    return JSON.parse(localStorage.getItem(key)) ?? fallback;
  } catch {
    return fallback;
  }
};
const writeJSON = (key, value) => localStorage.setItem(key, JSON.stringify(value));

async function request(path, options = {}) {
  const res = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers: { 'X-Device-Id': getDeviceId(), ...(options.headers || {}) },
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    const err = new Error(body.error || `Request failed (${res.status})`);
    err.status = res.status;
    throw err;
  }
  return res.json();
}

const isNetworkError = (err) => !err.status;

export const photoUrl = (key) => (key ? `${API_BASE}/api/photos/${encodeURIComponent(key)}` : null);

export async function uploadPhoto(blob) {
  const { key } = await request('/api/photos', {
    method: 'POST',
    headers: { 'Content-Type': 'image/jpeg' },
    body: blob,
  });
  return key;
}

// Loads lures, strikes and saved spreads, falling back to the last cached copy when offshore without signal.
export async function loadData() {
  try {
    const [lures, strikes, spreads] = await Promise.all([
      request('/api/lures'),
      request('/api/strikes'),
      request('/api/spreads'),
    ]);
    writeJSON(CACHE_KEY, { lures, strikes, spreads });
    return { lures, strikes, spreads, offline: false };
  } catch (err) {
    if (!isNetworkError(err)) throw err;
    const cached = readJSON(CACHE_KEY, {});
    return { lures: cached.lures || [], strikes: cached.strikes || [], spreads: cached.spreads || [], offline: true };
  }
}

// Keeps the offline copy in step when a lure or spread is added between full reloads.
export function updateCache(patch) {
  try {
    writeJSON(CACHE_KEY, { ...readJSON(CACHE_KEY, {}), ...patch });
  } catch {
    // Storage full — the next online load rewrites the cache anyway.
  }
}

export const getPendingStrikes = () => readJSON(PENDING_KEY, []);

// Tries to save the strike immediately; if there's no connection it is queued on the device
// and uploaded by flushPendingStrikes() once signal returns.
export async function logStrike(strike, photoBlob, photoDataUrl) {
  try {
    const photoKey = photoBlob ? await uploadPhoto(photoBlob) : null;
    const saved = await request('/api/strikes', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...strike, photoKey }),
    });
    return { strike: saved, queued: false };
  } catch (err) {
    if (!isNetworkError(err)) throw err;
    const pending = { ...strike, id: `pending-${Date.now()}`, pending: true, photoDataUrl: photoDataUrl || null };
    try {
      writeJSON(PENDING_KEY, [pending, ...getPendingStrikes()]);
    } catch {
      // Phone storage is full of queued photos — keep the strike, drop its photo.
      pending.photoDataUrl = null;
      writeJSON(PENDING_KEY, [pending, ...getPendingStrikes()]);
    }
    return { strike: pending, queued: true };
  }
}

export async function flushPendingStrikes() {
  const pending = getPendingStrikes();
  if (pending.length === 0) return 0;
  const remaining = [];
  let sent = 0;
  for (const item of pending.slice().reverse()) {
    try {
      const { id, pending: _p, photoDataUrl, ...strike } = item;
      const photoKey = photoDataUrl ? await uploadPhoto(await (await fetch(photoDataUrl)).blob()) : null;
      await request('/api/strikes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...strike, photoKey }),
      });
      sent++;
    } catch (err) {
      // Keep network failures for the next attempt; drop records the server rejects outright.
      if (isNetworkError(err)) remaining.unshift(item);
    }
  }
  writeJSON(PENDING_KEY, remaining);
  return sent;
}

export const deleteStrike = (id) => request(`/api/strikes?id=${id}`, { method: 'DELETE' });

export const addLure = (lure) =>
  request('/api/lures', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(lure),
  });

export const deleteLure = (id) => request(`/api/lures?id=${id}`, { method: 'DELETE' });

export const saveSpread = (name, slots) =>
  request('/api/spreads', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name, slots }),
  });

export const deleteSpread = (id) => request(`/api/spreads?id=${id}`, { method: 'DELETE' });

export { isNetworkError };
