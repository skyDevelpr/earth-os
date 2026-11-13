import type { Metadata, Viewport } from "next";
import "./globals.css";
import "./earth-os/earth-os.css";

export const metadata: Metadata = {
  title: "EARTH OS — Planetary Intelligence Platform",
  description: "Understand Everything Happening on Earth. Real-time planetary data, satellite imagery, and environmental intelligence.",
  openGraph: {
    title: "EARTH OS — Planetary Intelligence Platform",
    description: "Understand Everything Happening on Earth. Real-time planetary data, satellite imagery, and environmental intelligence.",
  },
  twitter: {
    card: "summary_large_image",
    title: "EARTH OS — Planetary Intelligence Platform",
    description: "Understand Everything Happening on Earth. Real-time planetary data, satellite imagery, and environmental intelligence.",
  },
};

export const viewport: Viewport = {
  themeColor: "#0a0c10",
  viewportFit: "cover",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="h-full scroll-smooth antialiased dark">
      <head>
        <link rel="icon" href="/favicon.ico" type="image/x-icon" />
        <link rel="stylesheet" href="/maplibre-gl.css" />
      </head>
      <body className="bg-[#0a0c10] text-[#f0f2f5] min-h-screen flex flex-col antialiased selection:bg-[#4facfe]/30 selection:text-white">
        {children}
      </body>
    </html>
  );
}
