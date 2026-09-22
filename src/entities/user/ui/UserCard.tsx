import * as React from "react";
import type { AthleteProfile } from "../model/types";
import styles from "./UserCard.module.css";

interface UserCardProps {
  athlete: AthleteProfile;
}

export const UserCard: React.FC<UserCardProps> = ({ athlete }) => {
  const initials = athlete.fullName
    .split(" ")
    .slice(0, 2)
    .map((part) => part[0])
    .join("");

  return (
    <article className={styles.card}>
      <header className={styles.header}>
        <div className={styles.avatarWrapper}>
          <div className={styles.avatar}>
            {initials}
          </div>
          <div className={styles.nameBlock}>
            <h3 className={styles.fullName}>{athlete.fullName}</h3>
            <p className={styles.metaInfo}>
              {athlete.organization} • {athlete.city}
            </p>
          </div>
        </div>

        <div className={styles.ratingBadge}>
          <span className={styles.ratingLabel}>Рейтинг ФСП</span>
          <span className={styles.ratingValue}>{athlete.rating}</span>
        </div>
      </header>

      <div className={styles.rankRow}>
        <span className={`${styles.badge} ${styles.rankBadge}`}>
          {athlete.rank}
        </span>
        <span className={`${styles.badge} ${styles.regionalBadge}`}>
          #{athlete.regionalRank} в рейтинге РД
        </span>
      </div>

      <div className={styles.disciplinesList}>
        <h4 className={styles.sectionTitle}>Дисциплины спортсмена</h4>
        {athlete.disciplines.map((discipline) => (
          <div key={discipline} className={styles.disciplineItem}>
            <span className={styles.disciplineDot} />
            <span>{discipline}</span>
          </div>
        ))}
      </div>
    </article>
  );
};
