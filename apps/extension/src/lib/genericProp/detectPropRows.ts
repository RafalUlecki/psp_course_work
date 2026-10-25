import {
  COMBO_HEADER_MARK,
  DECIMAL_NUMBER_PATTERN,
  POINTS_HEADER_MARK,
  POINTS_STAT,
  PROCESSED_ROW_ATTR,
} from "./constants/genericPropConstants";
import { normalizePlayerName } from "./playerNameMap";
import type { FixtureRowProps } from "../../components/fixtureHoverRoot/types/fixtureRow";
import type {
  DetectPointsPropRowProps,
  FindNearestPrecedingHeaderTextProps,
  FindSmallestPlayerLineRowsProps,
  MatchPlayerAndLineProps,
  PlayerLineMatch,
  ProcessableElement,
} from "./types/playerLineMatch";

export const matchPlayerAndLine = (
  props: MatchPlayerAndLineProps,
): PlayerLineMatch | null => {
  const { text, playersByNormalizedName } = props;
  const normalized = normalizePlayerName(text);

  if (DECIMAL_NUMBER_PATTERN.exec(normalized) === null) {
    return null;
  }

  let best: PlayerLineMatch | null = null;

  for (const [normalizedName, playerId] of playersByNormalizedName) {
    const matchesExactly = normalized === normalizedName;
    const matchesPrefix = normalized.startsWith(`${normalizedName} `);

    if (!matchesExactly && !matchesPrefix) {
      continue;
    }

    const afterName = normalized.slice(normalizedName.length);
    const lineMatch = DECIMAL_NUMBER_PATTERN.exec(afterName);

    if (lineMatch === null) {
      continue;
    }

    const candidate: PlayerLineMatch = {
      normalizedName,
      playerId,
      line: Number(lineMatch[1]),
    };

    if (
      best === null ||
      candidate.normalizedName.length > best.normalizedName.length
    ) {
      best = candidate;
    }
  }

  return best;
};

export const isPointsMarketHeader = (headerText: string): boolean => {
  const lower = headerText.toLowerCase();

  return lower.includes(POINTS_HEADER_MARK) && !lower.includes(COMBO_HEADER_MARK);
};

export const markProcessed = (row: ProcessableElement): void => {
  row.setAttribute(PROCESSED_ROW_ATTR, "");
};

export const isProcessed = (row: ProcessableElement): boolean =>
  row.hasAttribute(PROCESSED_ROW_ATTR);

const ELEMENT_NODE = 1;
const TEXT_NODE = 3;

const isElement = (node: Node): node is Element => node.nodeType === ELEMENT_NODE;

const collectElements = (root: ParentNode): Element[] => {
  const elements: Element[] = [];

  if (isElement(root)) {
    elements.push(root);
  }

  elements.push(...root.querySelectorAll("*"));

  return elements;
};

const hasMatchingDescendant = (
  element: Element,
  playersByNormalizedName: Map<string, number>,
): boolean => {
  for (const descendant of element.querySelectorAll("*")) {
    if (
      matchPlayerAndLine({
        text: descendant.textContent ?? "",
        playersByNormalizedName,
      }) !== null
    ) {
      return true;
    }
  }

  return false;
};

export const findSmallestPlayerLineRows = (
  props: FindSmallestPlayerLineRowsProps,
): HTMLElement[] => {
  const { root, playersByNormalizedName } = props;
  const rows: HTMLElement[] = [];

  for (const element of collectElements(root)) {
    if (isProcessed(element)) {
      continue;
    }

    if (
      matchPlayerAndLine({
        text: element.textContent ?? "",
        playersByNormalizedName,
      }) === null
    ) {
      continue;
    }

    if (hasMatchingDescendant(element, playersByNormalizedName)) {
      continue;
    }

    rows.push(element as HTMLElement);
  }

  return rows;
};

const elementMatchesPlayerLine = (
  element: Element,
  playersByNormalizedName: Map<string, number>,
): boolean =>
  matchPlayerAndLine({
    text: element.textContent ?? "",
    playersByNormalizedName,
  }) !== null;

const collectHeaderFromNode = (
  node: Node | null,
  playersByNormalizedName: Map<string, number>,
): string | null => {
  let current = node;

  while (current !== null) {
    if (current.nodeType === TEXT_NODE) {
      const text = current.textContent ?? "";

      if (normalizePlayerName(text).length > 0) {
        return text;
      }
    } else if (isElement(current)) {
      if (!elementMatchesPlayerLine(current, playersByNormalizedName)) {
        const nested = collectHeaderFromNode(
          current.lastChild,
          playersByNormalizedName,
        );

        if (nested !== null) {
          return nested;
        }

        const text = current.textContent ?? "";

        if (normalizePlayerName(text).length > 0) {
          return text;
        }
      }
    }

    current = current.previousSibling;
  }

  return null;
};

export const findNearestPrecedingHeaderText = (
  props: FindNearestPrecedingHeaderTextProps,
): string => {
  const { row, playersByNormalizedName } = props;
  let current: Element | null = row;

  while (current !== null) {
    const found = collectHeaderFromNode(
      current.previousSibling,
      playersByNormalizedName,
    );

    if (found !== null) {
      return found;
    }

    current = current.parentElement;
  }

  return "";
};

const displayNameFromRow = (row: HTMLElement): string => {
  for (const line of (row.textContent ?? "").split("\n")) {
    const trimmed = line.trim();

    if (trimmed.length > 0) {
      return trimmed;
    }
  }

  return "";
};

export const detectPointsPropRow = (
  props: DetectPointsPropRowProps,
): FixtureRowProps | null => {
  const { row, playersByNormalizedName } = props;
  const match = matchPlayerAndLine({
    text: row.textContent ?? "",
    playersByNormalizedName,
  });

  if (match === null) {
    return null;
  }

  const headerText = findNearestPrecedingHeaderText({
    row,
    playersByNormalizedName,
  });

  if (!isPointsMarketHeader(headerText)) {
    return null;
  }

  return {
    player: displayNameFromRow(row) || match.normalizedName,
    playerId: String(match.playerId),
    stat: POINTS_STAT,
    fixtureLine: match.line,
    opponentCodes: [],
  };
};
