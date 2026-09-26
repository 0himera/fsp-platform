import * as React from "react";
import type { Competition } from "@/shared/api";

export function useRegistrationWindow(competition?: Competition) {
  const [now, setNow] = React.useState(() => Date.now());
  const deadline = competition?.registration_deadline;
  const endsAt = competition?.ends_at;

  React.useEffect(() => {
    if (!deadline || !endsAt) return;
    const closesAt = Math.min(new Date(deadline).getTime(), new Date(endsAt).getTime());
    const delay = closesAt - Date.now();
    if (!Number.isFinite(delay) || delay <= 0) return;
    const timer = window.setTimeout(() => setNow(Date.now()), delay + 1);
    return () => window.clearTimeout(timer);
  }, [deadline, endsAt]);

  return Boolean(
    competition?.status === "open" &&
    competition.registration_open &&
    now < new Date(competition.registration_deadline).getTime() &&
    now < new Date(competition.ends_at).getTime()
  );
}
