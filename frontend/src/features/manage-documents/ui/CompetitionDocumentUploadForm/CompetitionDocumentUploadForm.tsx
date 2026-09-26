import * as React from "react";
import { Button, Input } from "@/shared/ui";
import { useUploadCompetitionDocumentMutation } from "@/entities/document";
import styles from "./CompetitionDocumentUploadForm.module.css";

interface Props {
  competitionId: number;
}

export const CompetitionDocumentUploadForm: React.FC<Props> = ({ competitionId }) => {
  const upload = useUploadCompetitionDocumentMutation();
  const [title, setTitle] = React.useState("");
  const [file, setFile] = React.useState<File>();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (file && title.trim()) {
      upload.mutate(
        { id: competitionId, title: title.trim(), file },
        { onSuccess: () => { setTitle(""); setFile(undefined); } }
      );
    }
  };

  return (
    <form onSubmit={handleSubmit} className={styles.form}>
      <Input required placeholder="Название документа" value={title} onChange={(e) => setTitle(e.target.value)} />
      <input required type="file" accept="application/pdf" onChange={(e) => setFile(e.target.files?.[0])} />
      <Button type="submit" disabled={upload.isPending} size="sm">Загрузить PDF</Button>
    </form>
  );
};
