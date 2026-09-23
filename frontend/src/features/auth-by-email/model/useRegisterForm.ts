import * as React from "react";
import { useRegisterMutation } from "../api/authApi";

export function useRegisterForm() {
  const [fullName, setFullName] = React.useState("");
  const [email, setEmail] = React.useState("");
  const [password, setPassword] = React.useState("");
  const [city, setCity] = React.useState("");
  const [organization, setOrganization] = React.useState("");

  const registerMutation = useRegisterMutation();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !password || !fullName.trim()) return;
    registerMutation.mutate({
      full_name: fullName.trim(),
      email: email.trim(),
      password,
      city: city.trim() || undefined,
      organization: organization.trim() || undefined,
    });
  };

  return {
    fullName, setFullName,
    email, setEmail,
    password, setPassword,
    city, setCity,
    organization, setOrganization,
    handleSubmit,
    registerMutation,
  };
}
