"use client";
import primaryPalette from "../palettes/primaryPalette";

export default function PrimaryPaletteGrid({ onAction }) {

  return (
    <div
      style={{
        display: "inline-block",
        float: 'left',
        gap: "18px",
        padding: "16px",
      }}
    >
      {primaryPalette.map(([h, s, l], index) => (
        <div
        onClick={() => handleColorSelect(h, s, l)}
          key={index}
          style={{
            backgroundColor: `hsl(${h}, ${s}%, ${l}%)`,
            width: "50px",
            height: "50px",
            border: "1px solid #ccc",
            float: "left"
          }}
        />
      ))}
    </div>
  );
}