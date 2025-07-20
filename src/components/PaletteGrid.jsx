export default function PaletteGrid({ onAction, workingPalette, setWorkingPalette, paletteType, removeColor }) {

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

    const deleteSwatch = (hIn, sIn, lIn) => {
        const newPalette = workingPalette.filter(([h, s, l]) => h !== hIn || s !== sIn || l !== lIn);
        setWorkingPalette(newPalette);
        localStorage.setItem('customPaletteColors', newPalette);
    }

    return (
        <div>
        <div style={{
            display: "inline-block",
            float: 'left',
            gap: "18px",
            padding: "16px",
            paddingTop: "0px"
        }}>
            {workingPalette && (workingPalette.map(([h, s, l], index) => (
                <div key={index+'w'} style={{position: 'relative', 
            display: "inline-block",
            float: 'left' }}>
                    {paletteType == "customPaletteColors" && ( 
                        <div key={index+'d'} style={{ position: 'absolute', right: 15, top: 0, height: 6, width: 6, zIndex: 2 }}>
                            <button onClick={() => deleteSwatch(h, s, l)} style={{ padding: '0px 5px 0px 5px', borderRadius: 0 }}>x</button>
                            </div>)}
                    <div 
                    onClick={() => handleColorSelect(h, s, l)}
                    key={index+'c'}
                    style={{
                        backgroundColor: `hsl(${h}, ${s}%, ${l}%)`,
                        width: "50px",
                        height: "50px",
                        border: "1px solid #ccc",
                        float: "left"
                    }}
                ></div>
                </div>
            )))}
        </div>
        </div>
    );
}