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
import type { FixtureRowProps } from "./types/fixtureRow";
import { readFixtureRow } from "./utils/readFixtureRow";

const FIXTURE_ROW_SELECTOR =
  "[data-prophover-row][data-prophover-player][data-prophover-stat][data-prophover-line][data-prophover-player-id]";

const queryClient = new QueryClient();

interface FixtureHoverRootProps {
  row: HTMLElement;
  fixture: FixtureRowProps;
}

const FixtureHoverRoot = (props: FixtureHoverRootProps): ReactElement => {
  const { row, fixture } = props;
  const [visible, setVisible] = useState(false);
  const [anchor, setAnchor] = useState({ top: 0, left: 0 });
  const lineSliderActiveRef = useRef(false);

  const showCard = useCallback((): void => {
    const rect = row.getBoundingClientRect();
    setAnchor({ top: rect.bottom, left: rect.left });
    setVisible(true);
  }, [row]);

  const hideCard = useCallback((): void => {
    if (lineSliderActiveRef.current) {
      return;
    }

    setVisible(false);
  }, []);

  useEffect(() => {
    row.addEventListener("mouseenter", showCard);
    row.addEventListener("mouseleave", hideCard);

    return () => {
      row.removeEventListener("mouseenter", showCard);
      row.removeEventListener("mouseleave", hideCard);
    };
  }, [row, showCard, hideCard]);

  if (!visible) {
    return <></>;
  }

  return (
    <HitRateCard
      fixture={fixture}
      anchorTop={anchor.top}
      anchorLeft={anchor.left}
      rowElement={row}
      onLineSliderActiveChange={(active) => {
        lineSliderActiveRef.current = active;
      }}
      onRequestHide={hideCard}
    />
  );
};

export const findAndMountFixtureHover = (): void => {
  const row = document.querySelector<HTMLElement>(FIXTURE_ROW_SELECTOR);
  if (!row) {
    return;
  }

  const fixture = readFixtureRow(row);
  if (!fixture) {
    return;
  }

  const shadowHost = document.createElement("div");
  const shadow = shadowHost.attachShadow({ mode: "open" });
  const styleTarget = document.createElement("div");
  const mountElement = document.createElement("div");
  shadow.append(styleTarget, mountElement);
  row.appendChild(shadowHost);

  createRoot(mountElement).render(
    <QueryClientProvider client={queryClient}>
      <StyleSheetManager target={styleTarget}>
        <FixtureHoverRoot row={row} fixture={fixture} />
      </StyleSheetManager>
    </QueryClientProvider>,
  );
};
