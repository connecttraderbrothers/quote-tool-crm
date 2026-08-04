import PocketBase from 'pocketbase';

// In dev, VITE_PB_URL is blank and Vite proxies /api to the local PocketBase,
// so the browser sees a same-origin URL and there is no CORS to configure.
// In production this is the PocketBase domain, e.g. https://api.yourdomain.co.uk
const baseUrl = import.meta.env.VITE_PB_URL || window.location.origin;

export const pb = new PocketBase(baseUrl);

// The SDK auto-refreshes tokens; disable auto-cancellation so parallel loads
// on one screen don't abort each other.
pb.autoCancellation(false);

export function fileUrl(record, filename, query) {
  if (!record || !filename) return '';
  return pb.files.getUrl(record, filename, query);
}

/** Turn a PocketBase ClientResponseError into something worth showing a user. */
export function errorMessage(err, fallback = 'Something went wrong.') {
  if (!err) return fallback;
  const data = err?.response?.data || err?.data;
  if (data && typeof data === 'object') {
    const first = Object.entries(data)[0];
    if (first) {
      const [field, detail] = first;
      const message = detail?.message || detail;
      if (message) return `${field}: ${message}`;
    }
  }
  return err?.message || fallback;
}
