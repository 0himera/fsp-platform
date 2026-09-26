import { TaskTemplate } from "./types";

export const csvTemplates: TaskTemplate[] = [
  {
    id: "csv-credit",
    title: "Кредитный скоринг (Credit Default)",
    category: "Табличный ML",
    statement: "Постройте бинарный классификатор вероятности дефолта заемщика. Метрика — Recall.",
    maxPoints: 100,
    publicCsv: "id,age,income,credit_score\n1,25,45000,680\n2,34,82000,740\n3,45,31000,590\n4,29,62000,710\n5,52,28000,560\n",
    labelsText: "1,0\n2,0\n3,1\n4,0\n5,1\n",
  },
  {
    id: "csv-churn",
    title: "Прогнозирование оттока клиентов (Telecom Churn)",
    category: "Табличный ML",
    statement: "Определите абонентов, планирующих расторгнуть договор в следующем месяце. Метрика — Recall.",
    maxPoints: 100,
    publicCsv: "id,tenure,monthly_charges,total_calls\n101,12,65.5,140\n102,3,89.0,30\n103,48,45.2,520\n104,2,95.1,15\n105,24,55.0,290\n",
    labelsText: "101,0\n102,1\n103,0\n104,1\n105,0\n",
  },
];
