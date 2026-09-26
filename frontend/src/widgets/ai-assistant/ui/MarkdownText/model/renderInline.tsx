import * as React from "react";
import styles from "../MarkdownText.module.css";

export function renderInline(text: string): React.ReactNode[] {
  const parts: React.ReactNode[] = [];
  let remaining = text;
  let keyIdx = 0;

  while (remaining.length > 0) {
    const boldMatch = remaining.match(/\*\*(.+?)\*\*/);
    const codeMatch = remaining.match(/`(.+?)`/);

    let earliestIdx = -1;
    let matchType: "bold" | "code" | null = null;
    let matchedStr = "";
    let innerContent = "";

    if (boldMatch && boldMatch.index !== undefined) {
      earliestIdx = boldMatch.index;
      matchType = "bold";
      matchedStr = boldMatch[0];
      innerContent = boldMatch[1];
    }

    if (codeMatch && codeMatch.index !== undefined) {
      if (earliestIdx === -1 || codeMatch.index < earliestIdx) {
        earliestIdx = codeMatch.index;
        matchType = "code";
        matchedStr = codeMatch[0];
        innerContent = codeMatch[1];
      }
    }

    if (matchType === null || earliestIdx === -1) {
      parts.push(remaining);
      break;
    }

    if (earliestIdx > 0) {
      parts.push(remaining.substring(0, earliestIdx));
    }

    if (matchType === "bold") {
      parts.push(<strong key={`b-${keyIdx++}`} className={styles.bold}>{innerContent}</strong>);
    } else if (matchType === "code") {
      parts.push(<code key={`c-${keyIdx++}`} className={styles.code}>{innerContent}</code>);
    }

    remaining = remaining.substring(earliestIdx + matchedStr.length);
  }

  return parts;
}
