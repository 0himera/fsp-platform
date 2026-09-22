import * as React from "react";
import { Badge } from "@/shared/ui";
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
      <Badge variant="secondary" className={styles.rankBadge}>
        {rank}
      </Badge>
      <Badge variant="outline" className={styles.regionalBadge}>
        #{regionalRank} в рейтинге РД
      </Badge>
    </div>
  );
};
