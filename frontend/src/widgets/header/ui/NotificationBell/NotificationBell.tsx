"use client";
import * as React from "react";
import Link from "next/link";
import { Bell } from "lucide-react";
import { useNotificationsQuery, useReadNotificationMutation, useReadAllNotificationsMutation } from "@/entities/user";
import { useMeQuery } from "@/entities/user";
import styles from "./NotificationBell.module.css";

export function NotificationBell() {
  const { data: me } = useMeQuery();
  const [open, setOpen] = React.useState(false);
  const { data } = useNotificationsQuery(Boolean(me?.user));
  const readOne = useReadNotificationMutation();
  const readAll = useReadAllNotificationsMutation();
  const ref = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    function onClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, []);

  if (!me?.user) return null;

  const unread = data?.unread ?? 0;
  const items = data?.notifications.slice(0, 10) ?? [];

  return (
    <div className={styles.wrap} ref={ref}>
      <button
        type="button"
        className={styles.bell}
        aria-label={`Уведомления${unread ? `, ${unread} непрочитанных` : ""}`}
        onClick={() => setOpen((v) => !v)}
      >
        <Bell size={17} />
        {unread > 0 && <span className={styles.badge}>{unread > 9 ? "9+" : unread}</span>}
      </button>
      {open && (
        <div className={styles.dropdown} role="dialog" aria-label="Уведомления">
          <div className={styles.dropdownHeader}>
            <span>Уведомления</span>
            {unread > 0 && (
              <button type="button" className={styles.readAll} onClick={() => readAll.mutate()}>
                Прочитать все
              </button>
            )}
          </div>
          {items.length === 0 ? (
            <div className={styles.empty}>Уведомлений пока нет</div>
          ) : (
            <ul className={styles.list}>
              {items.map((n) => (
                <li key={n.id} className={n.read_at ? styles.read : styles.unread}>
                  {n.link ? (
                    <Link
                      href={n.link}
                      className={styles.item}
                      onClick={() => { if (!n.read_at) readOne.mutate(n.id); setOpen(false); }}
                    >
                      <strong>{n.title}</strong>
                      {n.body && <span>{n.body}</span>}
                    </Link>
                  ) : (
                    <div className={styles.item}>
                      <strong>{n.title}</strong>
                      {n.body && <span>{n.body}</span>}
                    </div>
                  )}
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}
