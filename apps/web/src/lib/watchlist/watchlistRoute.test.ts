import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { GET } from "../../../app/api/watchlist/route";
import { UNAUTHORIZED_ERROR } from "../auth/errors";
import { CLIENT_ID_HEADER, TEST_CLIENT_A_ID } from "../clients/constants";

describe("GET /api/watchlist", () => {
  it("should return 401 when Authorization is missing even with X-Client-Id A", async () => {
    const response = await GET(
      new Request("http://localhost/api/watchlist", {
        headers: { [CLIENT_ID_HEADER]: TEST_CLIENT_A_ID },
      }),
    );

    assert.deepEqual(
      { status: response.status, body: await response.json() },
      { status: 401, body: { error: UNAUTHORIZED_ERROR } },
    );
  });
});
