import type { Metadata } from "next";
import { Providers } from "./providers";

export const metadata: Metadata = {
  title: "PropHover",
  description: "NBA props hit-rate helper",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en">
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
