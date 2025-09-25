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
  ratio?: number
): PerspectivePoints | null => {
  if (detectedCorners.length !== 4) return null

  const sortedCorners = sortCornersClockwise(detectedCorners)

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