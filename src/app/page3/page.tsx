'use client';
import { useEffect, useRef, useState } from 'react';
import { ReactZoomPanPinchRef, TransformComponent, TransformWrapper } from 'react-zoom-pan-pinch';

import zornPalette from '@/palettes/zornPalette';
import PaletteSelector from '../../components/PaletteSelector';
import { extractImageColors } from '../../services/imageColorService';
import palettes from '@/palettes';

// Helper function to convert HEX to RGB
function hexToRgb(hex: string) {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `rgb(${r}, ${g}, ${b})`;
}

function hexToCmyk(hex: string): string {
  // Remove "#" if present
  hex = hex.replace(/^#/, "");

  // Validate hex length (3 or 6)
  if (hex.length !== 3 && hex.length !== 6) {
    throw new Error("Invalid hex color length");
  }

  // Parse shorthand hex (#fff → #ffffff)
  if (hex.length === 3) {
    hex = hex.split("").map(char => char + char).join("");
  }

  // Parse RGB components
  const r = parseInt(hex.substring(0, 2), 16);
  const g = parseInt(hex.substring(2, 4), 16);
  const b = parseInt(hex.substring(4, 6), 16);

  // Normalize RGB to 0–1
  const rNorm = r / 255;
  const gNorm = g / 255;
  const bNorm = b / 255;

  // Calculate K (black) component
  const k = 1 - Math.max(rNorm, gNorm, bNorm);

  // Handle pure black case
  if (k === 1) {
    return "C:0 M:0 Y:0 K:100";
  }

  // Calculate CMYK components (0–100 scale)
  const c = ((1 - rNorm - k) / (1 - k)) * 100;
  const m = ((1 - gNorm - k) / (1 - k)) * 100;
  const y = ((1 - bNorm - k) / (1 - k)) * 100;
  const kScaled = k * 100;

  // Round to nearest integer (optional, adjust as needed)
  const format = (val: number) => Math.round(val);

  return `C:${format(c)} M:${format(m)} Y:${format(y)} K:${format(kScaled)}`;
}



export default function Page3() {
  const [imageSrc, setImageSrc] = useState<string | null>(null);
  const [originalImageSrc, setOriginalImageSrc] = useState<string | null>(null);
  const imgRef = useRef<HTMLImageElement | null>(null);
  const [pixelColor, setPixelColor] = useState('#dddddd');
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const transformRef = useRef<ReactZoomPanPinchRef | null>(null);
  const [transformState, setTransformState] = useState({
    scale: 1,
    positionX: 0,
    positionY: 0
  });
  const [showStrengthModal, setShowStrengthModal] = useState(false);
  const [strengthValue, setStrengthValue] = useState("30"); // Default value
  const [paletteToUse, setPaletteToUse] = useState<string>(() => {
    if (typeof window !== 'undefined') {
      console.log("this " + localStorage.getItem('selectedPalette'));
      return localStorage.getItem('selectedPalette') || '';
    }
    return '';
  });
  const [paletteData, setPaletteData] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);


  const handlePaletteAction = (data: any) => {
    console.log("Received from PrimaryPaletteGrid:", data);
    setPaletteData(data);
    setPixelColor(data.hex);
    localStorage.setItem('pixelColor', data.hex);
    // Do something with the data
  };

  const handleTransformEnd = () => {
    if (!transformRef.current || !transformRef.current.state) return;
    
    const { scale, positionX, positionY } = transformRef.current.state;
    setTransformState({
      scale,
      positionX,
      positionY
    });
  };

  useEffect(() => {
    // Retrieve from localStorage on component mount
    const savedImage = localStorage.getItem('savedImage');
    const originalImage = localStorage.getItem('savedImageOriginal');
    const storedPixelColor = localStorage.getItem('pixelColor');
    if (storedPixelColor) {
      console.log("bar");
      setPixelColor(storedPixelColor);
    }
    if (savedImage) {
      setImageSrc(savedImage);
      setOriginalImageSrc(originalImage);
    }
  }, []);

  const revertToOriginal = () => {
    if (originalImageSrc) {
      setImageSrc(originalImageSrc);
      localStorage.setItem('imageSrc', originalImageSrc);
      localStorage.setItem('savedImage', originalImageSrc);
    }
  }

const handleOverlayClick = (e: React.MouseEvent<HTMLDivElement>) => {
  const img = imgRef.current;
  if (!img || !imageSrc || !canvasRef.current) return;

  const canvas = canvasRef.current;
  const rect = img.getBoundingClientRect();

  const clickX = e.clientX - rect.left;
  const clickY = e.clientY - rect.top;

  // Convert visible click coords to actual image pixels
  const scaleX = img.naturalWidth / rect.width;
  const scaleY = img.naturalHeight / rect.height;

  const imgX = Math.floor(clickX * scaleX);
  const imgY = Math.floor(clickY * scaleY);

  canvas.width = img.naturalWidth;
  canvas.height = img.naturalHeight;

  const ctx = canvas.getContext('2d', { willReadFrequently: true });
  if (!ctx) return;

  ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
  const pixel = ctx.getImageData(imgX, imgY, 1, 1).data;

  const hex = `#${pixel[0].toString(16).padStart(2, '0')}${pixel[1].toString(16).padStart(2, '0')}${pixel[2].toString(16).padStart(2, '0')}`;
  setPixelColor(hex);
};




  const flipImageHorizontally = () => {
    if (!imageSrc) return;

    const canvas = document.createElement('canvas');
    const image = new Image();
    image.src = imageSrc;

    image.onload = () => {
      canvas.width = image.naturalWidth;
      canvas.height = image.naturalHeight;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      // Flip by scaling negatively and translating
      ctx.translate(canvas.width, 0);
      ctx.scale(-1, 1);
      ctx.drawImage(image, 0, 0);

      const flippedImageUrl = canvas.toDataURL('image/png');
      setImageSrc(flippedImageUrl);
      localStorage.setItem('savedImage', flippedImageUrl);
    };
  }

  const flipImageVertically = () => {
    if (!imageSrc) return;

    const canvas = document.createElement('canvas');
    const image = new Image();
    image.src = imageSrc;

    image.onload = () => {
      canvas.width = image.naturalWidth;
      canvas.height = image.naturalHeight;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      // Flip by scaling negatively and translating
      ctx.translate(0, canvas.height);
      ctx.scale(1, -1);
      ctx.drawImage(image, 0, 0);

      const flippedImageUrl = canvas.toDataURL('image/png');
      setImageSrc(flippedImageUrl);
      localStorage.setItem('savedImage', flippedImageUrl);
    };
  }

  const invertImageColors = () => {
    if (!imageSrc) return;

    const image = new Image();
    image.src = imageSrc;

    image.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = image.naturalWidth;
      canvas.height = image.naturalHeight;

      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      // Draw the image onto the canvas
      ctx.drawImage(image, 0, 0);

      // Get pixel data
      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      const data = imageData.data;

      // Invert colors (R, G, B channels)
      for (let i = 0; i < data.length; i += 4) {
        data[i] = 255 - data[i];       // Red
        data[i + 1] = 255 - data[i + 1]; // Green
        data[i + 2] = 255 - data[i + 2]; // Blue
        // Alpha channel (data[i+3]) remains unchanged
      }

      // Apply inverted pixels back to the canvas
      ctx.putImageData(imageData, 0, 0);

      // Update the image source and localStorage
      const invertedImageUrl = canvas.toDataURL('image/png');
      setImageSrc(invertedImageUrl);
      localStorage.setItem('savedImage', invertedImageUrl);
    };
  };

  // RGB to HSL conversion function
  const rgbToHsl = (r: number, g: number, b: number): [number, number, number] => {
  r /= 255;
  g /= 255;
  b /= 255;

  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  let h = 0; // default initialization
  let s = 0;
  const l = (max + min) / 2;

  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch (max) {
      case r:
        h = (g - b) / d + (g < b ? 6 : 0);
        break;
      case g:
        h = (b - r) / d + 2;
        break;
      case b:
        h = (r - g) / d + 4;
        break;
    }
    h *= 60;
  }

  return [Math.round(h), Math.round(s * 100), Math.round(l * 100)];
};

