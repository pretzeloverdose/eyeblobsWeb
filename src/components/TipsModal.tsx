// components/TipsModal.tsx
'use client';

import { useContext } from 'react';
import { TipsContext } from '../context/TipsContext';
import DOMPurify from 'dompurify';

export function TipsModal() {
  const { isModalOpen, closeModal, currentTips } = useContext(TipsContext);

  if (!isModalOpen) return null;

  // Sanitize HTML content
  const sanitizedTitle = DOMPurify.sanitize(currentTips.title);
  const sanitizedContent = DOMPurify.sanitize(currentTips.content, {
  ADD_ATTR: ['target', 'rel'],
});

  return (
    <div style={{ 
      width: '100vw', 
      height: '100vh', 
      zIndex: 1000, 
      position: 'absolute', 
      top: 0, 
      background: 'rgba(100, 100, 100, 0.5)' 
    }} className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white p-6 rounded-lg max-w-md w-full"
      style={{
        margin: 30,
        backgroundColor: '#fff',
        padding: 20,
        borderRadius: 10
      }}>
        {/* Render title as HTML */}
        <h3 
          className="text-xl font-bold mb-4"
          dangerouslySetInnerHTML={{ __html: sanitizedTitle }} 
        />
        
        {/* Render content as HTML */}
        <div 
          className="mb-4 tipsContent"
          dangerouslySetInnerHTML={{ __html: sanitizedContent }}
        />
        
        <button
          onClick={closeModal}
          className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
        >
          Close
        </button>
      </div>
    </div>
  );
}