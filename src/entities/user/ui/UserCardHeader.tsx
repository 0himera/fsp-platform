import * as React from "react";
import styles from "./UserCardHeader.module.css";

interface UserCardHeaderProps {
  fullName: string;
  organization: string;
  city: string;
  rating: number;
}

export const UserCardHeader: React.FC<UserCardHeaderProps> = ({
  fullName,
  organization,
  city,
  rating,
}) => {
  const initials = fullName
    .split(" ")
    .slice(0, 2)
    .map((part) => part[0])
    .join("");

  return (
    <header className={styles.header}>
      <div className={styles.avatarWrapper}>
        <div className={styles.avatar}>{initials}</div>
        <div className={styles.nameBlock}>
          <h3 className={styles.fullName}>{fullName}</h3>
          <p className={styles.metaInfo}>
            {organization} • {city}
          </p>
        </div>
      </div>

      <div className={styles.ratingBadge}>
        <span className={styles.ratingLabel}>Рейтинг ФСП</span>
        <span className={styles.ratingValue}>{rating}</span>
      </div>
    </header>
  );
};
