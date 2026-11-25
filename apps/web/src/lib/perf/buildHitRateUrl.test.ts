import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { buildHitRateUrl, lineForRequestIndex } from "./buildHitRateUrl";

describe("buildHitRateUrl", () => {
  it("should put playerId stat line and lastN on the hit-rate URL", () => {
    assert.equal(
      buildHitRateUrl({
        baseUrl: "http://localhost:3000",
        playerId: 203999,
        stat: "pts",
        line: 24.5,
        lastN: 10,
      }),
      "http://localhost:3000/api/hit-rate?playerId=203999&stat=pts&line=24.5&lastN=10",
    );
  });
});

describe("lineForRequestIndex", () => {
  it("should return 14.5 as the first slider line around 24.5 ± 10", () => {
    assert.equal(lineForRequestIndex({ index: 0 }), 14.5);
  });

  it("should return 24.5 after twenty 0.5 steps from 14.5", () => {
    assert.equal(lineForRequestIndex({ index: 20 }), 24.5);
  });
});
