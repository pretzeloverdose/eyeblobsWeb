import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import Navbar from "../components/Navbar";
import { ImageProvider } from "../context/ImageContext";
import { TipsProvider } from '../context/TipsContext';
import { TipsModal } from '../components/TipsModal';
import TagManager from 'react-gtm-module';

// Initialize GTM with your GTM ID
const tagManagerArgs = {
  gtmId: 'GTM-XBJ0EN40KZ', // Replace this with your actual GTM ID
};

TagManager.initialize(tagManagerArgs);

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