const hexToHslToString = (hex: string) => {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  const hsl = rgbToHsl(r, g, b);

  return "H:" + hsl[0] + " S:" + hsl[1] + " L:" + hsl[2];
}

const hslToRgb = (h: number, s: number, l: number): [number, number, number] => {
  // Convert saturation and lightness from percentages to 0-1 range
  s /= 100;
  l /= 100;

  // If saturation is 0, the color is achromatic (gray)
  if (s === 0) {
    const gray = Math.round(l * 255);
    return [gray, gray, gray];
  }

  // Temporary variables for calculation
  const temp1 = l < 0.5 ? l * (1 + s) : l + s - l * s;
  const temp2 = 2 * l - temp1;

  // Normalize hue to 0-1 range
  const hue = h / 360;

  // Calculate RGB components
  const rgb = [0, 0, 0];
  for (let i = 0; i < 3; i++) {
    let tempHue = hue + (1 / 3) * -(i - 1);
    if (tempHue < 0) tempHue += 1;
    if (tempHue > 1) tempHue -= 1;

    let tempColor;
    if (6 * tempHue < 1) {
      tempColor = temp2 + (temp1 - temp2) * 6 * tempHue;
    } else if (2 * tempHue < 1) {
      tempColor = temp1;
    } else if (3 * tempHue < 2) {
      tempColor = temp2 + (temp1 - temp2) * (2 / 3 - tempHue) * 6;
    } else {
      tempColor = temp2;
    }

    rgb[i] = Math.round(tempColor * 255);
  }

  return [rgb[0], rgb[1], rgb[2]];
};

