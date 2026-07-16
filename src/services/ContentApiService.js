import { apiRequest } from "./ApiClient";

export async function getPublicNewsApi() {
  const data = await apiRequest("/api/content/news", {
    method: "GET",
    token: "",
  });
  if (!data?.success) throw new Error(data?.message || "Cannot load news.");
  return Array.isArray(data.news) ? data.news : [];
}

export async function getPublicNewsBySlugApi(slug = "") {
  const data = await apiRequest(
    `/api/content/news/${encodeURIComponent(slug)}`,
    { method: "GET", token: "" }
  );
  if (!data?.success || !data.article) {
    throw new Error(data?.message || "News article not found.");
  }
  return data.article;
}

export async function getAdminNewsApi() {
  const data = await apiRequest("/api/admin/content/news");
  if (!data?.success) throw new Error(data?.message || "Cannot load admin news.");
  return Array.isArray(data.news) ? data.news : [];
}

export async function saveAdminNewsApi(article = {}) {
  const id = String(article.id || "").trim();

  const data = await apiRequest(
    id
      ? `/api/admin/content/news/${encodeURIComponent(id)}`
      : "/api/admin/content/news",
    {
      method: id ? "PUT" : "POST",
      body: JSON.stringify(article),
    }
  );

  if (!data?.success || !data.article) {
    throw new Error(data?.message || "Cannot save news article.");
  }

  return data.article;
}

export async function deleteAdminNewsApi(id) {
  const data = await apiRequest(
    `/api/admin/content/news/${encodeURIComponent(id)}`,
    { method: "DELETE" }
  );

  if (!data?.success) {
    throw new Error(data?.message || "Cannot delete news article.");
  }

  return true;
}

export async function getPublicEventsApi() {
  const data = await apiRequest("/api/content/events", {
    method: "GET",
    token: "",
  });
  if (!data?.success) throw new Error(data?.message || "Cannot load events.");
  return Array.isArray(data.events) ? data.events : [];
}

export async function getPublicEventByIdApi(id = "") {
  const data = await apiRequest(
    `/api/content/events/${encodeURIComponent(id)}`,
    { method: "GET", token: "" }
  );

  if (!data?.success || !data.event) {
    throw new Error(data?.message || "Event not found.");
  }

  return data.event;
}

export async function getAdminEventsApi() {
  const data = await apiRequest("/api/admin/content/events");

  if (!data?.success) {
    throw new Error(data?.message || "Cannot load admin events.");
  }

  return {
    events: Array.isArray(data.events) ? data.events : [],
    registrations: Array.isArray(data.registrations)
      ? data.registrations
      : [],
  };
}

export async function saveAdminEventApi(event = {}) {
  const id = String(event.id || "").trim();

  const data = await apiRequest(
    id
      ? `/api/admin/content/events/${encodeURIComponent(id)}`
      : "/api/admin/content/events",
    {
      method: id ? "PUT" : "POST",
      body: JSON.stringify(event),
    }
  );

  if (!data?.success || !data.event) {
    throw new Error(data?.message || "Cannot save event.");
  }

  return data.event;
}

export async function deleteAdminEventApi(id) {
  const data = await apiRequest(
    `/api/admin/content/events/${encodeURIComponent(id)}`,
    { method: "DELETE" }
  );

  if (!data?.success) {
    throw new Error(data?.message || "Cannot delete event.");
  }

  return true;
}

export async function registerEventApi(eventId, payload = {}) {
  const data = await apiRequest(
    `/api/content/events/${encodeURIComponent(eventId)}/registrations`,
    {
      method: "POST",
      token: "",
      body: JSON.stringify(payload),
    }
  );

  if (!data?.success) {
    throw new Error(data?.message || "Cannot register for event.");
  }

  return data.registration;
}

export async function updateAdminEventRegistrationApi(id, status) {
  const data = await apiRequest(
    `/api/admin/content/event-registrations/${encodeURIComponent(id)}`,
    {
      method: "PATCH",
      body: JSON.stringify({ status }),
    }
  );

  if (!data?.success) {
    throw new Error(data?.message || "Cannot update registration.");
  }

  return data.registration;
}
