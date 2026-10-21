import type { Venue } from "@prisma/client";

export interface FilterGamesOptions {
  lastN?: number;
  opponent?: string;
  venue?: Venue;
}
