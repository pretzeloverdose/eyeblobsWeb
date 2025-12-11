'use client'
import { Console } from 'console'
import React, { useEffect, useState, useRef } from 'react'
import { PerspectiveTransform } from 'react-perspective-transform';
import { sortCornersClockwise, Corner } from '../../functions/cornerDetection';
import { applyPerspectiveTransform as applyTransform } from '../../functions/perspectiveTransform';
import { detectPaperCorners } from '../../functions/paperDetection';
import { updatePointsFromCorners, PerspectivePoints } from '../../functions/pointsUtils';
import { TransformWrapper, TransformComponent, ReactZoomPanPinchRef } from "react-zoom-pan-pinch";
import { usePersistentTransform } from "@/hooks/usePersistentTransform";

function ImageProcessorB() {
  const [cvLoaded, setCvLoaded] = useState(false)
  const [cv, setCv] = useState<any>(null)
  const [loadingError, setLoadingError] = useState<string | null>(null)
  const [loadingStatus, setLoadingStatus] = useState<string>('Initializing...')
  const [corners, setCorners] = useState<Corner[]>([])
  const [showOverlay, setShowOverlay] = useState(false)
  const [imageSrc, setImageSrc] = useState<string | null>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const imageRef = useRef<HTMLImageElement>(null)
  const sourceImageRef = useRef<HTMLImageElement>(null)
  const [editable, setEditable] = useState(true);
  const [aspectRatioCompensation, setAspectRatioCompensation] = useState(1);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const [sampleImageSrc, setSampleImageSrc] = useState<string | null>(null);
  const [opacity, setOpacity] = useState(0.7);
  const [lockImage, setLockImage] = useState(false);
  const [points, setPoints] = useState<PerspectivePoints>({
    topLeft: { x: 0, y: 0 },
    topRight: { x: 0, y: 0 },
    bottomRight: { x: 0, y: 0 },
    bottomLeft: { x: 0, y: 0 }
  })
  const transformRef = useRef<ReactZoomPanPinchRef | null>(null);
   const { 
    transformState, 
    setTransformState,
  } = usePersistentTransform('camera');

  // Initialize transform with saved state
  useEffect(() => {
    if (transformRef.current && transformState && lockImage) {
      transformRef.current.setTransform(
        transformState.positionX,
        transformState.positionY,
        transformState.scale
      );
    }
  }, [transformState, imageSrc]);

  useEffect(() => {
    if (transformState && lockImage && points && imageRef.current) {
      const savedImage = localStorage.getItem('savedImage');
      const originalImage = new Image();
      originalImage.onload = () => {
        // alert(`Adjusting scale to ${newScale.toFixed(2)} based on points and image width`);
      // Apply saved transform immediately after initialization
        if (transformRef.current && imageRef.current) {
          transformRef.current.setTransform(
            0,
            0,
            transformState.scale
          );
        }
      };
      originalImage.src = savedImage || '';
    }
  }, [lockImage]);

  const handleTransformEnd = () => {
    if (!transformRef.current || !transformRef.current.state) return;

    const { scale, positionX, positionY } = transformRef.current.state;
    setTransformState({
      scale,
      positionX,
      positionY
    });
  };

  // Function to center and reset the saved image
  const centerAndResetImage = () => {
    if (!imageSrc) {
      alert('No image source available');
      return;
    }

    // Create a temporary image to get actual dimensions
    const tempImg = new Image();
    tempImg.onload = () => {
      const width = tempImg.naturalWidth;
      const height = tempImg.naturalHeight;
      
      // Reset points using actual image dimensions
      setPoints({
        topLeft: { x: 0, y: 0 },
        topRight: { x: width / 4, y: 0 },
        bottomRight: { x: width / 4, y: height / 4 },
        bottomLeft: { x: 0, y: height / 4 }
      });
    };
    tempImg.src = imageSrc;
    setAspectRatioCompensation(1);
  };

  // Get the correct path for assets based on environment
  const getAssetPath = (assetPath: string) => {
    // In production, use the basePath
    if (process.env.NODE_ENV === 'production') {
      return `/eyeblobs/app${assetPath}`
    }
    // In development, use the standard path
    return assetPath
  }

  // Get the correct path for OpenCV.js based on environment
  const getOpenCVPath = () => {
    return getAssetPath('/opencv/opencv.js')
  }

  useEffect(() => {
    const savedImage = localStorage.getItem('savedImage');
    if (savedImage) {
      setImageSrc(savedImage);
    }
  }, []);


  useEffect(() => {
    const loadOpenCV = () => {
      setLoadingStatus('Checking if OpenCV is already loaded...')
      
      if (window.cv && window.cv.Mat) {
        setCv(window.cv)
        setCvLoaded(true)
        setLoadingStatus('OpenCV.js is ready!')
        console.log('OpenCV.js was already loaded')
        return
      }

      const openCVPath = getOpenCVPath()
      const existingScript = document.querySelector(`script[src="${openCVPath}"]`)
      if (existingScript) {
        setLoadingStatus('OpenCV script already exists, waiting for initialization...')
        return
      }

      setLoadingStatus('Loading OpenCV.js script...')
      console.log('Loading OpenCV from path:', openCVPath);
      
      const script = document.createElement('script')
      script.src = openCVPath
      script.async = true
      
      script.onload = () => {
        setLoadingStatus('Script loaded, waiting for OpenCV initialization...')
        console.log('OpenCV.js script loaded successfully')
        
        const checkOpenCV = () => {
          console.log('Checking OpenCV readiness...', { windowCv: !!window.cv, cvMat: !!(window.cv && window.cv.Mat) });
          if (window.cv && window.cv.Mat) {
            console.log('OpenCV ready! Setting cv state...');
            setCv(window.cv)
            setCvLoaded(true)
            setLoadingStatus('OpenCV.js is ready!')
            console.log('OpenCV.js is fully initialized and ready')
          } else {
            console.log('OpenCV not ready yet, checking again in 100ms...');
            setTimeout(checkOpenCV, 100)
          }
        }
        
        checkOpenCV()
      }

      script.onerror = (error) => {
        const errorMsg = `Failed to load OpenCV.js script. Please check if the file exists at ${openCVPath}`
        setLoadingError(errorMsg)
        setLoadingStatus('Failed to load')
        console.error(errorMsg, error)
      }

      document.head.appendChild(script)
    }

    loadOpenCV()

    return () => {
      const openCVPath = getOpenCVPath()
      const scripts = document.querySelectorAll(`script[src="${openCVPath}"]`)
      scripts.forEach(script => script.remove())
    }
  }, [])

  const applyPerspectiveTransform = () => {
    if (!cv || !canvasRef.current || !sourceImageRef.current || corners.length !== 4) {
      console.log('Cannot apply perspective transform: missing requirements')
      return
    }

    applyTransform({
      cv,
      canvas: canvasRef.current,
      sourceImageElement: sourceImageRef.current,
      corners,
      sortCornersClockwise,
      onAspectRatioCalculated: (aspectRatio, compensationScale) => {
        // Store the compensation value for the PerspectiveTransform component
        setAspectRatioCompensation(compensationScale)
      }
    })
  }

  const handleImageLoad = () => {
    console.log('Image loaded, detecting corners...')
    if (cvLoaded) {
    //  setTimeout(handleDetectPaperCorners, 100)
    }
  }

  useEffect(() => {
    if (typeof navigator === "undefined" || !navigator.mediaDevices?.getUserMedia) {
      console.log("Camera not supported.");
      return;
    }

    const startCamera = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: "environment" },
          audio: false,
        });

        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          videoRef.current.play();
        }
      } catch (err) {
        console.error("Camera access error:", err);
        console.log("Could not access camera.");
      }
    };

    startCamera();

    return () => {
      if (videoRef.current?.srcObject) {
        const tracks = (videoRef.current.srcObject as MediaStream).getTracks();
        tracks.forEach((track) => track.stop());
      }
    };
  }, []);

  const captureFrame = () => {
    if (!videoRef.current || !canvasRef.current) return;

    const video = videoRef.current;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');

    if (!ctx || video.readyState !== video.HAVE_ENOUGH_DATA) return;

    // Set canvas dimensions to match video
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;

    // Draw the current video frame to canvas
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

    // Convert canvas to data URL
    const dataURL = canvas.toDataURL('image/jpeg', 0.8);
    setSampleImageSrc(dataURL);
  };

  const drawSampleImageToCanvas = () => {
    if (!sampleImageSrc || !canvasRef.current) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const img = new Image();
    img.onload = () => {
      // Clear canvas and draw the sample image
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
    };
    img.src = sampleImageSrc;
  };

  // Set up interval to capture frames every second
  useEffect(() => {
    if (!cvLoaded || !cv) {
      console.log('OpenCV not ready yet, skipping interval setup');
      return;
    }

    console.log('OpenCV ready, starting capture interval');
    const interval = setInterval(() => {
      
      // Capture frame first
      if (!videoRef.current || !canvasRef.current) return;

      const video = videoRef.current;
      const canvas = canvasRef.current;
      const ctx = canvas.getContext('2d');

      if (!ctx || video.readyState !== video.HAVE_ENOUGH_DATA) return;

      // Set canvas dimensions to match video
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;

      // Draw the current video frame to canvas
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

      // Convert canvas to data URL
      const dataURL = canvas.toDataURL('image/jpeg', 0.8);
      setSampleImageSrc(dataURL);

      // Then detect corners using the fresh data
      if (!cv || !canvas) {
        console.log('OpenCV or canvas not ready for corner detection')
        return
      }
      
      // Skip capture if image is locked
      if (lockImage) return;
      
      console.log('Detecting corners with fresh video frame data')
      
      // Create a temporary image element from the video frame
      const tempImg = new Image();
      const refImg = new Image();
      refImg.src = imageSrc || '';
      tempImg.onload = () => {
        detectPaperCorners({
          cv,
          canvas: canvas,
          imageElement: tempImg,
          refIMG: refImg,
          width: refImg.naturalWidth,
          height: refImg.naturalHeight,
          onCornersDetected: (corners: Corner[]) => {
            console.log('Corners detected:', corners.length);
            setCorners(corners);
          },
          onPointsUpdated: (points: PerspectivePoints) => {
            console.log('Points updated:', points);
            setPoints(points);
          //  setAspectRatioCompensation(refImg.naturalWidth && refImg.naturalHeight ? (refImg.naturalWidth / refImg.naturalHeight) : 1);
          }
        })
      };
      tempImg.src = dataURL; // Use the fresh dataURL directly
    }, 200); // Capture every 200ms

    return () => {
      clearInterval(interval);
    };
  }, [cvLoaded, cv, lockImage]);

  // Add useEffect to update points when imageSrc changes
  useEffect(() => {
    if (imageSrc) {
      // Get actual image dimensions when imageSrc is loaded
      const tempImg = new Image();
      tempImg.onload = () => {
        const width = tempImg.naturalWidth;
        const height = tempImg.naturalHeight;
        
        console.log('Setting initial points with image dimensions:', { width, height });
        
        // Set points to match the actual image dimensions
        setPoints({
          topLeft: { x: 0, y: 0 },
          topRight: { x: width/2, y: 0 },
          bottomRight: { x: width/2, y: height/2 },
          bottomLeft: { x: 0, y: height/2 }
        });
      };
      tempImg.src = imageSrc;
    }
  }, [imageSrc]);

  if (loadingError) {
    return (
      <div>
        <p style={{ color: 'red' }}>OpenCV Loading Error: {loadingError}</p>
        <button onClick={() => window.location.reload()}>Retry</button>
      </div>
    )
  }
  
  return (
    <div>
      <div style={{ flex: 1, padding: "16px", backgroundColor: "#f5f5f5", borderTop: "1px solid #ddd", position: "absolute", width: "100%", height: 70, bottom: 101, zIndex: 7000 }}>
        <div style={{ display: "flex", alignItems: "center", gap: "24px", float: 'left' }}>
          {/* <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
            <span>AR:</span>
            <label style={{ display: "flex", alignItems: "center", cursor: "pointer" }}>
              <input
                type="checkbox"
                checked={editable}
                onChange={(e) => setEditable(e.target.checked)}
                style={{ marginRight: "8px" }}
              />
              <span>{editable ? 'On' : 'Off'}</span>
            </label>
          </div> */}
          <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
            <label style={{ display: "flex", alignItems: "center", cursor: "pointer" }}>
              <button
                onClick={() => setLockImage(!lockImage)}
                style={{ marginRight: "8px" }}
              >{lockImage ? 'Unlock Image' : 'Lock Image in place'}</button>
            </label>
          </div>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: "12px", float: 'left' }}>
          <button
            onClick={centerAndResetImage}
          >
            Reset Image
          </button>
        </div>
      </div>
      <div style={{ padding: "16px", backgroundColor: "#f5f5f5", borderTop: "1px solid #ddd", position: "absolute", width: "100%", height: 50, bottom: 50, zIndex: 7000 }}>
        <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
          <span>Opacity:</span>
          <input
            type="range"
            min="0"
            max="1"
            step="0.01"
            value={opacity}
            onChange={(e) => setOpacity(parseFloat(e.target.value))}
            style={{ flex: 1 }}
          />
          <span style={{ width: "40px", textAlign: "right" }}>
            {Math.round(opacity * 100)}%
          </span>
        </div>
      </div>
      <div style={{ flex: 1, position: "relative", height: 'calc(100vh - 200px)' }}>
        {/* Opacity slider controls */}
      
          <video
            ref={videoRef}
            playsInline
            muted
            style={{ 
              width: "100%", 
              height: "100%", 
              backgroundColor: "#000", 
              zIndex: 0, 
              position: "absolute", 
              top: 0,
              pointerEvents: "none"
            }}
          />
          <canvas
            ref={canvasRef}
            style={{ width: '512px' }}
          />
      <div style={{ position: 'absolute', top: '0px', left: '0px', zIndex: 5000, opacity: opacity, maxWidth: '100%', maxHeight: '100%' }}>
        
        
{lockImage ? (
  <TransformWrapper
    ref={transformRef}
    initialScale={transformState.scale}
    initialPositionX={transformState.positionX}
    initialPositionY={transformState.positionY}
    onPanningStop={handleTransformEnd}
    onPinchingStop={handleTransformEnd}
    onInit={(ref) => {
      transformRef.current = ref;
      // Apply saved transform immediately after initialization
      ref.setTransform(
        transformState.positionX,
        transformState.positionY,
        transformState.scale
      );
    }}
    minScale={0.1}
    limitToBounds={false}
  >
    <TransformComponent wrapperStyle={{ width: "100%", height: "100%" }}>
      
  <PerspectiveTransform
      points={points}>
      <img 
        src={imageSrc || getAssetPath("/instructions.png")} 
        alt="Instructions" 
        style={{ transform: `scaleX(${aspectRatioCompensation})`}}
      /></PerspectiveTransform>
    </TransformComponent>
  </TransformWrapper>
) : (
  <PerspectiveTransform
      points={points}>
  <img 
    src={imageSrc || getAssetPath("/instructions.png")} 
    alt="Instructions" 
    style={{ transform: `scaleX(${aspectRatioCompensation})`}}
  />
  </PerspectiveTransform>
)}
  
