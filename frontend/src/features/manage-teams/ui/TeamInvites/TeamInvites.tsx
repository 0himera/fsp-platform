import * as React from "react";
import {
  useCreateTeamInviteLinkMutation,
  useInviteTeamMembersMutation,
} from "../../api/manageTeamsInviteApi";
import styles from "./TeamInvites.module.css";

interface TeamInvitesProps {
  competitionId: number;
  teamId: number;
}

export const TeamInvites: React.FC<TeamInvitesProps> = ({ competitionId, teamId }) => {
  const [emails, setEmails] = React.useState("");
  const [inviteUrl, setInviteUrl] = React.useState("");
  const createLink = useCreateTeamInviteLinkMutation();
  const invite = useInviteTeamMembersMutation();
  const emailList = emails.split(/[\s,;]+/).filter(Boolean);

  return (
    <div className={styles.invites}>
      <label>
        Пригласить по почте
        <input value={emails} onChange={(e) => setEmails(e.target.value)} placeholder="email@example.com" />
      </label>
      <button disabled={!emailList.length || invite.isPending} onClick={() => invite.mutate({ competitionId, teamId, emails: emailList })}>
        Отправить приглашения
      </button>
      <button className={styles.linkButton} disabled={createLink.isPending} onClick={() => createLink.mutate({ competitionId, teamId }, { onSuccess: (data: { invite_url: string }) => setInviteUrl(data.invite_url) })}>
        Создать ссылку-приглашение
      </button>
      {inviteUrl && <input readOnly value={inviteUrl} onFocus={(e) => e.currentTarget.select()} />}
      {invite.isSuccess && <small>Отправлено: {invite.data.sent.length}; ошибки: {invite.data.failed.length}</small>}
      {invite.isError && <small role="alert">{invite.error.message}</small>}
    </div>
  );
};
