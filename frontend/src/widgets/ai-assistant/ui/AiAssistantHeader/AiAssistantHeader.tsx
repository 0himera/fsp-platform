import * as React from "react";
import { Bot, X } from "lucide-react";
import styles from "./AiAssistantHeader.module.css";

interface Props {
  onClose: () => void;
}

export const AiAssistantHeader: React.FC<Props> = ({ onClose }) => (
  <div className={styles.header}>
    <div className={styles.headerTitle}>
      <Bot size={18} color="var(--primary)" />
      <span>ИИ-помощник ФСП РД</span>
    </div>
    <button type="button" className={styles.closeBtn} onClick={onClose} aria-label="Закрыть">
      <X size={18} />
    </button>
  </div>
);
