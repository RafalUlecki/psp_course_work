export const PROCESSED_ROW_ATTR = "data-prophover-processed";
export const OVERLAY_HOST_ATTR = "data-prophover-overlay";
export const POINTS_STAT = "PTS";
export const POINTS_HEADER_MARK = "taškai";
export const COMBO_HEADER_MARK = "+";
export const MARKET_HEADER_MARKS = [
  "tašk",
  "kamuol",
  "perdavim",
  "baud",
] as const;
export const DECIMAL_NUMBER_PATTERN = /(\d+\.\d+)/;
export const GLUED_LINE_AND_ODDS_PATTERN = /(\d+\.\d)\d*\.\d+/;
export const FETCH_HIT_RATE_MESSAGE = "FETCH_HIT_RATE" as const;
export const HIT_RATE_API_PATH = "/api/hit-rate";
export const WATCHLIST_REQUEST_MESSAGE = "WATCHLIST_REQUEST" as const;
export const WATCHLIST_API_PATH = "/api/watchlist";
export const CLIENT_ID_HEADER = "X-Client-Id";
export const SCAN_DEBOUNCE_MS = 300;
export const SCAN_RETRY_DELAYS_MS = [500, 1500, 3000] as const;
export const MARKET_HEADER_MAX_LENGTH = 100;
export const SELECTED_TAB_CLASS_PATTERN =
  /\b(?:selected|active|current|checked)\b/i;
