"use client";

import * as React from "react";
import type { Team } from "@/shared/api";
import { useCreateTeamInviteLinkMutation, useDeleteTeamMutation, useInviteTeamMembersMutation, useRemoveTeamMemberMutation, useUpdateTeamMutation } from "@/entities/competition";
import styles from "./TeamManager.module.css";

export function TeamManager({ competitionId, team, maxSize, athleteId }: { competitionId: number; team: Team; maxSize: number; athleteId: number }) {
  const [name, setName] = React.useState(team.name);
  const [description, setDescription] = React.useState(team.description || "");
  const [emails, setEmails] = React.useState("");
  const [inviteUrl, setInviteUrl] = React.useState("");
  const update = useUpdateTeamMutation();
  const deleteTeam = useDeleteTeamMutation();
  const createLink = useCreateTeamInviteLinkMutation();
  const invite = useInviteTeamMembersMutation();
  const remove = useRemoveTeamMemberMutation();
  const isCaptain = team.captain_id === athleteId;
  const emailList = emails.split(/[\s,;]+/).filter(Boolean);
  return <section className={styles.panel}><header><div><span>Команда · до {maxSize} участников</span><h3>{team.name}</h3></div>{isCaptain && <button className={styles.delete} disabled={deleteTeam.isPending} onClick={() => { if (window.confirm("Удалить команду и отменить заявки всех её участников?")) deleteTeam.mutate({ competitionId, teamId: team.id }); }}>Распустить команду</button>}</header>
    {team.description && <p>{team.description}</p>}<ul>{team.members.map((member) => <li key={member.athlete_id}><span>{member.full_name}{member.athlete_id === team.captain_id && <b>Капитан</b>}</span>{member.athlete_id !== team.captain_id && isCaptain && <button className={styles.remove} disabled={remove.isPending} onClick={() => remove.mutate({ competitionId, teamId: team.id, athleteId: member.athlete_id })}>Удалить участника</button>}</li>)}</ul>
    {!isCaptain ? <small>Изменять состав и приглашать участников может только капитан.</small> : <div className={styles.controls}><details><summary>Настройки команды</summary><form onSubmit={(event) => { event.preventDefault(); update.mutate({ competitionId, teamId: team.id, name, description }); }}><input required minLength={2} maxLength={100} value={name} onChange={(event) => setName(event.target.value)} /><textarea maxLength={500} value={description} onChange={(event) => setDescription(event.target.value)} /><button disabled={update.isPending}>Сохранить</button></form></details>
    <div className={styles.invites}><label>Пригласить по почте<input value={emails} onChange={(event) => setEmails(event.target.value)} placeholder="email@example.com" /></label><button disabled={!emailList.length || invite.isPending} onClick={() => invite.mutate({ competitionId, teamId: team.id, emails: emailList })}>Отправить приглашения</button><button className={styles.linkButton} disabled={createLink.isPending} onClick={() => createLink.mutate({ competitionId, teamId: team.id }, { onSuccess: (data) => setInviteUrl(data.invite_url) })}>Создать ссылку-приглашение</button>{inviteUrl && <input readOnly value={inviteUrl} onFocus={(event) => event.currentTarget.select()} />}{invite.isSuccess && <small>Отправлено: {invite.data.sent.length}; ошибки: {invite.data.failed.length}</small>}{invite.isError && <small role="alert">{invite.error.message}</small>}</div></div>}
  </section>;
}
