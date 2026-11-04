import { normalizePlayerName } from "../../../../web/src/lib/players/normalizePlayerName";
import playersJson from "../../../data/players.json";

export { normalizePlayerName };

export const loadPlayerNameMap = (): Map<string, number> =>
  new Map(Object.entries(playersJson));
