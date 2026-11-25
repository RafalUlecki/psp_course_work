import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { parsePerfArgs } from "./parsePerfArgs";

describe("parsePerfArgs", () => {
  it("should default measuredCount to 200 when argv is empty", () => {
    const result = parsePerfArgs({ argv: [], env: {} });
    assert.equal(result.ok ? result.args.measuredCount : null, 200);
  });

  it("should set writeReport when --write is passed", () => {
    const result = parsePerfArgs({ argv: ["--write"], env: {} });
    assert.equal(result.ok ? result.args.writeReport : false, true);
  });

  it("should return an error when --n is 0", () => {
    const result = parsePerfArgs({ argv: ["--n", "0"], env: {} });
    assert.equal(result.ok, false);
  });
});
