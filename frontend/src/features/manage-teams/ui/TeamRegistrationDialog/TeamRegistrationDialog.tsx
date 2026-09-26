"use client";

import * as React from "react";
import type { Competition } from "@/shared/api";
import { useCreateTeamMutation, useInviteTeamMembersMutation } from "@/entities/competition";
import styles from "./TeamRegistrationDialog.module.css";

export function TeamRegistrationDialog({ competition, onClose }: { competition: Competition; onClose: () => void }) {
  const [name, setName] = React.useState("");
  const [description, setDescription] = React.useState("");
  const [emails, setEmails] = React.useState("");
  const [inviteUrl, setInviteUrl] = React.useState("");
  const create = useCreateTeamMutation();
  const invite = useInviteTeamMembersMutation();
  const emailList = emails.split(/[\s,;]+/).filter(Boolean);
  const submit = (event: React.FormEvent) => {
    event.preventDefault();
    create.mutate({ competitionId: competition.id, name: name.trim(), description: description.trim() }, {
      onSuccess: ({ team, invite_url }) => {
        setInviteUrl(invite_url);
        if (emailList.length) invite.mutate({ competitionId: competition.id, teamId: team.id, emails: emailList });
      },
    });
  };
  return <div className={styles.scrim} role="presentation"><section className={styles.dialog} role="dialog" aria-modal="true" aria-labelledby="team-create-title">
    <button className={styles.close} onClick={onClose} aria-label="Закрыть">×</button>
    <h2 id="team-create-title">Создать команду и подать заявку</h2><p>Вы станете капитаном. В команде может быть до {competition.max_team_size} участников, включая вас.</p>
    {!inviteUrl ? <form onSubmit={submit}><label>Название команды<input required minLength={2} maxLength={100} value={name} onChange={(event) => setName(event.target.value)} /></label><label>Описание<textarea maxLength={500} value={description} onChange={(event) => setDescription(event.target.value)} /></label><label>Пригласить по почте<textarea placeholder="Каждый адрес с новой строки" value={emails} onChange={(event) => setEmails(event.target.value)} /></label><small>Можно указать до {competition.max_team_size - 1} адресов</small>{create.isError && <p role="alert">{create.error.message}</p>}<button disabled={create.isPending || emailList.length > competition.max_team_size - 1}>{create.isPending ? "Создаём…" : "Создать команду"}</button></form> : <div className={styles.success}><strong>Команда создана, заявка подана.</strong><p>Пригласите участников по общей ссылке:</p><input readOnly value={inviteUrl} onFocus={(event) => event.currentTarget.select()} /><button onClick={() => navigator.clipboard.writeText(inviteUrl)}>Скопировать ссылку</button>{invite.isPending && <small>Отправляем приглашения…</small>}{invite.isSuccess && <small>Письма отправлены: {invite.data.sent.length}. Ошибки: {invite.data.failed.length}.</small>}{invite.isError && <p role="alert">Команда создана, но приглашения не отправились: {invite.error.message}</p>}<button onClick={onClose}>Готово</button></div>}
  </section></div>;
}
