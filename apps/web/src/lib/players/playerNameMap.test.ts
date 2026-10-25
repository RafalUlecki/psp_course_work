import assert from "node:assert/strict";
import { describe, it } from "node:test";

import {
  buildPlayerNameMap,
  collectMissingPlayerNames,
  resolvePlayerId,
} from "./playerNameMap";

const lukaMap = (): Map<string, number> =>
  buildPlayerNameMap([{ id: 1629029, name: "Luka Doncic" }]);

describe("playerNameMap", () => {
  it("should resolve the same id when the name is padded, collapsed, or has diacritics", () => {
    const playersByNormalizedName = lukaMap();
    const ids = ["Luka Doncic ", "luka  doncic", "Luka Dončić"].map((name) =>
      resolvePlayerId({ name, playersByNormalizedName }),
    );

    assert.deepEqual(ids, [1629029, 1629029, 1629029]);
  });

  it("should name the missing player when the CSV map does not contain that player", () => {
    assert.deepEqual(
      collectMissingPlayerNames({
        requestedNames: ["Luka Doncic", "Not A Player"],
        playersByNormalizedName: lukaMap(),
      }),
      ["Not A Player"],
    );
  });
});
