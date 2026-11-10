import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { hashPassword, verifyPassword } from "./passwordHash";

const PASSWORD = "correct-horse-battery";

describe("passwordHash", () => {
  it("should store a hash that is not the raw password", async () => {
    const passwordHash = await hashPassword({ password: PASSWORD });

    assert.equal(passwordHash.includes(PASSWORD), false);
  });

  it("should verify the same password against the stored hash", async () => {
    const passwordHash = await hashPassword({ password: PASSWORD });
    const matches = await verifyPassword({ password: PASSWORD, passwordHash });

    assert.equal(matches, true);
  });

  it("should reject a wrong password against the stored hash", async () => {
    const passwordHash = await hashPassword({ password: PASSWORD });
    const matches = await verifyPassword({
      password: "wrong-password",
      passwordHash,
    });

    assert.equal(matches, false);
  });

  it("should produce a different hash when hashing the same password twice", async () => {
    const first = await hashPassword({ password: PASSWORD });
    const second = await hashPassword({ password: PASSWORD });

    assert.notEqual(first, second);
  });
});
