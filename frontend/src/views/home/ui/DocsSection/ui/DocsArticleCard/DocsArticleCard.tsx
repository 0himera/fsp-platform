import * as React from "react";
import { ArrowUpRight, BookOpen, FileCheck, Trophy, Phone } from "lucide-react";
import type { DocArticle } from "../../model/articles";
import styles from "./DocsArticleCard.module.css";

interface Props {
  article: DocArticle;
  index: number;
  onClick: () => void;
}

const ICONS = [FileCheck, Trophy, Phone];

export const DocsArticleCard: React.FC<Props> = ({ article, index, onClick }) => {
  const Icon = ICONS[index % ICONS.length];
  return (
    <article className={styles.card} role="button" tabIndex={0} onClick={onClick}>
      <div className={styles.cardTop}>
        <div className={styles.iconWrap}>
          <Icon size={18} />
        </div>
        <div className={styles.meta}>
          <h3 className={styles.title}>{article.title}</h3>
          <p className={styles.description}>{article.description}</p>
        </div>
      </div>
      <p className={styles.summary}>{article.summary}</p>
      <div className={styles.footer}>
        <span className={styles.action}>
          <BookOpen size={14} />
          Читать регламент
          <ArrowUpRight size={14} className={styles.arrow} />
        </span>
      </div>
    </article>
  );
};
