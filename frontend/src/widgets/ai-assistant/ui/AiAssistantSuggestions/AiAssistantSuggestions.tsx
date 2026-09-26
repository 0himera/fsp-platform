import * as React from "react";
import { QUICK_QUESTIONS } from "../../model/types";
import styles from "./AiAssistantSuggestions.module.css";

interface Props {
  onSelect: (question: string) => void;
}

export const AiAssistantSuggestions: React.FC<Props> = ({ onSelect }) => (
  <div className={styles.suggestions}>
    {QUICK_QUESTIONS.map((q, i) => (
      <button
        key={i}
        type="button"
        className={styles.suggestionBtn}
        onClick={() => onSelect(q)}
      >
        {q}
      </button>
    ))}
  </div>
);
