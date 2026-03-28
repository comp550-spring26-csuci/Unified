export function getApiErrorMessage(err, fallback = "Request failed") {
  const base =
    err?.data?.message ||
    err?.error ||
    err?.message ||
    fallback;
  const detail = err?.data?.detail;
  if (detail && import.meta.env.DEV) {
    return `${base} ${detail}`;
  }
  return base;
}
