import type { User, UserRole } from "@/shared/api";

export interface LoginFormValues {
  email: string;
  password?: string;
  role?: UserRole;
}

export interface RegisterFormValues {
  email: string;
  password: string;
  full_name: string;
  organization?: string;
  city?: string;
  role?: UserRole;
}

export interface AuthSession {
  user: User;
}

