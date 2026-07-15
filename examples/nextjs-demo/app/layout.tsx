import type { ReactNode } from "react";

export const metadata = {
  title: "Task Analysis Assessment Engine — Next.js Demo"
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="tr">
      <body style={{ fontFamily: "system-ui, sans-serif", margin: "2rem", color: "#1a1a1a" }}>{children}</body>
    </html>
  );
}
