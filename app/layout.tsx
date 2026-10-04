import type { Metadata } from "next";
import "./globals.css";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";

export const metadata: Metadata = {
  title: {
    default: "Mother Nature Academy | Outdoor Preschool in Moore County, NC",
    template: "%s | Mother Nature Academy",
  },
  description:
    "A play-based outdoor preschool on a private farm in Carthage, North Carolina. Explore our program, learning environment, hours and tuition.",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>
        <SiteHeader />
        <main>{children}</main>
        <SiteFooter />
      </body>
    </html>
  );
}
