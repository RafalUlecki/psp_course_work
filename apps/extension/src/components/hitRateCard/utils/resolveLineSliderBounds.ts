import {
  HIT_RATE_LINE_MIN,
  HIT_RATE_LINE_RANGE,
  HIT_RATE_LINE_STEP,
} from "../constants/hitRateCardConstants";

export interface LineSliderBounds {
  min: number;
  max: number;
  step: number;
  value: number;
}

export const alignLineToStep = (value: number, step: number): number =>
  Math.round(value / step) * step;

export const formatLineValue = (line: number): string => {
  const aligned = alignLineToStep(line, HIT_RATE_LINE_STEP);

  if (Math.abs(line - aligned) < 1e-6) {
    return Number.isInteger(aligned) ? String(aligned) : aligned.toFixed(1);
  }

  return String(line);
};

export const resolveLineSliderBounds = (props: {
  fixtureLine: number;
}): LineSliderBounds => {
  const { fixtureLine } = props;
  const step = HIT_RATE_LINE_STEP;
  const value = fixtureLine;
  const min = alignLineToStep(
    Math.max(HIT_RATE_LINE_MIN, fixtureLine - HIT_RATE_LINE_RANGE),
    step,
  );
  const max = alignLineToStep(fixtureLine + HIT_RATE_LINE_RANGE, step);

  return { min, max, step, value };
};
