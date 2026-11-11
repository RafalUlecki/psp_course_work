import assert from "node:assert/strict";
import { describe, it } from "node:test";

import {
  INVALID_EMAIL_ERROR,
  INVALID_JSON_BODY_ERROR,
  INVALID_LOGIN_BODY_ERROR,
  MISSING_PASSWORD_ERROR,
} from "./errors";
import { parseLoginBody } from "./parseLoginBody";

describe("parseLoginBody", () => {
  it("should return a lowercased email when the JSON body is valid", () => {
    const result = parseLoginBody({
      bodyText: JSON.stringify({
        email: "Admin-A@Prophover.Local",
        password: "password-admin-a",
      }),
    });

    assert.deepEqual(
      result.ok ? { email: result.email, password: result.password } : null,
      { email: "admin-a@prophover.local", password: "password-admin-a" },
    );
  });

  it("should return an invalid-body error when the body is empty", () => {
    const result = parseLoginBody({ bodyText: "  " });

    assert.equal(result.ok ? null : result.error, INVALID_LOGIN_BODY_ERROR);
  });

  it("should return an invalid-JSON error when the body is not JSON", () => {
    const result = parseLoginBody({ bodyText: "not-json" });

    assert.equal(result.ok ? null : result.error, INVALID_JSON_BODY_ERROR);
  });

  it("should return an invalid-email error when the email is malformed", () => {
    const result = parseLoginBody({
      bodyText: JSON.stringify({ email: "not-an-email", password: "secret" }),
    });

    assert.equal(result.ok ? null : result.error, INVALID_EMAIL_ERROR);
  });

  it("should return a missing-password error when password is omitted", () => {
    const result = parseLoginBody({
      bodyText: JSON.stringify({ email: "admin-a@prophover.local" }),
    });

    assert.equal(result.ok ? null : result.error, MISSING_PASSWORD_ERROR);
  });
});
