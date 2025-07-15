
import { getQuantizedColorsFromBase64 } from '@/functions/getTopColorsFromBase64';
export async function extractImageColors() {
  console.log("Starting image color extraction...");
  try {
    const savedImage = localStorage.getItem('savedImage');
    if (!savedImage) {
      console.error('No saved image found in localStorage');
      return null;
    }
    
    console.log("Found image, extracting colors...");
    const hslColors = await getQuantizedColorsFromBase64(savedImage);
    console.log("Extracted colors:", hslColors);
    return hslColors;
  } catch (err) {
    console.error('Error analyzing colors:', err);
    return null;
  }
}