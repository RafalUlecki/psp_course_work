import styled from "styled-components";

const shadcnTheme = {
  foreground: "hsl(240 10% 3.9%)",
  mutedForeground: "hsl(240 3.8% 46.1%)",
  ring: "hsl(240 5.9% 10%)",
};

interface StarButtonProps {
  $watched: boolean;
}

export const StarButton = styled.button<StarButtonProps>`
  border: none;
  background: transparent;
  padding: 0.125rem;
  margin: 0;
  cursor: pointer;
  font-size: 1.25rem;
  line-height: 1;
  color: ${(props) =>
    props.$watched ? "hsl(45 93% 47%)" : shadcnTheme.mutedForeground};

  &:hover:not(:disabled) {
    color: ${(props) =>
      props.$watched ? "hsl(45 93% 40%)" : shadcnTheme.foreground};
  }

  &:disabled {
    cursor: default;
    opacity: 0.6;
  }

  &:focus-visible {
    outline: 2px solid ${shadcnTheme.ring};
    outline-offset: 2px;
  }
`;