function findWeightedMidpointHsl(
  targetHsl: number[], 
  hslArray: number[][], 
  strength: number
): number[] {
  strength = Math.max(1, Math.min(100, strength));
  const weight = strength / 100;

  let closestItem = null;
  let smallestDiff = Infinity;

  for (const item of hslArray) {
    const hueDiff = Math.min(
      Math.abs(item[0] - targetHsl[0]),
      360 - Math.abs(item[0] - targetHsl[0])
    );
    const satDiff = Math.abs(item[1] - targetHsl[1]);
    const lightDiff = Math.abs(item[2] - targetHsl[2]);

    const overallDiff = Math.sqrt(
      Math.pow(hueDiff / 360, 2) + 
      Math.pow(satDiff / 100, 2) + 
      Math.pow(lightDiff / 100, 2)
    );

    if (overallDiff < smallestDiff) {
      smallestDiff = overallDiff;
      closestItem = item;
    }
  }

  if (!closestItem) return targetHsl;

  const [h1, s1, l1] = targetHsl;
  const [h2, s2, l2] = closestItem;

  // Hue interpolation with wrap-around
  let deltaH = h2 - h1;
  if (Math.abs(deltaH) > 180) {
    deltaH -= Math.sign(deltaH) * 360;
  }
  let weightedH = (h1 + deltaH * weight + 360) % 360;

  // Linear interpolation for S and L
  const weightedS = s1 + (s2 - s1) * weight;
  const weightedL = l1 + (l2 - l1) * weight;

  return [
    Math.round(weightedH),
    Math.round(weightedS),
    Math.round(weightedL)
  ];
}


const applyPalette = () => {
  console.log("sdf to use: " + paletteToUse);
  setShowStrengthModal(true);
};

const runWithProcessingOverlay = async (task: () => Promise<void>) => {
  setIsProcessing(true);
  try {
    await task();
  } finally {
    setIsProcessing(false);
  }
};

const applyZornFilterWithStrength = () => {
  setShowStrengthModal(false);
  runWithProcessingOverlay(() =>
    ApplyColorFilter(parseInt(strengthValue))
  );
};


