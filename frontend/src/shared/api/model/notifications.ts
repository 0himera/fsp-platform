export interface Notification {
  id: number;
  kind: string;
  title: string;
  body: string;
  link: string;
  read_at: string | null;
  created_at: string;
}

export interface NotificationsResponse {
  notifications: Notification[];
  unread: number;
}
