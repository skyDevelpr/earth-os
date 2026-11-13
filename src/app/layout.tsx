import type { Metadata, Viewport } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "fromanother",
  description: "We are an Artist - Led Creative Agency/Studio/Collective",
  openGraph: {
    title: "fromanother",
    description: "We are an Artist - Led Creative Agency/Studio/Collective",
    images: [
      {
        url: "https://images.prismic.io/fromanother-2026/abLhU1xvIZEnjnzT_Opengraph.jpg?auto=format%2Ccompress&fit=crop&w=1200&h=630",
        width: 1200,
        height: 630,
        alt: "fromanother opengraph image",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "fromanother",
    description: "We are an Artist - Led Creative Agency/Studio/Collective",
    images: ["https://images.prismic.io/fromanother-2026/abLhU1xvIZEnjnzT_Opengraph.jpg?auto=format%2Ccompress&fit=crop&w=1200&h=630"],
  },
};

export const viewport: Viewport = {
  themeColor: "#051236",
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
    <html lang="en" className="h-full scroll-smooth antialiased">
      <head>
        <link rel="icon" href="/favicon.ico" type="image/x-icon" />
      </head>
      <body className="bg-brand-dark-blue text-brand-yellow font-twk min-h-screen flex flex-col">
        {children}
      </body>
    </html>
  );
}
