import assert from "node:assert/strict";
import { describe, it } from "node:test";

import {
  addPublicApiRoute,
  isPublicApiRoute,
  LOGIN_API_PATH,
} from "./publicApiRoutes";

const UNLISTED_PATH = "/api/auth/logout";

describe("publicApiRoutes", () => {
  it("should treat the login route as public", () => {
    assert.equal(isPublicApiRoute({ pathname: LOGIN_API_PATH }), true);
  });

  it("should not treat an unlisted path as public", () => {
    assert.equal(isPublicApiRoute({ pathname: UNLISTED_PATH }), false);
  });

  it("should include a path after addPublicApiRoute", () => {
    const publicRoutes = addPublicApiRoute({ pathname: UNLISTED_PATH });

    assert.equal(
      isPublicApiRoute({ pathname: UNLISTED_PATH, publicRoutes }),
      true,
    );
  });
});
