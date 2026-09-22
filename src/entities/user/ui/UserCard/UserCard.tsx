import * as React from "react";
import type { AthleteProfile } from "../../model/types";
import { UserCardHeader } from "../UserCardHeader";
import { UserCardBadges } from "../UserCardBadges";
import { UserCardDisciplines } from "../UserCardDisciplines";
import styles from "./UserCard.module.css";

interface UserCardProps {
  athlete: AthleteProfile;
}

export const UserCard: React.FC<UserCardProps> = ({ athlete }) => {
  return (
    <article className={styles.card}>
      <UserCardHeader
        fullName={athlete.fullName}
        organization={athlete.organization}
        city={athlete.city}
        rating={athlete.rating}
      />
      <UserCardBadges
        rank={athlete.rank}
        regionalRank={athlete.regionalRank}
      />
      <UserCardDisciplines disciplines={athlete.disciplines} />
    </article>
  );
};
