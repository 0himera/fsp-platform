import * as React from "react";
import { Button } from "@/shared/ui";
import styles from "./CompetitionDetailTabs.module.css";

export type DetailTab = "registrations" | "teams" | "results" | "codeforces" | "admin";

interface CompetitionDetailTabsProps {
  currentTab: DetailTab;
  onTabChange: (tab: DetailTab) => void;
  regCount: number;
  teamsCount: number;
  resultsCount: number;
  isOrganizer: boolean;
}

export const CompetitionDetailTabs: React.FC<CompetitionDetailTabsProps> = ({
  currentTab, onTabChange, regCount, teamsCount, resultsCount, isOrganizer,
}) => (
  <div className={styles.tabs}>
    <Button size="sm" variant={currentTab === "registrations" ? "default" : "outline"} onClick={() => onTabChange("registrations")}>
      Заявки ({regCount})
    </Button>
    <Button size="sm" variant={currentTab === "teams" ? "default" : "outline"} onClick={() => onTabChange("teams")}>
      Команды ({teamsCount})
    </Button>
    <Button size="sm" variant={currentTab === "results" ? "default" : "outline"} onClick={() => onTabChange("results")}>
      Протокол ({resultsCount})
    </Button>
    <Button size="sm" variant={currentTab === "codeforces" ? "default" : "outline"} onClick={() => onTabChange("codeforces")}>
      Codeforces
    </Button>
    {isOrganizer && (
      <Button size="sm" variant={currentTab === "admin" ? "default" : "outline"} onClick={() => onTabChange("admin")}>
        Управление
      </Button>
    )}
  </div>
);
