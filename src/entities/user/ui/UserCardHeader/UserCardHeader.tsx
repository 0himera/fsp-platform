import * as React from "react";
import { Avatar, AvatarFallback } from "@/shared/ui";
import { RatingBadge } from "../RatingBadge";
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
        <Avatar className={styles.avatar}>
          <AvatarFallback>{initials}</AvatarFallback>
        </Avatar>
        <div className={styles.nameBlock}>
          <h3 className={styles.fullName}>{fullName}</h3>
          <p className={styles.metaInfo}>
            {organization} • {city}
          </p>
        </div>
      </div>
      <RatingBadge rating={rating} />
    </header>
  );
};
