"use client";

import * as React from "react";
import { ArrowUpRight, BookOpen } from "lucide-react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/shared/ui";
import { useMeQuery } from "@/entities/user";
import { useDocumentsQuery, useDeleteDocumentMutation } from "@/entities/document";
import { ARTICLES, type DocArticle } from "./model/articles";
import { DocsArticleDialog } from "./ui/DocsArticleDialog";
import { DocsUploadForm } from "./ui/DocsUploadForm";
import styles from "./DocsSection.module.css";

export const DocsSection: React.FC = () => {
  const { data: me } = useMeQuery();
  const { data: documents = [] } = useDocumentsQuery();
  const remove = useDeleteDocumentMutation();
  const [activeArticle, setActiveArticle] = React.useState<DocArticle | null>(null);

  return (
    <section id="docs" className={styles.section}>
      <div className={styles.header}>
        <h2 className={styles.heading}>Документы и регламенты</h2>
        <p className={styles.description}>Официальные материалы Федерации спортивного программирования Республики Дагестан</p>
      </div>

      {documents.length > 0 && (
        <div className={styles.documents}>
          <h3>Файлы Федерации</h3>
          {documents.map((item) => (
            <div key={item.id}>
              <a href={item.url} target="_blank" rel="noreferrer">{item.title} · PDF</a>
              {me?.user.role === "organizer" && <button onClick={() => remove.mutate(item.id)}>Удалить</button>}
            </div>
          ))}
        </div>
      )}

      {me?.user.role === "organizer" && <DocsUploadForm />}

      <div className={styles.grid}>
        {ARTICLES.map((article) => (
          <Card className={styles.card} key={article.title} role="button" tabIndex={0} onClick={() => setActiveArticle(article)}>
            <CardHeader><CardTitle className={styles.cardTitle}>{article.title}</CardTitle><CardDescription>{article.description}</CardDescription></CardHeader>
            <CardContent><p className={styles.cardBody}>{article.summary}</p></CardContent>
            <CardFooter><span className={styles.openArticle}><BookOpen size={15} />Открыть статью<ArrowUpRight size={15} /></span></CardFooter>
          </Card>
        ))}
      </div>

      <DocsArticleDialog article={activeArticle} onClose={() => setActiveArticle(null)} />
    </section>
  );
};

export default DocsSection;
