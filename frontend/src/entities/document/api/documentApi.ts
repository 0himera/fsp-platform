import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "@/shared/api";
import type { DocumentItem } from "@/shared/api";

export const documentKeys = { all: ["documents"] as const };
export function useDocumentsQuery() {
  return useQuery({ queryKey: documentKeys.all, queryFn: () => apiClient.get<DocumentItem[]>("/api/documents") });
}
export function useCompetitionDocumentsQuery(id: number) {
  return useQuery({ queryKey: [...documentKeys.all, id], queryFn: () => apiClient.get<DocumentItem[]>(`/api/competitions/${id}/documents`) });
}
export function useUploadCompetitionDocumentMutation() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: ({ id, title, file }: { id: number; title: string; file: File }) => {
      const body = new FormData(); body.set("title", title); body.set("file", file);
      return apiClient.request<DocumentItem>(`/api/competitions/${id}/documents`, { method: "POST", body });
    },
    onSuccess: (_, { id }) => client.invalidateQueries({ queryKey: [...documentKeys.all, id] }),
  });
}
export function useUploadDocumentMutation() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: ({ title, file }: { title: string; file: File }) => {
      const body = new FormData(); body.set("title", title); body.set("file", file);
      return apiClient.request<DocumentItem>("/api/documents", { method: "POST", body });
    },
    onSuccess: () => client.invalidateQueries({ queryKey: documentKeys.all }),
  });
}
export function useDeleteDocumentMutation() {
  const client = useQueryClient();
  return useMutation({ mutationFn: (id: number) => apiClient.delete(`/api/documents/${id}`), onSuccess: () => client.invalidateQueries({ queryKey: documentKeys.all }) });
}
