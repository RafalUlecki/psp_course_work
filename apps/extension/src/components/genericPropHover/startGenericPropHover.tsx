import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { createRoot } from "react-dom/client";
import { StyleSheetManager } from "styled-components";

import { createOverlayMount } from "./createOverlayMount";
import { GenericPropHoverRoot } from "./GenericPropHoverRoot";

const queryClient = new QueryClient();

export const startGenericPropHover = (): void => {
  const { overlayHost, styleTarget, mountElement } = createOverlayMount();

  createRoot(mountElement).render(
    <QueryClientProvider client={queryClient}>
      <StyleSheetManager target={styleTarget}>
        <GenericPropHoverRoot overlayHost={overlayHost} />
      </StyleSheetManager>
    </QueryClientProvider>,
  );
};
