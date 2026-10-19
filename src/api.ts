const BASE = (import.meta.env.VITE_API_URL ?? "").replace(/\/$/, "")
const TOKEN_KEY = "financehub-token"

export const tokenStore = {
  get: () => sessionStorage.getItem(TOKEN_KEY),
  set: (token: string) => sessionStorage.setItem(TOKEN_KEY, token),
  clear: () => sessionStorage.removeItem(TOKEN_KEY),
}

export class ApiError extends Error {
  constructor(
    public status: number,
    message: string,
  ) {
    super(message)
  }
}

export async function api<T>(
  path: string,
  init: { method?: string; body?: unknown } = {},
): Promise<T> {
  const token = tokenStore.get()
  const headers: Record<string, string> = {}
  if (init.body !== undefined) headers["Content-Type"] = "application/json"
  if (token) headers.Authorization = "Bearer " + token

  let res: Response
  try {
    res = await fetch(`${BASE}/api${path}`, {
      method: init.method ?? "GET",
      headers,
      body: init.body === undefined ? undefined : JSON.stringify(init.body),
    })
  } catch {
    throw new ApiError(0, "Cannot reach the server. Is the backend running on port 4000?")
  }

  const json = await res.json().catch(() => ({}))
  if (res.status === 401 && token) {
    tokenStore.clear()
    if (window.location.pathname !== "/login") window.location.assign("/login")
  }
  if (!res.ok) throw new ApiError(res.status, json.error ?? "Request failed")
  return json as T
}

export async function apiUpload<T>(path: string, form: FormData): Promise<T> {
  const token = tokenStore.get()
  const headers: Record<string, string> = {}
  if (token) headers.Authorization = `Bearer ${token}`
  let res: Response
  try {
    res = await fetch(`${BASE}/api${path}`, { method: "POST", headers, body: form })
  } catch {
    throw new ApiError(0, "Cannot reach the server. Is the backend running on port 4000?")
  }
  const json = await res.json().catch(() => ({}))
  if (res.status === 401 && token) {
    tokenStore.clear()
    if (window.location.pathname !== "/login") window.location.assign("/login")
  }
  if (!res.ok) throw new ApiError(res.status, json.error ?? "Request failed")
  return json as T
}

export async function apiFile(path: string): Promise<Blob> {
  const token = tokenStore.get()
  const headers: Record<string, string> = {}
  if (token) headers.Authorization = `Bearer ${token}`
  let res: Response
  try {
    res = await fetch(`${BASE}/api${path}`, { headers })
  } catch {
    throw new ApiError(0, "Cannot reach the server. Is the backend running on port 4000?")
  }
  if (res.status === 401 && token) {
    tokenStore.clear()
    if (window.location.pathname !== "/login") window.location.assign("/login")
  }
  if (!res.ok) {
    const json = await res.json().catch(() => ({}))
    throw new ApiError(res.status, json.error ?? "File could not be downloaded")
  }
  return res.blob()
}
