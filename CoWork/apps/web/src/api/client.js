/**
 * Thin fetch wrapper for the gateway. Every call sends the session cookie, and
 * every failure arrives as an Error carrying the server's own message so forms
 * can show it directly.
 */
export class ApiError extends Error {
  constructor(message, status, code) {
    super(message);
    this.status = status;
    this.code = code;
  }
}

export async function apiFetch(path, { method = "GET", body } = {}) {
  let response;
  try {
    response = await fetch(`/api${path}`, {
      method,
      credentials: "include", // the cw_session cookie rides along
      headers: body ? { "content-type": "application/json" } : undefined,
      body: body ? JSON.stringify(body) : undefined,
    });
  } catch {
    throw new ApiError("Can't reach the server. Is the backend running?", 0);
  }

  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new ApiError(data?.error?.message ?? "Something went wrong", response.status, data?.error?.code);
  }
  return data;
}

export const api = {
  register: (payload) => apiFetch("/auth/register", { method: "POST", body: payload }),
  login: (payload) => apiFetch("/auth/login", { method: "POST", body: payload }),
  logout: () => apiFetch("/auth/logout", { method: "POST" }),
  me: () => apiFetch("/auth/me"),
};
