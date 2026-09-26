import { APP_CONFIG } from "../config";
import type { RequestOptions } from "./types";

export function buildUrl(endpoint: string, params?: RequestOptions["params"]): string {
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
