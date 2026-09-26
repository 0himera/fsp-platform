import * as React from "react";
import Link from "next/link";
import type { Notification } from "@/shared/api";
import styles from "./NotificationDropdown.module.css";

interface NotificationDropdownProps {
  unread: number;
  items: Notification[];
  onReadAll: () => void;
  onReadOne: (id: number) => void;
  onClose: () => void;
}

export const NotificationDropdown: React.FC<NotificationDropdownProps> = ({
  unread,
  items,
  onReadAll,
  onReadOne,
  onClose,
}) => (
  <div className={styles.dropdown} role="dialog" aria-label="Уведомления">
    <div className={styles.header}>
      <span>Уведомления</span>
      {unread > 0 && (
        <button type="button" className={styles.readAll} onClick={onReadAll}>
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
                onClick={() => {
                  if (!n.read_at) onReadOne(n.id);
                  onClose();
                }}
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
);
