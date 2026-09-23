import * as React from "react";
import { Button } from "@/shared/ui";
import styles from "./LoginExtraLinks.module.css";

interface LoginExtraLinksProps {
  onForgot: () => void;
  onResend: () => void;
}

export const LoginExtraLinks: React.FC<LoginExtraLinksProps> = ({
  onForgot,
  onResend,
}) => (
  <div className={styles.extraLinks}>
    <Button type="button" variant="ghost" className={styles.linkBtn} onClick={onForgot}>
      Забыли пароль?
    </Button>
    <Button type="button" variant="ghost" className={styles.linkBtn} onClick={onResend}>
      Подтвердить email
    </Button>
  </div>
);
