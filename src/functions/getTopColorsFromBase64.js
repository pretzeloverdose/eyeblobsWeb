// utils/colorUtils.js

export async function getQuantizedColorsFromBase64(base64Image, colorCount = 36) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = async () => {
      try {
        // Create canvas to analyze image
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        canvas.width = img.naturalWidth;
        canvas.height = img.naturalHeight;
        ctx.drawImage(img, 0, 0);
        
        // Get pixel data
        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const pixels = imageData.data;
        
        // Convert all pixels to HSL and collect unique colors
        const hslPixels = [];
        for (let i = 0; i < pixels.length; i += 4) {
          const r = pixels[i];
          const g = pixels[i + 1];
          const b = pixels[i + 2];
          hslPixels.push(rgbToHsl(r, g, b));
        }
        
        // Perform median cut quantization in HSL space
        const quantizedColors = medianCutQuantize(hslPixels, colorCount);
        
        // Sort by luminance to make the palette more organized
        quantizedColors.sort((a, b) => b[2] - a[2]);
        
        resolve(quantizedColors);
      } catch (error) {
        reject(error);
      }
    };
    img.onerror = () => reject(new Error('Failed to load image'));
    img.src = base64Image;
  });
}

// HSL Median Cut Quantization
function medianCutQuantize(hslPixels, colorCount) {
  // Create initial bucket with all colors
  let buckets = [hslPixels];
  
  // Recursively split buckets
  while (buckets.length < colorCount) {
    const newBuckets = [];
    
    for (const bucket of buckets) {
      if (bucket.length === 0) continue;
      
      // Find which HSL channel has greatest range
      const hRange = getChannelRange(bucket, 0);
      const sRange = getChannelRange(bucket, 1);
      const lRange = getChannelRange(bucket, 2);
      
      const maxRange = Math.max(hRange, sRange, lRange);
      let channelToSort;
      if (maxRange === hRange) channelToSort = 0;
      else if (maxRange === sRange) channelToSort = 1;
      else channelToSort = 2;
      
      // Sort bucket by the channel with greatest range
      bucket.sort((a, b) => a[channelToSort] - b[channelToSort]);
      
      // Split at median
      const median = Math.floor(bucket.length / 2);
      newBuckets.push(bucket.slice(0, median));
      newBuckets.push(bucket.slice(median));
    }
    
    buckets = newBuckets;
    if (buckets.length >= colorCount) break;
  }
  
  // Calculate average color for each bucket
  return buckets.map(bucket => {
    if (bucket.length === 0) return [0, 0, 0];
    
    const sum = bucket.reduce((acc, color) => {
      acc[0] += color[0];
      acc[1] += color[1];
      acc[2] += color[2];
      return acc;
    }, [0, 0, 0]);
    
    return [
      Math.round(sum[0] / bucket.length),
      Math.round(sum[1] / bucket.length),
      Math.round(sum[2] / bucket.length)
    ];
  });
}

function getChannelRange(colors, channelIndex) {
  let min = 360, max = 0;
  for (const color of colors) {
    const val = color[channelIndex];
    min = Math.min(min, val);
    max = Math.max(max, val);
  }
  return max - min;
}

// RGB to HSL conversion (optimized)
function rgbToHsl(r, g, b) {
  r /= 255, g /= 255, b /= 255;
  const max = Math.max(r, g, b), min = Math.min(r, g, b);
  let h, s, l = (max + min) / 2;

  if (max === min) {
    h = s = 0; // achromatic
  } else {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch (max) {
      case r: h = (g - b) / d + (g < b ? 6 : 0); break;
      case g: h = (b - r) / d + 2; break;
      case b: h = (r - g) / d + 4; break;
    }
    h /= 6;
  }

  return [
    Math.round(h * 360),  // H: 0-360
    Math.round(s * 100),  // S: 0-100
    Math.round(l * 100)   // L: 0-100
  ];
}