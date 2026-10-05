import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/toaster";
import { ThemeProvider } from "next-themes";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "MedGovern AI — Clinician-Governed Multi-Modality Healthcare Platform",
  description: "Healthcare SaaS platform supporting Allopathy, Ayurveda, and Homeopathy care tracks with clinician-governed AI assistance, safety checks, and triage.",
  keywords: ["MedGovern AI", "Healthcare", "Multi-Modality", "Allopathy", "Ayurveda", "Homeopathy", "Clinical AI", "Patient Safety"],
  authors: [{ name: "MedGovern AI Team" }],
  icons: {
    icon: "https://z-cdn.chatglm.cn/z-ai/static/logo.svg",
  },
  openGraph: {
    title: "MedGovern AI",
    description: "Clinician-Governed Multi-Modality Healthcare Platform",
    url: "https://chat.z.ai",
    siteName: "MedGovern AI",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "MedGovern AI",
    description: "Clinician-Governed Multi-Modality Healthcare Platform",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased bg-background text-foreground`}
      >
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange>
          {children}
          <Toaster />
        </ThemeProvider>
      </body>
    </html>
  );
}
