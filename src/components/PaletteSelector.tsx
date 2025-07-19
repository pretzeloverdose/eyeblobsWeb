// components/PaletteSelector.tsx
import { useState, useEffect, useImperativeHandle, Ref, forwardRef } from 'react';

import PaletteGrid from './PaletteGrid';
import palettes from '@/palettes';
import { extractImageColors } from '../services/imageColorService';

const paletteMap: any = palettes;

type PaletteSelectorRef = {
  addToPalette: () => void;
};

type Props = {
  onPrimaryPaletteAction: (data: any) => void;
};

const PaletteSelector = forwardRef<PaletteSelectorRef, Props>(
  ({ onPrimaryPaletteAction }, ref) => {

  const [selectedPalette, setSelectedPalette] = useState('');
  const [workingPalette, setWorkingPalette] = useState(paletteMap['primary']);

  const addToPalette = () => {
    if (localStorage.getItem('selectedPalette') == "customPaletteColors") {
      setSelectedPalette("customPaletteColors");
      setWorkingPalette(getStoredPalette());
    }
  };
  
  // Load image colors on initial render
    useEffect(() => {
        const savedPalette = localStorage.getItem('selectedPalette');
        
            const loadImagePalette = async () => {
        if (savedPalette) {
                const imageColors = await extractImageColors();
                if (imageColors && localStorage.getItem('selectedPalette') == "Image") {
                    console.log("set working as image " + imageColors);
                    setWorkingPalette(imageColors);
                    // Optional: set as selected if you want image palette as default
                    setSelectedPalette("Image");
                } else if (localStorage.getItem('selectedPalette') == "customPaletteColors") {
                  setSelectedPalette("customPaletteColors");
                  setWorkingPalette(getStoredPalette());
                } else {    
                    setSelectedPalette(savedPalette);
                    console.log("setting " + paletteMap[savedPalette]);
                    setWorkingPalette(paletteMap[savedPalette]);
                }
            }
        };
        
        loadImagePalette();
    }, []);

  useImperativeHandle(ref, () => ({
    addToPalette,
  }));

  function getStoredPalette(): number[][] {
  try {
    const stored = localStorage.getItem('customPaletteColors');
    if (!stored) return [];
    
    const parsed = JSON.parse(stored);
    
    // Validate it's an array of number arrays
    if (Array.isArray(parsed) && 
        parsed.every(item => Array.isArray(item) && 
        parsed.every(item => item.every((x: any) => typeof x === 'number')))) {
      return parsed as number[][];
    }
    
    return [];
  } catch (e) {
    console.error('Failed to parse palette', e);
    return [];
  }
}
useEffect(() => {
  if (selectedPalette == "customPaletteColors") {
    setWorkingPalette(getStoredPalette());
  }
}, [selectedPalette]);

useEffect(() => {
  console.log("update");
}, [workingPalette]);

const paletteGrid = () => {
  
}


  const handleChange = async (e: { target: { value: any; }; }) => {
        const selectedValue = e.target.value;
        setSelectedPalette(selectedValue);
        localStorage.setItem('selectedPalette', selectedValue);
        
        if (selectedValue === "Image") {
            const imageColors = await extractImageColors();
            if (imageColors) {
                setWorkingPalette(imageColors);
            }
        } else {
            console.log(paletteMap[selectedValue]);
            setWorkingPalette(paletteMap[selectedValue]);
        }
    };

    const removeColor = (hIn: any, sIn: any, lIn: any) => {
      console.log("there are " + hIn, sIn, lIn);
        const newPalette = workingPalette.filter(([h, s, l]: any) => h !== hIn || s !== sIn || l !== lIn);
        setWorkingPalette(JSON.stringify(newPalette));
    }
    

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
        {workingPalette && <PaletteGrid onAction={onPrimaryPaletteAction}
                workingPalette={workingPalette}
                setWorkingPalette={setWorkingPalette}
                removeColor={removeColor}
                paletteType={selectedPalette} />
        }
      </div>
    </div>
  );
})

export default PaletteSelector;