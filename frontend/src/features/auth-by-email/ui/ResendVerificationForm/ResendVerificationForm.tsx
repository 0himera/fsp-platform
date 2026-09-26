import * as React from "react";
import { Button, Input } from "@/shared/ui";
import { useResendVerificationMutation } from "../../api/authApi";
import styles from "./ResendVerificationForm.module.css";

interface ResendVerificationFormProps {
  onBack: () => void;
}

export const ResendVerificationForm: React.FC<ResendVerificationFormProps> = ({ onBack }) => {
  const [email, setEmail] = React.useState("");
  const resendMutation = useResendVerificationMutation();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;
    resendMutation.mutate(email.trim());
  };

  return (
    <form onSubmit={handleSubmit} className={styles.form}>
      <h4 className={styles.heading}>Повторная отправка подтверждения</h4>
      <p className={styles.desc}>
        Введите email, на который мы повторно отправим письмо активации аккаунта.
      </p>
      <div className={styles.fieldGroup}>
        <label className={styles.label} htmlFor="resend-email">
          Электронная почта
        </label>
        <Input
          id="resend-email"
          type="email"
          required
          placeholder="your@email.ru"
          value={email}
          onChange={(e: React.ChangeEvent<HTMLInputElement>) => setEmail(e.target.value)}
        />
      </div>
      <Button type="submit" disabled={resendMutation.isPending}>
        {resendMutation.isPending ? "Отправка..." : "Отправить письмо"}
      </Button>
      <Button type="button" variant="ghost" className={styles.backBtn} onClick={onBack}>
        ← Вернуться ко входу
      </Button>
    </form>
  );
};
