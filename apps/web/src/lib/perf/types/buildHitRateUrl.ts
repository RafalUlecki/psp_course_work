export interface BuildHitRateUrlProps {
  baseUrl: string;
  playerId: number;
  stat: string;
  line: number;
  lastN: number;
}

export interface LineForRequestIndexProps {
  index: number;
}