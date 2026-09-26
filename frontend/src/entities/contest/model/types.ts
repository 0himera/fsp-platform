export interface TaskTemplate {
  id: string;
  title: string;
  category: string;
  statement: string;
  maxPoints: number;
  starterCode?: string;
  expectedLabels?: Record<string, string>;
  publicCsv?: string;
  labelsText?: string;
}
