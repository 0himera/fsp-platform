"use client";

import * as React from "react";
import { ArrowUpRight, BookOpen, X } from "lucide-react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/shared/ui";
import { APP_CONFIG, SPORT_DISCIPLINES } from "@/shared/config";
import { useMeQuery } from "@/entities/user";
import { useDeleteDocumentMutation, useDocumentsQuery, useUploadDocumentMutation } from "@/entities/document";
import styles from "./DocsSection.module.css";

const articles = [
  {
    title: "Правила вида спорта",
    description: "Правила соревнований по спортивному программированию РФ",
    summary: "Платформа поддерживает пять дисциплин спортивного программирования. Для каждого старта формат и условия участия определяются отдельным положением.",
    sections: [
      { heading: "Дисциплины", items: [...SPORT_DISCIPLINES] },
      { heading: "Перед соревнованием", text: "Проверьте положение конкретного старта: в нём организатор публикует формат, этапы, сроки и требования к участникам." },
    ],
  },
  {
    title: "Положение о рейтинге arena-2",
    description: "Внутренний регламент начисления баллов спортсменам Дагестана",
    summary: "Итоговый рейтинг складывается из очков за результаты и бонуса подтверждённого спортивного разряда с учётом активности спортсмена.",
    sections: [
      { heading: "Очки за результаты", text: "В зачёт идут четыре лучших результата. Баллы за старт зависят от уровня соревнования, места, числа участников и давности результата. Отборочные этапы в рейтинг не включаются; результаты старше трёх лет не дают очков." },
      { heading: "Бонус разряда", text: "Базовый бонус разряда умножается на коэффициент активности. Он постепенно снижается после последнего результата и становится нулевым через два года без новых результатов." },
      { heading: "Уровни соревнований", items: ["Чемпионат или Кубок России — 1000 базовых баллов", "Всероссийское соревнование — 650", "Межрегиональное соревнование — 400", "Чемпионат или Кубок Дагестана — 250", "Региональное соревнование — 120"] },
    ],
  },
  {
    title: "Контакты Федерации",
    description: APP_CONFIG.location,
    summary: "По вопросам проведения турниров и подтверждения разрядов можно связаться с Федерацией по электронной почте.",
    sections: [
      { heading: "Связаться с нами", text: `Почта Федерации: ${APP_CONFIG.supportEmail}.` },
      { heading: "Адрес", text: APP_CONFIG.location },
    ],
  },
];

export const DocsSection: React.FC = () => {
  const { data: me } = useMeQuery();
  const { data: documents = [] } = useDocumentsQuery();
  const upload = useUploadDocumentMutation();
  const remove = useDeleteDocumentMutation();
  const [title, setTitle] = React.useState("");
  const [file, setFile] = React.useState<File>();
  const [activeArticle, setActiveArticle] = React.useState<(typeof articles)[number] | null>(null);
  const articleDialog = React.useRef<HTMLDialogElement>(null);

  React.useEffect(() => {
    const dialog = articleDialog.current;
    if (!dialog) return;
    if (activeArticle && !dialog.open) dialog.showModal();
    if (!activeArticle && dialog.open) dialog.close();
  }, [activeArticle]);

  return (
    <section id="docs" className={styles.section}>
      <div className={styles.header}>
        <h2 className={styles.heading}>Документы и регламенты</h2>
        <p className={styles.description}>Официальные материалы Федерации спортивного программирования Республики Дагестан</p>
      </div>

      {documents.length > 0 && <div className={styles.documents}><h3>Файлы Федерации</h3>{documents.map((item) => <div key={item.id}><a href={item.url} target="_blank" rel="noreferrer">{item.title} · PDF</a>{me?.user.role === "organizer" && <button onClick={() => remove.mutate(item.id)}>Удалить</button>}</div>)}</div>}
      {me?.user.role === "organizer" && <form className={styles.upload} onSubmit={(event) => { event.preventDefault(); if (file && title.trim()) upload.mutate({ title: title.trim(), file }, { onSuccess: () => { setTitle(""); setFile(undefined); } }); }}><h3>Добавить документ</h3><input required value={title} onChange={(event) => setTitle(event.target.value)} placeholder="Название документа" /><input required type="file" accept="application/pdf" onChange={(event) => setFile(event.target.files?.[0])} /><button disabled={upload.isPending}>{upload.isPending ? "Загружаем…" : "Загрузить PDF"}</button></form>}

      <div className={styles.grid}>
        {articles.map((article) => <Card className={styles.card} key={article.title} role="button" tabIndex={0} aria-haspopup="dialog" onClick={() => setActiveArticle(article)} onKeyDown={(event) => { if (event.key === "Enter" || event.key === " ") { event.preventDefault(); setActiveArticle(article); } }}>
          <CardHeader>
            <CardTitle className={styles.cardTitle}>{article.title}</CardTitle>
            <CardDescription>{article.description}</CardDescription>
          </CardHeader>
          <CardContent><p className={styles.cardBody}>{article.summary}</p></CardContent>
          <CardFooter><span className={styles.openArticle}><BookOpen size={15} />Открыть статью<ArrowUpRight size={15} /></span></CardFooter>
        </Card>)}
      </div>

      <dialog ref={articleDialog} className={styles.articleDialog} aria-labelledby="document-article-title" onClose={() => setActiveArticle(null)} onClick={(event) => { if (event.target === event.currentTarget) setActiveArticle(null); }}>
        {activeArticle && <>
          <header className={styles.articleHeader}><div><span>Документы Федерации</span><h2 id="document-article-title">{activeArticle.title}</h2><p>{activeArticle.description}</p></div><button type="button" className={styles.closeArticle} onClick={() => setActiveArticle(null)} aria-label="Закрыть статью"><X size={19} /></button></header>
          <div className={styles.articleContent}>
            <p>{activeArticle.summary}</p>
            {activeArticle.sections.map((part) => <section key={part.heading}><h3>{part.heading}</h3>{part.text && <p>{part.text}</p>}{part.items && <ul>{part.items.map((item) => <li key={item}>{item}</li>)}</ul>}</section>)}
            {activeArticle.title === "Контакты Федерации" && <a className={styles.articleEmail} href={`mailto:${APP_CONFIG.supportEmail}`}>Написать на {APP_CONFIG.supportEmail} <ArrowUpRight size={15} /></a>}
          </div>
        </>}
      </dialog>
    </section>
  );
};

export default DocsSection;
