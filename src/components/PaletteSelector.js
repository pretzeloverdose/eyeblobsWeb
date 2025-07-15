// components/PaletteSelector.js
import { useState, useEffect } from 'react';

// Import your palette components
import PrimaryPaletteGrid from './PrimaryPaletteGrid';
import ZornPaletteGrid from './ZornPaletteGrid';
import MonetPalleteGrid from './MonetPaletteGrid';
import PaletteGrid from './PaletteGrid';
import primaryPalette from '../palettes/primaryPalette';
import zornPalette from '@/palettes/zornPalette';
import monetPalette from '@/palettes/monetPalette';
import { extractImageColors } from '../services/imageColorService';

const paletteGridMap = {
  primary: PrimaryPaletteGrid,
  zorn: ZornPaletteGrid,
  monet: MonetPalleteGrid
  // Add more palette components here as needed
};

const paletteMap = {
                primary: primaryPalette,
                zorn: zornPalette,
                monet: monetPalette,
                Image: null
            };

export default function PaletteSelector({ onPrimaryPaletteAction }) {
  const [selectedPalette, setSelectedPalette] = useState('');
  const [workingPalette, setWorkingPalette] = useState(primaryPalette);
  
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
            setWorkingPalette(paletteMap[selectedValue] || primaryPalette);
        }
    };

  return (
    <div>
      <div className="mb-4" style={{ margin: '20px', clear: 'both', display: 'block' }}>
        <label htmlFor="palette-select" className="block text-sm font-medium text-gray-700">
          Select Palette:
        </label>
        <select
          id="palette-select"
          value={selectedPalette}
          onChange={handleChange}
          className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md"
        >
          <option key="Image" value="Image">Image</option>
          {Object.keys(paletteGridMap).map((key) => (
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