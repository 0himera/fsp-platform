import * as React from "react";
import { Button, Input } from "@/shared/ui";
import { useForgotPasswordMutation } from "../../api/authApi";
import styles from "./ForgotPasswordForm.module.css";

interface ForgotPasswordFormProps {
  onBack: () => void;
}

export const ForgotPasswordForm: React.FC<ForgotPasswordFormProps> = ({ onBack }) => {
  const [email, setEmail] = React.useState("");
  const forgotMutation = useForgotPasswordMutation();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;
    forgotMutation.mutate(email.trim());
  };

  return (
    <form onSubmit={handleSubmit} className={styles.form}>
      <h4 className={styles.heading}>Восстановление пароля</h4>
      <p className={styles.desc}>
        Введите email, указанный при регистрации. Мы отправим ссылку для смены пароля.
      </p>
      <div className={styles.fieldGroup}>
        <label className={styles.label} htmlFor="forgot-email">
          Электронная почта
        </label>
        <Input
          id="forgot-email"
          type="email"
          required
          placeholder="your@email.ru"
          value={email}
          onChange={(e: React.ChangeEvent<HTMLInputElement>) => setEmail(e.target.value)}
        />
      </div>
      <Button type="submit" disabled={forgotMutation.isPending}>
        {forgotMutation.isPending ? "Отправка..." : "Отправить ссылку"}
      </Button>
      <Button type="button" variant="ghost" className={styles.backBtn} onClick={onBack}>
        ← Вернуться ко входу
      </Button>
    </form>
  );
};
