'use client';
import { RefObject, useEffect, useRef, useState } from 'react';
import Modal from '../../components/Modal'
import { ReactZoomPanPinchRef, TransformComponent, TransformWrapper } from 'react-zoom-pan-pinch';

import { calculateBounds, findWeightedMidpointHsl, hexToCmyk, hexToHslToString, hexToRgb, hexToRgbArray, hslToRgb, rgbToHsl } from '@/functions/imageUtils';

import StrengthSlider from '@/components/StrengthSlider'

import zornPalette from '@/palettes/zornPalette';
import PaletteSelector from '../../components/PaletteSelector';
import { extractImageColors } from '../../services/imageColorService';
import palettes from '@/palettes';
import { ColorPicker, HSL, RGB, rgbToHex } from 'next-colors';

import './Page3.css';


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
  const [strengthValue, setStrengthValue] = useState("50"); // Default value
  const [paletteToUse, setPaletteToUse] = useState<string>(() => {
    if (typeof window !== 'undefined') {
      console.log("this " + localStorage.getItem('selectedPalette'));
      return localStorage.getItem('selectedPalette') || '';
    }
    return '';
  });
  const [paletteData, setPaletteData] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isImageLoading, setIsImageLoading] = useState(true);
  const [addSwatchVisible, setAddSwatchVisible] = useState(false);
  type PaletteSelectorRef = {
    addToPalette: () => void;
  };
  const paletteSelectorRef = useRef<PaletteSelectorRef>(null);


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
    const savedImage = localStorage.getItem('savedImage');
    const originalImage = localStorage.getItem('savedImageOriginal');
    const storedPixelColor = localStorage.getItem('pixelColor');
    // localStorage.setItem('customPaletteColors', '')
    
    if (storedPixelColor) {
      setPixelColor(storedPixelColor);
    }

    if (savedImage) {
      const img = new Image();
      img.onload = () => {
        setImageSrc(savedImage);
        setOriginalImageSrc(originalImage);
        setIsImageLoading(false);
      };
      img.onerror = () => {
        setIsImageLoading(false); // Image failed to load
      };
      img.src = savedImage;
    } else {
      setIsImageLoading(false); // No image to load
    }
  }, []);

  // Update the image rendering part to handle loading states properly
  const renderImageContent = () => {
    if (isImageLoading) {
      return (
        <div className="imageLoadingContainer">
          <div className="spinner" />
        </div>
      );
    }

    if (!imageSrc) {
      return <p style={{ marginTop: '15px' }}>No image found. Please upload an image first.</p>;
    }

    return (
      <>
        <img
          src={imageSrc}
          alt="Saved Crop"
          ref={(img) => {
            if (img) {
              img.onload = () => setIsImageLoading(false);
              img.onerror = () => setIsImageLoading(false);
              imgRef.current = img;
            }
          }}
          style={{ display: 'block' }}
        />
        <div onClick={handleOverlayClick} className="imageOverlay" />
      </>
    );
  };

  const revertToOriginal = () => {
    if (originalImageSrc) {
      setIsImageLoading(true);
      const img = new Image();
      img.onload = () => {
        setImageSrc(originalImageSrc);
        localStorage.setItem('imageSrc', originalImageSrc);
        localStorage.setItem('savedImage', originalImageSrc);
        setIsImageLoading(false);
      };
      img.src = originalImageSrc;
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

  const addSwatch = () => {
    setAddSwatchVisible(true);
  }

  const applyPalette = () => {
    console.log("to use: " + paletteToUse);
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

  // Adjust position to keep image within bounds
  const getAdjustedPosition = (positionX: number, positionY: number, scale: any) => {
    const bounds = calculateBounds(imgRef, transformState);
    
    return {
      positionX: Math.min(Math.max(positionX, bounds.minPositionX), bounds.maxPositionX),
      positionY: Math.min(Math.max(positionY, bounds.minPositionY), bounds.maxPositionY)
    };
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
        let selectedPalette = paletteToUseLocal === 'Image'
          ? await extractImageColors()
          : palettesVar[paletteToUseLocal] || zornPalette;

        if (paletteToUseLocal == 'customPaletteColors') {
          const storedPalette = localStorage.getItem('customPaletteColors');
          if (storedPalette) {
            try {
              selectedPalette = JSON.parse(storedPalette);
            } catch (error) {
              console.error('Invalid customPaletteColors in localStorage', error);
              selectedPalette = zornPalette; // fallback
            }
          } else {
            selectedPalette = zornPalette; // fallback
          }
        }

        console.log("p load " + palettesVar['monet']);

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

  const AddToCustomPalette = (pixelColor: string) => {
    const color = hexToRgbArray(pixelColor);
    const hsl = rgbToHsl(color.r, color.g, color.b);
    const storedCustomPalette = localStorage.getItem('customPaletteColors');
    if (!storedCustomPalette) {
      const updated = [hsl];
      localStorage.setItem('customPaletteColors', JSON.stringify(updated));
    } else {
      const existingCustomPalette: [number, number, number] | [] = storedCustomPalette
      ? (JSON.parse(storedCustomPalette) as [number, number, number])
      : [];
      console.log("exisiting " + existingCustomPalette);
      const updated = [...existingCustomPalette, hsl];
      localStorage.setItem('customPaletteColors', JSON.stringify(updated));
    }
    paletteSelectorRef.current?.addToPalette();
    setAddSwatchVisible(false);
  }

  const SetPixelColorFromPicker= (color: RGB) => {
    setPixelColor(rgbToHex(color));
  }

  return (
    <div>
      {addSwatchVisible && (
        <Modal>
          <ColorPicker
            initialColor={hexToRgbArray(pixelColor)}
            onChange={SetPixelColorFromPicker}
            width={300}
            height={200}
          />
          <button className="modalButton" onClick={() => AddToCustomPalette(pixelColor)}>
            Add to custom palette
          </button>
          <button className="modalCloseButton" onClick={() => setAddSwatchVisible(false)}>
            Close
          </button>
        </Modal>
      )}

      {isProcessing && (
        <div className='modalDiv'>
          <div className='spinner-lg' />
          Processing...
        </div>
      )}
      {showStrengthModal && (
        <div className='modalDiv'>
          <div className='modalContent'>
            <h3>Set Filter Strength</h3>
            <p>Choose a value between 1 and 100:</p>
            <StrengthSlider value={strengthValue} setValue={setStrengthValue} />
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
              <button className='modalCancel' onClick={() => setShowStrengthModal(false)}>
                Cancel
              </button>
              <button className='modalButton' onClick={applyZornFilterWithStrength}>
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
            limitToBounds={true}          
            maxPositionX={calculateBounds(imgRef, transformState).maxPositionX}
            minPositionX={calculateBounds(imgRef, transformState).minPositionX}
            maxPositionY={calculateBounds(imgRef, transformState).maxPositionY}
            minPositionY={calculateBounds(imgRef, transformState).minPositionY}
          >
            <TransformComponent wrapperStyle={{ width: '100%', height: '100%' }}>
              <div style={{ position: 'relative' }}>{renderImageContent()}</div>
            </TransformComponent>
          </TransformWrapper>
        </div>
      </div>

      <div style={{ display: 'flex' }}>
        <div className="editPanelLeft">
          {pixelColor && (
            <div className='swatchDiv'>
              <p>Tap image above to get pixel colour</p>
              <div className='colorPreview' style={{ background: pixelColor }} />
              <button className='addSwatch' onClick={addSwatch}>+ Add swatch to custom palette</button>
              <div>
                <p>HEX: {pixelColor}</p>
                <p>RGB: {hexToRgb(pixelColor)}</p>
                <p>CMYK: {hexToCmyk(pixelColor)}</p>
                <p>HSL: {hexToHslToString(pixelColor)}</p>
              </div>
              <p>Tap a swatch below to get palette colour</p>
            </div>
          )}
        </div>
        <div className="editPanelRight">
          <button onClick={invertImageColors} className="editButton">Invert Colors</button>
          <button onClick={flipImageHorizontally} className="editButton">Flip Horizontally</button>
          <button onClick={flipImageVertically} className="editButton">Flip Vertically</button>
          <button onClick={applyPalette} className='editButton'>Apply Palette to Image</button>
          <button onClick={revertToOriginal} className='editButton'>Revert to Original Image</button>
        </div>
      </div>

      <div className="paletteSelectorWrap">
        <PaletteSelector ref={paletteSelectorRef} onPrimaryPaletteAction={handlePaletteAction} />
      </div>
    </div>
  );
}