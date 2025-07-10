'use client'
import React, { useState, useRef } from 'react'
import Head from 'next/head';
import ReactCrop, {
  centerCrop,
  makeAspectCrop,
  Crop,
  PixelCrop,
} from 'react-image-crop'

import 'react-image-crop/dist/ReactCrop.css'

// This is to demonstate how to make and center a % aspect crop
// which is a bit trickier so we use some helper functions.
function centerAspectCrop(
  mediaWidth: number,
  mediaHeight: number,
  aspect: number,
) {
  return centerCrop(
    makeAspectCrop(
      {
        unit: '%',
        height: 40,
      },
      aspect,
      mediaWidth,
      mediaHeight,
    ),
    mediaWidth,
    mediaHeight,
  )
}

export default function App() {
  const [imgSrc, setImgSrc] = useState('')
  const previewCanvasRef = useRef<HTMLCanvasElement>(null)
  const imgRef = useRef<HTMLImageElement>(null)
  const [crop, setCrop] = useState<Crop>()
  const [completedCrop, setCompletedCrop] = useState<PixelCrop>()
  const [scale, setScale] = useState(1)
  const [rotate, setRotate] = useState(0)
  const [aspect, setAspect] = useState<number | undefined>(undefined)

  function onSelectFile(e: React.ChangeEvent<HTMLInputElement>) {
    if (e.target.files && e.target.files.length > 0) {
      setCrop(undefined) // Makes crop preview update between images.
      const reader = new FileReader()
      reader.addEventListener('load', () =>
        setImgSrc(reader.result?.toString() || ''),
      )
      reader.readAsDataURL(e.target.files[0])
    }
  }

  function onImageLoad(e: React.SyntheticEvent<HTMLImageElement>) {
      const { width, height } = e.currentTarget
      setCrop(centerAspectCrop(width, height, 1))
  }

 async function saveImage() {
  try {
    const image = imgRef.current;
    const previewCanvas = previewCanvasRef.current;
    if (!image || !previewCanvas || !completedCrop) {
      throw new Error('Crop canvas does not exist');
    }

    // Ensure the preview canvas is properly drawn first
    const scaleX = image.naturalWidth / image.width;
    const scaleY = image.naturalHeight / image.height;

    const cropX = completedCrop.x * scaleX;
    const cropY = completedCrop.y * scaleY;
    const cropWidth = completedCrop.width * scaleX;
    const cropHeight = completedCrop.height * scaleY;

    // Create a regular canvas instead of OffscreenCanvas for better compatibility
    const canvas = document.createElement('canvas');
    canvas.width = cropWidth;
    canvas.height = cropHeight;
    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('Could not get canvas context');

    // Draw the cropped portion directly from the original image
    ctx.drawImage(
      image,
      cropX,
      cropY,
      cropWidth,
      cropHeight,
      0,
      0,
      cropWidth,
      cropHeight
    );

    // Resize if needed
    let resizedWidth = canvas.width;
    let resizedHeight = canvas.height;
    const MAX_WIDTH = 1024;
    
    if (resizedWidth > MAX_WIDTH) {
      const scaleFactor = MAX_WIDTH / resizedWidth;
      resizedWidth = MAX_WIDTH;
      resizedHeight = resizedHeight * scaleFactor;
      
      const resizedCanvas = document.createElement('canvas');
      resizedCanvas.width = resizedWidth;
      resizedCanvas.height = resizedHeight;
      const resizedCtx = resizedCanvas.getContext('2d');
      if (!resizedCtx) throw new Error('Could not get resized canvas context');
      
      resizedCtx.drawImage(
        canvas,
        0,
        0,
        canvas.width,
        canvas.height,
        0,
        0,
        resizedWidth,
        resizedHeight
      );
      
      // Use the resized canvas
      canvas.width = resizedWidth;
      canvas.height = resizedHeight;
      canvas.getContext('2d')?.drawImage(resizedCanvas, 0, 0);
    }

    // Convert to blob with error handling
    return new Promise((resolve, reject) => {
      canvas.toBlob(
        (blob) => {
          if (!blob) {
            reject(new Error('Canvas to Blob conversion failed'));
            return;
          }

          // Check size
          if (blob.size > 4.5 * 1024 * 1024) {
            alert("Image is too large after resizing. Try reducing quality or cropping a smaller area.");
            reject(new Error('Image too large'));
            return;
          }

          const reader = new FileReader();
          reader.onloadend = () => {
            try {
              const base64data = reader.result as string;
              localStorage.setItem('savedImage', base64data);
              alert('Image saved successfully! Go to lightbox tab below to use.');
              resolve(true);
            } catch (error) {
              console.error('LocalStorage error:', error);
              alert('Failed to save image to storage.');
              reject(error);
            }
          };
          reader.onerror = () => reject(new Error('FileReader error'));
          reader.readAsDataURL(blob);
        },
        'image/jpeg',
        0.8
      );
    });
  } catch (error) {
    console.error('Error in saveImage:', error);
    alert('Failed to save image: ');
    return false;
  }
}

function isLocalStorageAvailable() {
  try {
    const test = '__storage_test__';
    localStorage.setItem(test, test);
    localStorage.removeItem(test);
    return true;
  } catch (e) {
    return false;
  }
}

  return (
    <>
    <div className="App">
      <div className="Crop-Controls" style={{justifyContent: 'center', marginTop: '50px', marginBottom: '50px'}}>
      <p>Select an image to use for your reference on this site</p>
        <input type="file" accept="image/*" onChange={onSelectFile} />
      </div>
      {!!imgSrc && (
        <div className="cropSection">
        <ReactCrop
          crop={crop}
          onChange={(_, percentCrop) => setCrop(percentCrop)}
          onComplete={(c) => setCompletedCrop(c)}
          aspect={aspect}
          minHeight={50}
          // circularCrop
        >
          <img
            ref={imgRef}
            alt="Crop me"
            src={imgSrc}
            style={{ transform: `scale(${scale}) rotate(${rotate}deg)` }}
            onLoad={onImageLoad}
          />
        </ReactCrop>
        </div>
      )}
      {!!completedCrop &&
      <>
      <div>
      <div className="Crop-Controls">
        <button onClick={saveImage}>Save Image</button>
        </div>
            <canvas
              ref={previewCanvasRef}
              style={{
                border: '1px solid black',
                objectFit: 'contain',
                width: completedCrop.width,
                height: completedCrop.height,
                visibility: 'hidden'
              }}
            />
          </div>
        </>
      }
    </div>
    </>
  )
}
