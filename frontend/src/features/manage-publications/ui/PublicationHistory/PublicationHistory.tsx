"use client";

import { useResultPublicationsQuery, useRestorePublicationMutation } from "@/entities/competition";

export function PublicationHistory({ competitionId, editable }: { competitionId: number; editable: boolean }) {
  const { data = [] } = useResultPublicationsQuery(competitionId);
  const restore = useRestorePublicationMutation();
  if (!data.length) return null;
  return <section style={{ marginTop: 16, padding: 16, border: "1px solid #ddd", borderRadius: 8 }}><h3>История публикаций протокола</h3>{data.map((item) => <div key={item.id} style={{ display: "flex", justifyContent: "space-between", gap: 12, padding: "8px 0", borderTop: "1px solid #eee" }}><span>{new Date(item.published_at).toLocaleString("ru-RU")} · {item.publisher}</span>{editable && <button disabled={restore.isPending} onClick={() => restore.mutate({ competitionId, publicationId: item.id })}>Восстановить</button>}</div>)}</section>;
}
