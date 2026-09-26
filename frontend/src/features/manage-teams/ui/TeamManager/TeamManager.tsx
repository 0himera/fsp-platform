"use client";

import * as React from "react";
import type { Team } from "@/shared/api";
import { useDeleteTeamMutation } from "../../api/manageTeamsApi";
import { useRemoveTeamMemberMutation } from "../../api/manageTeamsInviteApi";
import { TeamInvites } from "../TeamInvites";
import { TeamSettings } from "../TeamSettings";
import styles from "./TeamManager.module.css";

interface TeamManagerProps {
  competitionId: number;
  team: Team;
  maxSize: number;
  athleteId: number;
}

export function TeamManager({ competitionId, team, maxSize, athleteId }: TeamManagerProps) {
  const deleteTeam = useDeleteTeamMutation();
  const remove = useRemoveTeamMemberMutation();
  const isCaptain = team.captain_id === athleteId;

  return (
    <section className={styles.panel}>
      <header>
        <div>
          <span>Команда · до {maxSize} участников</span>
          <h3>{team.name}</h3>
        </div>
        {isCaptain && (
          <button className={styles.delete} disabled={deleteTeam.isPending} onClick={() => {
            if (window.confirm("Удалить команду и отменить заявки всех её участников?")) {
              deleteTeam.mutate({ competitionId, teamId: team.id });
            }
          }}>Распустить команду</button>
        )}
      </header>
      {team.description && <p>{team.description}</p>}
      <ul>
        {team.members.map((m) => (
          <li key={m.athlete_id}>
            <span>{m.full_name}{m.athlete_id === team.captain_id && <b>Капитан</b>}</span>
            {m.athlete_id !== team.captain_id && isCaptain && (
              <button className={styles.remove} disabled={remove.isPending} onClick={() => remove.mutate({ competitionId, teamId: team.id, athleteId: m.athlete_id })}>Удалить</button>
            )}
          </li>
        ))}
      </ul>
      {!isCaptain ? <small>Изменять состав и приглашать участников может только капитан.</small> : (
        <div className={styles.controls}>
          <TeamSettings
            competitionId={competitionId}
            teamId={team.id}
            initialName={team.name}
            initialDescription={team.description}
          />
          <TeamInvites competitionId={competitionId} teamId={team.id} />
        </div>
      )}
    </section>
  );
}
