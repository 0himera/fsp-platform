import * as React from "react";
import { Card, CardHeader, CardTitle, CardContent, Button, Badge } from "@/shared/ui";
import type { User, Athlete } from "@/shared/api";
import styles from "./ProfileInfo.module.css";

interface ProfileInfoProps {
  user: User;
  athlete?: Athlete;
  onEdit: () => void;
}

export const ProfileInfo: React.FC<ProfileInfoProps> = ({ user, athlete, onEdit }) => (
  <Card className={styles.infoCard}>
    <CardHeader>
      <CardTitle>Данные профиля</CardTitle>
    </CardHeader>
    <CardContent>
      <div className={styles.detailsList}>
        <div className={styles.row}>
          <span className={styles.label}>Город:</span>
          <span className={styles.value}>{user.city || "Не указан"}</span>
        </div>
        <div className={styles.row}>
          <span className={styles.label}>Организация / Вуз:</span>
          <span className={styles.value}>{user.organization || "Не указана"}</span>
        </div>
        {athlete && (
          <div className={styles.row}>
            <span className={styles.label}>Дисциплины:</span>
            <div className={styles.badges}>
              {athlete.disciplines?.map((d) => (
                <Badge key={d} variant="secondary">
                  {d}
                </Badge>
              )) || "Не выбраны"}
            </div>
          </div>
        )}
      </div>
      <Button variant="outline" size="sm" onClick={onEdit}>
        Редактировать профиль
      </Button>
    </CardContent>
  </Card>
);
