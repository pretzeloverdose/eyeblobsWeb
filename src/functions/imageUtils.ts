import { RGB } from "next-colors";
import { RefObject } from "react";

export function hexToCmyk(hex: string): string {
  // Remove "#" if present
  hex = hex.replace(/^#/, "");

  // Validate hex length (3 or 6)
  if (hex.length !== 3 && hex.length !== 6) {
    throw new Error("Invalid hex color length");
  }

  // Parse shorthand hex (#fff → #ffffff)
  if (hex.length === 3) {
    hex = hex.split("").map(char => char + char).join("");
  }

  // Parse RGB components
  const r = parseInt(hex.substring(0, 2), 16);
  const g = parseInt(hex.substring(2, 4), 16);
  const b = parseInt(hex.substring(4, 6), 16);

  // Normalize RGB to 0–1
  const rNorm = r / 255;
  const gNorm = g / 255;
  const bNorm = b / 255;

  // Calculate K (black) component
  const k = 1 - Math.max(rNorm, gNorm, bNorm);

  // Handle pure black case
  if (k === 1) {
    return "C:0 M:0 Y:0 K:100";
  }

  // Calculate CMYK components (0–100 scale)
  const c = ((1 - rNorm - k) / (1 - k)) * 100;
  const m = ((1 - gNorm - k) / (1 - k)) * 100;
  const y = ((1 - bNorm - k) / (1 - k)) * 100;
  const kScaled = k * 100;

  // Round to nearest integer (optional, adjust as needed)
  const format = (val: number) => Math.round(val);

  return `C:${format(c)} M:${format(m)} Y:${format(y)} K:${format(kScaled)}`;
}

export function hexToRgb(hex: string) {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `rgb(${r}, ${g}, ${b})`;
}

export function hexToRgbArray(hex: string): RGB {
  return {
    r: parseInt(hex.slice(1, 3), 16),
    g: parseInt(hex.slice(3, 5), 16),
    b: parseInt(hex.slice(5, 7), 16)
  };
}

export const rgbToHsl = (r: number, g: number, b: number): [number, number, number] => {
    r /= 255;
    g /= 255;
    b /= 255;

    const max = Math.max(r, g, b);
    const min = Math.min(r, g, b);
    let h = 0; // default initialization
    let s = 0;
    const l = (max + min) / 2;

    if (max !== min) {
      const d = max - min;
      s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
      switch (max) {
        case r:
          h = (g - b) / d + (g < b ? 6 : 0);
          break;
        case g:
          h = (b - r) / d + 2;
          break;
        case b:
          h = (r - g) / d + 4;
          break;
      }
      h *= 60;
    }

    return [Math.round(h), Math.round(s * 100), Math.round(l * 100)];
  };

  export const hexToHslToString = (hex: string) => {
    const r = parseInt(hex.slice(1, 3), 16);
    const g = parseInt(hex.slice(3, 5), 16);
    const b = parseInt(hex.slice(5, 7), 16);
    const hsl = rgbToHsl(r, g, b);

    return "H:" + hsl[0] + " S:" + hsl[1] + " L:" + hsl[2];
  }

  export const hslToRgb = (h: number, s: number, l: number): [number, number, number] => {
    // Convert saturation and lightness from percentages to 0-1 range
    s /= 100;
    l /= 100;

    // If saturation is 0, the color is achromatic (gray)
    if (s === 0) {
      const gray = Math.round(l * 255);
      return [gray, gray, gray];
    }

    // Temporary variables for calculation
    const temp1 = l < 0.5 ? l * (1 + s) : l + s - l * s;
    const temp2 = 2 * l - temp1;

    // Normalize hue to 0-1 range
    const hue = h / 360;

    // Calculate RGB components
    const rgb = [0, 0, 0];
    for (let i = 0; i < 3; i++) {
      let tempHue = hue + (1 / 3) * -(i - 1);
      if (tempHue < 0) tempHue += 1;
      if (tempHue > 1) tempHue -= 1;

      let tempColor;
      if (6 * tempHue < 1) {
        tempColor = temp2 + (temp1 - temp2) * 6 * tempHue;
      } else if (2 * tempHue < 1) {
        tempColor = temp1;
      } else if (3 * tempHue < 2) {
        tempColor = temp2 + (temp1 - temp2) * (2 / 3 - tempHue) * 6;
      } else {
        tempColor = temp2;
      }

      rgb[i] = Math.round(tempColor * 255);
    }

    return [rgb[0], rgb[1], rgb[2]];
  };

  export function findWeightedMidpointHsl(
    targetHsl: number[],
    hslArray: number[][],
    strength: number
  ): number[] {
    strength = Math.max(1, Math.min(100, strength));
    const weight = strength / 100;

    let closestItem = null;
    let smallestDiff = Infinity;

    for (const item of hslArray) {
      const hueDiff = Math.min(
        Math.abs(item[0] - targetHsl[0]),
        360 - Math.abs(item[0] - targetHsl[0])
      );
      const satDiff = Math.abs(item[1] - targetHsl[1]);
      const lightDiff = Math.abs(item[2] - targetHsl[2]);

      const overallDiff = Math.sqrt(
        Math.pow(hueDiff / 360, 2) +
        Math.pow(satDiff / 100, 2) +
        Math.pow(lightDiff / 100, 2)
      );

      if (overallDiff < smallestDiff) {
        smallestDiff = overallDiff;
        closestItem = item;
      }
    }

    if (!closestItem) return targetHsl;

    const [h1, s1, l1] = targetHsl;
    const [h2, s2, l2] = closestItem;

    // Hue interpolation with wrap-around
    let deltaH = h2 - h1;
    if (Math.abs(deltaH) > 180) {
      deltaH -= Math.sign(deltaH) * 360;
    }
    let weightedH = (h1 + deltaH * weight + 360) % 360;

    // Linear interpolation for S and L
    const weightedS = s1 + (s2 - s1) * weight;
    const weightedL = l1 + (l2 - l1) * weight;

    return [
      Math.round(weightedH),
      Math.round(weightedS),
      Math.round(weightedL)
    ];
  }

  export const calculateBounds = (imgRefIn: RefObject<HTMLImageElement | null>, transformState: { scale: any; }) => {
    if (!imgRefIn.current) return { minPositionX: 0, maxPositionX: 0, minPositionY: 0, maxPositionY: 0 };

    const img = imgRefIn.current;
    const wrapper = img.parentElement?.parentElement; // TransformComponent -> div wrapper
    const wrapperWidth = wrapper?.clientWidth || 300;
    const wrapperHeight = wrapper?.clientHeight || 300;
    
    const scale = transformState.scale;
    const imgWidth = img.naturalWidth * scale;
    const imgHeight = img.naturalHeight * scale;

    // Calculate maximum allowed position to keep image visible
    const maxPositionX = Math.max(0, (imgWidth - wrapperWidth) / 2);
    const minPositionX = -maxPositionX;
    const maxPositionY = Math.max(0, (imgHeight - wrapperHeight) / 2);
    const minPositionY = -maxPositionY;

    return { minPositionX, maxPositionX, minPositionY, maxPositionY };
  };