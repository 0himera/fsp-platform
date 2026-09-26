"use client";

import * as React from "react";
import styles from "./MarkdownText.module.css";

interface Props {
  text: string;
}

export const MarkdownText: React.FC<Props> = ({ text }) => {
  const lines = text.split("\n");
  const elements: React.ReactNode[] = [];
  let currentList: React.ReactNode[] = [];

  const flushList = () => {
    if (currentList.length > 0) {
      elements.push(
        <ul key={`ul-${elements.length}`} className={styles.list}>
          {currentList}
        </ul>
      );
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

    // List item check: * text, - text, • text
    const listMatch = line.match(/^(\s*)[*•-]\s+(.+)$/);
    if (listMatch) {
      const itemContent = listMatch[2];
      currentList.push(
        <li key={`li-${lineIdx}`} className={styles.listItem}>
          {renderInline(itemContent)}
        </li>
      );
      return;
    }

    flushList();

    // Numbered list item check: 1. text
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

    // Header check
    if (line.startsWith("### ")) {
      elements.push(<h4 key={`h-${lineIdx}`} className={styles.h4}>{renderInline(line.slice(4))}</h4>);
      return;
    }
    if (line.startsWith("## ")) {
      elements.push(<h3 key={`h-${lineIdx}`} className={styles.h3}>{renderInline(line.slice(3))}</h3>);
      return;
    }

    // Regular paragraph
    elements.push(
      <p key={`p-${lineIdx}`} className={styles.paragraph}>
        {renderInline(line)}
      </p>
    );
  });

  flushList();

  return <div className={styles.container}>{elements}</div>;
};

function renderInline(text: string): React.ReactNode[] {
  // Parse **bold** and `code`
  const parts: React.ReactNode[] = [];
  let remaining = text;
  let keyIdx = 0;

  while (remaining.length > 0) {
    // Check **bold**
    const boldMatch = remaining.match(/\*\*(.+?)\*\*/);
    // Check `code`
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

    // Push preceding text
    if (earliestIdx > 0) {
      parts.push(remaining.substring(0, earliestIdx));
    }

    // Push matched element
    if (matchType === "bold") {
      parts.push(<strong key={`b-${keyIdx++}`} className={styles.bold}>{innerContent}</strong>);
    } else if (matchType === "code") {
      parts.push(<code key={`c-${keyIdx++}`} className={styles.code}>{innerContent}</code>);
    }

    remaining = remaining.substring(earliestIdx + matchedStr.length);
  }

  return parts;
}
