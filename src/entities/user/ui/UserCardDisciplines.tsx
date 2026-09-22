import * as React from "react";
import type { SportDiscipline } from "../model/types";
import styles from "./UserCardDisciplines.module.css";

interface UserCardDisciplinesProps {
  disciplines: SportDiscipline[];
}

export const UserCardDisciplines: React.FC<UserCardDisciplinesProps> = ({
  disciplines,
}) => {
  return (
    <div className={styles.disciplinesList}>
      <h4 className={styles.title}>Дисциплины</h4>
      {disciplines.map((discipline) => (
        <div key={discipline} className={styles.item}>
          <span className={styles.dot} />
          <span>{discipline}</span>
        </div>
      ))}
    </div>
  );
};
