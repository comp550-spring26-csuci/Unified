export function getApiErrorMessage(err, fallback = "Request failed") {
  return (
    err?.data?.message ||
    err?.error ||
    err?.message ||
    fallback
  );
}
