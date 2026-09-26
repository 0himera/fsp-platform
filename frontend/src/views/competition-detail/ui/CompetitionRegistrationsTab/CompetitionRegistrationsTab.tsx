import * as React from "react";
import Link from "next/link";
import { Card, CardHeader, CardTitle, CardContent } from "@/shared/ui";
import type { Registration, CompetitionParticipant } from "@/shared/api";
import styles from "./CompetitionRegistrationsTab.module.css";

interface CompetitionRegistrationsTabProps {
  registrations: (Registration | CompetitionParticipant)[];
}

export const CompetitionRegistrationsTab: React.FC<CompetitionRegistrationsTabProps> = ({
  registrations,
}) => {
  const showPrivateRegistrationFields = registrations.length > 0 && "organization" in registrations[0];

  return (
    <Card className={styles.card}>
      <CardHeader>
        <CardTitle>Зарегистрированные участники ({registrations.length})</CardTitle>
      </CardHeader>
      <CardContent className={styles.tableWrapper}>
        {registrations.length === 0 ? (
          <p className={styles.empty}>Заявок пока нет</p>
        ) : (
          <table className={styles.table}>
            <thead>
              <tr>
                <th className={styles.th}>№</th>
                <th className={styles.th}>ФИО</th>
                {showPrivateRegistrationFields && <th className={styles.th}>Организация / Вуз</th>}
                {showPrivateRegistrationFields && <th className={styles.th}>Город</th>}
                {showPrivateRegistrationFields && <th className={styles.th}>Дата подачи</th>}
              </tr>
            </thead>
            <tbody>
              {registrations.map((r, i) => (
                <tr key={r.athlete_id} className={styles.row}>
                  <td className={styles.cell}>{i + 1}</td>
                  <td className={styles.cell}>
                    <Link href={`/athletes/${r.athlete_id}`} className={styles.link}>
                      {r.full_name}
                    </Link>
                  </td>
                  {"organization" in r && <td className={styles.cell}>{r.organization || "—"}</td>}
                  {"city" in r && <td className={styles.cell}>{r.city || "—"}</td>}
                  {"created_at" in r && (
                    <td className={styles.cell}>
                      {new Date(r.created_at).toLocaleDateString("ru-RU")}
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </CardContent>
    </Card>
  );
};
