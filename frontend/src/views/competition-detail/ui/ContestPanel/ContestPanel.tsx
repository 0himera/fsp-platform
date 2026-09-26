"use client";

import * as React from "react";
import { ApiError, type Competition } from "@/shared/api";
import { Button, Card, CardHeader, CardTitle, Input } from "@/shared/ui";
import {
  useContestLeaderboardQuery,
  useContestQuery,
  useContestSubmissionsQuery,
  useCreateContestMutation,
  useCreateContestTaskMutation,
  useFinalizeContestMutation,
  useReviewContestSubmissionMutation,
  useSubmitCodeMutation,
  useSubmitCSVMutation,
} from "@/entities/contest";
import type { ContestSubmission } from "@/shared/api";
import styles from "./ContestPanel.module.css";

interface Props {
  competition: Competition;
  isOrganizer: boolean;
  isRegistered: boolean;
}

const statusLabel: Record<ContestSubmission["status"], string> = {
  submitted: "На проверке организатором",
  queued: "В очереди на проверку",
  checking: "Проверяется",
  graded: "Проверено",
  invalid: "Файл не прошёл проверку",
};

function getError(error: unknown, fallback: string) {
  return error instanceof Error ? error.message : fallback;
}

function ReviewRow({ submission, onReview, pending, editable }: {
  submission: ContestSubmission;
  onReview: (score: number, feedback: string) => void;
  pending: boolean;
  editable: boolean;
}) {
  return (
    <article className={styles.submission}>
      <div className={styles.submissionTop}>
        <strong>{submission.athlete_name}</strong>
        <span>{submission.task_title} · {statusLabel[submission.status]}</span>
      </div>
      {submission.source_code && <><p className={styles.feedback}>Язык: {submission.language}</p><pre className={styles.code}>{submission.source_code}</pre></>}
      {submission.file_name && (
        <details className={styles.fileDetails}>
          <summary>{submission.file_name} · открыть содержимое</summary>
          <pre className={styles.code}>{submission.file_content}</pre>
        </details>
      )}
      {(submission.score !== undefined || submission.automatic_score !== undefined) && (
        <p className={styles.feedback}>Баллы: {submission.score ?? submission.automatic_score} · {submission.verdict}{submission.feedback ? ` — ${submission.feedback}` : ""}</p>
      )}
      {editable && submission.status !== "queued" && submission.status !== "checking" && (
        <form className={styles.reviewForm} onSubmit={(event) => {
          event.preventDefault();
          const form = new FormData(event.currentTarget);
          onReview(Number(form.get("score")), String(form.get("feedback") ?? ""));
        }}>
          <Input name="score" aria-label="Баллы за решение" type="number" min="0" step="0.01" defaultValue={submission.score ?? submission.automatic_score ?? 0} />
          <Input name="feedback" aria-label="Комментарий к проверке" placeholder="Комментарий спортсмену" defaultValue={submission.feedback} />
          <Button size="sm" type="submit" disabled={pending}>Сохранить оценку</Button>
        </form>
      )}
    </article>
  );
}

