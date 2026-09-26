import * as React from "react";
import { ArrowUpRight, X } from "lucide-react";
import { APP_CONFIG } from "@/shared/config";
import type { DocArticle } from "../../model/articles";
import styles from "./DocsArticleDialog.module.css";

interface Props {
  article: DocArticle | null;
  onClose: () => void;
}

export const DocsArticleDialog: React.FC<Props> = ({ article, onClose }) => {
  const dialogRef = React.useRef<HTMLDialogElement>(null);

  React.useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    if (article && !dialog.open) dialog.showModal();
    if (!article && dialog.open) dialog.close();
  }, [article]);

  if (!article) return null;

  return (
    <dialog ref={dialogRef} className={styles.articleDialog} aria-labelledby="doc-title" onClose={onClose} onClick={(e) => e.target === e.currentTarget && onClose()}>
      <header className={styles.articleHeader}>
        <div><span>Документы Федерации</span><h2 id="doc-title">{article.title}</h2><p>{article.description}</p></div>
        <button type="button" className={styles.closeArticle} onClick={onClose} aria-label="Закрыть"><X size={19} /></button>
      </header>
      <div className={styles.articleContent}>
        <p>{article.summary}</p>
        {article.sections.map((part) => (
          <section key={part.heading}>
            <h3>{part.heading}</h3>
            {part.text && <p>{part.text}</p>}
            {part.items && <ul>{part.items.map((item) => <li key={item}>{item}</li>)}</ul>}
          </section>
        ))}
        {article.title === "Контакты Федерации" && (
          <a className={styles.articleEmail} href={`mailto:${APP_CONFIG.supportEmail}`}>
            Написать на {APP_CONFIG.supportEmail} <ArrowUpRight size={15} />
          </a>
        )}
      </div>
    </dialog>
  );
};
