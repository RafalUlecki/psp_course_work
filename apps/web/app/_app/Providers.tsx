"use client";

import { QueryClientProvider } from "@tanstack/react-query";
import { useServerInsertedHTML } from "next/navigation";
import { ReactNode, useState, type ReactElement } from "react";
import { ServerStyleSheet, StyleSheetManager } from "styled-components";
import { getQueryClient } from "./utils/getQueryClient";

interface ProvidersProps {
  children: ReactNode;
}

export const Providers = (props: ProvidersProps): ReactElement => {
  const { children } = props;
  const queryClient = getQueryClient();
  const [styledComponentsStyleSheet] = useState(() => new ServerStyleSheet());

  useServerInsertedHTML((): ReactElement => {
    const styles = styledComponentsStyleSheet.getStyleElement();
    styledComponentsStyleSheet.instance.clearTag();
    return <>{styles}</>;
  });

  const content =
    typeof window !== "undefined" ? (
      children
    ) : (
      <StyleSheetManager sheet={styledComponentsStyleSheet.instance}>
        {children}
      </StyleSheetManager>
    );

  return (
    <QueryClientProvider client={queryClient}>{content}</QueryClientProvider>
  );
};