export const ContestPanel: React.FC<Props> = ({ competition, isOrganizer, isRegistered }) => {
  const id = competition.id;
  const contestQuery = useContestQuery(id);
  const createContest = useCreateContestMutation(id);
  const createTask = useCreateContestTaskMutation(id);
  const submitCode = useSubmitCodeMutation(id);
  const submitCSV = useSubmitCSVMutation(id);
  const review = useReviewContestSubmissionMutation(id);
  const finalize = useFinalizeContestMutation(id);
  const [mode, setMode] = React.useState<"algorithm" | "csv_metric">("algorithm");
  const [instructions, setInstructions] = React.useState("");
  const [taskTitle, setTaskTitle] = React.useState("");
  const [statement, setStatement] = React.useState("");
  const [maxPoints, setMaxPoints] = React.useState("100");
  const [labelsText, setLabelsText] = React.useState("");
  const [publicCSV, setPublicCSV] = React.useState("");
  const [codeByTask, setCodeByTask] = React.useState<Record<number, string>>({});
  const [languageByTask, setLanguageByTask] = React.useState<Record<number, string>>({});
  const [fileByTask, setFileByTask] = React.useState<Record<number, File | undefined>>({});
  const [formError, setFormError] = React.useState("");
  const [now, setNow] = React.useState(() => Date.now());
  const refreshedForStart = React.useRef<number | null>(null);
  React.useEffect(() => {
    const timer = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(timer);
  }, []);
  React.useEffect(() => {
    const startsAt = new Date(competition.starts_at).getTime();
    if (now >= startsAt && refreshedForStart.current !== startsAt) {
      refreshedForStart.current = startsAt;
      void contestQuery.refetch();
    }
  }, [now, competition.starts_at, contestQuery.refetch]);

  const contest = contestQuery.data;
  const isNotConfigured = contestQuery.error instanceof ApiError && contestQuery.error.status === 404;
  const submissionsQuery = useContestSubmissionsQuery(id, Boolean(contest && (isOrganizer || isRegistered)));
  const leaderboardQuery = useContestLeaderboardQuery(id, Boolean(contest && (isOrganizer || competition.status === "completed")));
  const mayFinalize = new Date(competition.ends_at).getTime() <= now && competition.status !== "completed";
  const canSubmitNow = (competition.status === "open" || competition.status === "running") &&
    new Date(competition.starts_at).getTime() <= now && new Date(competition.ends_at).getTime() > now;
  const canConfigure = new Date(competition.starts_at).getTime() > now && competition.status !== "completed";

  if (contestQuery.isLoading) return null;
  if (isNotConfigured && (!isOrganizer || !canConfigure)) return null;

  const taskSubmission = (taskId: number) => submitCode.mutate({ taskId, language: languageByTask[taskId] || "cpp", sourceCode: codeByTask[taskId] || "" });
  const submitFile = (taskId: number) => {
    const file = fileByTask[taskId];
    if (file) submitCSV.mutate({ taskId, file });
  };

  return (
    <section className={styles.section}>
      <Card>
        <CardHeader><CardTitle>Контест на платформе</CardTitle></CardHeader>
        <div className={styles.body}>
          {contestQuery.error && !isNotConfigured && <p className={styles.error}>{getError(contestQuery.error, "Не удалось загрузить контест")}</p>}
          {isNotConfigured && isOrganizer && (
            <form className={styles.form} onSubmit={(event) => {
              event.preventDefault();
              setFormError("");
              createContest.mutate({ mode, instructions }, { onError: (error) => setFormError(getError(error, "Не удалось создать контест")) });
            }}>
              <p>Выберите режим и создайте контест для этого индивидуального соревнования.</p>
              <label>Режим
                <select value={mode} onChange={(event) => setMode(event.target.value as typeof mode)}>
                  <option value="algorithm">Алгоритмические задачи</option>
                  <option value="csv_metric">Проверка CSV по recall</option>
                </select>
              </label>
              <label>Инструкция участникам<textarea value={instructions} onChange={(event) => setInstructions(event.target.value)} rows={3} /></label>
              {formError && <p className={styles.error}>{formError}</p>}
              <Button type="submit" disabled={createContest.isPending}>Создать контест</Button>
            </form>
          )}
          {contest && <>
            <div className={styles.intro}>
              <span className={styles.mode}>{contest.mode === "algorithm" ? "Алгоритмический контест" : "CSV · recall"}</span>
              {contest.instructions && <p>{contest.instructions}</p>}
              {!isOrganizer && new Date(competition.starts_at).getTime() > now && <p>Задания откроются после начала соревнования.</p>}
              {isOrganizer && contest.finalized && <p>Итоговый протокол опубликован.</p>}
            </div>

            {isOrganizer && !contest.finalized && new Date(competition.starts_at).getTime() > now && (
              <form className={styles.form} onSubmit={(event) => {
                event.preventDefault();
                setFormError("");
                let expectedLabels: Record<string, string> | undefined;
                if (contest.mode === "csv_metric") {
                  expectedLabels = {};
                  for (const line of labelsText.split(/\r?\n/).filter((row) => row.trim())) {
                    const separator = line.indexOf(",");
                    if (separator < 1) { setFormError("Эталон: одна строка на id в формате id,метка"); return; }
                    expectedLabels[line.slice(0, separator).trim()] = line.slice(separator + 1).trim();
                  }
                  if (Object.keys(expectedLabels).length === 0) { setFormError("Добавьте эталонные строки CSV"); return; }
                }
                createTask.mutate({ title: taskTitle, statement, max_points: Number(maxPoints), public_csv: publicCSV, expected_labels: expectedLabels }, {
                  onSuccess: () => { setTaskTitle(""); setStatement(""); setLabelsText(""); setPublicCSV(""); },
                  onError: (error) => setFormError(getError(error, "Не удалось добавить задание")),
                });
              }}>
                <h3>Добавить задание</h3>
                <Input required maxLength={160} placeholder="Название задания" value={taskTitle} onChange={(event) => setTaskTitle(event.target.value)} />
                <textarea required maxLength={12000} rows={5} placeholder="Условие, формат отправки и ограничения" value={statement} onChange={(event) => setStatement(event.target.value)} />
                <label>Максимум баллов<Input required type="number" min="1" step="0.01" value={maxPoints} onChange={(event) => setMaxPoints(event.target.value)} /></label>
                {contest.mode === "csv_metric" && <label>Открытые данные для предсказаний (CSV)<textarea required rows={4} value={publicCSV} onChange={(event) => setPublicCSV(event.target.value)} placeholder={"id,feature\nrow-1,0.8\nrow-2,0.2"} /></label>}
                {contest.mode === "csv_metric" && <label>Закрытые эталонные метки: id,метка (0 или 1)<textarea required rows={5} value={labelsText} onChange={(event) => setLabelsText(event.target.value)} placeholder={"row-1,1\nrow-2,0\nrow-3,1"} /></label>}
                {formError && <p className={styles.error}>{formError}</p>}
                <Button type="submit" disabled={createTask.isPending}>Добавить задание</Button>
              </form>
            )}

            {contest.tasks.length === 0 ? <p className={styles.empty}>{isOrganizer ? "Добавьте задания до начала контеста." : "Задания пока недоступны."}</p> : (
              <div className={styles.tasks}>
                {contest.tasks.map((task, index) => (
                  <article className={styles.task} key={task.id}>
                    <div className={styles.taskHeading}><h3>{index + 1}. {task.title}</h3><span>{task.max_points} баллов</span></div>
                    <p className={styles.statement}>{task.statement}</p>
                    {task.public_csv && <details className={styles.fileDetails}><summary>Открытые данные задания</summary><pre className={styles.code}>{task.public_csv}</pre></details>}
                    {!isOrganizer && isRegistered && canSubmitNow && !contest.finalized && (
                      contest.mode === "algorithm" ? <div className={styles.submitBox}>
                        <label htmlFor={`code-${task.id}`}>Отправить исходный код (первая версия проверяется организатором)</label>
                        <select aria-label="Язык программирования" value={languageByTask[task.id] || "cpp"} onChange={(event) => setLanguageByTask((current) => ({ ...current, [task.id]: event.target.value }))}>
                          <option value="cpp">C++</option><option value="python">Python</option><option value="go">Go</option><option value="java">Java</option><option value="javascript">JavaScript</option>
                        </select>
                        <textarea id={`code-${task.id}`} rows={8} spellCheck={false} placeholder="Вставьте решение" value={codeByTask[task.id] || ""} onChange={(event) => setCodeByTask((current) => ({ ...current, [task.id]: event.target.value }))} />
                        <Button size="sm" disabled={submitCode.isPending || !codeByTask[task.id]?.trim()} onClick={() => taskSubmission(task.id)}>Отправить решение</Button>
                      </div> : <div className={styles.submitBox}>
                        <label htmlFor={`csv-${task.id}`}>Загрузить CSV с колонками id,prediction (до 2 МБ)</label>
                        <Input id={`csv-${task.id}`} type="file" accept=".csv,text/csv" onChange={(event) => setFileByTask((current) => ({ ...current, [task.id]: event.target.files?.[0] }))} />
                        <Button size="sm" disabled={submitCSV.isPending || !fileByTask[task.id]} onClick={() => submitFile(task.id)}>Загрузить решение</Button>
                      </div>
                    )}
                  </article>
                ))}
              </div>
            )}

            {isOrganizer && submissionsQuery.data && submissionsQuery.data.length > 0 && (
              <div className={styles.submissions}>
                <h3>Поступившие решения</h3>
                {submissionsQuery.data.map((submission) => <ReviewRow key={submission.id} submission={submission} pending={review.isPending} editable={!contest.finalized} onReview={(score, feedback) => review.mutate({ submissionId: submission.id, score, feedback })} />)}
              </div>
            )}
            {!isOrganizer && isRegistered && submissionsQuery.data && submissionsQuery.data.length > 0 && (
              <div className={styles.submissions}>
                <h3>Мои отправки</h3>
                {submissionsQuery.data.map((submission) => <p className={styles.feedback} key={submission.id}>{submission.task_title}: {statusLabel[submission.status]}{submission.score !== undefined ? ` · ${submission.score} баллов` : ""}{submission.feedback ? ` · ${submission.feedback}` : ""}</p>)}
              </div>
            )}

            {(competition.status === "completed" || isOrganizer) && leaderboardQuery.data && (
              <div className={styles.leaderboard}>
                <h3>Итоговая таблица</h3>
                <table><thead><tr><th>Место</th><th>Участник</th><th>Баллы</th></tr></thead><tbody>
                  {leaderboardQuery.data.map((row) => <tr key={row.athlete_id}><td>{row.place}</td><td>{row.full_name}</td><td>{row.score.toFixed(2)} / {row.max_score.toFixed(2)}</td></tr>)}
                </tbody></table>
              </div>
            )}

            {isOrganizer && !contest.finalized && <div className={styles.finalize}>
              <p>{mayFinalize ? "Все оценки будут опубликованы в протоколе соревнования и учтены в профилях и рейтинге." : "Завершить контест можно после времени окончания соревнования."}</p>
              <Button variant="secondary" disabled={!mayFinalize || finalize.isPending} onClick={() => finalize.mutate(undefined, { onError: (error) => setFormError(getError(error, "Не удалось завершить контест")) })}>Завершить и опубликовать результаты</Button>
              {finalize.error && <p className={styles.error}>{formError}</p>}
            </div>}
          </>}
        </div>
      </Card>
    </section>
  );
};
