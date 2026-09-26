"use client";

import * as React from "react";
import type { Athlete, Discipline } from "@/shared/api";
import { type UpdateProfileInput, useAvatarMutation } from "@/features/update-profile";
import { Button, Input } from "@/shared/ui";
import styles from "./ProfileEditor.module.css";

interface Props { athlete: Athlete; disciplines: Discipline[]; saving: boolean; onSave: (input: UpdateProfileInput) => void; }

export function ProfileEditor({ athlete, disciplines, saving, onSave }: Props) {
  const [name, setName] = React.useState(athlete.full_name);
  const [city, setCity] = React.useState(athlete.city);
  const [organization, setOrganization] = React.useState(athlete.organization);
  const [codeforcesHandle, setCodeforcesHandle] = React.useState(athlete.codeforces_handle || "");
  const [selected, setSelected] = React.useState(athlete.disciplines);
  const avatar = useAvatarMutation();

  React.useEffect(() => {
    queueMicrotask(() => {
      setName(athlete.full_name);
      setCity(athlete.city);
      setOrganization(athlete.organization);
      setCodeforcesHandle(athlete.codeforces_handle || "");
      setSelected(athlete.disciplines);
    });
  }, [athlete]);

  const toggle = (code: string) => setSelected((values) => values.includes(code) ? values.filter((item) => item !== code) : values.length < 5 ? [...values, code] : values);
  const submit = (event: React.FormEvent) => { event.preventDefault(); onSave({ full_name: name.trim(), city: city.trim(), organization: organization.trim(), disciplines: selected, codeforces_handle: codeforcesHandle.trim() }); };

  return (
    <section className={styles.editor}>
      <h2>Данные профиля</h2>
      <form className={styles.form} onSubmit={submit}>
        <label className={styles.wide}>Фото профиля<input type="file" accept="image/png,image/jpeg,image/webp" onChange={(event) => { const file = event.target.files?.[0]; if (file) avatar.mutate(file); }} /></label>
        {athlete.avatar_url && <button type="button" onClick={() => avatar.mutate(null)} disabled={avatar.isPending}>Удалить фото</button>}
        <label>ФИО<Input required value={name} onChange={(event) => setName(event.target.value)} /></label>
        <label>Город<Input value={city} onChange={(event) => setCity(event.target.value)} /></label>
        <label className={styles.wide}>Организация<Input value={organization} onChange={(event) => setOrganization(event.target.value)} /></label>
        <label className={styles.wide}>Codeforces Handle<Input placeholder="Например: tourist" value={codeforcesHandle} onChange={(event) => setCodeforcesHandle(event.target.value)} /></label>
        <fieldset><legend>Дисциплины · до 5</legend>{disciplines.map((item) => <label key={item.code}><input type="checkbox" checked={selected.includes(item.code)} onChange={() => toggle(item.code)} />{item.name}</label>)}</fieldset>
        <Button className={styles.submit} size="sm" disabled={saving}>{saving ? "Сохраняем…" : "Сохранить изменения"}</Button>
      </form>
    </section>
  );
}
