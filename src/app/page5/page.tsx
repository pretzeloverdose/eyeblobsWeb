'use client'
import { Console } from 'console'
import React, { useEffect, useState, useRef } from 'react'
import { PerspectiveTransform } from 'react-perspective-transform';

function ImageProcessor() {
  const [cvLoaded, setCvLoaded] = useState(false)
  const [cv, setCv] = useState<any>(null)
  const [loadingError, setLoadingError] = useState<string | null>(null)
  const [loadingStatus, setLoadingStatus] = useState<string>('Initializing...')
  const [corners, setCorners] = useState<any[]>([])
  const [showOverlay, setShowOverlay] = useState(false)
  const [points, setPoints] = useState({
    topLeft: { x: 0, y: 0 },
    topRight: { x: 100, y: 0 },
    bottomRight: { x: 100, y: 100 },
    bottomLeft: { x: 0, y: 100 }
  })
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const imageRef = useRef<HTMLImageElement>(null)
  const sourceImageRef = useRef<HTMLImageElement>(null)
  const [editable, setEditable] = useState(true);
  const [aspectRatioCompensation, setAspectRatioCompensation] = useState(1);

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
      
      const script = document.createElement('script')
      script.src = openCVPath
      script.async = true
      
      script.onload = () => {
        setLoadingStatus('Script loaded, waiting for OpenCV initialization...')
        console.log('OpenCV.js script loaded successfully')
        
        const checkOpenCV = () => {
          if (window.cv && window.cv.Mat) {
            setCv(window.cv)
            setCvLoaded(true)
            setLoadingStatus('OpenCV.js is ready!')
            console.log('OpenCV.js is fully initialized and ready')
          } else {
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

  const detectB = () => {

  }

  const applyPerspectiveTransform = () => {
    if (!cv || !canvasRef.current || !sourceImageRef.current || corners.length !== 4) {
      console.log('Cannot apply perspective transform: missing requirements')
      return
    }

    try {
      const canvas = canvasRef.current
      const ctx = canvas.getContext('2d')
      const sourceImg = sourceImageRef.current

      // Load the source image that we want to transform
      let sourceMat: any
      try {
        sourceMat = cv.imread(sourceImg)
        console.log('Source image loaded:', sourceMat.rows, 'x', sourceMat.cols)
      } catch (e) {
        console.error('Failed to load source image:', e)
        return
      }

      // Sort corners to ensure proper mapping (top-left, top-right, bottom-right, bottom-left)
      const sortedCorners = sortCornersClockwise(corners)

      // Source points (corners of the source image)
      const srcPoints = cv.matFromArray(4, 1, cv.CV_32FC2, [
        0, 0,                                    // top-left
        sourceMat.cols, 0,                       // top-right  
        sourceMat.cols, sourceMat.rows,          // bottom-right
        0, sourceMat.rows                        // bottom-left
      ])

      // Destination points (detected corners in the target image)
      const dstPoints = cv.matFromArray(4, 1, cv.CV_32FC2, [
        sortedCorners[0].x, sortedCorners[0].y,  // top-left
        sortedCorners[1].x, sortedCorners[1].y,  // top-right
        sortedCorners[2].x, sortedCorners[2].y,  // bottom-right
        sortedCorners[3].x, sortedCorners[3].y   // bottom-left
      ])

      // get the ratio of Y to X
      
      // Calculate the width and height of the detected rectangle
      const rectWidth = Math.sqrt(
        Math.pow(sortedCorners[1].x - sortedCorners[0].x, 2) + 
        Math.pow(sortedCorners[1].y - sortedCorners[0].y, 2)
      )
      const rectHeight = Math.sqrt(
        Math.pow(sortedCorners[3].x - sortedCorners[0].x, 2) + 
        Math.pow(sortedCorners[3].y - sortedCorners[0].y, 2)
      )
      
      // Calculate aspect ratio (height/width)
      const aspectRatio = rectHeight / rectWidth
      const compensationScale = 1 / aspectRatio
      
      console.log('Rectangle dimensions:', { width: rectWidth, height: rectHeight, aspectRatio, compensationScale })
      
      // Apply scaleY compensation to the source image element
      if (sourceImageRef.current) {
        sourceImageRef.current.style.transform = `scaleY(${compensationScale})`
      console.log('Applied scaleY compensation:', compensationScale)
      
      // Store the compensation value for the PerspectiveTransform component
      setAspectRatioCompensation(compensationScale)
    }      // Calculate perspective transformation matrix
      const transformMatrix = cv.getPerspectiveTransform(srcPoints, dstPoints)

      // Create output matrix for the transformed image
      const transformed = new cv.Mat()

      // Apply perspective transformation
      cv.warpPerspective(
        sourceMat, 
        transformed, 
        transformMatrix, 
        new cv.Size(canvas.width, canvas.height)
      )

      // Get the current image on canvas (the detected paper image)
      const currentImageData = ctx?.getImageData(0, 0, canvas.width, canvas.height)
      if (currentImageData) {
        const backgroundMat = cv.matFromImageData(currentImageData)
        
        // Create a mask for blending
        const mask = new cv.Mat(canvas.height, canvas.width, cv.CV_8UC1, new cv.Scalar(0))
        
        // Create contour points in the correct format for fillPoly
        const pts = cv.matFromArray(4, 1, cv.CV_32SC2, 
          sortedCorners.flatMap(corner => [Math.round(corner.x), Math.round(corner.y)]))
        
        const contours = new cv.MatVector()
        contours.push_back(pts)
        
        // Use drawContours with filled option instead of fillPoly
        cv.drawContours(mask, contours, -1, new cv.Scalar(255), -1)

        // Blend the transformed image with the background
        const result = new cv.Mat()
        backgroundMat.copyTo(result)

        // Copy transformed image to result where mask is white
        transformed.copyTo(result, mask)

        // Display the result
        cv.imshow(canvas, result)

        // Cleanup
        backgroundMat.delete()
        mask.delete()
        pts.delete()
        contours.delete()
        result.delete()
      }

      // Cleanup
      sourceMat.delete()
      srcPoints.delete()
      dstPoints.delete()
      transformMatrix.delete()
      transformed.delete()

    } catch (error) {
      console.error('Error in perspective transform:', error)
    }
  }

  // Helper function to sort corners in clockwise order starting from top-left
  const sortCornersClockwise = (corners: any[]) => {
    if (corners.length !== 4) return corners

    // Find center point
    const centerX = corners.reduce((sum, corner) => sum + corner.x, 0) / 4
    const centerY = corners.reduce((sum, corner) => sum + corner.y, 0) / 4

    // Sort by angle from center
    const cornersWithAngle = corners.map(corner => ({
      ...corner,
      angle: Math.atan2(corner.y - centerY, corner.x - centerX)
    }))

    cornersWithAngle.sort((a, b) => a.angle - b.angle)

    // Find top-left corner (smallest x + y)
    let topLeftIndex = 0
    let minSum = cornersWithAngle[0].x + cornersWithAngle[0].y
    
    for (let i = 1; i < 4; i++) {
      const sum = cornersWithAngle[i].x + cornersWithAngle[i].y
      if (sum < minSum) {
        minSum = sum
        topLeftIndex = i
      }
    }

    // Reorder starting from top-left, going clockwise
    const ordered = []
    for (let i = 0; i < 4; i++) {
      ordered.push(cornersWithAngle[(topLeftIndex + i) % 4])
    }

    return ordered
  }

  // Function to update PerspectiveTransform points from detected corners
  const updatePointsFromCorners = (detectedCorners: any[]) => {
    if (detectedCorners.length !== 4) return

    const sortedCorners = sortCornersClockwise(detectedCorners)
    
    // Convert to the format expected by react-perspective-transform
    // Format: { topLeft: {x, y}, topRight: {x, y}, bottomRight: {x, y}, bottomLeft: {x, y} }
    const newPoints = {
      topLeft: { x: sortedCorners[0].x, y: sortedCorners[0].y },
      topRight: { x: sortedCorners[1].x, y: sortedCorners[1].y },
      bottomRight: { x: sortedCorners[2].x, y: sortedCorners[2].y },
      bottomLeft: { x: sortedCorners[3].x, y: sortedCorners[3].y }
    }
    
    console.log('Updating PerspectiveTransform points:', newPoints)
    setPoints(newPoints)
  }

  const detectPaperCorners = () => {
    if (!cv || !canvasRef.current || !imageRef.current) {
      console.log('OpenCV, canvas, or image not ready')
      return
    }

    try {
      const canvas = canvasRef.current
      const ctx = canvas.getContext('2d')
      const img = imageRef.current

      // Ensure canvas matches image dimensions
      canvas.width = img.naturalWidth || img.width
      canvas.height = img.naturalHeight || img.height

      // Clear canvas and draw image
      ctx?.clearRect(0, 0, canvas.width, canvas.height)
      ctx?.drawImage(img, 0, 0, canvas.width, canvas.height)

      // Alternative method: use cv.imread directly on the image element
      let src: any
      try {
        // Method 1: Try using cv.imread (preferred for images)
        src = cv.imread(img)
        console.log('Image loaded with cv.imread:', src.rows, 'x', src.cols, 'channels:', src.channels(), 'type:', src.type())
      } catch (e) {
        console.log('cv.imread failed, trying matFromImageData...', e)
        // Method 2: Fallback to canvas image data
        try {
          const imageData = ctx?.getImageData(0, 0, canvas.width, canvas.height)
          if (!imageData) {
            console.error('Could not get image data from canvas')
            return
          }
          src = cv.matFromImageData(imageData)
          console.log('Image loaded with matFromImageData:', src.rows, 'x', src.cols, 'channels:', src.channels(), 'type:', src.type())
        } catch (e2) {
          console.error('Both image loading methods failed:', e2)
          return
        }
      }

      const gray = new cv.Mat()
      const blurred = new cv.Mat()
      const edges = new cv.Mat()
      const contours = new cv.MatVector()
      const hierarchy = new cv.Mat()

      // Validate source image before color conversion
      if (src.channels() === 4) {
        // RGBA to Gray conversion
        cv.cvtColor(src, gray, cv.COLOR_RGBA2GRAY)
      } else if (src.channels() === 3) {
        // RGB to Gray conversion  
        cv.cvtColor(src, gray, cv.COLOR_RGB2GRAY)
      } else if (src.channels() === 1) {
        // Already grayscale, just copy
        src.copyTo(gray)
      } else {
        console.error('Unsupported number of channels:', src.channels())
        src.delete()
        gray.delete()
        blurred.delete()
        edges.delete()
        contours.delete()
        hierarchy.delete()
        return
      }

      console.log('Gray image created:', gray.rows, 'x', gray.cols, 'type:', gray.type())

      cv.GaussianBlur(gray, blurred, new cv.Size(5, 5), 0)
      cv.Canny(blurred, edges, 50, 150)
      cv.findContours(edges, contours, hierarchy, cv.RETR_EXTERNAL, cv.CHAIN_APPROX_SIMPLE)

      let largestContour = null
      let largestArea = 0

      console.log('Contours found:', contours.size())

      for (let i = 0; i < contours.size(); i++) {
        const contour = contours.get(i)
        const area = cv.contourArea(contour)
        
        const epsilon = 0.02 * cv.arcLength(contour, true)
        const approx = new cv.Mat()
        cv.approxPolyDP(contour, approx, epsilon, true)

        if (approx.rows === 4 && area > largestArea && area > 1000) {
          largestArea = area
          largestContour = approx.clone()
        }
        
        approx.delete()
        contour.delete()
      }

      if (largestContour) {
        const cornersArray = []
        for (let i = 0; i < largestContour.rows; i++) {
          const point = {
            x: largestContour.data32S[i * 2],
            y: largestContour.data32S[i * 2 + 1]
          }
          cornersArray.push(point)
        }
        
        setCorners(cornersArray)
        
        // Update the PerspectiveTransform points
        updatePointsFromCorners(cornersArray)

        ctx?.drawImage(img, 0, 0)

        ctx!.strokeStyle = 'red'
        ctx!.fillStyle = 'red'
        ctx!.lineWidth = 3

        cornersArray.forEach((corner, index) => {
          ctx?.beginPath()
          ctx?.arc(corner.x, corner.y, 8, 0, 2 * Math.PI)
          ctx?.fill()

          ctx!.fillStyle = 'white'
          ctx!.font = '16px Arial'
          ctx?.fillText(`${index + 1}`, corner.x - 6, corner.y + 6)
          ctx!.fillStyle = 'red'
        })

        ctx!.strokeStyle = 'blue'
        ctx!.lineWidth = 2
        ctx?.beginPath()
        cornersArray.forEach((corner, index) => {
          if (index === 0) {
            ctx?.moveTo(corner.x, corner.y)
          } else {
            ctx?.lineTo(corner.x, corner.y)
          }
        })
        ctx?.closePath()
        ctx?.stroke()

        largestContour.delete()
      } else {
        console.log('No quadrilateral found')
        ctx?.drawImage(img, 0, 0)
      }

      src.delete()
      gray.delete()
      blurred.delete()
      edges.delete()
      contours.delete()
      hierarchy.delete()

    } catch (error) {
      console.error('Error in corner detection:', error)
    }
  }

  const handleImageLoad = () => {
    console.log('Image loaded, detecting corners...')
    if (cvLoaded) {
      setTimeout(detectPaperCorners, 100)
    }
  }

  useEffect(() => {
    if (cvLoaded && imageRef.current?.complete) {
      detectPaperCorners()
    }
  }, [cvLoaded])

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
      <h2>Paper Corner Detection</h2>
      <p>OpenCV Status: {cvLoaded ? 'Ready ✅' : loadingStatus}</p>
      {cvLoaded && cv && (
        <p style={{ color: 'green' }}>OpenCV initialized successfully</p>
      )}
      
      <div style={{ marginTop: '10px', maxWidth: '600px', zIndex: 5000, position: 'absolute', opacity: 0.6 }}>
        <PerspectiveTransform
      points={points}
      onPointsChange={setPoints}
      editable={editable}
      onEditableChange={setEditable}
    >
        <img 
          src={getAssetPath("/source1.jpg")} 
          alt="Instructions" 
          style={{ 
            width: '100%', 
            border: '1px solid #ccc',
            transform: `scaleY(${aspectRatioCompensation})`
          }}
        />
        </PerspectiveTransform>
      </div>

      <div style={{ marginTop: '20px' }}>
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
          src={getAssetPath("/test5.jpg")} 
          alt="Test paper" 
          style={{ display: 'none' }}
          onLoad={handleImageLoad}
          onError={(e) => {
            console.error('Failed to load image:', e)
            setLoadingError('Failed to load test.jpg image')
          }}
          crossOrigin="anonymous"
        />
        <canvas 
          ref={canvasRef}
          style={{ 
            maxWidth: '30%', 
            border: '1px solid #ccc',
            display: cvLoaded ? 'block' : 'none'
          }}
        />
        {!cvLoaded && (
          <div style={{ 
            width: '400px', 
            height: '300px', 
            border: '1px solid #ccc', 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'center',
            backgroundColor: '#f5f5f5'
          }}>
            Loading OpenCV...
          </div>
        )}
      </div>

      {corners.length > 0 && (
        <div style={{ marginTop: '20px' }}>
          <h3>Detected Corners:</h3>
          <ul>
            {corners.map((corner, index) => (
              <li key={index}>
                Corner {index + 1}: ({corner.x}, {corner.y})
              </li>
            ))}
          </ul>
          
          <div style={{ marginTop: '15px' }}>
            <button onClick={detectPaperCorners} style={{ marginRight: '10px' }}>
              Re-detect Corners
            </button>
            
            <button 
              onClick={() => updatePointsFromCorners(corners)}
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
              onClick={detectPaperCorners}
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
          <button onClick={detectPaperCorners} style={{ marginTop: '10px' }}>
            Re-detect Corners
          </button>
    </div>
  )
}

export default function Page5() {
  return (
    <div>
      <ImageProcessor />
    </div>
  )
}
