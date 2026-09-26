import * as React from "react";
import { Input } from "@/shared/ui";
import styles from "./RankingHeader.module.css";

interface RankingHeaderProps {
  search: string;
  onSearchChange: (value: string) => void;
}

export const RankingHeader: React.FC<RankingHeaderProps> = ({
  search,
  onSearchChange,
}) => (
  <div className={styles.header}>
    <div className={styles.titleGroup}>
      <h2 className={styles.heading}>Рейтинг спортсменов Республики Дагестан</h2>
      <p className={styles.description}>
        Единый официальный рейтинг Федерации спортивного программирования РД (arena-2).
      </p>
    </div>
    <div className={styles.toolbar}>
      <Input
        placeholder="Поиск по спортсмену, городу или вузу..."
        value={search}
        onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
          onSearchChange(e.target.value)
        }
      />
    </div>
  </div>
);
