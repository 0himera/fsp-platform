import { useQueryClient } from "@tanstack/react-query";
import { contestKeys } from "./queries";

export function useRefreshContest(id: number) {
  const client = useQueryClient();
  return () => {
    client.invalidateQueries({ queryKey: contestKeys.root(id) });
    client.invalidateQueries({ queryKey: ["competitions"] });
    client.invalidateQueries({ queryKey: ["rankings"] });
    client.invalidateQueries({ queryKey: ["users"] });
  };
}
