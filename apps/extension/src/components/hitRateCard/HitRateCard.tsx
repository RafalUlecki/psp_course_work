import { useForm, useStore } from "@tanstack/react-form";
import { type PointerEvent, type ReactElement, type SyntheticEvent } from "react";

import {
  HIT_RATE_CARD_ERROR_TEXT,
  HIT_RATE_CARD_LOADING_TEXT,
  HIT_RATE_LAST_N_OPTIONS,
  HIT_RATE_LINE_DEBOUNCE_MS,
  HIT_RATE_VENUE_FILTER_OPTIONS,
  HitRateLastN,
  HitRateVenueFilter,
} from "./constants/hitRateCardConstants";
import { useHitRateQuery } from "./requests/useHitRateQuery";
import type { HitRateCardProps } from "./types/hitRateCard";
import {
  alignLineToStep,
  formatLineValue,
  resolveLineSliderBounds,
} from "./utils/resolveLineSliderBounds";
import { resolveHitRateCardSummary } from "./utils/resolveHitRateCardSummary";
import { useDebouncedValue } from "./utils/useDebouncedValue";
import {
  CardAnchor,
  FilterLabel,
  FilterSelect,
  FiltersRow,
  HitRateCardGlobalStyle,
  LineControl,
  LineSlider,
  LineValue,
  Panel,
  Summary,
  ToggleButton,
  ToggleRow,
} from "./hitRateCardStyles";

type HitRateCardViewStatus = "loading" | "data" | "empty" | "error";

const stop = (event: SyntheticEvent): void => {
  event.stopPropagation();
};

export const HitRateCard = (props: HitRateCardProps): ReactElement => {
  const {
    fixture,
    anchorTop,
    anchorLeft,
    onLineSliderActiveChange,
    onRequestHide,
    rowElement,
  } = props;

  const { playerId, stat, fixtureLine, opponentCodes } = fixture;
  const lineSlider = resolveLineSliderBounds({ fixtureLine });
  const { min: lineMin, max: lineMax, step: lineStep } = lineSlider;

  const form = useForm({
    defaultValues: {
      lastN: HitRateLastN.Ten,
      opponent: HitRateVenueFilter.All as string,
      venue: HitRateVenueFilter.All as string,
      line: fixtureLine,
    },
  });

  const { lastN, opponent, venue, line } = useStore(form.store, (state) => ({
    lastN: state.values.lastN,
    opponent: state.values.opponent,
    venue: state.values.venue,
    line: state.values.line,
  }));

  const debouncedLine = useDebouncedValue(line, HIT_RATE_LINE_DEBOUNCE_MS);

  const query = useHitRateQuery({
    playerId,
    stat,
    line: debouncedLine,
    lastN,
    opponent,
    venue,
  });

  const summaryIsCurrent =
    line === debouncedLine && !query.isPending && !query.isFetching;

  let viewStatus: HitRateCardViewStatus = "loading";
  let summaryText = HIT_RATE_CARD_LOADING_TEXT;

  if (summaryIsCurrent && query.isError) {
    viewStatus = "error";
    summaryText = HIT_RATE_CARD_ERROR_TEXT;
  } else if (summaryIsCurrent && query.data) {
    summaryText = resolveHitRateCardSummary({
      stat,
      line: debouncedLine,
      hitRate: query.data.hitRate,
      hits: query.data.hits,
      n: query.data.n,
    });
    viewStatus = query.data.n === 0 ? "empty" : "data";
  }

  const opponentOptions = [
    { value: HitRateVenueFilter.All, label: "All" },
    ...opponentCodes.map((code) => ({ value: code, label: code })),
  ];

  const endSliderDrag = (event: PointerEvent<HTMLInputElement>): void => {
    onLineSliderActiveChange(false);
    const underPointer = document.elementFromPoint(
      event.clientX,
      event.clientY,
    );
    if (!underPointer || !rowElement.contains(underPointer)) {
      onRequestHide();
    }
  };

  return (
    <CardAnchor style={{ top: anchorTop, left: anchorLeft }}>
      <HitRateCardGlobalStyle />
      <Panel
        data-prophover-card=""
        onClick={stop}
        onMouseDown={stop}
        onMouseUp={stop}
        onPointerDown={stop}
        onPointerUp={stop}
      >
        <Summary
          data-prophover-summary=""
          data-prophover-state={viewStatus}
          $viewStatus={viewStatus}
        >
          {summaryText}
        </Summary>
        <ToggleRow data-prophover-last-n-toggle="">
          {HIT_RATE_LAST_N_OPTIONS.map((value) => (
            <ToggleButton
              key={value}
              type="button"
              data-prophover-last-n={value}
              $selected={lastN === value}
              aria-pressed={lastN === value}
              onClick={(event) => {
                event.preventDefault();
                stop(event);
                form.setFieldValue("lastN", value);
              }}
            >
              Last {value}
            </ToggleButton>
          ))}
        </ToggleRow>
        <form.Field name="line">
          {(field) => (
            <LineControl data-prophover-line-control="">
              Line
              <LineSlider
                type="range"
                data-prophover-line-slider=""
                min={lineMin}
                max={lineMax}
                step={lineStep}
                value={field.state.value}
                onPointerDown={(event) => {
                  stop(event);
                  onLineSliderActiveChange(true);
                  event.currentTarget.setPointerCapture(event.pointerId);
                }}
                onPointerUp={(event) => {
                  stop(event);
                  endSliderDrag(event);
                }}
                onPointerCancel={(event) => {
                  stop(event);
                  endSliderDrag(event);
                }}
                onInput={(event) => {
                  stop(event);
                  field.handleChange(
                    alignLineToStep(
                      Number(event.currentTarget.value),
                      lineStep,
                    ),
                  );
                }}
                onClick={stop}
                onMouseDown={stop}
                onMouseUp={stop}
                onMouseMove={stop}
                onTouchStart={stop}
                onTouchEnd={stop}
                onTouchMove={stop}
              />
              <LineValue data-prophover-line-value="">
                {formatLineValue(field.state.value)}
              </LineValue>
            </LineControl>
          )}
        </form.Field>
        <FiltersRow data-prophover-filters="">
          <form.Field name="opponent">
            {(field) => (
              <FilterLabel>
                Opponent
                <FilterSelect
                  data-prophover-opponent=""
                  value={field.state.value}
                  onClick={stop}
                  onChange={(event) => {
                    event.preventDefault();
                    stop(event);
                    field.handleChange(event.currentTarget.value);
                  }}
                >
                  {opponentOptions.map((option) => (
                    <option key={option.value || "all"} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </FilterSelect>
              </FilterLabel>
            )}
          </form.Field>
          <form.Field name="venue">
            {(field) => (
              <FilterLabel>
                Venue
                <FilterSelect
                  data-prophover-venue=""
                  value={field.state.value}
                  onClick={stop}
                  onChange={(event) => {
                    event.preventDefault();
                    stop(event);
                    field.handleChange(event.currentTarget.value);
                  }}
                >
                  {HIT_RATE_VENUE_FILTER_OPTIONS.map((option) => (
                    <option key={option.value || "all"} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </FilterSelect>
              </FilterLabel>
            )}
          </form.Field>
        </FiltersRow>
      </Panel>
    </CardAnchor>
  );
};
