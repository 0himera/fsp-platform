import * as React from "react";
import { renderInline } from "./renderInline";
import styles from "../MarkdownText.module.css";

export function parseMarkdownLines(text: string): React.ReactNode[] {
  const lines = text.split("\n");
  const elements: React.ReactNode[] = [];
  let currentList: React.ReactNode[] = [];

  const flushList = () => {
    if (currentList.length > 0) {
      elements.push(<ul key={`ul-${elements.length}`} className={styles.list}>{currentList}</ul>);
      currentList = [];
    }
  };

  lines.forEach((line, lineIdx) => {
    const trimmed = line.trim();
    if (!trimmed) {
      flushList();
      elements.push(<div key={`empty-${lineIdx}`} className={styles.spacing} />);
      return;
    }
    const listMatch = line.match(/^(\s*)[*•-]\s+(.+)$/);
    if (listMatch) {
      currentList.push(<li key={`li-${lineIdx}`} className={styles.listItem}>{renderInline(listMatch[2])}</li>);
      return;
    }
    flushList();
    const numMatch = line.match(/^(\s*)\d+\.\s+(.+)$/);
    if (numMatch) {
      elements.push(
        <div key={`num-${lineIdx}`} className={styles.numItem}>
          <span className={styles.numPrefix}>{line.match(/^\s*\d+\./)?.[0]}</span>
          <span>{renderInline(numMatch[2])}</span>
        </div>
      );
      return;
    }
    if (line.startsWith("### ")) {
      elements.push(<h4 key={`h-${lineIdx}`} className={styles.h4}>{renderInline(line.slice(4))}</h4>);
      return;
    }
    if (line.startsWith("## ")) {
      elements.push(<h3 key={`h-${lineIdx}`} className={styles.h3}>{renderInline(line.slice(3))}</h3>);
      return;
    }
    elements.push(<p key={`p-${lineIdx}`} className={styles.paragraph}>{renderInline(line)}</p>);
  });

  flushList();
  return elements;
}
