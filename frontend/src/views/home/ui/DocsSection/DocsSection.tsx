"use client";

import * as React from "react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/shared/ui";
import { APP_CONFIG } from "@/shared/config";
import { useMeQuery } from "@/entities/user";
import { useDeleteDocumentMutation, useDocumentsQuery, useUploadDocumentMutation } from "@/entities/document";
import styles from "./DocsSection.module.css";

export const DocsSection: React.FC = () => {
  const { data: me } = useMeQuery();
  const { data: documents = [] } = useDocumentsQuery();
  const upload = useUploadDocumentMutation();
  const remove = useDeleteDocumentMutation();
  const [title, setTitle] = React.useState("");
  const [file, setFile] = React.useState<File>();
  return (
    <section id="docs" className={styles.section}>
      <div className={styles.header}>
        <h2 className={styles.heading}>Документы и регламенты</h2>
        <p className={styles.description}>
          Официальные материалы Федерации спортивного программирования Республики Дагестан
        </p>
      </div>

      {documents.length > 0 && <div className={styles.documents}><h3>Файлы Федерации</h3>{documents.map((item) => <div key={item.id}><a href={item.url} target="_blank" rel="noreferrer">{item.title} · PDF</a>{me?.user.role === "organizer" && <button onClick={() => remove.mutate(item.id)}>Удалить</button>}</div>)}</div>}
      {me?.user.role === "organizer" && <form className={styles.upload} onSubmit={(event) => { event.preventDefault(); if (file && title.trim()) upload.mutate({ title: title.trim(), file }, { onSuccess: () => { setTitle(""); setFile(undefined); } }); }}><h3>Добавить документ</h3><input required value={title} onChange={(event) => setTitle(event.target.value)} placeholder="Название документа" /><input required type="file" accept="application/pdf" onChange={(event) => setFile(event.target.files?.[0])} /><button disabled={upload.isPending}>{upload.isPending ? "Загружаем…" : "Загрузить PDF"}</button></form>}

      <div className={styles.grid}>
        <Card className={styles.card}>
          <CardHeader>
            <CardTitle className={styles.cardTitle}>Правила вида спорта</CardTitle>
            <CardDescription>
              Правила соревнований по спортивному программированию РФ
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className={styles.cardBody}>
              Включает стандарты 5 дисциплин: алгоритмическое, продуктовое, информационная безопасность,
              робототехника и программирование БАС.
            </p>
          </CardContent>
        </Card>

        <Card className={styles.card}>
          <CardHeader>
            <CardTitle className={styles.cardTitle}>Положение о рейтинге arena-2</CardTitle>
            <CardDescription>
              Внутренний регламент начисления баллов спортсменам Дагестана
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className={styles.cardBody}>
              Математическая модель прозрачного сравнения спортивных результатов, учитывающая уровень стартов,
              разряды и давность выступлений.
            </p>
          </CardContent>
        </Card>

        <Card className={styles.card}>
          <CardHeader>
            <CardTitle className={styles.cardTitle}>Контакты Федерации</CardTitle>
            <CardDescription>{APP_CONFIG.location}</CardDescription>
          </CardHeader>
          <CardContent>
            <p className={styles.cardBody}>
              По вопросам проведения турниров и подтверждения разрядов:{" "}
              <a href={`mailto:${APP_CONFIG.supportEmail}`} className={styles.link}>
                {APP_CONFIG.supportEmail}
              </a>
            </p>
          </CardContent>
        </Card>
      </div>
    </section>
  );
};

export default DocsSection;
