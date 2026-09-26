import * as React from "react";
import { FileText, Trash2, Download } from "lucide-react";
import type { DocumentItem } from "@/shared/api";
import { Button } from "@/shared/ui";
import styles from "./DocsFileList.module.css";

interface Props {
  documents: DocumentItem[];
  isOrganizer: boolean;
  onDelete: (id: number) => void;
}

export const DocsFileList: React.FC<Props> = ({ documents, isOrganizer, onDelete }) => {
  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <FileText size={16} className={styles.headerIcon} />
        <h3 className={styles.title}>Официальные материалы Федерации</h3>
      </div>
      <div className={styles.list}>
        {documents.map((item) => (
          <div key={item.id} className={styles.item}>
            <a href={item.url} target="_blank" rel="noreferrer" className={styles.link}>
              <Download size={15} />
              <span>{item.title}</span>
              <span className={styles.badge}>PDF</span>
            </a>
            {isOrganizer && (
              <Button
                variant="ghost"
                size="sm"
                className={styles.deleteBtn}
                onClick={() => onDelete(item.id)}
                aria-label="Удалить документ"
              >
                <Trash2 size={14} />
              </Button>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};
