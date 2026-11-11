import assert from "node:assert/strict";
import { readdirSync, readFileSync } from "node:fs";
import path from "node:path";
import { describe, it } from "node:test";
import { fileURLToPath } from "node:url";

import { isPublicApiRoute, PUBLIC_API_ROUTES } from "./publicApiRoutes";

const apiRoot = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  "../../../app/api",
);

const collectRouteFiles = (dir: string): string[] => {
  const files: string[] = [];

  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      files.push(...collectRouteFiles(fullPath));
      continue;
    }
    if (entry.name === "route.ts") {
      files.push(fullPath);
    }
  }

  return files;
};

const toApiPath = (file: string): string => {
  const relative = path.relative(apiRoot, file).replaceAll("\\", "/");
  return `/api/${relative.replace(/\/route\.ts$/, "")}`;
};

describe("API route auth guard", () => {
  it("should allow only the login route on the public allowlist", () => {
    assert.deepEqual(PUBLIC_API_ROUTES, ["/api/auth/login"]);
  });

  it("should require requireAuth or a PUBLIC_API_ROUTES entry for every API route", () => {
    const unguarded = collectRouteFiles(apiRoot)
      .filter((file) => {
        const pathname = toApiPath(file);
        if (isPublicApiRoute({ pathname })) {
          return false;
        }
        const source = readFileSync(file, "utf8");
        return !source.includes("requireAuth");
      })
      .map(toApiPath);

    assert.deepEqual(unguarded, []);
  });
});
