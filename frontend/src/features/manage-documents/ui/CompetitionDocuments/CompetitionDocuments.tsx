"use client";

import * as React from "react";
import { useCompetitionDocumentsQuery, useUploadCompetitionDocumentMutation } from "@/entities/document";

export function CompetitionDocuments({ id, editable }: { id: number; editable: boolean }) {
  const { data = [] } = useCompetitionDocumentsQuery(id);
  const upload = useUploadCompetitionDocumentMutation();
  const [title, setTitle] = React.useState("");
  const [file, setFile] = React.useState<File>();
  return <section style={{ margin: "1rem 0", padding: 16, border: "1px solid #ddd", borderRadius: 8 }}><h3>Документы соревнования</h3>{data.map((item) => <p key={item.id}><a href={item.url} target="_blank" rel="noreferrer">{item.title} · PDF</a></p>)}{editable && <form onSubmit={(event) => { event.preventDefault(); if (file && title.trim()) upload.mutate({ id, title: title.trim(), file }, { onSuccess: () => { setTitle(""); setFile(undefined); } }); }}><input required placeholder="Название документа" value={title} onChange={(event) => setTitle(event.target.value)} /><input required type="file" accept="application/pdf" onChange={(event) => setFile(event.target.files?.[0])} /><button disabled={upload.isPending}>Загрузить PDF</button></form>}</section>;
}
