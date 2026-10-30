import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import {
  addWatchlistPlayer,
  fetchWatchlist,
  removeWatchlistPlayer,
} from "./fetchWatchlist";

interface UseWatchlistQueryProps {
  clientId: string;
}

export const watchlistQueryKey = (clientId: string): [string, string] => [
  "watchlist",
  clientId,
];

export const useWatchlistQuery = (props: UseWatchlistQueryProps) => {
  const { clientId } = props;

  return useQuery({
    queryKey: watchlistQueryKey(clientId),
    queryFn: () => fetchWatchlist({ clientId }),
    retry: false,
    refetchOnWindowFocus: false,
  });
};

interface ToggleWatchlistVars {
  playerId: number;
  watched: boolean;
}

export const useWatchlistToggle = (props: UseWatchlistQueryProps) => {
  const { clientId } = props;
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (vars: ToggleWatchlistVars): Promise<void> => {
      const { playerId, watched } = vars;
      if (watched) {
        await removeWatchlistPlayer({ clientId, playerId });
        return;
      }

      await addWatchlistPlayer({ clientId, playerId });
    },
    onSuccess: async (): Promise<void> => {
      await queryClient.invalidateQueries({
        queryKey: watchlistQueryKey(clientId),
      });
    },
  });
};
