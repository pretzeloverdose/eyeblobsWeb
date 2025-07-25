"use client";
import monetPalette from "../palettes/monetPalette";
import zornPalette from "../palettes/monetPalette";

export default function MonetPaletteGrid() {
  return (
    <div
      style={{
        display: "inline-block",
        float: 'left',
        gap: "18px",
        padding: "16px",
      }}
    >
      {monetPalette.map(([h, s, l], index) => (
        <div
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
