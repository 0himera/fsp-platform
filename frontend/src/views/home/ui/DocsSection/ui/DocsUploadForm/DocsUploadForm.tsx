import * as React from "react";
import { FileUp, Paperclip, Upload } from "lucide-react";
import { useUploadDocumentMutation } from "@/entities/document";
import { Button, Input } from "@/shared/ui";
import styles from "./DocsUploadForm.module.css";

export const DocsUploadForm: React.FC = () => {
  const upload = useUploadDocumentMutation();
  const [title, setTitle] = React.useState("");
  const [file, setFile] = React.useState<File>();
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!file || !title.trim()) return;
    upload.mutate({ title: title.trim(), file }, {
      onSuccess: () => {
        setTitle("");
        setFile(undefined);
        if (fileInputRef.current) fileInputRef.current.value = "";
      },
    });
  };

  return (
    <form className={styles.upload} onSubmit={handleSubmit}>
      <div className={styles.header}>
        <FileUp size={16} className={styles.headerIcon} />
        <span className={styles.title}>Добавить официальный документ</span>
      </div>
      <div className={styles.fields}>
        <Input
          required
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Название документа (например: Регламент 2026)"
          className={styles.textInput}
        />
        <label className={styles.filePicker}>
          <Paperclip size={15} />
          <span className={styles.fileName}>{file ? file.name : "Выбрать PDF"}</span>
          <input
            ref={fileInputRef}
            required
            type="file"
            accept="application/pdf"
            className={styles.hiddenFile}
            onChange={(e) => setFile(e.target.files?.[0])}
          />
        </label>
        <Button type="submit" disabled={upload.isPending || !file || !title.trim()} className={styles.submitBtn}>
          <Upload size={14} />{upload.isPending ? "Загрузка…" : "Загрузить PDF"}
        </Button>
      </div>
    </form>
  );
};
