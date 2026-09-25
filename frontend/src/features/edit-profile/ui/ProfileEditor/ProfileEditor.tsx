"use client";

import * as React from "react";
import type { Athlete, Discipline } from "@/shared/api";
import type { UpdateProfileInput } from "@/entities/user";
import { Button, Input } from "@/shared/ui";
import styles from "./ProfileEditor.module.css";

interface Props { athlete: Athlete; disciplines: Discipline[]; saving: boolean; onSave: (input: UpdateProfileInput) => void; }

export function ProfileEditor({ athlete, disciplines, saving, onSave }: Props) {
  const [name, setName] = React.useState(athlete.full_name);
  const [city, setCity] = React.useState(athlete.city);
  const [organization, setOrganization] = React.useState(athlete.organization);
  const [selected, setSelected] = React.useState(athlete.disciplines);
  React.useEffect(() => { setName(athlete.full_name); setCity(athlete.city); setOrganization(athlete.organization); setSelected(athlete.disciplines); }, [athlete]);
  const toggle = (code: string) => setSelected((values) => values.includes(code) ? values.filter((item) => item !== code) : values.length < 5 ? [...values, code] : values);
  const submit = (event: React.FormEvent) => { event.preventDefault(); onSave({ full_name: name.trim(), city: city.trim(), organization: organization.trim(), disciplines: selected }); };

  return (
    <details className={styles.editor}>
      <summary>Редактировать профиль</summary>
      <form className={styles.form} onSubmit={submit}>
        <label>ФИО<Input required value={name} onChange={(event) => setName(event.target.value)} /></label>
        <label>Город<Input value={city} onChange={(event) => setCity(event.target.value)} /></label>
        <label className={styles.wide}>Организация<Input value={organization} onChange={(event) => setOrganization(event.target.value)} /></label>
        <fieldset><legend>Дисциплины · до 5</legend>{disciplines.map((item) => <label key={item.code}><input type="checkbox" checked={selected.includes(item.code)} onChange={() => toggle(item.code)} />{item.name}</label>)}</fieldset>
        <Button className={styles.submit} size="sm" disabled={saving}>{saving ? "Сохраняем…" : "Сохранить изменения"}</Button>
      </form>
    </details>
  );
}
