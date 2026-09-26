"use client";

import * as React from "react";
import { useMeQuery } from "@/entities/user";
import { useDocumentsQuery, useDeleteDocumentMutation } from "@/entities/document";
import { ARTICLES, type DocArticle } from "./model/articles";
import { DocsArticleDialog } from "./ui/DocsArticleDialog";
import { DocsArticleCard } from "./ui/DocsArticleCard";
import { DocsUploadForm } from "./ui/DocsUploadForm";
import { DocsFileList } from "./ui/DocsFileList";
import styles from "./DocsSection.module.css";

export const DocsSection: React.FC = () => {
  const { data: me } = useMeQuery();
  const { data: documents = [] } = useDocumentsQuery();
  const remove = useDeleteDocumentMutation();
  const [activeArticle, setActiveArticle] = React.useState<DocArticle | null>(null);

  return (
    <section id="docs" className={styles.section}>
      <header className={styles.header}>
        <span className={styles.badge}>База знаний Федерации</span>
        <h1 className={styles.heading}>Документы и регламенты</h1>
        <p className={styles.description}>
          Официальные материалы Федерации спортивного программирования Республики Дагестан
        </p>
      </header>

      {me?.user.role === "organizer" && <DocsUploadForm />}

      {documents.length > 0 && (
        <DocsFileList
          documents={documents}
          isOrganizer={me?.user.role === "organizer"}
          onDelete={(id) => remove.mutate(id)}
        />
      )}

      <div className={styles.grid}>
        {ARTICLES.map((article, index) => (
          <DocsArticleCard
            key={article.title}
            article={article}
            index={index}
            onClick={() => setActiveArticle(article)}
          />
        ))}
      </div>

      <DocsArticleDialog article={activeArticle} onClose={() => setActiveArticle(null)} />
    </section>
  );
};

export default DocsSection;
