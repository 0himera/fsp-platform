"use client";

import Link from "next/link";
import { ArrowRight, CalendarDays, MapPin } from "lucide-react";
import type { Competition } from "@/shared/api";
import { formatDate } from "@/shared/lib";
import styles from "./UpcomingEventRow.module.css";

interface Props {
  event: Competition;
  index: number;
  isActive: boolean;
  onSelect: () => void;
  onOpen: () => void;
}

export function UpcomingEventRow({ event, index, isActive, onSelect, onOpen }: Props) {
  const handleClick = () => (isActive ? onOpen() : onSelect());
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.target === e.currentTarget && (e.key === "Enter" || e.key === " ")) {
      e.preventDefault();
      handleClick();
    }
  };

  return (
    <div
      role="button"
      tabIndex={0}
      className={`${styles.row} ${isActive ? styles.active : ""}`}
      aria-pressed={isActive}
      onClick={handleClick}
      onKeyDown={handleKeyDown}
    >
      <span className={styles.index}>{String(index + 1).padStart(2, "0")}</span>
      <span className={styles.content}>
        <strong>{event.title}</strong>
        <small>
          <CalendarDays />{formatDate(event.starts_at, { year: undefined })}<i>·</i>
          <MapPin />{event.location || "Онлайн"}
        </small>
      </span>
      <Link
        href={`/competitions/${event.id}`}
        className={styles.arrowLink}
        aria-label={`Перейти к соревнованию ${event.title}`}
        onClick={(e) => e.stopPropagation()}
      >
        <ArrowRight className={styles.arrow} />
      </Link>
    </div>
  );
}
