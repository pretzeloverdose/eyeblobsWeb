'use client'
import React, { createContext, useContext, useState } from "react";

type ImageContextType = {
  image: string | null;
  setImage: (img: string | null) => void;
};

const ImageContext = createContext<ImageContextType | undefined>(undefined);

export function ImageProvider({ children }: { children: React.ReactNode }) {
  const [image, setImage] = useState<string | null>(null);
  return (
    <ImageContext.Provider value={{ image, setImage }}>
      {children}
    </ImageContext.Provider>
  );
}

export function useImage() {
  const context = useContext(ImageContext);
  if (!context) throw new Error("useImage must be used within ImageProvider");
  return context;
}