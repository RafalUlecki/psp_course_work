import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { addPublicApiRoute, isPublicApiRoute } from "./publicApiRoutes";

const FUTURE_LOGIN_PATH = "/api/auth/login";

describe("publicApiRoutes", () => {
  it("should not treat an unlisted path as public", () => {
    assert.equal(isPublicApiRoute({ pathname: FUTURE_LOGIN_PATH }), false);
  });

  it("should include a path after addPublicApiRoute", () => {
    const publicRoutes = addPublicApiRoute({ pathname: FUTURE_LOGIN_PATH });

    assert.equal(
      isPublicApiRoute({ pathname: FUTURE_LOGIN_PATH, publicRoutes }),
      true,
    );
  });
});
