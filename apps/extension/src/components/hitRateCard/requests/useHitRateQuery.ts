import { useQuery } from "@tanstack/react-query";

import { fetchHitRate } from "./fetchHitRate";

interface UseHitRateQueryProps {
  playerId: string;
  stat: string;
  line: number;
  lastN: number;
  opponent: string;
  venue: string;
}

export const useHitRateQuery = (props: UseHitRateQueryProps) => {
  const { playerId, stat, line, lastN, opponent, venue } = props;

  return useQuery({
    queryKey: ["hitRate", playerId, stat, line, lastN, opponent, venue],
    queryFn: () =>
      fetchHitRate({
        playerId,
        stat,
        line,
        lastN,
        opponent,
        venue,
      }),
    retry: false,
    refetchOnWindowFocus: false,
  });
};
