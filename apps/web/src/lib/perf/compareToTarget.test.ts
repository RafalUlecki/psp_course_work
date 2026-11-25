import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { isUnderTargetMs } from "./compareToTarget";

describe("isUnderTargetMs", () => {
  it("should return true when the value is below 300", () => {
    assert.equal(isUnderTargetMs({ valueMs: 299.99, targetMs: 300 }), true);
  });

  it("should return false when the value is 300", () => {
    assert.equal(isUnderTargetMs({ valueMs: 300, targetMs: 300 }), false);
  });
});
