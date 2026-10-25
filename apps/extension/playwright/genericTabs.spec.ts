import { createServer, type IncomingMessage, type Server } from "node:http";
import { mkdtempSync, readFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { chromium, expect, test, type BrowserContext, type Page } from "@playwright/test";

interface RecordedRequest {
  playerId: string | null;
  stat: string | null;
  line: string | null;
  lastN: string | null;
}

const extensionRoot = join(dirname(fileURLToPath(import.meta.url)), "..");
const genericTabsPath = join(
  extensionRoot,
  "../web/public/fixture/generic-tabs.html",
);

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, OPTIONS",
};

const listen = (server: Server, port: number): Promise<void> =>
  new Promise((resolve, reject) => {
    server.once("error", reject);
    server.listen(port, "127.0.0.1", () => resolve());
  });

const closeServer = (server: Server): Promise<void> =>
  new Promise((resolve, reject) => {
    server.close((error) => {
      if (error) {
        reject(error);
        return;
      }

      resolve();
    });
  });

const jsonBody = (request: IncomingMessage): string => {
  const url = new URL(request.url ?? "/", "http://localhost:3000");
  const lastN = url.searchParams.get("lastN") ?? "10";
  const isFive = lastN === "5";

  return JSON.stringify({
    playerId: Number(url.searchParams.get("playerId")),
    stat: url.searchParams.get("stat"),
    line: Number(url.searchParams.get("line")),
    hitRate: isFive ? 0.8 : 0.6,
    hits: isFive ? 4 : 6,
    n: Number(lastN),
  });
};

test("should show the Doncic card after SPA row fill and hide it on a reused non-points tab", async () => {
  const apiRequests: RecordedRequest[] = [];
  const consoleErrors: string[] = [];
  let mainFrameNavigations = 0;

  const apiServer = createServer((request, response) => {
    if (request.method === "OPTIONS") {
      response.writeHead(204, corsHeaders);
      response.end();
      return;
    }

    const url = new URL(request.url ?? "/", "http://localhost:3000");
    apiRequests.push({
      playerId: url.searchParams.get("playerId"),
      stat: url.searchParams.get("stat"),
      line: url.searchParams.get("line"),
      lastN: url.searchParams.get("lastN"),
    });
    response.writeHead(200, {
      "Content-Type": "application/json",
      ...corsHeaders,
    });
    response.end(jsonBody(request));
  });

  const pageHtml = readFileSync(genericTabsPath);
  const pageServer = createServer((request, response) => {
    if (request.url === "/fixture/generic-tabs.html") {
      response.writeHead(200, {
        "Content-Type": "text/html; charset=utf-8",
        "Content-Security-Policy":
          "default-src 'none'; style-src 'unsafe-inline'; script-src 'unsafe-inline'; img-src data:; connect-src 'none'",
      });
      response.end(pageHtml);
      return;
    }

    response.writeHead(404);
    response.end();
  });

  let context: BrowserContext | undefined;
  const userDataDir = mkdtempSync(join(tmpdir(), "prophover-ext-tabs-"));

  try {
    await listen(apiServer, 3000);
    await listen(pageServer, 4174);
    const address = pageServer.address();
    const pagePort =
      address !== null && typeof address !== "string" ? address.port : 4174;
    const extensionPath = join(extensionRoot, "dist");

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
    page.on("framenavigated", (frame) => {
      if (frame === page.mainFrame()) {
        mainFrameNavigations += 1;
      }
    });
    page.on("console", (message) => {
      if (message.type() === "error") {
        consoleErrors.push(message.text());
      }
    });
    page.on("pageerror", (error) => {
      consoleErrors.push(error.message);
    });

    await page.goto(
      `http://localhost:${pagePort}/fixture/generic-tabs.html`,
    );
    await expect(page.locator("[data-prophover-processed]")).toHaveCount(2, {
      timeout: 10_000,
    });
    expect(mainFrameNavigations).toEqual(1);

    const doncic = page.locator("#doncic-row");
    await doncic.evaluate((el) => {
      el.setAttribute("data-row-identity", "doncic");
    });
    const beforeBox = await doncic.boundingBox();
    const beforeProbe = await page.locator("#layout-probe").boundingBox();

    await doncic.hover();
    const summary = page.locator("[data-prophover-summary]");
    await expect(summary).toHaveText("PTS over 30.5 — 60% · 6/10");
    await expect(summary).toContainText("over 30.5");
    expect(apiRequests.some((entry) => entry.line === "30.5")).toEqual(true);
    await expect(page.locator("#betslip")).toHaveText("Kortelė(0)");

    await page.locator("[data-prophover-last-n='5']").hover();
    await page.locator("[data-prophover-last-n='5']").click();
    await expect(summary).toHaveText("PTS over 30.5 — 80% · 4/5");
    await page.locator("[data-prophover-last-n='10']").click();
    await expect(summary).toHaveText("PTS over 30.5 — 60% · 6/10");
    await expect(page.locator("#betslip")).toHaveText("Kortelė(0)");

    const afterBox = await doncic.boundingBox();
    const afterProbe = await page.locator("#layout-probe").boundingBox();
    expect(afterBox).toEqual(beforeBox);
    expect(afterProbe).toEqual(beforeProbe);

    await page.screenshot({
      path: join(extensionRoot, "test-results/ph-41-generic-tabs-card.png"),
      fullPage: true,
    });

    const requestsAfterPoints = apiRequests.length;

    await page.locator("#layout-probe").hover();
    await expect(page.locator("[data-prophover-card]")).toHaveCount(0);

    await page.locator("#rebounds-tab").click();
    await expect(page.locator("#points-tab")).toHaveAttribute(
      "aria-selected",
      "false",
    );
    await expect(doncic).toHaveAttribute("data-row-identity", "doncic");
    await expect(doncic).toContainText("8.5");

    await doncic.hover();
    await expect(page.locator("[data-prophover-card]")).toHaveCount(0);
    expect(apiRequests.length).toEqual(requestsAfterPoints);

    await page.locator("#points-tab").click();
    await expect(page.locator("#points-tab")).toHaveAttribute(
      "aria-selected",
      "true",
    );
    await expect(doncic).toHaveAttribute("data-row-identity", "doncic");
    await expect(doncic).toContainText("30.5");

    await doncic.hover();
    await expect(summary).toHaveText("PTS over 30.5 — 60% · 6/10");
    expect(apiRequests.some((entry) => entry.line === "30.5")).toEqual(true);
    expect(mainFrameNavigations).toEqual(1);
    expect(consoleErrors).toEqual([]);
  } finally {
    await context?.close();
    rmSync(userDataDir, { recursive: true, force: true });
    await closeServer(pageServer);
    await closeServer(apiServer);
  }
});
