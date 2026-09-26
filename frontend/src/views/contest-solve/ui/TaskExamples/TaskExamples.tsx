import styles from "./TaskExamples.module.css";

interface Example {
  input: string;
  output: string;
}

interface Props {
  examples: Example[];
}

export function TaskExamples({ examples }: Props) {
  if (examples.length === 0) return null;

  return (
    <div className={styles.container}>
      <span className={styles.title}>Примеры тестов</span>
      {examples.map((ex, i) => (
        <div key={i} className={styles.exampleCard}>
          <span className={styles.subLabel}>Пример {i + 1}</span>
          <div className={styles.subLabel}>Входные данные (stdin):</div>
          <pre className={styles.codeBox}>{ex.input.trim() || "<пусто>"}</pre>
          <div className={styles.subLabel}>Выходные данные (stdout):</div>
          <pre className={styles.codeBox}>{ex.output.trim()}</pre>
        </div>
      ))}
    </div>
  );
}
