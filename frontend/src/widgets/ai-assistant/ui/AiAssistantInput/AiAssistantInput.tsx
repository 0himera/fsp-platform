import * as React from "react";
import { Send } from "lucide-react";
import styles from "./AiAssistantInput.module.css";

interface Props {
  input: string;
  isPending: boolean;
  onInputChange: (val: string) => void;
  onSubmit: () => void;
}

export const AiAssistantInput: React.FC<Props> = ({
  input,
  isPending,
  onInputChange,
  onSubmit,
}) => {
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit();
  };

  return (
    <form className={styles.inputForm} onSubmit={handleSubmit}>
      <input
        className={styles.input}
        placeholder="Спросите о турнирах, регламенте..."
        value={input}
        onChange={(e) => onInputChange(e.target.value)}
        disabled={isPending}
      />
      <button
        type="submit"
        className={styles.sendBtn}
        disabled={isPending || !input.trim()}
        aria-label="Отправить"
      >
        <Send size={16} />
      </button>
    </form>
  );
};
