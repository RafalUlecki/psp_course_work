import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "PropHover",
  description: "NBA props hit-rate helper",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
