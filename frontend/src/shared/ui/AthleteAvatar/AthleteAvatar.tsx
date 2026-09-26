import { getInitials } from "@/shared/lib";
import styles from "./AthleteAvatar.module.css";

interface AthleteAvatarProps {
  name: string;
  size?: "small" | "medium" | "large";
  src?: string;
}

export function AthleteAvatar({ name, size = "medium", src }: AthleteAvatarProps) {
  return <span className={`${styles.avatar} ${styles[size]}`} aria-label={name}>{src ? <img src={src} alt="" /> : getInitials(name)}</span>;
}
