export interface PlayerLineMatch {
  normalizedName: string;
  playerId: number;
  line: number;
}

export interface MatchPlayerAndLineProps {
  text: string;
  playersByNormalizedName: Map<string, number>;
}

export interface ProcessableElement {
  setAttribute: (name: string, value: string) => void;
  hasAttribute: (name: string) => boolean;
}

export interface FindSmallestPlayerLineRowsProps {
  root: ParentNode;
  playersByNormalizedName: Map<string, number>;
}

export interface FindNearestPrecedingHeaderTextProps {
  row: Element;
  playersByNormalizedName: Map<string, number>;
}

export type FindMarketContextTextProps = FindNearestPrecedingHeaderTextProps;

export interface DetectPointsPropRowProps {
  row: HTMLElement;
  playersByNormalizedName: Map<string, number>;
}
