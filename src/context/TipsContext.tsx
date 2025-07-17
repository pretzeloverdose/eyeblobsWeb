// contexts/TipsContext.tsx
'use client';

import { createContext, useContext, useEffect, useState } from 'react';
import { usePathname } from 'next/navigation';

type TipsContent = {
  title: string;
  content: string;
};

export const TipsContext = createContext({
  isModalOpen: false,
  openModal: () => {},
  closeModal: () => {},
  currentTips: { title: '', content: '' } as TipsContent,
});

export function TipsProvider({ children }: { children: React.ReactNode }) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const pathname = usePathname();

  // Close modal when route changes
  useEffect(() => {
    setIsModalOpen(false);
  }, [pathname]);

  const tipsContentMap: Record<string, TipsContent> = {
    '/': {
      title: 'Uploading Tips',
      content: `<p style="margin-top: 15px; margin-bottom: 15px;">If you encounter error with uploading, try an image of a lower file size and allow the site to access the media locations you want</p>`,
    },
    '/page2/': {
      title: '<h1>Lightbox Tips</h1>',
      content: `<ol>
        <li>For best results without distortion, position your device parallel to the surface you are working on <img src="/images/lightboxGraphic.png" style="margin: 3px; display: block;" height="170" width="250" /></li>
        <li>To use the lighbox while working on the surface, a <a href="https://www.google.com/search?q=gooseneck+device+holder" target="_blank" style="color: #0071bd" rel="noopener noreferrer">gooseneck device holder</a> is highly recommended to keep your device steady and in the right position</li>
      </ol>`,
    },
    '/page3/': {
      title: '<h1>Edit Tips</h1>',
      content: `<ol>
      <li>The colour of the swatch on the left can be changed by tapping any region on the image above or palette below</li>
      <li>The buttons on the right allow you to edit the image</li>
      <li>The palette below can be changed by using the drop down menu next to 'Select Palette'
      </ol>`,
    },
    '/page4/': {
      title: '<h1>Grid Tips</h1>',
      content: `<ol>
        <li>You can set the Image width to the width of the area you are working on (21cm for an A4 piece of paper, for example)</li>
        <li>Grid lines are automatically generated according to the settings, with a limit of 10 across the width</li>
      </ol>`,
    },
  };

  const currentTips = tipsContentMap[pathname] || {
    title: 'General Tips',
    content: 'Here are some general tips...' + pathname,
  };

  return (
    <TipsContext.Provider
      value={{
        isModalOpen,
        openModal: () => setIsModalOpen(true),
        closeModal: () => setIsModalOpen(false),
        currentTips,
      }}
    >
      {children}
    </TipsContext.Provider>
  );
}