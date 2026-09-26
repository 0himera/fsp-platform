export { UserCard } from "./ui/UserCard";
export {
  useAthleteProfile,
  getAthleteProfile,
  useMeQuery,
  getMe,
  useAthleteQuery,
  useUpdateProfileMutation,
  useFeaturedAchievementMutation,
  useAvatarMutation,
  useUpdateRankMutation,
  userKeys,
} from "./api/userApi";
export { toAthleteProfile } from "./model/types";
export type {
  AthleteProfile,
  UserRole,
  SportDiscipline,
  SportRank,
  CompetitionHistoryItem,
  User,
  Athlete,
  MeResponse,
} from "./model/types";
export type { UpdateProfileInput } from "./api/userApi";

export {
  useNotificationsQuery,
  useReadNotificationMutation,
  useReadAllNotificationsMutation,
} from "./api/notificationsApi";
