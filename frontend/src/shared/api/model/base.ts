export interface RequestOptions extends RequestInit {
  params?: Record<string, string | number | boolean | undefined>;
  token?: string;
}

export class ApiError extends Error {
  public status: number;
  public data: unknown;

  constructor(message: string, status: number, data?: unknown) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.data = data;
  }
}

export type UserRole = "athlete" | "organizer" | "coach" | "judge";

export type RankCode =
  | "none"
  | "III"
  | "II"
  | "I"
  | "KMS"
  | "MS"
  | "MSMK"
  | "ZMS";
