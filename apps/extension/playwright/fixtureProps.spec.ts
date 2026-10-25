import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { chromium, expect, test, type BrowserContext, type Page } from "@playwright/test";

const extensionRoot = join(dirname(fileURLToPath(import.meta.url)), "..");
const FIXTURE_URL = "http://localhost:3000/fixture/props.html";
const LAST_10_SUMMARY = "PTS over 24.5 — 40% · 4/10";
const LAST_5_SUMMARY = "PTS over 24.5 — 40% · 2/5";

test("should show the real Jokic hit rate on the fixture page", async () => {
  const consoleErrors: string[] = [];
  let context: BrowserContext | undefined;
  const userDataDir = mkdtempSync(join(tmpdir(), "prophover-fixture-"));
  const extensionPath = join(extensionRoot, "dist");

  try {
    context = await chromium.launchPersistentContext(userDataDir, {
      headless: false,
      args: [
        "--headless=new",
        "--disable-gpu",
        `--disable-extensions-except=${extensionPath}`,
        `--load-extension=${extensionPath}`,
      ],
      ignoreDefaultArgs: ["--disable-extensions"],
    });

    if (context.serviceWorkers().length === 0) {
      await context.waitForEvent("serviceworker", { timeout: 15_000 });
    }

    const page: Page = context.pages()[0] ?? (await context.newPage());
    page.on("console", (message) => {
      if (message.type() !== "error") {
        return;
      }

      if (message.location().url.includes("favicon")) {
        return;
      }

      consoleErrors.push(message.text());
    });
    page.on("pageerror", (error) => {
      consoleErrors.push(error.message);
    });

    await page.goto(FIXTURE_URL);
    const row = page.locator("[data-prophover-row]");
    await expect(row).toHaveAttribute("data-prophover-player-id", "203999");

    await row.hover();
    const summary = page.locator("[data-prophover-summary]");
    await expect(summary).toHaveText(LAST_10_SUMMARY);
    await page.screenshot({
      path: join(extensionRoot, "test-results/ph-41-fixture-props.png"),
      fullPage: true,
    });

    await page.locator("[data-prophover-last-n='5']").hover();
    await page.locator("[data-prophover-last-n='5']").click();
    await expect(summary).toHaveText(LAST_5_SUMMARY);

    await page.locator("[data-prophover-last-n='10']").click();
    await expect(summary).toHaveText(LAST_10_SUMMARY);

    expect(consoleErrors).toEqual([]);
  } finally {
    await context?.close();
    rmSync(userDataDir, { recursive: true, force: true });
  }
});
