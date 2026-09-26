"use client";

import * as React from "react";
import { useCompetitionDocumentsQuery } from "@/entities/document";
import { CompetitionDocumentUploadForm } from "../CompetitionDocumentUploadForm";
import styles from "./CompetitionDocuments.module.css";

interface CompetitionDocumentsProps {
  id: number;
  editable: boolean;
}

export function CompetitionDocuments({ id, editable }: CompetitionDocumentsProps) {
  const { data = [] } = useCompetitionDocumentsQuery(id);

  return (
    <section className={styles.container}>
      <h3 className={styles.heading}>Документы соревнования</h3>
      {data.map((item) => (
        <p key={item.id} className={styles.docLink}>
          <a href={item.url} target="_blank" rel="noreferrer">
            {item.title} · PDF
          </a>
        </p>
      ))}
      {editable && <CompetitionDocumentUploadForm competitionId={id} />}
    </section>
  );
}
