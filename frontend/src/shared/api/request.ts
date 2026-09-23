import { APP_CONFIG } from "../config";
import { ApiError, type RequestOptions } from "./types";

function buildUrl(endpoint: string, params?: RequestOptions["params"]): string {
  let url = endpoint.startsWith("http")
    ? endpoint
    : `${APP_CONFIG.apiBaseUrl.replace(/\/$/, "")}/${endpoint.replace(/^\//, "")}`;

  if (params) {
    const searchParams = new URLSearchParams();
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        searchParams.append(key, String(value));
      }
    });
    const queryString = searchParams.toString();
    if (queryString) {
      url += (url.includes("?") ? "&" : "?") + queryString;
    }
  }
  return url;
}

export async function request<T>(endpoint: string, options: RequestOptions = {}): Promise<T> {
  const { params, token, headers, ...restOptions } = options;
  const url = buildUrl(endpoint, params);

  const defaultHeaders: Record<string, string> = {
    "Content-Type": "application/json",
    Accept: "application/json",
  };

  if (token) {
    defaultHeaders["Authorization"] = `Bearer ${token}`;
  }

  const response = await fetch(url, {
    ...restOptions,
    headers: { ...defaultHeaders, ...headers },
  });

  if (!response.ok) {
    let errorPayload: unknown;
    const responseText = await response.text();
    try {
      errorPayload = JSON.parse(responseText);
    } catch {
      errorPayload = responseText;
    }
    throw new ApiError(`API failed with ${response.status}`, response.status, errorPayload);
  }

  return response.status === 204 ? (null as unknown as T) : response.json();
}
