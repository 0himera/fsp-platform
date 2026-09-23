import * as React from "react";
import styles from "./RegisterSuccessNotice.module.css";

interface RegisterSuccessNoticeProps {
  email: string;
  mailSent?: boolean;
}

export const RegisterSuccessNotice: React.FC<RegisterSuccessNoticeProps> = ({
  email,
  mailSent,
}) => (
  <div className={styles.successBox}>
    <h3 className={styles.successTitle}>
      {mailSent ? "Проверьте почту" : "Аккаунт создан"}
    </h3>
    <p className={styles.successDesc}>
      {mailSent
        ? `Мы отправили ссылку для подтверждения на ${email}. Откройте письмо для активации аккаунта.`
        : "Аккаунт создан. Локальные письма перехватывает Mailpit (localhost:8025)."}
    </p>
    <p className={styles.hint}>
      Для локального тестирования письма доступны в Mailpit на{" "}
      <a href="http://localhost:8025" target="_blank" rel="noreferrer" className={styles.link}>
        localhost:8025
      </a>
    </p>
  </div>
);
