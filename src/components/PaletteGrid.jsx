export default function PaletteGrid({ onAction, workingPalette, setWorkingPalette }) {

    const hslToHex = (h, s, l) => {
        l /= 100;
        const a = s * Math.min(l, 1 - l) / 100;
        const f = n => {
            const k = (n + h / 30) % 12;
            const color = l - a * Math.max(Math.min(k - 3, 9 - k, 1), -1);
            return Math.round(255 * color).toString(16).padStart(2, '0');
        };
        return `#${f(0)}${f(8)}${f(4)}`;
    };

    const handleColorSelect = (h, s, l) => {
        const hexValue = hslToHex(h, s, l);
        onAction?.({
            type: "colorSelected",
            hsl: `hsl(${h}, ${s}%, ${l}%)`,
            hex: hexValue,
            components: { h, s, l }
        });
    };

    return (
        <div>
        <div style={{
            display: "inline-block",
            float: 'left',
            gap: "18px",
            padding: "16px",
            paddingTop: "0px"
        }}>
            {workingPalette.map(([h, s, l], index) => (
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
        </div>
    );
}