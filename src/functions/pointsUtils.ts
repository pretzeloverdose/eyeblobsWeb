// Utilities for converting between different point formats

import { Corner } from './cornerDetection';

export interface PerspectivePoints {
  topLeft: { x: number; y: number };
  topRight: { x: number; y: number };
  bottomRight: { x: number; y: number };
  bottomLeft: { x: number; y: number };
}

// Function to update PerspectiveTransform points from detected corners
export const updatePointsFromCorners = (
  detectedCorners: Corner[],
  sortCornersClockwise: (corners: Corner[]) => Corner[],
  width: number,
  height: number,
): PerspectivePoints | null => {
  if (detectedCorners.length !== 4) return null

  let sortedCorners = sortCornersClockwise(detectedCorners)

  if (width && height) {
    // alert('Reference image provided, adjusting corners to maintain aspect ratio is not yet implemented.')
    // maintain the ratio
    if (width > height) {
      // alert('Landscape reference image provided, adjusting corners to maintain aspect ratio is not yet implemented.')
      let ratio = height / width
      width = sortedCorners[1].x - sortedCorners[0].x
      height = width * ratio
      sortedCorners[3].y = sortedCorners[0].y + height
      sortedCorners[2].y = sortedCorners[1].y + height
    } else {
      // alert('Portrait reference image provided, adjusting corners to maintain aspect ratio is not yet implemented.')
      let ratio = width / height
    //  alert(height + ' / ' + width + ' = ' + ratio);
      height = sortedCorners[3].y - sortedCorners[0].y
      width = height * ratio
    //  alert(width + " by "  + height + " ratio: " + ratio)
      sortedCorners[1].x = sortedCorners[0].x + width
      sortedCorners[2].x = sortedCorners[3].x + width
    //  alert(`Adjusted width to maintain aspect ratio: ${ratio.toFixed(2)}`)
    }
  }
  // Convert to the format expected by react-perspective-transform
  // Format: { topLeft: {x, y}, topRight: {x, y}, bottomRight: {x, y}, bottomLeft: {x, y} }
  const newPoints: PerspectivePoints = {
    topLeft: { x: sortedCorners[0].x, y: sortedCorners[0].y },
    topRight: { x: sortedCorners[1].x, y: sortedCorners[1].y },
    bottomRight: { x: sortedCorners[2].x, y: sortedCorners[2].y },
    bottomLeft: { x: sortedCorners[3].x, y: sortedCorners[3].y }
  }
  
  console.log('Updating PerspectiveTransform points:', newPoints)
  return newPoints
}