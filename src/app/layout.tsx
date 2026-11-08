import type { Metadata, Viewport } from "next";
import { Geist } from "next/font/google";
import "./globals.css";
import { SnowFall } from "@/components/snow-fall";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Julklappsdragning",
  description: "Dra julklappar med vänner — enkelt och hemligt",
  manifest: "/manifest.webmanifest",
  appleWebApp: {
    capable: true,
    title: "Juldragning",
    statusBarStyle: "black-translucent",
  },
  icons: {
    icon: [{ url: "/icons/icon-192.png", sizes: "192x192", type: "image/png" }],
    apple: [{ url: "/icons/icon-192.png", sizes: "192x192" }],
  },
};

export const viewport: Viewport = {
  themeColor: "#0a1f14",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="sv"
      className={`${geistSans.variable} h-full antialiased`}
    >
      <body className="relative min-h-full font-sans">
        <SnowFall />
        <div className="relative z-10 flex min-h-full flex-col px-4 py-8">
          {children}
        </div>
      </body>
    </html>
  );
}
