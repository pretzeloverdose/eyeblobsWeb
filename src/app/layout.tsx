import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import Navbar from "../components/Navbar";
import { ImageProvider } from "../context/ImageContext";
import { TipsProvider } from '../context/TipsContext';
import { TipsModal } from '../components/TipsModal';
import { GoogleAnalytics } from '@next/third-parties/google'
import Head from 'next/head'

// Initialize GTM with your GTM ID
const tagManagerArgs = {
  gtmId: 'GTM-XBJ0EN40KZ', // Replace this with your actual GTM ID
};

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
      <head>
        <script async src="https://www.googletagmanager.com/gtag/js?id=G-XBJ0EN40KZ"></script>
        <script>{`
          window.dataLayer = window.dataLayer || [];
          function gtag(){dataLayer.push(arguments);}
          gtag('js', new Date());

          gtag('config', 'G-XBJ0EN40KZ');
        `}</script>
      </head>
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