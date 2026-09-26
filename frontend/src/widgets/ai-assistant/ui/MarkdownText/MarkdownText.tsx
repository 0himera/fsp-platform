"use client";

import * as React from "react";
import { parseMarkdownLines } from "./model/parseMarkdownLines";
import styles from "./MarkdownText.module.css";

interface Props {
  text: string;
}

export const MarkdownText: React.FC<Props> = ({ text }) => {
  const elements = React.useMemo(() => parseMarkdownLines(text), [text]);
  return <div className={styles.container}>{elements}</div>;
};
