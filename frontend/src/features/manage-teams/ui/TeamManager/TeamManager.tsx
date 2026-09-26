"use client";

import * as React from "react";
import type { Team } from "@/shared/api";
import { useDeleteTeamMutation } from "../../api/manageTeamsApi";
import { useRemoveTeamMemberMutation } from "../../api/manageTeamsInviteApi";
import { TeamInvites } from "../TeamInvites";
import { TeamSettings } from "../TeamSettings";
import { TeamMembersList } from "../TeamMembersList";
import styles from "./TeamManager.module.css";

interface Props {
  competitionId: number;
  team: Team;
  maxSize: number;
  athleteId: number;
}

export function TeamManager({ competitionId, team, maxSize, athleteId }: Props) {
  const deleteTeam = useDeleteTeamMutation();
  const remove = useRemoveTeamMemberMutation();
  const isCaptain = team.captain_id === athleteId;

  const handleDelete = () => {
    if (window.confirm("Удалить команду и отменить заявки всех её участников?")) {
      deleteTeam.mutate({ competitionId, teamId: team.id });
    }
  };

  return (
    <section className={styles.panel}>
      <header>
        <div><span>Команда · до {maxSize} участников</span><h3>{team.name}</h3></div>
        {isCaptain && <button className={styles.delete} disabled={deleteTeam.isPending} onClick={handleDelete}>Распустить команду</button>}
      </header>
      {team.description && <p>{team.description}</p>}
      <TeamMembersList
        members={team.members}
        captainId={team.captain_id}
        isCaptain={isCaptain}
        isPending={remove.isPending}
        onRemove={(id) => remove.mutate({ competitionId, teamId: team.id, athleteId: id })}
      />
      {!isCaptain ? <small>Изменять состав и приглашать участников может только капитан.</small> : (
        <div className={styles.controls}>
          <TeamSettings competitionId={competitionId} teamId={team.id} initialName={team.name} initialDescription={team.description} />
          <TeamInvites competitionId={competitionId} teamId={team.id} />
        </div>
      )}
    </section>
  );
}
