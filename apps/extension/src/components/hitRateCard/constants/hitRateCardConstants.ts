export enum HitRateLastN {
  Five = 5,
  Ten = 10,
}

export const HIT_RATE_LAST_N_OPTIONS: HitRateLastN[] = [
  HitRateLastN.Five,
  HitRateLastN.Ten,
];

export enum HitRateVenueFilter {
  All = "",
  Home = "home",
  Away = "away",
}

export const HIT_RATE_VENUE_FILTER_OPTIONS: {
  value: HitRateVenueFilter;
  label: string;
}[] = [
  { value: HitRateVenueFilter.All, label: "All" },
  { value: HitRateVenueFilter.Home, label: "Home" },
  { value: HitRateVenueFilter.Away, label: "Away" },
];

export const HIT_RATE_LINE_STEP = 0.5;
export const HIT_RATE_LINE_RANGE = 10;
export const HIT_RATE_LINE_MIN = 0.5;
export const HIT_RATE_LINE_DEBOUNCE_MS = 200;

export const HIT_RATE_CARD_LOADING_TEXT = "Loading…";
export const HIT_RATE_CARD_ERROR_TEXT = "error";
