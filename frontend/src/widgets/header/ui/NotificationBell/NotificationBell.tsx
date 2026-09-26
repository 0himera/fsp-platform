"use client";

import * as React from "react";
import { Bell } from "lucide-react";
import {
  useNotificationsQuery,
  useReadNotificationMutation,
  useReadAllNotificationsMutation,
  useMeQuery,
} from "@/entities/user";
import { NotificationDropdown } from "../NotificationDropdown";
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
        <NotificationDropdown
          unread={unread}
          items={items}
          onReadAll={() => readAll.mutate()}
          onReadOne={(id) => readOne.mutate(id)}
          onClose={() => setOpen(false)}
        />
      )}
    </div>
  );
}
