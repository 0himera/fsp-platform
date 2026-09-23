import type { UserRole } from "@/entities/user";

export interface LoginFormValues {
  email: string;
  role: UserRole;
}

export interface AuthSession {
  token: string;
  user: {
    id: string;
    email: string;
    role: UserRole;
  };
}
