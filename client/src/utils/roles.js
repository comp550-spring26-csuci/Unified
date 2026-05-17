const USER_ROLE_LABELS = {
  user: "User",
  business_owner: "Business Owner",
  community_admin: "Community Admin",
  super_admin: "Super Admin",
};

const USER_STATUS_LABELS = {
  active: "Active",
  banned: "Banned",
};

function startCase(value) {
  return String(value || "")
    .replace(/_/g, " ")
    .replace(/\b\w/g, (ch) => ch.toUpperCase());
}

export function formatUserRole(role) {
  const key = String(role || "").trim();
  if (!key) return "";
  return USER_ROLE_LABELS[key] || startCase(key);
}

export function formatUserStatus(status) {
  const key = String(status || "").trim();
  if (!key) return "";
  return USER_STATUS_LABELS[key] || startCase(key);
}
