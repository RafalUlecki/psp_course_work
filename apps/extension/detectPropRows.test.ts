import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { describe, it } from "node:test";
import { fileURLToPath } from "node:url";

import { JSDOM } from "jsdom";

import {
  detectPointsPropRow,
  findMarketContextText,
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

  it("should extract line 32.5 when the over line and odds are concatenated", () => {
    assert.equal(
      matchPlayerAndLine({
        text: "Luka Doncic Daugiau 32.51.80Mažiau 32.51.90",
        playersByNormalizedName,
      })?.line,
      32.5,
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
  it("should return a PTS prop when a team title sits between the row and the points header", () => {
    const document = documentFrom(`
      <section>
        <header>
          <div>Žaidėjo pelnyti taškai</div>
        </header>
        <div>
          <div>Los Angeles Lakers</div>
          <div id="row">
            <span>Luka Doncic </span>
            <div>Daugiau 30.5</div>
            <div>1.90</div>
            <div>Mažiau 30.5</div>
            <div>1.80</div>
          </div>
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
        line: 30.5,
        opponentCodes: [],
      },
    );
  });

  it("should skip the row when the nearest market header is assists", () => {
    const document = documentFrom(`
      <section>
        <header>
          <div>Žaidėjo rezultatyvūs perdavimai</div>
        </header>
        <div id="row">
          <span>Luka Doncic </span>
          <div>Daugiau 8.5</div>
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

  it("should skip a rebounds row when a points market section precedes it", () => {
    const document = documentFrom(`
      <section>
        <header><div>Žaidėjo pelnyti taškai</div></header>
        <div>
          <div>Los Angeles Lakers</div>
          <div>
            <span>Luka Doncic </span>
            <div>Daugiau 30.5</div>
          </div>
        </div>
      </section>
      <section>
        <header><div>Žaidėjo atkovoti kamuoliai</div></header>
        <div>
          <div>Los Angeles Lakers</div>
          <div id="row">
            <span>Luka Doncic </span>
            <div>Daugiau 7.5</div>
          </div>
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

  it("should skip the row when the nearest market header is a combo with a plus", () => {
    const document = documentFrom(`
      <section>
        <header>
          <div>Žaidėjo surinkti Taškai + Kamuoliai</div>
        </header>
        <div id="row">
          <span>Luka Doncic </span>
          <div>Daugiau 39.5</div>
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

  it("should return a PTS prop when the selected tab is a points market", () => {
    const document = documentFrom(`
      <div role="tablist">
        <button role="tab" aria-selected="true">Žaidėjo pelnyti taškai</button>
        <button role="tab" aria-selected="false">Žaidėjo atkovoti kamuoliai</button>
      </div>
      <div id="row">
        <span>Luka Doncic </span>
        <div>Daugiau 30.5</div>
      </div>
    `);
    const row = document.getElementById("row");

    assert.equal(
      row === null
        ? null
        : detectPointsPropRow({ row, playersByNormalizedName })?.stat,
      "PTS",
    );
  });

  it("should select the smallest wrapping element when nested nodes contain the name and line", () => {
    const document = documentFrom(`
      <section>
        <h2>Žaidėjo pelnyti taškai</h2>
        <div id="outer">
          <div id="row">
            <span>Luka Doncic </span>
            <div>Daugiau 30.5</div>
          </div>
        </div>
      </section>
    `);
    const ids = findSmallestPlayerLineRows({
      root: document.body,
      playersByNormalizedName,
    }).map((row) => row.id);

    assert.deepEqual(ids, ["row"]);
  });
});

describe("findMarketContextText", () => {
  it("should skip a team title and read the points market header above it", () => {
    const document = documentFrom(`
      <section>
        <header>
          <div>Žaidėjo pelnyti taškai</div>
        </header>
        <div>
          <div>Utah Jazz</div>
          <div id="row">
            <span>Luka Doncic </span>
            <div>Daugiau 30.5</div>
          </div>
        </div>
      </section>
    `);
    const row = document.getElementById("row");

    assert.equal(
      row === null
        ? ""
        : findMarketContextText({
            row,
            playersByNormalizedName,
          }).trim(),
      "Žaidėjo pelnyti taškai",
    );
  });

  it("should read a points market label from the page when no header precedes the row", () => {
    const document = documentFrom(`
      <div>Žaidėjo pelnyti taškai</div>
      <div id="row">
        <span>Zion Williamson </span>
        <div>Daugiau 20.5</div>
      </div>
    `);
    const row = document.getElementById("row");

    assert.equal(
      row === null
        ? null
        : detectPointsPropRow({ row, playersByNormalizedName })?.stat,
      "PTS",
    );
  });
});

describe("manifest", () => {
  it("should match only betsson.lt in content_scripts.matches", () => {
    assert.deepEqual(readManifest().content_scripts[0]?.matches, [
      "https://www.betsson.lt/*",
    ]);
  });
});
