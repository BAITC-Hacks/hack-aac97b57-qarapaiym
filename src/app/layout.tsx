import type { Metadata } from "next";
import "./globals.css";
export const metadata: Metadata = { title: "Аким на 5 часов | Astana City Lab", description: "Five decisions. One city. Explore Astana's future in a deterministic city-management simulator." };
export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="en"><body>{children}</body></html>;
}
