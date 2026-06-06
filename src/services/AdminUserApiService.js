import { apiRequest } from "./ApiClient";

export async function getAdminUsersApi(params = {}) {
  const query = new URLSearchParams();

  if (params.q) query.set("q", params.q);
  if (params.roleId) query.set("roleId", params.roleId);
  if (params.active && params.active !== "ALL") query.set("active", params.active);

  const suffix = query.toString() ? `?${query.toString()}` : "";
  const data = await apiRequest(`/api/admin-users/users${suffix}`);

  if (!data?.success || !Array.isArray(data.users)) {
    throw new Error(data?.message || "Cannot load admin users.");
  }

  return data;
}

export async function createAdminUserApi(payload = {}) {
  const data = await apiRequest("/api/admin-users/users", {
    method: "POST",
    body: JSON.stringify(payload),
  });

  if (!data?.success || !data.user) {
    throw new Error(data?.message || "Cannot create user.");
  }

  return data;
}

export async function updateAdminUserApi(id, payload = {}) {
  const data = await apiRequest(`/api/admin-users/users/${encodeURIComponent(id)}`, {
    method: "PATCH",
    body: JSON.stringify(payload),
  });

  if (!data?.success || !data.user) {
    throw new Error(data?.message || "Cannot update user.");
  }

  return data.user;
}

export async function getAdminRolesApi() {
  const data = await apiRequest("/api/admin-users/roles");

  if (!data?.success || !Array.isArray(data.roles)) {
    throw new Error(data?.message || "Cannot load roles.");
  }

  return data;
}

export async function createAdminRoleApi(payload = {}) {
  const data = await apiRequest("/api/admin-users/roles", {
    method: "POST",
    body: JSON.stringify(payload),
  });

  if (!data?.success || !data.role) {
    throw new Error(data?.message || "Cannot create role.");
  }

  return data.role;
}

export async function updateAdminRoleApi(id, payload = {}) {
  const data = await apiRequest(`/api/admin-users/roles/${encodeURIComponent(id)}`, {
    method: "PATCH",
    body: JSON.stringify(payload),
  });

  if (!data?.success || !data.role) {
    throw new Error(data?.message || "Cannot update role.");
  }

  return data.role;
}
