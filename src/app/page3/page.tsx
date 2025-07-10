'use client';
import { useEffect, useRef, useState } from 'react';
import { ReactZoomPanPinchRef, TransformComponent, TransformWrapper } from 'react-zoom-pan-pinch';

// Helper function to convert HEX to RGB
function hexToRgb(hex: string) {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `rgb(${r}, ${g}, ${b})`;
}

export default function Page3() {
  const [imageSrc, setImageSrc] = useState<string | null>(null);
  const imgRef = useRef<HTMLImageElement | null>(null);
  const [pixelColor, setPixelColor] = useState<string | null>('#dddddd');
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const transformRef = useRef<ReactZoomPanPinchRef | null>(null);
  const [transformState, setTransformState] = useState({
    scale: 1,
    positionX: 0,
    positionY: 0
  });

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
    if (savedImage) {
      setImageSrc(savedImage);
    }
  }, []);

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

  return (
    <div>
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
                  <p>No image found. Please upload an image first.</p>
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
            }}>
              <div style={{
                width: '120px',
                height: '150px',
                background: pixelColor,
                clear: 'both',
                display: 'block',
                border: '1px solid #000'
              }} />
              <div>
                <p>HEX: {pixelColor}</p>
                <p>RGB: {hexToRgb(pixelColor)}</p>
              </div>
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
          </div>
          </div>
    </div>
  );
}