import { algorithmTemplates } from "./algorithmTemplates";
import { csvTemplates } from "./csvTemplates";
import { TaskTemplate } from "./types";

export function getTemplatesForMode(mode: string): TaskTemplate[] {
  if (mode === "algorithm") return algorithmTemplates;
  if (mode === "csv_metric") return csvTemplates;
  return [];
}

export type { TaskTemplate };
export { algorithmTemplates, csvTemplates };
