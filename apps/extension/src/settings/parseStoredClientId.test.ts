import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { DEFAULT_CLIENT_ID, TEST_CLIENT_B_ID } from "./constants";
import { parseStoredClientId } from "./parseStoredClientId";

describe("parseStoredClientId", () => {
  it("should return the stored client id when it is Client B", () => {
    assert.equal(parseStoredClientId(TEST_CLIENT_B_ID), TEST_CLIENT_B_ID);
  });

  it("should return the default client id when the stored value is missing", () => {
    assert.equal(parseStoredClientId(undefined), DEFAULT_CLIENT_ID);
  });

  it("should return the default client id when the stored value is unknown", () => {
    assert.equal(parseStoredClientId("Z"), DEFAULT_CLIENT_ID);
  });
});
