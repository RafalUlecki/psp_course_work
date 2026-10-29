import {
  COMBO_HEADER_MARK,
  DECIMAL_NUMBER_PATTERN,
  GLUED_LINE_AND_ODDS_PATTERN,
  MARKET_HEADER_MARKS,
  MARKET_HEADER_MAX_LENGTH,
  POINTS_HEADER_MARK,
  POINTS_STAT,
  PROCESSED_ROW_ATTR,
  SELECTED_TAB_CLASS_PATTERN,
} from "./constants/genericPropConstants";
import { normalizePlayerName } from "./playerNameMap";
import type { PropRow } from "./types/propRow";
import type {
  DetectPointsPropRowProps,
  FindMarketContextTextProps,
  FindNearestPrecedingHeaderTextProps,
  FindSmallestPlayerLineRowsProps,
  MatchPlayerAndLineProps,
  PlayerLineMatch,
  ProcessableElement,
} from "./types/playerLineMatch";

export const parseFirstDecimalLine = (text: string): number | null => {
  const glued = GLUED_LINE_AND_ODDS_PATTERN.exec(text);

  if (glued !== null) {
    return Number(glued[1]);
  }

  const plain = DECIMAL_NUMBER_PATTERN.exec(text);

  if (plain === null) {
    return null;
  }

  return Number(plain[1]);
};

export const matchPlayerAndLine = (
  props: MatchPlayerAndLineProps,
): PlayerLineMatch | null => {
  const { text, playersByNormalizedName } = props;
  const normalized = normalizePlayerName(text);

  if (parseFirstDecimalLine(normalized) === null) {
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
    const line = parseFirstDecimalLine(afterName);

    if (line === null) {
      continue;
    }

    const candidate: PlayerLineMatch = {
      normalizedName,
      playerId,
      line,
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

const isMarketLikeHeader = (headerText: string): boolean => {
  const trimmed = headerText.trim();

  if (trimmed.length === 0 || trimmed.length > MARKET_HEADER_MAX_LENGTH) {
    return false;
  }

  const lower = trimmed.toLowerCase();

  return MARKET_HEADER_MARKS.some((mark) => lower.includes(mark));
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

const hasTruthyAriaState = (element: Element, name: string): boolean => {
  const value = element.getAttribute(name);

  return value !== null && value !== "false";
};

const hasTabLikeSibling = (element: Element): boolean => {
  const parent = element.parentElement;

  if (parent === null) {
    return false;
  }

  for (const sibling of parent.children) {
    if (sibling === element) {
      continue;
    }

    if (sibling.getAttribute("role") === "tab") {
      return true;
    }

    if (sibling.hasAttribute("aria-selected")) {
      return true;
    }
  }

  return false;
};

export const isTabSelectionMutationTarget = (element: Element): boolean => {
  if (element.getAttribute("role") === "tab") {
    return true;
  }

  if (element.closest('[role="tablist"]') !== null) {
    return true;
  }

  return hasTabLikeSibling(element);
};

const isTabContextNode = (element: Element): boolean => {
  if (element.getAttribute("role") === "tablist") {
    return true;
  }

  if (element.getAttribute("role") === "tab") {
    return true;
  }

  return element.querySelector('[role="tab"], [role="tablist"]') !== null;
};

const isSelectedMarketChip = (element: Element): boolean => {
  if (element.getAttribute("aria-selected") === "true") {
    return true;
  }

  if (element.getAttribute("aria-pressed") === "true") {
    return true;
  }

  if (hasTruthyAriaState(element, "aria-current")) {
    return true;
  }

  return SELECTED_TAB_CLASS_PATTERN.test(element.getAttribute("class") ?? "");
};

const isShortPointsMarketLabel = (text: string): boolean => {
  const trimmed = text.trim();

  return (
    trimmed.length > 0 &&
    trimmed.length <= MARKET_HEADER_MAX_LENGTH &&
    isPointsMarketHeader(trimmed)
  );
};

const isLeafLikeLabel = (element: Element, text: string): boolean =>
  ![...element.children].some(
    (child) => (child.textContent ?? "").trim() === text,
  );

const leafMarketLabelsIn = (
  element: Element,
): { element: Element; text: string }[] => {
  const labels: { element: Element; text: string }[] = [];

  for (const candidate of [element, ...element.querySelectorAll("*")]) {
    const text = (candidate.textContent ?? "").trim();

    if (!isMarketLikeHeader(text) || !isLeafLikeLabel(candidate, text)) {
      continue;
    }

    labels.push({ element: candidate, text });
  }

  return labels;
};

const pickMarketLabel = (
  labels: { element: Element; text: string }[],
): string | null => {
  if (labels.length === 0) {
    return null;
  }

  const selected = labels.find((label) => isSelectedMarketChip(label.element));

  if (selected !== undefined) {
    return selected.text;
  }

  if (labels.length === 1) {
    return labels[0]?.text ?? null;
  }

  return null;
};

const collectMarketHeaderFromNode = (
  node: Node | null,
  playersByNormalizedName: Map<string, number>,
): string | null => {
  let current = node;

  while (current !== null) {
    if (current.nodeType === TEXT_NODE) {
      const text = (current.textContent ?? "").trim();

      if (isMarketLikeHeader(text)) {
        return text;
      }
    } else if (isElement(current)) {
      if (isTabContextNode(current)) {
        const fromTabs = pickMarketLabel(leafMarketLabelsIn(current));

        if (fromTabs !== null) {
          return fromTabs;
        }

        current = current.previousSibling;
        continue;
      }

      if (!elementMatchesPlayerLine(current, playersByNormalizedName)) {
        const picked = pickMarketLabel(leafMarketLabelsIn(current));

        if (picked !== null) {
          return picked;
        }
      }
    }

    current = current.previousSibling;
  }

  return null;
};

const findNearestPrecedingMarketHeader = (
  props: FindNearestPrecedingHeaderTextProps,
): string => {
  const { row, playersByNormalizedName } = props;
  let current: Element | null = row;

  while (current !== null) {
    const found = collectMarketHeaderFromNode(
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

const findLeafPointsMarketLabelInRoot = (root: ParentNode): string => {
  for (const element of root.querySelectorAll("*")) {
    const text = (element.textContent ?? "").trim();

    if (!isShortPointsMarketLabel(text) || !isLeafLikeLabel(element, text)) {
      continue;
    }

    if (element.getAttribute("aria-selected") === "false") {
      continue;
    }

    if (element.getAttribute("aria-pressed") === "false") {
      continue;
    }

    return text;
  }

  return "";
};

export const findMarketContextText = (
  props: FindMarketContextTextProps,
): string => {
  const { row, playersByNormalizedName } = props;
  const headerText = findNearestPrecedingMarketHeader({
    row,
    playersByNormalizedName,
  });

  if (headerText.length > 0) {
    return headerText;
  }

  const documentRoot = row.ownerDocument;

  if (documentRoot === null) {
    return "";
  }

  return findLeafPointsMarketLabelInRoot(documentRoot);
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
): PropRow | null => {
  const { row, playersByNormalizedName } = props;
  const match = matchPlayerAndLine({
    text: row.textContent ?? "",
    playersByNormalizedName,
  });

  if (match === null) {
    return null;
  }

  const marketText = findMarketContextText({
    row,
    playersByNormalizedName,
  });

  if (!isPointsMarketHeader(marketText)) {
    return null;
  }

  return {
    player: displayNameFromRow(row) || match.normalizedName,
    playerId: String(match.playerId),
    stat: POINTS_STAT,
    line: match.line,
    opponentCodes: [],
  };
};
