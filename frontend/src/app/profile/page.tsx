"use client";

import * as React from "react";
import Link from "next/link";
import { useMeQuery, useUpdateProfileMutation } from "@/entities/user";
import { useMyRegistrationsQuery } from "@/entities/competition";
import { useDisciplinesQuery } from "@/entities/discipline";
import { ProfileEditor } from "@/features/edit-profile";
import { AccountSecurity } from "@/features/manage-account";
import { AthleteProfileView } from "@/views/athlete-profile";
import styles from "./profile-page.module.css";

export default function ProfilePage() {
  const { data: me, isLoading } = useMeQuery();
  const { data: registrations = [] } = useMyRegistrationsQuery();
  const { data: disciplines = [] } = useDisciplinesQuery();
  const update = useUpdateProfileMutation();
  if (isLoading) return <main className={styles.message}>Загружаем профиль…</main>;
  if (!me?.user) return <main className={styles.messageCard}><h1>Войдите в аккаунт</h1><p>Личный профиль доступен после входа.</p><Link href="/login">Перейти ко входу <span>→</span></Link></main>;
  if (!me.athlete) return <main className={styles.messageCard}><h1>Профиль спортсмена не найден</h1><p>Для аккаунта организатора доступна панель соревнований.</p><Link href="/admin">Открыть панель организатора <span>→</span></Link></main>;
  return <AthleteProfileView athlete={me.athlete} own email={me.user.email} registrations={registrations} editor={<><ProfileEditor athlete={me.athlete} disciplines={disciplines} saving={update.isPending} onSave={(input) => update.mutate(input)} /><AccountSecurity email={me.user.email} /></>} />;
}
