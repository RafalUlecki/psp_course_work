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
import type { FixtureRowProps } from "../fixtureHoverRoot/types/fixtureRow";
import { OVERLAY_HOST_ATTR } from "../../lib/genericProp/constants/genericPropConstants";
import {
  detectPointsPropRow,
  findSmallestPlayerLineRows,
  markProcessed,
} from "../../lib/genericProp/detectPropRows";
import { loadPlayerNameMap } from "../../lib/genericProp/playerNameMap";

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
  fixture: FixtureRowProps;
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
    (row: HTMLElement, fixture: FixtureRowProps): void => {
      hoveringRowRef.current = true;
      cancelHide();
      const rect = row.getBoundingClientRect();
      setActive({
        row,
        fixture,
        anchor: { top: rect.bottom, left: rect.left },
      });
    },
    [cancelHide],
  );

  useEffect(() => {
    const playersByNormalizedName = loadPlayerNameMap();

    const bindRow = (row: HTMLElement, fixture: FixtureRowProps): void => {
      row.addEventListener("mouseenter", () => {
        showRow(row, fixture);
      });
      row.addEventListener("mouseleave", () => {
        hoveringRowRef.current = false;
        hideCard();
      });
    };

    const scanRoot = (root: ParentNode): void => {
      if (root instanceof Node && overlayHost.contains(root)) {
        return;
      }

      for (const row of findSmallestPlayerLineRows({
        root,
        playersByNormalizedName,
      })) {
        markProcessed(row);
        const fixture = detectPointsPropRow({
          row,
          playersByNormalizedName,
        });

        if (fixture !== null) {
          bindRow(row, fixture);
        }
      }
    };

    scanRoot(document.body);

    const observer = new MutationObserver((mutations) => {
      for (const mutation of mutations) {
        for (const node of mutation.addedNodes) {
          if (node instanceof Element && !overlayHost.contains(node)) {
            scanRoot(node);
          }
        }
      }
    });

    observer.observe(document.body, { childList: true, subtree: true });

    return () => {
      observer.disconnect();
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
        fixture={active.fixture}
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
