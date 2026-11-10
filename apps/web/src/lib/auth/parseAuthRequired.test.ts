import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { parseAuthRequired } from "./parseAuthRequired";

describe("parseAuthRequired", () => {
  it("should default to true when AUTH_REQUIRED is missing", () => {
    assert.equal(parseAuthRequired({ raw: undefined }), true);
  });

  it("should return false when AUTH_REQUIRED is false", () => {
    assert.equal(parseAuthRequired({ raw: "false" }), false);
  });

  it("should return true when AUTH_REQUIRED is true", () => {
    assert.equal(parseAuthRequired({ raw: "true" }), true);
  });
});
