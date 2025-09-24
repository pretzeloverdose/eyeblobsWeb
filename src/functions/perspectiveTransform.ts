// Perspective transformation utility functions for OpenCV

import { Corner } from './cornerDetection';

export interface PerspectiveTransformParams {
  cv: any;
  canvas: HTMLCanvasElement;
  sourceImageElement: HTMLImageElement;
  corners: Corner[];
  sortCornersClockwise: (corners: Corner[]) => Corner[];
  onAspectRatioCalculated?: (aspectRatio: number, compensationScale: number) => void;
}

export const applyPerspectiveTransform = ({
  cv,
  canvas,
  sourceImageElement,
  corners,
  sortCornersClockwise,
  onAspectRatioCalculated
}: PerspectiveTransformParams): void => {
  if (!cv || !canvas || !sourceImageElement || corners.length !== 4) {
    console.log('Cannot apply perspective transform: missing requirements')
    return
  }

  try {
    const ctx = canvas.getContext('2d')
    const sourceImg = sourceImageElement

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
    if (sourceImageElement) {
      sourceImageElement.style.transform = `scaleY(${compensationScale})`
      console.log('Applied scaleY compensation:', compensationScale)
    }
    
    // Call the callback if provided
    if (onAspectRatioCalculated) {
      onAspectRatioCalculated(aspectRatio, compensationScale)
    }

    // Calculate perspective transformation matrix
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