// Component-specific wrapper for paper corner detection

import { detectPaperCorners as detectCorners, Corner } from './cornerDetection';
import { updatePointsFromCorners, PerspectivePoints } from './pointsUtils';
import { sortCornersClockwise } from './cornerDetection';

export interface PaperDetectionParams {
  cv: any;
  canvas: HTMLCanvasElement;
  imageElement: HTMLImageElement;
  refIMG?: HTMLImageElement;
  onCornersDetected?: (corners: Corner[]) => void;
  onPointsUpdated?: (points: PerspectivePoints) => void;
}

export const detectPaperCorners = ({
  cv,
  canvas,
  imageElement,
  refIMG,
  onCornersDetected,
  onPointsUpdated
}: PaperDetectionParams): Corner[] => {
  if (!cv || !canvas || !imageElement) {
    console.log('OpenCV, canvas, or image not ready')
    return []
  }

  const refWidth = refIMG ? refIMG.naturalWidth : 0;
  const refHeight = refIMG ? refIMG.naturalHeight : 0;
  // alert(`Reference Image Dimensions: ${refWidth} x ${refHeight}`);

  const detectedCorners = detectCorners({
    cv,
    canvas,
    imageElement,
    onCornersDetected: (corners) => {
      // Update the PerspectiveTransform points
      const points = updatePointsFromCorners(corners, sortCornersClockwise, (refWidth && refHeight) ? (refWidth / refHeight) : undefined);
      
      if (onCornersDetected) {
        onCornersDetected(corners)
      }
      
      if (onPointsUpdated && points) {
        onPointsUpdated(points)
      }
    }
  })

  // Set corners in state if callback wasn't used
  if (detectedCorners.length > 0) {
    const points = updatePointsFromCorners(detectedCorners, sortCornersClockwise, (refWidth && refHeight) ? (refWidth / refHeight) : undefined);
    
    if (onCornersDetected) {
      onCornersDetected(detectedCorners)
    }
    
    if (onPointsUpdated && points) {
      onPointsUpdated(points)
    }
  }

  return detectedCorners
}