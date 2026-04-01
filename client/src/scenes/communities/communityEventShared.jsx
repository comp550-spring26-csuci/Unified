import { Stack, Typography } from "@mui/material";

export const API_BASE = import.meta.env.VITE_APP_BASE_URL || "http://localhost:5001";

export function normalizeId(value) {
  if (!value) return "";
  if (typeof value === "string" || typeof value === "number")
    return String(value);
  return String(value?._id || value?.id || "");
}

/** Events whose start time is still in the future or now; soonest first. */
export function filterEventsUpcoming(events) {
  const now = Date.now();
  return [...(events || [])]
    .filter((ev) => new Date(ev.date).getTime() >= now)
    .sort((a, b) => new Date(a.date) - new Date(b.date));
}

/** Events whose start time is in the past; most recent first. */
export function filterEventsPast(events) {
  const now = Date.now();
  return [...(events || [])]
    .filter((ev) => new Date(ev.date).getTime() < now)
    .sort((a, b) => new Date(b.date) - new Date(a.date));
}

export function toAbsoluteMediaUrl(url) {
  if (!url) return "";
  if (url.startsWith("http://") || url.startsWith("https://")) return url;
  return `${API_BASE}${url.startsWith("/") ? url : `/${url}`}`;
}

export function MetaRow({ icon, label, value }) {
  return (
    <Stack direction="row" spacing={1} alignItems="center">
      {icon}
      <Typography variant="body2" color="text.secondary">
        {label}:
      </Typography>
      <Typography variant="body2" fontWeight={600}>
        {value}
      </Typography>
    </Stack>
  );
}

/** Parse `datetime-local` / `YYYY-MM-DD` strings as local wall time (not UTC). */
export function parseDateTimeLocalInput(str) {
  if (!str || typeof str !== "string") return null;
  const trimmed = str.trim();
  if (!trimmed) return null;
  const [datePart, timePartRaw = "00:00"] = trimmed.split("T");
  const dp = datePart.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (!dp) return null;
  const y = Number(dp[1]);
  const mo = Number(dp[2]);
  const d = Number(dp[3]);
  const tpr = String(timePartRaw).slice(0, 8);
  const timeMatch = tpr.match(/^(\d{1,2}):(\d{2})/);
  const h = timeMatch ? Number(timeMatch[1]) : 0;
  const min = timeMatch ? Number(timeMatch[2]) : 0;
  if ([y, mo, d, h, min].some((n) => Number.isNaN(n))) return null;
  const dt = new Date(y, mo - 1, d, h, min, 0, 0);
  return Number.isNaN(dt.getTime()) ? null : dt;
}

export function parseTimeOnDatePart(datePart, hhmm) {
  if (!datePart || !hhmm) return null;
  const dp = String(datePart).match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (!dp) return null;
  const y = Number(dp[1]);
  const mo = Number(dp[2]);
  const day = Number(dp[3]);
  const timeMatch = String(hhmm).slice(0, 5).match(/^(\d{1,2}):(\d{2})$/);
  if (!timeMatch) return null;
  const h = Number(timeMatch[1]);
  const mi = Number(timeMatch[2]);
  if ([y, mo, day, h, mi].some((n) => Number.isNaN(n))) return null;
  const dt = new Date(y, mo - 1, day, h, mi, 0, 0);
  return Number.isNaN(dt.getTime()) ? null : dt;
}

export function computeAgendaSlots(eventDateStr, firstOffsetMinutes, items) {
  if (!items.length) return [];
  const base = parseDateTimeLocalInput(eventDateStr);
  if (!eventDateStr || !base) {
    return items.map(() => ({ start: null, end: null }));
  }
  let t = base.getTime() + firstOffsetMinutes * 60000;
  const out = [];
  for (let i = 0; i < items.length; i++) {
    if (i > 0) {
      t += items[i].gapBeforeMinutes * 60000;
    }
    const start = new Date(t);
    const end = new Date(t + items[i].durationMinutes * 60000);
    out.push({ start, end });
    t = end.getTime();
  }
  return out;
}

export function formatAgendaClock(d) {
  if (!d || Number.isNaN(d.getTime())) return "—";
  return `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
}

/** Local `datetime-local` string for agenda math from an API / ISO date. */
export function toDateTimeLocalFromDate(isoOrDate) {
  const x = new Date(isoOrDate);
  if (Number.isNaN(x.getTime())) return "";
  const y = x.getFullYear();
  const mo = String(x.getMonth() + 1).padStart(2, "0");
  const da = String(x.getDate()).padStart(2, "0");
  const h = String(x.getHours()).padStart(2, "0");
  const m = String(x.getMinutes()).padStart(2, "0");
  return `${y}-${mo}-${da}T${h}:${m}`;
}
