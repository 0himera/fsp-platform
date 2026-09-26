export type EventStatusFilter = "all" | "active" | "completed";

export interface EventFilterBarProps {
  filter: EventStatusFilter;
  search: string;
  discipline: string;
  level: string;
  disciplines: { code: string; name: string }[];
  onFilter: (value: EventStatusFilter) => void;
  onSearch: (value: string) => void;
  onDiscipline: (value: string) => void;
  onLevel: (value: string) => void;
}

export const EVENT_STATUS_OPTIONS: [EventStatusFilter, string][] = [
  ["all", "Все"],
  ["active", "Предстоящие"],
  ["completed", "Прошедшие"],
];

export const EVENT_LEVEL_OPTIONS = [
  { value: "all", label: "Все уровни" },
  { value: "all_russian", label: "Всероссийский" },
  { value: "interregional", label: "Межрегиональный" },
  { value: "rf_championship", label: "Чемпионат РФ" },
  { value: "rd_championship", label: "Чемпионат РД" },
  { value: "regional", label: "Региональный" },
];
