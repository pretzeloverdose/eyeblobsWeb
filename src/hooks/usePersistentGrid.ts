// hooks/usePersistentGrid.ts
import { useState, useEffect } from 'react';

export const usePersistentGrid = (keyPrefix: string = 'grid') => {
  // Initialize all state from localStorage

  // Other grid states
  const [gridWidth, setGridWidth] = useState(() => {
    if (typeof window === 'undefined') return '21';
    return localStorage.getItem(`${keyPrefix}-gridWidth`) || '21';
  });

  const [gridRows, setGridRows] = useState(() => {
    if (typeof window === 'undefined') return '2';
    return localStorage.getItem('gridRows') || '2';
  });

  const [gridCellWidth, setGridCellWidth] = useState(() => {
    if (typeof window === 'undefined') return '';
    return localStorage.getItem('gridCellWidth') || '';
  });

  const [color, setColor] = useState(() => {
    if (typeof window === 'undefined') return { r: 80, g: 227, b: 194 };
    const saved = localStorage.getItem('gridColor');
    return saved ? JSON.parse(saved) : { r: 80, g: 227, b: 194 };
  });

  const [strokeColor, setStrokeColor] = useState(() => {
    if (typeof window === 'undefined') return '#50e3c3';
    return localStorage.getItem('strokeColor') || '#50e3c3';
  });

  // Save to localStorage whenever state changes
  useEffect(() => {
    localStorage.setItem('gridRows', gridRows);
  }, [gridRows]);

  useEffect(() => {
    localStorage.setItem('gridCellWidth', gridCellWidth);
  }, [gridCellWidth]);

  useEffect(() => {
    localStorage.setItem('gridColor', JSON.stringify(color));
  }, [color]);

  useEffect(() => {
    localStorage.setItem('strokeColor', strokeColor);
  }, [strokeColor]);


  useEffect(() => {
    localStorage.setItem(`${keyPrefix}-gridWidth`, gridWidth);
  }, [gridWidth, keyPrefix]);

  return {
    gridWidth,
    setGridWidth,
    gridRows,
    setGridRows,
    gridCellWidth,
    setGridCellWidth,
    color,
    setColor,
    strokeColor,
    setStrokeColor
  };
};