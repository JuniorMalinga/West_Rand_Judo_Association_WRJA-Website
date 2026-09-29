// The one place the browser talks to the WRJA server.
//
// - Login is a server session in an HttpOnly cookie. JavaScript can't read it,
//   so a script injected into the page can't steal it.
// - Every request carries an X-Requested-With header, which the server requires
//   on anything that changes data (protects against cross-site request forgery).

const BASE = import.meta.env?.VITE_API_URL || "";

export class ApiError extends Error {
  constructor(message, status = 0, data = null) {
    super(message);
    this.status = status;
    this.data = data;
  }
}

export const apiUrl = (path) => `${BASE}${path}`;

export async function api(path, { method = "GET", body } = {}) {
  let response;
  try {
    response = await fetch(apiUrl(path), {
      method,
      credentials: "include",
      headers: {
        "X-Requested-With": "wrja-web",
        ...(body !== undefined ? { "Content-Type": "application/json" } : {}),
      },
      body: body !== undefined ? JSON.stringify(body) : undefined,
    });
  } catch {
    throw new ApiError("Can't reach the WRJA server. Make sure it is running (npm run dev starts both).");
  }

  let data = null;
  try {
    data = await response.json();
  } catch {
    // empty or non-JSON body
  }

  if (!response.ok) {
    if (response.status === 401) window.dispatchEvent(new Event("wrja:session-expired"));
    throw new ApiError(data?.error || `Something went wrong (${response.status}).`, response.status, data);
  }
  return data;
}

// Tells the admin sidebar/overview to re-check its counts.
export const notifyAdminChanged = () => window.dispatchEvent(new Event("wrja:admin-changed"));
