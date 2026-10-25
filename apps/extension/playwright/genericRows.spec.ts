import { createServer, type IncomingMessage, type Server } from "node:http";
import { readFileSync } from "node:fs";
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
const genericRowsPath = join(
  extensionRoot,
  "../web/public/fixture/generic-rows.html",
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

test("should show the Doncic hit-rate card and ignore other rows on the generic page", async () => {
  const apiRequests: RecordedRequest[] = [];
  const consoleErrors: string[] = [];

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

  const pageHtml = readFileSync(genericRowsPath);
  const pageServer = createServer((request, response) => {
    if (request.url === "/fixture/generic-rows.html") {
      response.writeHead(200, {
        "Content-Type": "text/html; charset=utf-8",
        "Content-Security-Policy":
          "default-src 'none'; style-src 'unsafe-inline'; script-src 'unsafe-inline'; connect-src 'none'",
      });
      response.end(pageHtml);
      return;
    }

    response.writeHead(404);
    response.end();
  });

  let context: BrowserContext | undefined;

  try {
    await listen(apiServer, 3000);
    await listen(pageServer, 4173);
    const address = pageServer.address();
    const pagePort =
      address !== null && typeof address !== "string" ? address.port : 4173;

    context = await chromium.launchPersistentContext("", {
      headless: true,
      args: [
        "--headless=new",
        `--disable-extensions-except=${join(extensionRoot, "dist")}`,
        `--load-extension=${join(extensionRoot, "dist")}`,
      ],
    });

    const page: Page = await context.newPage();
    page.on("console", (message) => {
      if (message.type() === "error") {
        consoleErrors.push(message.text());
      }
    });
    page.on("pageerror", (error) => {
      consoleErrors.push(error.message);
    });

    await page.goto(
      `http://localhost:${pagePort}/fixture/generic-rows.html`,
    );
    await expect(page.locator("[data-prophover-processed]")).toHaveCount(3);

    const doncic = page.locator("#doncic-points-row");
    const beforeBox = await doncic.boundingBox();
    const beforeProbe = await page.locator("#layout-probe").boundingBox();

    await doncic.hover();
    const summary = page.locator("[data-prophover-summary]");
    await expect(summary).toHaveText("PTS over 30.5 — 60% · 6/10");
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

    await page.locator("#reaves-combo-row").hover();
    await page.locator("#jokic-rebounds-row").hover();
    await page.locator("#unknown-points-row").hover();
    await expect(page.locator("[data-prophover-card]")).toHaveCount(0);
    await expect(page.locator("#betslip")).toHaveText("Kortelė(0)");

    const playerIds = [...new Set(apiRequests.map((entry) => entry.playerId))];
    expect(playerIds).toEqual(["1629029"]);
    expect(apiRequests.some((entry) => entry.stat === "PTS")).toEqual(true);
    expect(apiRequests.some((entry) => entry.line === "30.5")).toEqual(true);
    expect(consoleErrors).toEqual([]);
  } finally {
    await context?.close();
    await closeServer(pageServer);
    await closeServer(apiServer);
  }
});
