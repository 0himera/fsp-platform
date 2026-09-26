export interface CompetitionSchedule {
  startsAt: string;
  registrationDeadline: string;
  endsAt: string;
}

export type CompetitionScheduleField = keyof CompetitionSchedule;

export function toDateTimeLocal(value: string | Date) {
  const date = typeof value === "string" ? new Date(value) : value;
  return new Date(date.getTime() - date.getTimezoneOffset() * 60_000).toISOString().slice(0, 16);
}

export function fromDateTimeLocal(value: string) {
  return new Date(value).toISOString();
}

export function createDefaultSchedule(): CompetitionSchedule {
  const startsAt = new Date();
  startsAt.setDate(startsAt.getDate() + 7);
  startsAt.setHours(10, 0, 0, 0);
  const registrationDeadline = new Date(startsAt);
  registrationDeadline.setDate(registrationDeadline.getDate() - 1);
  const endsAt = new Date(startsAt);
  endsAt.setHours(endsAt.getHours() + 4);
  return {
    startsAt: toDateTimeLocal(startsAt),
    registrationDeadline: toDateTimeLocal(registrationDeadline),
    endsAt: toDateTimeLocal(endsAt),
  };
}
