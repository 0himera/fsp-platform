import { APP_CONFIG } from "../config";
import { ApiError, type RequestOptions } from "./types";

function buildUrl(endpoint: string, params?: RequestOptions["params"]): string {
  const base = APP_CONFIG.apiBaseUrl.replace(/\/$/, "");
  const path = endpoint.replace(/^\//, "");
  let url = endpoint.startsWith("http") ? endpoint : base ? `${base}/${path}` : `/${path}`;

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

  const defaultHeaders = new Headers({
    Accept: "application/json",
  });
  if (!(restOptions.body instanceof FormData)) defaultHeaders.set("Content-Type", "application/json");

  if (token) {
    defaultHeaders.set("Authorization", `Bearer ${token}`);
  }

  const mergedHeaders = new Headers(defaultHeaders);
  new Headers(headers).forEach((value, key) => mergedHeaders.set(key, value));

  const response = await fetch(url, {
    credentials: restOptions.credentials || "include",
    ...restOptions,
    headers: mergedHeaders,
  });

  if (!response.ok) {
    let errorPayload: unknown;
    const responseText = await response.text();
    try {
      errorPayload = JSON.parse(responseText);
    } catch {
      errorPayload = responseText;
    }

    let errorMessage = `Ошибка ${response.status}`;
    if (typeof errorPayload === "object" && errorPayload !== null && "error" in errorPayload) {
      errorMessage = String((errorPayload as Record<string, unknown>).error);
    } else if (typeof errorPayload === "string" && errorPayload.trim()) {
      errorMessage = errorPayload;
    }

    throw new ApiError(errorMessage, response.status, errorPayload);
  }

  return response.status === 204 ? (null as unknown as T) : response.json();
}
