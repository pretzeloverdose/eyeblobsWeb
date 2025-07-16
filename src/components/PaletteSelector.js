// components/PaletteSelector.js
import { useState, useEffect } from 'react';

import PaletteGrid from './PaletteGrid';
import palettes from '@/palettes';
import { extractImageColors } from '../services/imageColorService';

const paletteMap = palettes;

export default function PaletteSelector({ onPrimaryPaletteAction }) {
  const [selectedPalette, setSelectedPalette] = useState('');
  const [workingPalette, setWorkingPalette] = useState(paletteMap['primary']);
  
  // Load image colors on initial render
    useEffect(() => {
        const savedPalette = localStorage.getItem('selectedPalette');
        
            const loadImagePalette = async () => {
        if (savedPalette) {
                const imageColors = await extractImageColors();
                if (imageColors && localStorage.getItem('selectedPalette') == "Image") {
                    console.log("set working as image");
                    setWorkingPalette(imageColors);
                    // Optional: set as selected if you want image palette as default
                    setSelectedPalette("Image");
                } else {    
                    setSelectedPalette(savedPalette);
                    console.log("setting " + savedPalette);
                    setWorkingPalette(paletteMap[savedPalette] || primaryPalette);
                }
            }
        };
        
        loadImagePalette();
    }, []);

  const handleChange = async (e) => {
        const selectedValue = e.target.value;
        setSelectedPalette(selectedValue);
        localStorage.setItem('selectedPalette', selectedValue);
        
        if (selectedValue === "Image") {
            const imageColors = await extractImageColors();
            if (imageColors) {
                setWorkingPalette(imageColors);
            }
        } else {
            console.log(selectedValue);
            setWorkingPalette(paletteMap[selectedValue] || primaryPalette);
        }
    };

  return (
    <div>
      <div style={{ margin: '20px', marginTop: '3px', marginBottom: '3px', clear: 'both', display: 'block' }}>
        <label style={{ fontSize: '12px' }} htmlFor="palette-select" className="block text-sm font-medium text-gray-700">
          Select Palette: 
        </label>
        <select
          id="palette-select"
          value={selectedPalette}
          onChange={handleChange}
          style={{ marginTop: '2px !important', marginLeft: '6px', fontSize: '12px' }}
        >
          {Object.keys(paletteMap).map((key) => (
            <option key={key} value={key}>
              {key.charAt(0).toUpperCase() + key.slice(1).replace(/([A-Z])/g, ' $1')}
            </option>
          ))}
        </select>
      </div>
      
      <div className="palette-container">
        <PaletteGrid onAction={onPrimaryPaletteAction}
                workingPalette={workingPalette}
                setWorkingPalette={setWorkingPalette} />
      </div>
    </div>
  );
}