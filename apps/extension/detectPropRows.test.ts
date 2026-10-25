import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { describe, it } from "node:test";
import { fileURLToPath } from "node:url";

import { JSDOM } from "jsdom";

import {
  detectPointsPropRow,
  findSmallestPlayerLineRows,
  isPointsMarketHeader,
  isProcessed,
  markProcessed,
  matchPlayerAndLine,
} from "./src/lib/genericProp/detectPropRows";
import { loadPlayerNameMap } from "./src/lib/genericProp/playerNameMap";

const SAMPLE_ROW_TEXT =
  "Luka Doncic\nDaugiau 30.5\n1.80\nMažiau 30.5\n1.90";
const SAMPLE_ROW_TEXT_TRAILING_SPACE =
  "Luka Doncic \nDaugiau 30.5\n1.80\nMažiau 30.5\n1.90";

const playersByNormalizedName = loadPlayerNameMap();

const extensionRoot = dirname(fileURLToPath(import.meta.url));

interface ExtensionManifest {
  content_scripts: { matches: string[] }[];
  host_permissions: string[];
}

const readManifest = (): ExtensionManifest =>
  JSON.parse(
    readFileSync(join(extensionRoot, "manifest.src.json"), "utf8"),
  ) as ExtensionManifest;

const documentFrom = (html: string): Document =>
  new JSDOM(`<!DOCTYPE html><html><body>${html}</body></html>`).window
    .document;

describe("matchPlayerAndLine", () => {
  it("should resolve Luka Doncic when the row text has a trailing space after the name", () => {
    assert.equal(
      matchPlayerAndLine({
        text: SAMPLE_ROW_TEXT_TRAILING_SPACE,
        playersByNormalizedName,
      })?.playerId,
      1629029,
    );
  });

  it("should resolve Luka Doncic when the name has diacritics", () => {
    assert.equal(
      matchPlayerAndLine({
        text: "Luka Dončić\nDaugiau 30.5\n1.80",
        playersByNormalizedName,
      })?.playerId,
      1629029,
    );
  });

  it("should extract line 30.5 when the sample row lists over, odds, and under", () => {
    assert.equal(
      matchPlayerAndLine({
        text: SAMPLE_ROW_TEXT,
        playersByNormalizedName,
      })?.line,
      30.5,
    );
  });

  it("should skip the text when the name is not in the player map", () => {
    assert.equal(
      matchPlayerAndLine({
        text: "Not A Player\nDaugiau 20.5\n1.80",
        playersByNormalizedName,
      }),
      null,
    );
  });
});

describe("isPointsMarketHeader", () => {
  it("should accept the header when it contains taškai and no plus", () => {
    assert.equal(isPointsMarketHeader("Žaidėjo pelnyti taškai"), true);
  });

  it("should skip the header when it contains taškai and a plus", () => {
    assert.equal(
      isPointsMarketHeader("Žaidėjo taškai + atkovoti kamuoliai"),
      false,
    );
  });
});

describe("markProcessed", () => {
  it("should mark a row processed when markProcessed is called", () => {
    const flags = new Set<string>();
    const row = {
      setAttribute: (name: string, _value: string): void => {
        flags.add(name);
      },
      hasAttribute: (name: string): boolean => flags.has(name),
    };

    markProcessed(row);

    assert.equal(isProcessed(row), true);
  });
});

describe("detectPointsPropRow", () => {
  it("should select the smallest wrapping element when nested nodes contain the name and line", () => {
    const document = documentFrom(`
      <section>
        <h2>Žaidėjo pelnyti taškai</h2>
        <div id="row">
          <span>Luka Doncic </span>
          <div>Daugiau 30.5</div>
          <div>1.80</div>
          <div>Mažiau 30.5</div>
          <div>1.90</div>
        </div>
      </section>
    `);
    const rows = findSmallestPlayerLineRows({
      root: document.body,
      playersByNormalizedName,
    });

    assert.deepEqual(
      rows.map((row) => row.id),
      ["row"],
    );
  });

  it("should return a PTS fixture when the nearest header is a points market", () => {
    const document = documentFrom(`
      <section>
        <h2>Žaidėjo pelnyti taškai</h2>
        <div id="row">
          <span>Luka Doncic </span>
          <div>Daugiau 30.5</div>
        </div>
      </section>
    `);
    const row = document.getElementById("row");

    assert.deepEqual(
      row === null
        ? null
        : detectPointsPropRow({ row, playersByNormalizedName }),
      {
        player: "Luka Doncic",
        playerId: "1629029",
        stat: "PTS",
        fixtureLine: 30.5,
        opponentCodes: [],
      },
    );
  });

  it("should skip the row when the nearest header is a combo market", () => {
    const document = documentFrom(`
      <section>
        <h2>Žaidėjo taškai + atkovoti kamuoliai</h2>
        <div id="row">
          <span>Austin Reaves </span>
          <div>Daugiau 12.5</div>
        </div>
      </section>
    `);
    const row = document.getElementById("row");

    assert.equal(
      row === null
        ? "missing"
        : detectPointsPropRow({ row, playersByNormalizedName }),
      null,
    );
  });

  it("should skip the row when the nearest header is a rebounds market", () => {
    const document = documentFrom(`
      <section>
        <h2>Žaidėjo atkovoti kamuoliai</h2>
        <div id="row">
          <span>Nikola Jokic </span>
          <div>Daugiau 10.5</div>
        </div>
      </section>
    `);
    const row = document.getElementById("row");

    assert.equal(
      row === null
        ? "missing"
        : detectPointsPropRow({ row, playersByNormalizedName }),
      null,
    );
  });
});

describe("manifest", () => {
  it("should list the fixture match before betsson.lt in content_scripts.matches", () => {
    assert.deepEqual(readManifest().content_scripts[0]?.matches, [
      "http://localhost/fixture/*",
      "https://www.betsson.lt/*",
    ]);
  });

  it("should list the local API host in host_permissions", () => {
    assert.equal(
      readManifest().host_permissions.includes("http://localhost:3000/*"),
      true,
    );
  });
});
