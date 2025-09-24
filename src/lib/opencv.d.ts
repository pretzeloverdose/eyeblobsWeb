// Global OpenCV.js type definitions
declare global {
  interface Window {
    cv: OpenCV;
  }
}

interface OpenCV {
  Mat: any;
  MatVector: any;
  imread: (imageElement: any) => any;
  imshow: (canvasElement: any, mat: any) => void;
  cvtColor: (src: any, dst: any, code: any) => void;
  GaussianBlur: (src: any, dst: any, ksize: any, sigmaX: number, sigmaY?: number) => void;
  Canny: (image: any, edges: any, threshold1: number, threshold2: number) => void;
  findContours: (image: any, contours: any, hierarchy: any, mode: any, method: any) => void;
  contourArea: (contour: any) => number;
  arcLength: (curve: any, closed: boolean) => number;
  approxPolyDP: (curve: any, approx: any, epsilon: number, closed: boolean) => void;
  getPerspectiveTransform: (src: any, dst: any) => any;
  warpPerspective: (src: any, dst: any, M: any, dsize: any) => void;
  fillPoly: (img: any, pts: any, color: any) => void;
  matFromArray: (rows: number, cols: number, type: number, array: number[]) => any;
  threshold: (src: any, dst: any, thresh: number, maxval: number, type: any) => void;
  boundingRect: (contour: any) => any;
  rectangle: (img: any, pt1: any, pt2: any, color: any, thickness?: number) => void;
  Point: new (x: number, y: number) => any;
  Scalar: new (r: number, g: number, b: number, a?: number) => any;
  Size: new (width: number, height: number) => any;
  matFromImageData: (imageData: ImageData) => any;
  COLOR_RGBA2GRAY: any;
  COLOR_RGB2GRAY: any;
  CV_32FC2: any;
  CV_32SC2: any;
  CV_8UC1: any;
  COLOR_BGR2RGB: any;
  THRESH_BINARY: any;
  RETR_EXTERNAL: any;
  CHAIN_APPROX_SIMPLE: any;
  matFromImageData: (imageData: ImageData) => any;
  CV_8UC1: any;
  CV_8UC3: any;
  CV_8UC4: any;
  onRuntimeInitialized?: () => void;
}

export {};