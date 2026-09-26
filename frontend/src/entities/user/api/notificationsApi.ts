import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "@/shared/api";
import type { NotificationsResponse } from "@/shared/api";

export const notificationKeys = {
  all: ["notifications"] as const,
};

export function useNotificationsQuery(enabled = true) {
  return useQuery({
    queryKey: notificationKeys.all,
    queryFn: () => apiClient.get<NotificationsResponse>("/api/notifications"),
    staleTime: 1000 * 30,
    refetchInterval: 1000 * 60, // poll every minute
    enabled,
  });
}

export function useReadNotificationMutation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => apiClient.post(`/api/notifications/${id}/read`),
    onSuccess: () => qc.invalidateQueries({ queryKey: notificationKeys.all }),
  });
}

export function useReadAllNotificationsMutation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: () => apiClient.post("/api/notifications/read-all"),
    onSuccess: () => qc.invalidateQueries({ queryKey: notificationKeys.all }),
  });
}
