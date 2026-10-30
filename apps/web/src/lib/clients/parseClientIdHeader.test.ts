import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { CLIENT_ID_HEADER, TEST_CLIENT_A_ID } from "./constants";
import { MISSING_CLIENT_ID_ERROR } from "./errors";
import { parseClientIdHeader } from "./parseClientIdHeader";

describe("parseClientIdHeader", () => {
  it("should return the trimmed client id when X-Client-Id is present", () => {
    const result = parseClientIdHeader({
      headers: new Headers({ [CLIENT_ID_HEADER]: ` ${TEST_CLIENT_A_ID} ` }),
    });

    assert.equal(result.ok ? result.clientId : null, TEST_CLIENT_A_ID);
  });

  it("should return a missing-header error when X-Client-Id is absent", () => {
    const result = parseClientIdHeader({ headers: new Headers() });

    assert.equal(result.ok ? null : result.error, MISSING_CLIENT_ID_ERROR);
  });

  it("should return a missing-header error when X-Client-Id is blank", () => {
    const result = parseClientIdHeader({
      headers: new Headers({ [CLIENT_ID_HEADER]: "   " }),
    });

    assert.equal(result.ok ? null : result.error, MISSING_CLIENT_ID_ERROR);
  });
});
