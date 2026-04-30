const LOCAL_API_PORT = "5000";

function trimTrailingSlash(value) {
  return String(value || "").replace(/\/+$/, "");
}

export function getApiBaseUrl() {
  const envBase = trimTrailingSlash(import.meta.env.VITE_APP_BASE_URL);
  if (envBase) return envBase;

  if (typeof window === "undefined") {
    return `http://localhost:${LOCAL_API_PORT}`;
  }

  const { hostname, origin, protocol, port } = window.location;
  const isLocalHost = hostname === "localhost" || hostname === "127.0.0.1";

  if (isLocalHost && port !== LOCAL_API_PORT) {
    return `${protocol}//${hostname}:${LOCAL_API_PORT}`;
  }

  return trimTrailingSlash(origin);
}

export function getMediaBaseUrl() {
  const envMediaBase = trimTrailingSlash(import.meta.env.VITE_MEDIA_BASE_URL);
  if (envMediaBase) return envMediaBase;
  return getApiBaseUrl();
}

export function toAbsoluteMediaUrl(url) {
  if (!url) return "";
  if (url.startsWith("http://") || url.startsWith("https://")) return url;
  const base = getMediaBaseUrl();
  return `${base}${url.startsWith("/") ? url : `/${url}`}`;
}
