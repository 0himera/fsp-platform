import * as React from "react";
import { useUploadDocumentMutation } from "@/entities/document";
import styles from "../../DocsSection.module.css";

export const DocsUploadForm: React.FC = () => {
  const upload = useUploadDocumentMutation();
  const [title, setTitle] = React.useState("");
  const [file, setFile] = React.useState<File>();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (file && title.trim()) {
      upload.mutate({ title: title.trim(), file }, {
        onSuccess: () => {
          setTitle("");
          setFile(undefined);
        },
      });
    }
  };

  return (
    <form className={styles.upload} onSubmit={handleSubmit}>
      <h3>Добавить документ</h3>
      <input required value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Название документа" />
      <input required type="file" accept="application/pdf" onChange={(e) => setFile(e.target.files?.[0])} />
      <button disabled={upload.isPending}>{upload.isPending ? "Загружаем…" : "Загрузить PDF"}</button>
    </form>
  );
};
