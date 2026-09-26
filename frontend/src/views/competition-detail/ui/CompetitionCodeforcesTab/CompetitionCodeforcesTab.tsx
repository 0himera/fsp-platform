"use client";

import { ExternalLink } from "lucide-react";
import {
  useCodeforcesContestQuery, useLinkCodeforcesMutation,
  useImportCodeforcesTasksMutation, useSyncCodeforcesStandingsMutation,
} from "@/entities/codeforces";
import { CodeforcesLinkForm } from "./ui/CodeforcesLinkForm";
import { CodeforcesProblemsList } from "./ui/CodeforcesProblemsList";
import { CodeforcesStandingsTable } from "./ui/CodeforcesStandingsTable";
import styles from "./CompetitionCodeforcesTab.module.css";

interface Props {
  competitionId: number;
  organizer?: boolean;
}

export function CompetitionCodeforcesTab({ competitionId, organizer = false }: Props) {
  const { data, isLoading } = useCodeforcesContestQuery(competitionId);
  const linkMutation = useLinkCodeforcesMutation(competitionId);
  const importTasks = useImportCodeforcesTasksMutation(competitionId);
  const syncStandings = useSyncCodeforcesStandingsMutation(competitionId);

  if (isLoading) return <p>Загрузка данных Codeforces…</p>;
  if (!data?.linked || !data.standings) {
    return <CodeforcesLinkForm onLink={(id) => linkMutation.mutate(id)} pending={linkMutation.isPending} />;
  }

  const { contest, problems, rows } = data.standings;

  return (
    <div className={styles.container}>
      <div className={styles.headerCard}>
        <div>
          <h2 className={styles.cfTitle}>{contest.name}</h2>
          <p className={styles.cfMeta}>ID: #{contest.id} · {contest.type} · {contest.phase}</p>
          {organizer && (
            <div className={styles.actions}>
              <button type="button" className={styles.actionBtn} onClick={() => importTasks.mutate()} disabled={importTasks.isPending}>
                {importTasks.isPending ? "Импорт…" : "Импортировать задачи"}
              </button>
              <button type="button" className={styles.secondaryBtn} onClick={() => syncStandings.mutate()} disabled={syncStandings.isPending}>
                {syncStandings.isPending ? "Синхронизация…" : "Синхронизировать результаты"}
              </button>
            </div>
          )}
        </div>
        <a href={`https://codeforces.com/contest/${contest.id}`} target="_blank" rel="noreferrer" className={styles.linkBtn}>
          Codeforces <ExternalLink size={14} />
        </a>
      </div>
      <div className={styles.section}><CodeforcesProblemsList problems={problems} /></div>
      <div className={styles.section}><CodeforcesStandingsTable rows={rows} /></div>
    </div>
  );
}
