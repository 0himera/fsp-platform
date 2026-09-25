import { getInitials } from "@/shared/lib";
import styles from "./AthleteAvatar.module.css";

interface AthleteAvatarProps {
  name: string;
  size?: "small" | "medium" | "large";
}

export function AthleteAvatar({ name, size = "medium" }: AthleteAvatarProps) {
  return <span className={`${styles.avatar} ${styles[size]}`} aria-label={name}>{getInitials(name)}</span>;
}
