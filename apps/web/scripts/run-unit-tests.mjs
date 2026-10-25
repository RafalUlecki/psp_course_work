import { spawnSync } from "node:child_process";
import { readdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const webRoot = join(dirname(fileURLToPath(import.meta.url)), "..");

const collectTestFiles = (dir) => {
  const files = [];

  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const path = join(dir, entry.name);

    if (entry.isDirectory()) {
      files.push(...collectTestFiles(path));
    } else if (entry.name.endsWith(".test.ts")) {
      files.push(path);
    }
  }

  return files;
};

const extensionRoot = join(webRoot, "..", "extension");
const testRoots = [join(webRoot, "src"), join(webRoot, "app"), extensionRoot];
const testFiles = testRoots.flatMap(collectTestFiles);

if (testFiles.length === 0) {
  console.error(
    "No *.test.ts files found under src/, app/, or apps/extension/",
  );
  process.exit(1);
}

const result = spawnSync("npx", ["tsx", "--test", ...testFiles], {
  stdio: "inherit",
  shell: true,
});

process.exit(result.status ?? 1);
