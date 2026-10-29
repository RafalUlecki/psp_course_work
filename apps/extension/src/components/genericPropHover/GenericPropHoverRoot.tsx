import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type ReactElement,
} from "react";
import { createRoot } from "react-dom/client";
import { StyleSheetManager } from "styled-components";

import { HitRateCard } from "../hitRateCard/HitRateCard";
import {
  OVERLAY_HOST_ATTR,
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
import type { PropRow } from "../../lib/genericProp/types/propRow";

const queryClient = new QueryClient();

const PAGE_EVENTS = [
  "click",
  "mousedown",
  "mouseup",
  "pointerdown",
  "pointerup",
  "auxclick",
  "touchstart",
  "touchend",
] as const;

interface ActiveProp {
  row: HTMLElement;
  prop: PropRow;
  anchor: { top: number; left: number };
}

interface GenericPropHoverRootProps {
  overlayHost: HTMLElement;
}

const isolateOverlayEvents = (host: HTMLElement): void => {
  for (const eventName of PAGE_EVENTS) {
    host.addEventListener(eventName, (event: Event) => {
      event.stopPropagation();
    });
  }
};

const GenericPropHoverRoot = (
  props: GenericPropHoverRootProps,
): ReactElement => {
  const { overlayHost } = props;
  const [active, setActive] = useState<ActiveProp | null>(null);
  const hoveringRowRef = useRef(false);
  const hoveringCardRef = useRef(false);
  const lineSliderActiveRef = useRef(false);
  const hideTimerRef = useRef(0);

  const cancelHide = useCallback((): void => {
    window.clearTimeout(hideTimerRef.current);
  }, []);

  const hideCard = useCallback((): void => {
    if (lineSliderActiveRef.current) {
      return;
    }

    cancelHide();
    hideTimerRef.current = window.setTimeout(() => {
      if (
        hoveringRowRef.current ||
        hoveringCardRef.current ||
        lineSliderActiveRef.current
      ) {
        return;
      }

      setActive(null);
    }, 50);
  }, [cancelHide]);

  const showRow = useCallback(
    (row: HTMLElement, prop: PropRow): void => {
      hoveringRowRef.current = true;
      cancelHide();
      const rect = row.getBoundingClientRect();
      setActive({
        row,
        prop,
        anchor: { top: rect.bottom, left: rect.left },
      });
    },
    [cancelHide],
  );

  useEffect(() => {
    const playersByNormalizedName = loadPlayerNameMap();

    const bindRow = (row: HTMLElement): void => {
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

    const bindRows = (rows: HTMLElement[]): void => {
      for (const row of rows) {
        markProcessed(row);
        bindRow(row);
      }
    };

    const scanRoot = (root: ParentNode): void => {
      if (root instanceof Node && overlayHost.contains(root)) {
        return;
      }

      bindRows(
        findSmallestPlayerLineRows({
          root,
          playersByNormalizedName,
        }),
      );
    };

    scanRoot(document.body);

    let debounceTimer = 0;
    const retryTimers: number[] = [];

    const scheduleScan = (): void => {
      window.clearTimeout(debounceTimer);
      debounceTimer = window.setTimeout(() => {
        scanRoot(document.body);
      }, SCAN_DEBOUNCE_MS);
    };

    for (const delayMs of SCAN_RETRY_DELAYS_MS) {
      retryTimers.push(
        window.setTimeout(() => {
          scanRoot(document.body);
        }, delayMs),
      );
    }

    const observer = new MutationObserver((mutations) => {
      for (const mutation of mutations) {
        if (overlayHost.contains(mutation.target)) {
          continue;
        }

        if (mutation.type === "attributes") {
          if (
            mutation.target instanceof Element &&
            isTabSelectionMutationTarget(mutation.target)
          ) {
            scheduleScan();
            return;
          }

          continue;
        }

        if (mutation.addedNodes.length > 0) {
          scheduleScan();
          return;
        }
      }
    });

    observer.observe(document.body, {
      childList: true,
      subtree: true,
      attributes: true,
      attributeFilter: [
        "aria-selected",
        "aria-current",
        "aria-pressed",
        "class",
      ],
    });

    return () => {
      observer.disconnect();
      window.clearTimeout(debounceTimer);
      for (const timer of retryTimers) {
        window.clearTimeout(timer);
      }
      cancelHide();
    };
  }, [overlayHost, showRow, hideCard, cancelHide]);

  if (active === null) {
    return <></>;
  }

  return (
    <div
      onMouseEnter={() => {
        hoveringCardRef.current = true;
        cancelHide();
      }}
      onMouseLeave={() => {
        hoveringCardRef.current = false;
        hideCard();
      }}
    >
      <HitRateCard
        prop={active.prop}
        anchorTop={active.anchor.top}
        anchorLeft={active.anchor.left}
        rowElement={active.row}
        onLineSliderActiveChange={(sliderActive) => {
          lineSliderActiveRef.current = sliderActive;
        }}
        onRequestHide={hideCard}
      />
    </div>
  );
};

export const startGenericPropHover = (): void => {
  const overlayHost = document.createElement("div");
  overlayHost.setAttribute(OVERLAY_HOST_ATTR, "");
  overlayHost.style.position = "fixed";
  overlayHost.style.inset = "0";
  overlayHost.style.pointerEvents = "none";
  overlayHost.style.zIndex = "2147483647";
  isolateOverlayEvents(overlayHost);

  const shadow = overlayHost.attachShadow({ mode: "open" });
  const styleTarget = document.createElement("div");
  const mountElement = document.createElement("div");
  mountElement.style.pointerEvents = "auto";
  shadow.append(styleTarget, mountElement);
  document.body.append(overlayHost);

  createRoot(mountElement).render(
    <QueryClientProvider client={queryClient}>
      <StyleSheetManager target={styleTarget}>
        <GenericPropHoverRoot overlayHost={overlayHost} />
      </StyleSheetManager>
    </QueryClientProvider>,
  );
};
