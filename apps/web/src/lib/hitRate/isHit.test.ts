import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { isHit } from "./isHit";

describe("isHit", () => {
  it("should return true when stat is strictly above the line", () => {
    assert.equal(isHit(25, 24), true);
  });

  it("should return true when stat is above a half-point line", () => {
    assert.equal(isHit(25, 24.5), true);
  });

  it("should return false when stat equals the line", () => {
    assert.equal(isHit(24.5, 24.5), false);
  });

  it("should return false when stat equals an integer line", () => {
    assert.equal(isHit(24, 24), false);
  });

  it("should return false when stat is below the line", () => {
    assert.equal(isHit(24, 24.5), false);
  });

  it("should return false when both values are 0", () => {
    assert.equal(isHit(0, 0), false);
  });

  it("should return true when stat is 0 and line is negative", () => {
    assert.equal(isHit(0, -0.5), true);
  });
});
