"use client";

import * as React from "react";
import type { Competition, CreateTeamResponse } from "@/shared/api";
import { useCreateTeamMutation } from "../../api/manageTeamsApi";
import { useInviteTeamMembersMutation } from "../../api/manageTeamsInviteApi";
import { TeamRegistrationForm } from "../TeamRegistrationForm";
import { TeamRegistrationSuccess } from "../TeamRegistrationSuccess";
import styles from "./TeamRegistrationDialog.module.css";

interface Props {
  competition: Competition;
  onClose: () => void;
}

export function TeamRegistrationDialog({ competition, onClose }: Props) {
  const [inviteUrl, setInviteUrl] = React.useState("");
  const create = useCreateTeamMutation();
  const invite = useInviteTeamMembersMutation();
  const maxSize = competition.max_team_size || 5;

  const handleSubmit = (name: string, description: string, emailList: string[]) => {
    create.mutate(
      { competitionId: competition.id, name, description },
      {
        onSuccess: ({ team, invite_url }: CreateTeamResponse) => {
          setInviteUrl(invite_url);
          if (emailList.length) invite.mutate({ competitionId: competition.id, teamId: team.id, emails: emailList });
        },
      }
    );
  };

  return (
    <div className={styles.scrim} role="presentation">
      <section className={styles.dialog} role="dialog" aria-modal="true" aria-labelledby="team-create-title">
        <button className={styles.close} onClick={onClose} aria-label="Закрыть">×</button>
        <h2 id="team-create-title">Создать команду и подать заявку</h2>
        <p>Вы станете капитаном. В команде может быть до {maxSize} участников, включая вас.</p>
        {!inviteUrl ? (
          <TeamRegistrationForm
            maxSize={maxSize}
            isPending={create.isPending}
            errorMessage={create.error?.message}
            onSubmit={handleSubmit}
          />
        ) : (
          <TeamRegistrationSuccess
            inviteUrl={inviteUrl}
            isPending={invite.isPending}
            isSuccess={invite.isSuccess}
            isError={invite.isError}
            sentCount={invite.data?.sent.length || 0}
            failedCount={invite.data?.failed.length || 0}
            errorMessage={invite.error?.message}
            onClose={onClose}
          />
        )}
      </section>
    </div>
  );
}
