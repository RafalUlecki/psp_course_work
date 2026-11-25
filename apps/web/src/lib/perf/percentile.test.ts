import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { percentileMs, summarizeLatencies } from "./percentile";

describe("percentileMs", () => {
  it("should return 2 as p50 when samples are 1, 2, 3, 4", () => {
    assert.equal(percentileMs({ samplesMs: [1, 2, 3, 4], percentile: 50 }), 2);
  });

  it("should return 4 as p95 when samples are 1, 2, 3, 4", () => {
    assert.equal(percentileMs({ samplesMs: [1, 2, 3, 4], percentile: 95 }), 4);
  });

  it("should return 4 as max when samples are 1, 2, 3, 4", () => {
    assert.equal(summarizeLatencies([1, 2, 3, 4]).maxMs, 4);
  });
});
