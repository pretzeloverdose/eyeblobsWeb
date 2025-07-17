// components/TipsLink.tsx
'use client';

import { useContext } from 'react';
import { TipsContext } from '../context/TipsContext';

export function TipsLink() {
  const { openModal } = useContext(TipsContext);

  return (
    <button onClick={openModal} className="text-inherit linkButton">
      Help
    </button>
  );
}