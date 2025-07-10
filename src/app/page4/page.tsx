'use client';
import React from 'react';
import { SketchPicker } from 'react-color';
import { ChangeEventHandler, useEffect, useRef, useState } from 'react';
import { ReactZoomPanPinchRef, TransformComponent, TransformWrapper } from 'react-zoom-pan-pinch';



export default function Page4() {
  const [imageSrc, setImageSrc] = useState<string | null>(null);
  const imgRef = useRef<HTMLImageElement | null>(null);
    const [gridWidth, setGridWidth] = useState('');
    const [gridRows, setGridRows] = useState('');
    const [gridCellWidth, setGridCellWidth] = useState('');
    const [virtualRatio, setVirtualRatio] = useState(0.0);
  const gridRef = useRef<number | null>(null);
  const [pixelColor, setPixelColor] = useState<string | null>('#dddddd');
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const transformRef = useRef<ReactZoomPanPinchRef | null>(null);
  const [transformState, setTransformState] = useState({
    scale: 1,
    positionX: 0,
    positionY: 0
  });
  const [color, setColor] = useState({
      r: 241,
      g: 112,
      b: 19
    });
    const [strokeColor, setStrokeColor] = useState('#000000');
  const [displayColorPicker, setdisplayColorPicker] = useState(false);

  const handleTransformEnd = () => {
    if (!transformRef.current || !transformRef.current.state) return;
    
    const { scale, positionX, positionY } = transformRef.current.state;
    setTransformState({
      scale,
      positionX,
      positionY
    });
  };

  useEffect(() => {
    // Retrieve from localStorage on component mount
    const savedImage = localStorage.getItem('savedImage');
    if (savedImage) {
      setImageSrc(savedImage);
    }
  }, []);

const handleOverlayClick = (e: React.MouseEvent<HTMLDivElement>) => {
  const img = imgRef.current;
  if (!img || !imageSrc || !canvasRef.current) return;

  const canvas = canvasRef.current;
  const rect = img.getBoundingClientRect();

  const clickX = e.clientX - rect.left;
  const clickY = e.clientY - rect.top;

  // Convert visible click coords to actual image pixels
  const scaleX = img.naturalWidth / rect.width;
  const scaleY = img.naturalHeight / rect.height;

  const imgX = Math.floor(clickX * scaleX);
  const imgY = Math.floor(clickY * scaleY);

  canvas.width = img.naturalWidth;
  canvas.height = img.naturalHeight;

  const ctx = canvas.getContext('2d', { willReadFrequently: true });
  if (!ctx) return;

  ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
  const pixel = ctx.getImageData(imgX, imgY, 1, 1).data;

  const hex = `#${pixel[0].toString(16).padStart(2, '0')}${pixel[1].toString(16).padStart(2, '0')}${pixel[2].toString(16).padStart(2, '0')}`;
  setPixelColor(hex);
};

    const calculateCellWidth = (rows: string) => {
        if (gridWidth != null) {
            const newCellWIdth = parseFloat(gridWidth) / parseInt(rows);
            setGridCellWidth(newCellWIdth.toString());
        }
    }

    const calculateRows = (cellWidth: string) => {
        if (gridCellWidth != null && gridRows != null) {
            const newRows = parseFloat(gridWidth) / parseFloat(cellWidth);
            setGridRows(parseInt(newRows.toString()).toString());
        }
    }

    const HozAxis = () => {
        useEffect(() => {
            if (imgRef.current?.width != null) {
            setVirtualRatio(imgRef.current?.width / parseFloat(gridWidth));
            }
        }, [imgRef.current?.width, gridWidth]);
        return (
            <div style={{position: 'relative', marginTop: -20}}>
                {Array.from({ length: parseInt(gridRows) }).map((_, i) => {
                    const x = virtualRatio * i * parseFloat(gridCellWidth);
                    const realPos = i * parseFloat(gridCellWidth);
                    return (
                        <React.Fragment key={i}>
                            <div style={{left: x, float: 'left', display: 'inline', position: 'absolute'}}>{realPos}</div>
                            <div style={{left: imgRef.current?.width, top: x, display: 'block', position: 'absolute'}}>{realPos}</div>
                        </React.Fragment>
                    )
                })}
            </div>
        )
    }

    const GridLines = () => {
        useEffect(() => {
            if (imgRef.current?.width != null) {
            setVirtualRatio(imgRef.current?.width / parseFloat(gridWidth));
            }
        }, [imgRef.current?.width, gridWidth]);

        
        
    return (
        <svg height={imgRef.current?.width} width={imgRef.current?.width}>
        {Array.from({ length: parseInt(gridRows) }).map((_, i) => {
            const x = virtualRatio * i * parseFloat(gridCellWidth);
            const y = virtualRatio * i * parseFloat(gridCellWidth);
            return (
            <React.Fragment key={i}>
            <line
                x1={0}
                y1={y}
                x2={imgRef.current?.width}
                y2={y}
                stroke={strokeColor}
                strokeWidth={1}
            />
            <line
                x1={x}
                y1={0}
                x2={x}
                y2={imgRef.current?.height}
                stroke={strokeColor}
                strokeWidth={1}
            />
            </React.Fragment>
            );
        })}
        </svg>
    );
    };

    const handleClick = () => {
        setdisplayColorPicker(!displayColorPicker);
    };

    const handleClose = () => {
        setdisplayColorPicker(false);
    };

    const handleChange = (color: { rgb: any; }) => {
        setColor(color.rgb);
        setStrokeColor(rgbToHex(color.rgb.r, color.rgb.g, color.rgb.b));
    };

const styles = {
  default: {
    color: {
      width: '36px',
      height: '14px',
      borderRadius: '2px',
      background: `rgba(${color.r}, ${color.g}, ${color.b}, 1)`,
    } as React.CSSProperties,
    swatch: {
      padding: '5px',
      background: '#fff',
      borderRadius: '1px',
      boxShadow: '0 0 0 1px rgba(0,0,0,.1)',
      display: 'inline-block',
      cursor: 'pointer',
    } as React.CSSProperties,
    popover: {
      position: 'absolute',
      zIndex: 200,
    } as React.CSSProperties,
    cover: {
      position: 'fixed',
      top: '0px',
      right: '0px',
      bottom: '0px',
      left: '0px',
    } as React.CSSProperties,
  },
};

function rgbToHex(r: number, g: number, b: number): string {
  return (
    '#' +
    [r, g, b]
      .map((x) => {
        const hex = x.toString(16);
        return hex.length === 1 ? '0' + hex : hex;
      })
      .join('')
  );
}

    return (
        <div>
            <div>
                <p>Image width: <input name='setWidth' onChange={e => setGridWidth(e.target.value)} value={gridWidth?.toString()} />cm</p>
                <p>Number of rows: <input name='setRows' onChange={e => { setGridRows(e.target.value), calculateCellWidth(e.target.value)}} value={gridRows?.toString()} /></p>
                <p>Cell width: <input name='setCellWidth' onChange={e => { setGridCellWidth(e.target.value), calculateRows(e.target.value)}} value={gridCellWidth?.toString()} />cm</p>
                <div style={styles.default.swatch} onClick={ handleClick }>Set line colour 
                <div style={ styles.default.color } />
                </div>{ displayColorPicker ? <div style={ styles.default.popover }>
          <div style={ styles.default.cover } onClick={ handleClose }/>
          <SketchPicker color={ color } onChange={ handleChange } />
        </div> : null }
        </div>
            <div className="editImageWrap">
                <canvas ref={canvasRef} style={{ display: 'none' }} />
                <div style={{ position: 'relative', width: '100%', height: '100%' }}>
                    <TransformWrapper
                        ref={transformRef}
                        initialScale={transformState.scale}
                        initialPositionX={transformState.positionX}
                        initialPositionY={transformState.positionY}
                        onPanningStop={handleTransformEnd}
                        onPinchingStop={handleTransformEnd}
                        minScale={0.1}
                        limitToBounds={false}
                    >
                        {({ zoomIn, zoomOut, resetTransform, ...rest }) => (
                            <TransformComponent wrapperStyle={{ width: '100%', height: '100%' }}>
                                <div style={{ position: 'relative' }}>
                                    {imageSrc && (
                                        <>
                                        <div style={{position: 'absolute', zIndex: 100}} id='GridBox'>
                                            <HozAxis />
                                            <GridLines />
                                        </div>
                                        <div style={{position: 'relative', zIndex: 50, marginTop: -20}}>
                                            <img
                                                src={imageSrc}
                                                alt="Saved Crop"
                                                ref={(img) => {
                                                    imgRef.current = img;
                                                }}
                                                style={{ display: 'block', width: '100%' }}
                                            />
                                            <div
                                                onClick={handleOverlayClick}
                                                style={{
                                                    position: 'absolute',
                                                    top: 0,
                                                    left: 0,
                                                    right: 0,
                                                    bottom: 0,
                                                    cursor: 'crosshair',
                                                    zIndex: 10
                                                }}
                                            />
                                            </div>
                                        </>
                                    )}
                                    {!imageSrc && <p>No image found. Please upload an image first.</p> }
                                </div>
                            </TransformComponent>
                        )}
                    </TransformWrapper>
                </div>
            </div>
        </div>
  );
}