// Modify the existing ApplyColorFilter to accept strength parameter
const ApplyColorFilter = async (strength: number = 30): Promise<void> => {
  return new Promise((resolve) => {
    if (!imageSrc) return resolve();

    const paletteToUseLocal = localStorage.getItem('selectedPalette') || 'Zorn';
    const palettesVar: Record<string, any> = palettes;

    let loadImage = new Image();
    loadImage.src = imageSrc;

    loadImage.onload = async () => {
      const selectedPalette = paletteToUseLocal === 'Image'
        ? await extractImageColors()
        : palettesVar[paletteToUseLocal] || zornPalette;

      const canvas = document.createElement('canvas');
      canvas.width = loadImage.naturalWidth;
      canvas.height = loadImage.naturalHeight;

      const ctx = canvas.getContext('2d');
      if (!ctx) return resolve();

      ctx.drawImage(loadImage, 0, 0);
      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      const data = imageData.data;

      for (let i = 0; i < data.length; i += 4) {
        const hslOriginal = rgbToHsl(data[i], data[i + 1], data[i + 2]);
        const newHSL = findWeightedMidpointHsl(hslOriginal, selectedPalette, strength);
        const [r, g, b] = hslToRgb(newHSL[0], newHSL[1], newHSL[2]);
        data[i] = r;
        data[i + 1] = g;
        data[i + 2] = b;
      }

      ctx.putImageData(imageData, 0, 0);
      const filteredImageUrl = canvas.toDataURL('image/png');
      setImageSrc(filteredImageUrl);
      localStorage.setItem('savedImage', filteredImageUrl);
      resolve();
    };
  });
};



  return (
    <div>
      {isProcessing && (
  <div style={{
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.6)',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 9999,
    flexDirection: 'column',
    color: 'white',
    fontSize: '1.5rem',
    fontWeight: 'bold'
  }}>
    <div style={{
      border: '6px solid #f3f3f3',
      borderTop: '6px solid #3498db',
      borderRadius: '50%',
      width: '60px',
      height: '60px',
      animation: 'spin 1s linear infinite',
      marginBottom: '20px'
    }} />
    Processing...
  </div>
)}
      {showStrengthModal && (
  <div style={{
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.5)',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000
  }}>
    <div style={{
      backgroundColor: 'white',
      padding: '2rem',
      borderRadius: '8px',
      maxWidth: '400px',
      width: '100%'
    }}>
      <h3>Set Filter Strength</h3>
      <p>Enter a value between 1 and 100:</p>
      <input
  type="number"
  min="1"
  max="100"
  value={strengthValue}
  onChange={(e) => {
    setStrengthValue(e.target.value); // Keep raw input
  }}
  onBlur={() => {
    // Validate on blur
    const parsed = parseInt(strengthValue);
    if (isNaN(parsed)) {
      setStrengthValue("30"); // Fallback
    } else {
      setStrengthValue(Math.min(100, Math.max(1, parsed)).toString());
    }
  }}
  style={{
    width: '100%',
    padding: '8px',
    margin: '10px 0',
    fontSize: '16px'
  }}
/>
      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
        <button 
          onClick={() => setShowStrengthModal(false)}
          style={{
            padding: '8px 16px',
            backgroundColor: '#f0f0f0',
            border: 'none',
            borderRadius: '4px'
          }}
        >
          Cancel
        </button>
        <button 
          onClick={applyZornFilterWithStrength}
          style={{
            padding: '8px 16px',
            backgroundColor: '#0070f3',
            color: 'white',
            border: 'none',
            borderRadius: '4px'
          }}
        >
          Apply
        </button>
      </div>
    </div>
  </div>
)}
        <div className="editImageWrap">
          <canvas ref={canvasRef} style={{ display: 'none' }} />
          <div style={{ position: 'relative', width: '100%', height: '100%' }}>
  <TransformWrapper
    ref={transformRef}
    initialScale={transformState.scale}
    initialPositionX={transformState.positionX}
    initialPositionY={transformState.positionY}
    onPanningStop={handleTransformEnd}
    onPinchingStop={handleTransformEnd}
    minScale={0.1}
    limitToBounds={false}
  >
    {({ zoomIn, zoomOut, resetTransform, ...rest }) => (
      <TransformComponent wrapperStyle={{ width: '100%', height: '100%' }}>
        <div style={{ position: 'relative' }}>
          {imageSrc && (
            <>
              <img
                src={imageSrc}
                alt="Saved Crop"
                ref={(img) => {
  imgRef.current = img;
}}
                style={{ display: 'block', width: '100%' }}
              />
              <div
                onClick={handleOverlayClick}
                style={{
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  right: 0,
                  bottom: 0,
                  cursor: 'crosshair',
                  zIndex: 10
                }}
              />
            </>
          )}
          {!imageSrc && <p>No image found. Please upload an image first.</p> }
        </div>
      </TransformComponent>
    )}
  </TransformWrapper>
</div>

        </div>
      <div style={{display: 'flex'}}>
        <div style={{width: '50%', paddingRight: '10px'}}>
          {pixelColor && (
            <div style={{ 
              marginTop: '1rem',
              padding: '1rem',
              background: '#f0f0f0',
              borderRadius: '4px',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: '1rem'
            }} className='swatchDiv'>
              <p>Tap image above to get pixel colour</p>
              <div style={{
                width: '150px',
                height: '100px',
                background: pixelColor,
                clear: 'both',
                display: 'block',
                border: '1px solid #000'
              }} />
              <div>
                <p>HEX: {pixelColor}</p>
                <p>RGB: {hexToRgb(pixelColor)}</p>
                <p>CMYK: {hexToCmyk(pixelColor)}</p>
                <p>HSL: { hexToHslToString(pixelColor) }</p>
              </div>
              <p>Tap a swatch below to get palette colour</p>
            </div>
          )}
          </div>
          <div style={{width: '40%', marginTop: '0.8rem'}}>
          
          <button 
            onClick={invertImageColors}
            className="editButton"
          >
            Invert Colors
          </button>
          <button onClick={flipImageHorizontally} className="editButton">
            Flip Horizontally
          </button>
          <button onClick={flipImageVertically} className="editButton">
            Flip Vertically
          </button>
          <button onClick={applyPalette} className='editButton'>
            Apply Palette to Image
          </button>
          {/* <button className='editButton'>
            Undo
          </button> */}
          <button onClick={revertToOriginal} className='editButton'>
            Revert to Original Image
          </button>
          </div>
          </div>
          
          <div style={{ display: 'flex', flexWrap: 'wrap', width: '100%', marginBottom: '200px' }}>
            <PaletteSelector onPrimaryPaletteAction={handlePaletteAction} />
          </div>
    </div>
  );
}