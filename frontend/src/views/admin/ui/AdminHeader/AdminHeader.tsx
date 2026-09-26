import * as React from "react";
import { Button } from "@/shared/ui";
import styles from "./AdminHeader.module.css";

export type AdminTab = "competitions" | "create" | "disciplines";

interface AdminHeaderProps {
  currentTab: AdminTab;
  onTabChange: (tab: AdminTab) => void;
}

export const AdminHeader: React.FC<AdminHeaderProps> = ({ currentTab, onTabChange }) => (
  <div className={styles.header}>
    <div>
      <h1 className={styles.title}>Панель организатора</h1>
      <p className={styles.desc}>Управление турнирами, заявками и видами спорта</p>
    </div>
    <div className={styles.tabs}>
      <Button
        variant={currentTab === "competitions" ? "default" : "outline"}
        size="sm"
        onClick={() => onTabChange("competitions")}
      >
        Соревнования
      </Button>
      <Button
        variant={currentTab === "create" ? "default" : "outline"}
        size="sm"
        onClick={() => onTabChange("create")}
      >
        + Создать турнир
      </Button>
      <Button
        variant={currentTab === "disciplines" ? "default" : "outline"}
        size="sm"
        onClick={() => onTabChange("disciplines")}
      >
        Дисциплины
      </Button>
    </div>
  </div>
);
