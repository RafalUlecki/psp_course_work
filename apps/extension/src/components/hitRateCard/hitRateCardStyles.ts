import styled, { createGlobalStyle } from "styled-components";

const shadcnTheme = {
  background: "hsl(0 0% 100%)",
  foreground: "hsl(240 10% 3.9%)",
  card: "hsl(0 0% 100%)",
  cardForeground: "hsl(240 10% 3.9%)",
  mutedForeground: "hsl(240 3.8% 46.1%)",
  border: "hsl(240 5.9% 90%)",
  input: "hsl(240 5.9% 90%)",
  primary: "hsl(240 5.9% 10%)",
  destructive: "hsl(0 84.2% 60.2%)",
  ring: "hsl(240 5.9% 10%)",
  radius: "0.5rem",
  radiusSm: "0.375rem",
  fontSans:
    'ui-sans-serif, system-ui, -apple-system, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
};

export const HitRateCardGlobalStyle = createGlobalStyle`
  :host {
    all: initial;
  }

  *, *::before, *::after {
    box-sizing: border-box;
  }
`;

export const CardAnchor = styled.div`
  position: fixed;
  z-index: 2147483647;
  pointer-events: auto;
  padding-top: 0.5rem;
  font-family: ${shadcnTheme.fontSans};
  font-size: 0.875rem;
  line-height: 1.25rem;
  color: ${shadcnTheme.cardForeground};
  -webkit-font-smoothing: antialiased;
`;

export const Panel = styled.div`
  background: ${shadcnTheme.card};
  color: ${shadcnTheme.cardForeground};
  border: 1px solid ${shadcnTheme.border};
  border-radius: ${shadcnTheme.radius};
  box-shadow:
    0 1px 2px 0 rgb(0 0 0 / 0.05),
    0 4px 6px -1px rgb(0 0 0 / 0.1),
    0 2px 4px -2px rgb(0 0 0 / 0.1);
  padding: 1rem;
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
  width: max-content;
  min-width: 16rem;
`;

interface SummaryProps {
  $viewStatus: string;
}

export const SummaryRow = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.75rem;
`;

export const Summary = styled.div<SummaryProps>`
  white-space: nowrap;
  font-size: 0.875rem;
  font-weight: 500;
  line-height: 1.25rem;
  color: ${(props) =>
    props.$viewStatus === "error"
      ? shadcnTheme.destructive
      : shadcnTheme.cardForeground};
`;

export const ToggleRow = styled.div`
  display: inline-flex;
  flex-wrap: wrap;
  gap: 0.25rem;
  padding: 0.125rem;
  border-radius: ${shadcnTheme.radiusSm};
  background: hsl(240 4.8% 95.9%);
  max-width: 100%;
`;

interface ToggleButtonProps {
  $selected: boolean;
}

export const ToggleButton = styled.button<ToggleButtonProps>`
  border: none;
  background: ${(props) =>
    props.$selected ? shadcnTheme.background : "transparent"};
  color: ${(props) =>
    props.$selected ? shadcnTheme.foreground : shadcnTheme.mutedForeground};
  padding: 0.375rem 0.75rem;
  border-radius: calc(${shadcnTheme.radiusSm} - 2px);
  font-family: inherit;
  font-size: 0.75rem;
  font-weight: 500;
  line-height: 1rem;
  cursor: pointer;
  box-shadow: ${(props) =>
    props.$selected ? "0 1px 2px 0 rgb(0 0 0 / 0.05)" : "none"};
  transition: background 0.15s ease, color 0.15s ease;

  &:hover {
    color: ${shadcnTheme.foreground};
  }

  &:focus-visible {
    outline: 2px solid ${shadcnTheme.ring};
    outline-offset: 2px;
  }
`;

export const FiltersRow = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
  align-items: flex-start;
`;

export const FilterLabel = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.375rem;
  font-size: 0.75rem;
  font-weight: 500;
  line-height: 1rem;
  color: ${shadcnTheme.mutedForeground};
`;

export const LineControl = styled.label`
  display: flex;
  align-items: center;
  gap: 0.75rem;
  font-size: 0.75rem;
  font-weight: 500;
  color: ${shadcnTheme.mutedForeground};
`;

export const LineSlider = styled.input`
  width: 9rem;
  height: 0.25rem;
  cursor: pointer;
  accent-color: ${shadcnTheme.primary};
  background: transparent;
`;

export const LineValue = styled.span`
  min-width: 2.5rem;
  font-size: 0.875rem;
  font-weight: 500;
  font-variant-numeric: tabular-nums;
  color: ${shadcnTheme.foreground};
`;
