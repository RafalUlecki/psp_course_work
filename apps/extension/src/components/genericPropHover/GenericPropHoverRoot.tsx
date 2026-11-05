import { useEffect, type ReactElement } from "react";

import { HitRateCard } from "../hitRateCard/HitRateCard";
import { attachPropRowScan } from "./attachPropRowScan";
import type { GenericPropHoverRootProps } from "./types/genericPropHover";
import { useHoverCardController } from "./useHoverCardController";

export const GenericPropHoverRoot = (
  props: GenericPropHoverRootProps,
): ReactElement => {
  const { overlayHost } = props;
  const {
    active,
    hoveringRowRef,
    hideCard,
    showRow,
    cancelHide,
    setHoveringCard,
    setLineSliderActive,
  } = useHoverCardController();

  useEffect(() => {
    return attachPropRowScan({
      overlayHost,
      hoveringRowRef,
      showRow,
      hideCard,
      cancelHide,
    });
  }, [overlayHost, hoveringRowRef, showRow, hideCard, cancelHide]);

  if (active === null) {
    return <></>;
  }

  return (
    <div
      onMouseEnter={() => {
        setHoveringCard(true);
      }}
      onMouseLeave={() => {
        setHoveringCard(false);
      }}
    >
      <HitRateCard
        prop={active.prop}
        anchorTop={active.anchor.top}
        anchorLeft={active.anchor.left}
        rowElement={active.row}
        onLineSliderActiveChange={setLineSliderActive}
        onRequestHide={hideCard}
      />
    </div>
  );
};
