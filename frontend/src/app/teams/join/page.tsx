"use client";

import * as React from "react";
import Link from "next/link";
import { useMeQuery } from "@/entities/user";
import { useAcceptTeamInviteMutation } from "@/features/manage-teams";

export default function TeamInvitePage() {
  const me = useMeQuery();
  const accept = useAcceptTeamInviteMutation();
  const started = React.useRef(false);
  const [token, setToken] = React.useState("");

  React.useEffect(() => {
    const param = new URLSearchParams(window.location.search).get("token") || "";
    queueMicrotask(() => setToken(param));
  }, []);

  React.useEffect(() => {
    if (!token || !me.data?.user || me.data.user.role !== "athlete" || started.current) return;
    started.current = true;
    accept.mutate(token);
  }, [accept, me.data, token]);

  if (!token && me.isLoading) return <main><p>Проверяем приглашение…</p></main>;
  if (!token) return <main><h1>Ссылка приглашения недействительна</h1></main>;
  if (!me.data?.user) {
    const returnTo = `/teams/join?token=${encodeURIComponent(token)}`;
    return <main><h1>Вступление в команду</h1><p>Войдите в аккаунт спортсмена, чтобы принять приглашение.</p><Link href={`/login?returnTo=${encodeURIComponent(returnTo)}`}>Войти и вступить</Link></main>;
  }
  if (me.data.user.role !== "athlete") return <main><h1>Нужен аккаунт спортсмена</h1><p>Выйдите из аккаунта организатора и войдите как спортсмен.</p></main>;
  if (accept.isError) return <main><h1>Не удалось вступить в команду</h1><p>{accept.error.message}</p></main>;
  if (!accept.data) return <main><p>Принимаем приглашение…</p></main>;
  return <main><h1>Вы в команде «{accept.data.team.name}»</h1><p>Заявка на соревнование подана.</p><Link href={`/competitions/${accept.data.team.competition_id}`}>Открыть соревнование</Link></main>;
}
