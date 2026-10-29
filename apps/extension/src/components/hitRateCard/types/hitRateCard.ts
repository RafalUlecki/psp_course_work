import type { PropRow } from "../../../lib/genericProp/types/propRow";

export interface HitRateCardProps {
  prop: PropRow;
  anchorTop: number;
  anchorLeft: number;
  rowElement: HTMLElement;
  onLineSliderActiveChange: (active: boolean) => void;
  onRequestHide: () => void;
}
