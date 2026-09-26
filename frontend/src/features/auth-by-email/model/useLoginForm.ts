import * as React from "react";
import { useRouter } from "next/navigation";
import type { UserRole } from "@/entities/user";
import { useLoginMutation } from "../api/authApi";

export function useLoginForm() {
  const router = useRouter();
  const [email, setEmail] = React.useState("athlete1@arena.local");
  const [password, setPassword] = React.useState("");
  const [role, setRole] = React.useState<UserRole>("athlete");
  const [view, setView] = React.useState<"login" | "forgot" | "resend">("login");

  const loginMutation = useLoginMutation();

  const handleRoleChange = (newRole: UserRole) => {
    setRole(newRole);
    setEmail(newRole === "organizer" ? "organizer@arena.local" : "athlete1@arena.local");
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;
    loginMutation.mutate({ email, password: password || undefined, role }, {
      onSuccess: () => {
        const returnTo = new URLSearchParams(window.location.search).get("returnTo");
        router.push(returnTo?.startsWith("/") && !returnTo.startsWith("//") ? returnTo : "/profile");
      },
    });
  };

  return {
    email,
    setEmail,
    password,
    setPassword,
    role,
    view,
    setView,
    loginMutation,
    handleRoleChange,
    handleSubmit,
  };
}
