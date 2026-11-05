import type { RefObject } from "react";

import type { PropRow } from "../../../lib/genericProp/types/propRow";

export interface ActiveProp {
  row: HTMLElement;
  prop: PropRow;
  anchor: { top: number; left: number };
}

export interface GenericPropHoverRootProps {
  overlayHost: HTMLElement;
}

export interface HoverCardController {
  active: ActiveProp | null;
  hoveringRowRef: RefObject<boolean>;
  cancelHide: () => void;
  hideCard: () => void;
  showRow: (row: HTMLElement, prop: PropRow) => void;
  setHoveringCard: (hovering: boolean) => void;
  setLineSliderActive: (active: boolean) => void;
}

export interface BindPropRowProps {
  row: HTMLElement;
  playersByNormalizedName: Map<string, number>;
  hoveringRowRef: RefObject<boolean>;
  showRow: (row: HTMLElement, prop: PropRow) => void;
  hideCard: () => void;
}

export interface BindPropRowsProps {
  rows: HTMLElement[];
  playersByNormalizedName: Map<string, number>;
  hoveringRowRef: RefObject<boolean>;
  showRow: (row: HTMLElement, prop: PropRow) => void;
  hideCard: () => void;
}

export interface ScanPropRowsProps {
  root: ParentNode;
  overlayHost: HTMLElement;
  playersByNormalizedName: Map<string, number>;
  hoveringRowRef: RefObject<boolean>;
  showRow: (row: HTMLElement, prop: PropRow) => void;
  hideCard: () => void;
}

export interface MutationRequestsRescanProps {
  mutation: MutationRecord;
  overlayHost: HTMLElement;
}

export interface AttachPropRowScanProps {
  overlayHost: HTMLElement;
  hoveringRowRef: RefObject<boolean>;
  showRow: (row: HTMLElement, prop: PropRow) => void;
  hideCard: () => void;
  cancelHide: () => void;
}

export interface OverlayMount {
  overlayHost: HTMLElement;
  styleTarget: HTMLElement;
  mountElement: HTMLElement;
}
