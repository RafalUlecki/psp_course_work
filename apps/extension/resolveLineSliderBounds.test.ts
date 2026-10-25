import assert from "node:assert/strict";
import { describe, it } from "node:test";

import {
  formatLineValue,
  resolveLineSliderBounds,
} from "./src/components/hitRateCard/utils/resolveLineSliderBounds";

describe("resolveLineSliderBounds", () => {
  it("should use slider value 32.5 when the parsed line is 32.5", () => {
    assert.equal(resolveLineSliderBounds({ fixtureLine: 32.5 }).value, 32.5);
  });

  it("should keep slider values on the 0.5 grid when moving from a 32.5 line", () => {
    const bounds = resolveLineSliderBounds({ fixtureLine: 32.5 });

    assert.deepEqual(
      [
        bounds.value,
        bounds.value + bounds.step,
        bounds.value + 2 * bounds.step,
        bounds.max,
      ].map(formatLineValue),
      ["32.5", "33", "33.5", "42.5"],
    );
  });
});
