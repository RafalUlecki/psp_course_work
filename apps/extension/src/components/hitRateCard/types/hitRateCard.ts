import type { FixtureRowProps } from "../../fixtureHoverRoot/types/fixtureRow";

export interface HitRateCardProps {
  fixture: FixtureRowProps;
  anchorTop: number;
  anchorLeft: number;
  onLineSliderActiveChange: (active: boolean) => void;
  onRequestHide: () => void;
  rowElement: HTMLElement;
}
