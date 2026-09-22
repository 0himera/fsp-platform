import * as React from "react";
import type { SportRank } from "../../model/types";
import styles from "./UserCardBadges.module.css";

interface UserCardBadgesProps {
  rank: SportRank;
  regionalRank: number;
}

export const UserCardBadges: React.FC<UserCardBadgesProps> = ({
  rank,
  regionalRank,
}) => {
  return (
    <div className={styles.rankRow}>
      <span className={`${styles.badge} ${styles.rankBadge}`}>{rank}</span>
      <span className={`${styles.badge} ${styles.regionalBadge}`}>
        #{regionalRank} в рейтинге РД
      </span>
    </div>
  );
};
