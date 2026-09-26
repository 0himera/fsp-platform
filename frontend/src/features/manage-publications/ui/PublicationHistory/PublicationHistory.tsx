"use client";

import * as React from "react";
import { Button } from "@/shared/ui";
import { useResultPublicationsQuery } from "@/entities/competition";
import { useRestorePublicationMutation } from "@/features/publish-results";
import styles from "./PublicationHistory.module.css";

interface PublicationHistoryProps {
  competitionId: number;
  editable: boolean;
}

export function PublicationHistory({ competitionId, editable }: PublicationHistoryProps) {
  const { data = [] } = useResultPublicationsQuery(competitionId);
  const restore = useRestorePublicationMutation();

  if (!data.length) return null;

  return (
    <section className={styles.container}>
      <h3 className={styles.heading}>История публикаций протокола</h3>
      {data.map((item) => (
        <div key={item.id} className={styles.row}>
          <span>{new Date(item.published_at).toLocaleString("ru-RU")} · {item.publisher}</span>
          {editable && (
            <Button
              size="sm"
              variant="outline"
              disabled={restore.isPending}
              onClick={() => restore.mutate({ competitionId, publicationId: item.id })}
            >
              Восстановить
            </Button>
          )}
        </div>
      ))}
    </section>
  );
}
