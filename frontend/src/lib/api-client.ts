/**
 * Central HTTP API Client for MNOP Frontend.
 * Intercepts requests and connects to FastAPI Backend endpoints (/api/v1).
 */

const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:8000/api/v1";

export async function fetchApi<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const token = localStorage.getItem("mnop_access_token");

  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(options.headers as Record<string, string>),
  };

  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    ...options,
    headers,
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.detail || errorData.message || `API Error (${response.status})`);
  }

  if (response.status === 204) {
    return {} as T;
  }

  return response.json();
}
