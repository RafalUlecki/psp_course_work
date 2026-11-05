import { useCallback, useRef, useState } from "react";

import type { PropRow } from "../../lib/genericProp/types/propRow";
import type {
  ActiveProp,
  HoverCardController,
} from "./types/genericPropHover";

const HIDE_CARD_DELAY_MS = 50;

export const useHoverCardController = (): HoverCardController => {
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
    }, HIDE_CARD_DELAY_MS);
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

  const setHoveringCard = useCallback(
    (hovering: boolean): void => {
      hoveringCardRef.current = hovering;
      if (hovering) {
        cancelHide();
        return;
      }

      hideCard();
    },
    [cancelHide, hideCard],
  );

  const setLineSliderActive = useCallback((sliderActive: boolean): void => {
    lineSliderActiveRef.current = sliderActive;
  }, []);

  return {
    active,
    hoveringRowRef,
    cancelHide,
    hideCard,
    showRow,
    setHoveringCard,
    setLineSliderActive,
  };
};
