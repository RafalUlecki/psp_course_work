import type { Metadata } from "next";
import type { ReactElement } from "react";
import { Providers } from "./_app/Providers";

export const metadata: Metadata = {
  title: "PropHover",
  description: "NBA props hit-rate helper",
};

const RootLayout = (props: LayoutProps<"/">): ReactElement => {
  const { children } = props;

  return (
    <html lang="en">
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
};

export default RootLayout;
