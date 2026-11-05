import {
  SCAN_DEBOUNCE_MS,
  SCAN_RETRY_DELAYS_MS,
} from "../../lib/genericProp/constants/genericPropConstants";
import {
  detectPointsPropRow,
  findSmallestPlayerLineRows,
  isTabSelectionMutationTarget,
  markProcessed,
} from "../../lib/genericProp/detectPropRows";
import { loadPlayerNameMap } from "../../lib/genericProp/playerNameMap";
import type {
  AttachPropRowScanProps,
  BindPropRowProps,
  BindPropRowsProps,
  MutationRequestsRescanProps,
  ScanPropRowsProps,
} from "./types/genericPropHover";

const MUTATION_ATTRIBUTE_FILTER = [
  "aria-selected",
  "aria-current",
  "aria-pressed",
  "class",
] as const;

const bindPropRow = (props: BindPropRowProps): void => {
  const {
    row,
    playersByNormalizedName,
    hoveringRowRef,
    showRow,
    hideCard,
  } = props;

  row.addEventListener("mouseenter", () => {
    const prop = detectPointsPropRow({
      row,
      playersByNormalizedName,
    });

    if (prop === null) {
      hoveringRowRef.current = false;
      hideCard();
      return;
    }

    showRow(row, prop);
  });

  row.addEventListener("mouseleave", () => {
    hoveringRowRef.current = false;
    hideCard();
  });
};

const bindPropRows = (props: BindPropRowsProps): void => {
  const {
    rows,
    playersByNormalizedName,
    hoveringRowRef,
    showRow,
    hideCard,
  } = props;

  for (const row of rows) {
    markProcessed(row);
    bindPropRow({
      row,
      playersByNormalizedName,
      hoveringRowRef,
      showRow,
      hideCard,
    });
  }
};

const scanPropRows = (props: ScanPropRowsProps): void => {
  const {
    root,
    overlayHost,
    playersByNormalizedName,
    hoveringRowRef,
    showRow,
    hideCard,
  } = props;

  if (root instanceof Node && overlayHost.contains(root)) {
    return;
  }

  bindPropRows({
    rows: findSmallestPlayerLineRows({
      root,
      playersByNormalizedName,
    }),
    playersByNormalizedName,
    hoveringRowRef,
    showRow,
    hideCard,
  });
};

const mutationRequestsRescan = (
  props: MutationRequestsRescanProps,
): boolean => {
  const { mutation, overlayHost } = props;

  if (overlayHost.contains(mutation.target)) {
    return false;
  }

  if (mutation.type === "attributes") {
    return (
      mutation.target instanceof Element &&
      isTabSelectionMutationTarget(mutation.target)
    );
  }

  return mutation.addedNodes.length > 0;
};

export const attachPropRowScan = (
  props: AttachPropRowScanProps,
): (() => void) => {
  const { overlayHost, hoveringRowRef, showRow, hideCard, cancelHide } = props;
  const playersByNormalizedName = loadPlayerNameMap();

  const scanBody = (): void => {
    scanPropRows({
      root: document.body,
      overlayHost,
      playersByNormalizedName,
      hoveringRowRef,
      showRow,
      hideCard,
    });
  };

  scanBody();

  let debounceTimer = 0;
  const retryTimers: number[] = [];

  const scheduleScan = (): void => {
    window.clearTimeout(debounceTimer);
    debounceTimer = window.setTimeout(scanBody, SCAN_DEBOUNCE_MS);
  };

  for (const delayMs of SCAN_RETRY_DELAYS_MS) {
    retryTimers.push(window.setTimeout(scanBody, delayMs));
  }

  const observer = new MutationObserver((mutations) => {
    for (const mutation of mutations) {
      if (mutationRequestsRescan({ mutation, overlayHost })) {
        scheduleScan();
        return;
      }
    }
  });

  observer.observe(document.body, {
    childList: true,
    subtree: true,
    attributes: true,
    attributeFilter: [...MUTATION_ATTRIBUTE_FILTER],
  });

  return () => {
    observer.disconnect();
    window.clearTimeout(debounceTimer);
    for (const timer of retryTimers) {
      window.clearTimeout(timer);
    }
    cancelHide();
  };
};
