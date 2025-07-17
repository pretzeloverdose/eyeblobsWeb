import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import Navbar from "../components/Navbar";
import { ImageProvider } from "../context/ImageContext";
import { TipsProvider } from '../context/TipsContext';
import { TipsModal } from '../components/TipsModal';

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Eyeblobs",
  description: "Digital tools for traditional artists",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${geistSans.variable} ${geistMono.variable}`}>
        <ImageProvider>
          <TipsProvider>
            {children}
            <Navbar />
            <TipsModal />
          </TipsProvider>
        </ImageProvider>
      </body>
    </html>
  );
}