</div>

      <div style={{ position: 'absolute', top: '0px', left: '0px', marginTop: '0px', zIndex: 4500, width: '300px', height: '300px' }}>
        {/* Hidden source image for perspective transform */}
        <img 
          ref={sourceImageRef}
          src={getAssetPath("/source1.jpg")} 
          alt="Source for transform" 
          style={{ display: 'none' }}
          crossOrigin="anonymous"
        />
        
        <img 
          ref={imageRef}
          src={sampleImageSrc || getAssetPath("/test5.jpg")} 
          alt="Test paper" 
          style={{ display: 'none',
            transformOrigin: 'top left' }}
          onLoad={handleImageLoad}
          onError={(e) => {
            console.error('Failed to load image:', e)
            setLoadingError('Failed to load test.jpg image')
          }}
          crossOrigin="anonymous"
        />
      </div>
</div>
      {/* {corners.length > 0 && (
        <div style={{ position: 'absolute', top: '320px', left: '10px', zIndex: 4000, backgroundColor: 'white', padding: '10px', border: '1px solid #ccc', borderRadius: '4px', width: '300px' }}>
          <h3>Detected Corners:</h3>
          <ul>
            {corners.map((corner, index) => (
              <li key={index}>
                Corner {index + 1}: ({corner.x}, {corner.y})
              </li>
            ))}
          </ul>
          
          <div style={{ marginTop: '15px' }}>
            <button onClick={handleDetectPaperCorners} style={{ marginRight: '10px' }}>
              Re-detect Corners
            </button>
            
            <button 
              onClick={handleUpdatePointsFromCorners}
              style={{ 
                marginRight: '10px',
                backgroundColor: '#28a745',
                color: 'white',
                border: 'none',
                padding: '8px 16px',
                borderRadius: '4px',
                cursor: 'pointer'
              }}
            >
              Sync to Perspective Transform
            </button>
            
            <button 
              onClick={applyPerspectiveTransform}
              style={{ 
                marginRight: '10px',
                backgroundColor: '#007bff',
                color: 'white',
                border: 'none',
                padding: '8px 16px',
                borderRadius: '4px',
                cursor: 'pointer'
              }}
            >
              Apply OpenCV Transform
            </button>
            
            <button 
              onClick={handleDetectPaperCorners}
              style={{ 
                backgroundColor: '#6c757d',
                color: 'white',
                border: 'none',
                padding: '8px 16px',
                borderRadius: '4px',
                cursor: 'pointer'
              }}
            >
              Reset View
            </button>
          </div>
          
          <div style={{ marginTop: '10px', fontSize: '14px', color: '#666' }}>
            <p><strong>PerspectiveTransform Points:</strong></p>
            <ul style={{ margin: 0, paddingLeft: '20px' }}>
              <li>Top-Left: ({points.topLeft.x.toFixed(1)}, {points.topLeft.y.toFixed(1)})</li>
              <li>Top-Right: ({points.topRight.x.toFixed(1)}, {points.topRight.y.toFixed(1)})</li>
              <li>Bottom-Right: ({points.bottomRight.x.toFixed(1)}, {points.bottomRight.y.toFixed(1)})</li>
              <li>Bottom-Left: ({points.bottomLeft.x.toFixed(1)}, {points.bottomLeft.y.toFixed(1)})</li>
            </ul>
          </div>
        </div>
      )}
          <button onClick={handleDetectPaperCorners} style={{ marginTop: '10px' }}>
            Re-detect Corners
          </button> */}
    </div>
  )
}

export default function Page5() {
  return (
    <div>
      <ImageProcessorB />
    </div>
  )
}
