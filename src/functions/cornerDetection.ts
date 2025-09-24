// Corner detection utility functions for OpenCV paper detection

export interface Corner {
  x: number;
  y: number;
}

export interface CornerDetectionParams {
  cv: any;
  canvas: HTMLCanvasElement;
  imageElement: HTMLImageElement;
  onCornersDetected?: (corners: Corner[]) => void;
}

// Helper function to sort corners in clockwise order starting from top-left
export const sortCornersClockwise = (corners: Corner[]): Corner[] => {
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

export const detectPaperCorners = ({ cv, canvas, imageElement, onCornersDetected }: CornerDetectionParams): Corner[] => {
  if (!cv || !canvas || !imageElement) {
    console.log('OpenCV, canvas, or image not ready')
    return []
  }

  try {
    const ctx = canvas.getContext('2d')
    const img = imageElement

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
          return []
        }
        src = cv.matFromImageData(imageData)
        console.log('Image loaded with matFromImageData:', src.rows, 'x', src.cols, 'channels:', src.channels(), 'type:', src.type())
      } catch (e2) {
        console.error('Both image loading methods failed:', e2)
        return []
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
      return []
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

    let cornersArray: Corner[] = []

    if (largestContour) {
      for (let i = 0; i < largestContour.rows; i++) {
        const point = {
          x: largestContour.data32S[i * 2],
          y: largestContour.data32S[i * 2 + 1]
        }
        cornersArray.push(point)
      }
      
      // Draw the detected corners on the canvas
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
      
      // Call the callback if provided
      if (onCornersDetected) {
        onCornersDetected(cornersArray)
      }
    } else {
      console.log('No quadrilateral found')
      ctx?.drawImage(img, 0, 0)
    }

    // Cleanup
    src.delete()
    gray.delete()
    blurred.delete()
    edges.delete()
    contours.delete()
    hierarchy.delete()

    return cornersArray

  } catch (error) {
    console.error('Error in corner detection:', error)
    return []
  }
}