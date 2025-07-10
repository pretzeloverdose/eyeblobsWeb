'use client';
import React from 'react';
import { SketchPicker } from 'react-color';
import { ChangeEventHandler, useEffect, useRef, useState } from 'react';
import { ReactZoomPanPinchRef, TransformComponent, TransformWrapper } from 'react-zoom-pan-pinch';
import { usePersistentGrid } from '@/hooks/usePersistentGrid';
import { usePersistentTransform } from '@/hooks/usePersistentTransform';

export default function Page4() {
    const [imageSrc, setImageSrc] = useState<string | null>(null);
    const imgRef = useRef<HTMLImageElement | null>(null);
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const transformGridRef = useRef<ReactZoomPanPinchRef | null>(null);
    const [displayColorPicker, setdisplayColorPicker] = useState(false);
    const [virtualRatio, setVirtualRatio] = useState(0.0);
    const [imageLoaded, setImageLoaded] = useState(false);


    // Use the persistent hook for all state
    const {
        gridWidth,
        setGridWidth,
        gridRows,
        setGridRows,
        gridCellWidth,
        setGridCellWidth,
        color,
        setColor,
        strokeColor,
        setStrokeColor,
    } = usePersistentGrid();

    const {
        transformState,
        setTransformState,
        opacity,
        setOpacity
    } = usePersistentTransform('grid');

    const cssColor = `rgba(${color.r}, ${color.g}, ${color.b}, 1)`;

    useEffect(() => {
        if (transformGridRef.current) {
            transformGridRef.current.setTransform(
                transformState.positionX,
                transformState.positionY,
                transformState.scale
            );
        }
    }, [transformState, imageSrc]);

    const handleTransformEnd = () => {
        if (!transformGridRef.current || !transformGridRef.current.state) return;

        const { scale, positionX, positionY } = transformGridRef.current.state;
        setTransformState({
            scale,
            positionX,
            positionY
        });
    };

    useEffect(() => {
        const savedImage = localStorage.getItem('savedImage');
        if (savedImage) {
            setImageSrc(savedImage);
        }
        calculateCellWidth(gridRows);
    }, []);

    const calculateCellWidth = (rows: string) => {
        if (gridWidth != null) {
            const newCellWidth = parseFloat(gridWidth) / parseInt(rows);
            setGridCellWidth(newCellWidth.toString());
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
            if (imgRef.current?.width && gridWidth) {
                setVirtualRatio(imgRef.current.width / parseFloat(gridWidth));
            }
        }, [imgRef.current?.width, gridWidth]);

        if (!imgRef.current || !imgRef.current.width || !imgRef.current.height || virtualRatio === 0.0) {
            return null;
        }

        const cellHeight = parseFloat(gridCellWidth) * virtualRatio;
        const labels = [];

        // Horizontal labels for vertical grid lines (along top edge)
        let xPos = 0;
        while (xPos < imgRef.current.width) {
            const realValue = xPos / virtualRatio;
            if (realValue > 0.01) {
                labels.push(
                    <div
                        key={`hoz-${xPos}`}
                        style={{
                            position: 'absolute',
                            left: xPos + 15,
                            top: 0,
                            transform: 'translateX(-50%)',
                            color: cssColor,
                            fontSize: '0.8em',
                            zIndex: 200,
                        }}
                    >
                        {realValue.toFixed(1)}
                    </div>
                );
            }
            xPos += cellHeight;
        }

        // Vertical labels for horizontal grid lines (along left edge)
        let yPos = 0;
        while (yPos < imgRef.current.height) {
            const realValue = yPos / virtualRatio;
            if (realValue > 0.01) {
                labels.push(
                    <div
                        key={`vert-${yPos}`}
                        style={{
                            position: 'absolute',
                            left: 0,
                            top: yPos + 7,
                            transform: 'translateY(-50%)',
                            color: cssColor,
                            fontSize: '0.8em',
                            zIndex: 200,
                        }}
                    >
                        {realValue.toFixed(1)}
                    </div>
                );
            }
            yPos += cellHeight;
        }

        return <div style={{ position: 'absolute', width: '100%', height: '100%' }}>{labels}</div>;
    };



    const GridLines = () => {
        useEffect(() => {
            if (imgRef.current?.width != null && gridWidth) {
                setVirtualRatio(imgRef.current.width / parseFloat(gridWidth));
            }
        }, [imgRef.current?.width, gridWidth]);

        if (!imgRef.current || !imgRef.current.width || !gridWidth || virtualRatio === 0.0) {
            return null;
        }

        // todo: correct naming for x y and cols
        const lines = [];
        let yPos = 0;
        let xPos = 0;
        const cellHeight = parseFloat(gridCellWidth) * virtualRatio;

        while (yPos < (imgRef.current?.width || 0)) {
            lines.push(
                <line
                    key={`vertical-${yPos}`}
                    x1={yPos}
                    y1={0}
                    x2={yPos}
                    y2={imgRef.current?.height}
                    stroke={strokeColor}
                    strokeWidth={1}
                />
            );
            yPos += cellHeight;
        }

        while (xPos < (imgRef.current?.height || 0)) {
            lines.push(
                <line
                    key={`horizontal-${xPos}`}
                    x1={0}
                    y1={xPos}
                    x2={imgRef.current?.width}
                    y2={xPos}
                    stroke={strokeColor}
                    strokeWidth={1}
                />
            );
            xPos += cellHeight;
        }

        return (
            <svg height={imgRef.current?.height} width={imgRef.current?.width} key='gridLines'>
                {lines}
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
            <div style={{ margin: 10 }}>
                <div style={{ margin: 10 }}></div>
                <div style={{ width: 100, float: 'left' }}>Image width: </div><input name='setWidth' style={{ width: '80px', padding: '3px' }} onChange={e => setGridWidth(e.target.value)} value={gridWidth?.toString()} />cm
            </div>
            <div style={{ margin: 10 }}>
                <p>
                    Number of columns:
                    <select
                        style={{ marginLeft: '10px' }}
                        name="setRows"
                        onChange={(e) => {
                            setGridRows(e.target.value);
                            calculateCellWidth(e.target.value);
                        }}
                        value={gridRows}
                    >
                        {Array.from({ length: 9 }, (_, i) => i + 2).map((num) => (
                            <option key={num} value={num}>
                                {num}
                            </option>
                        ))}
                    </select>
                </p>
            </div>
            <div style={{ margin: 10 }}>
                <div style={{ width: 100, float: 'left' }}>Cell width: </div><input name='setCellWidth' style={{ width: '80px', padding: '3px' }} onChange={e => { setGridCellWidth(e.target.value), calculateRows(e.target.value) }} value={gridCellWidth?.toString()} />cm

                <div style={{ margin: 10 }}></div>
                <div style={styles.default.swatch} onClick={handleClick}>Set line colour
                    <div style={styles.default.color} />
                </div>{displayColorPicker ? <div style={styles.default.popover}>
                    <div style={styles.default.cover} onClick={handleClose} />
                    <SketchPicker color={color} onChange={handleChange} />
                </div> : null}
            </div>
            <div className="editImageWrap" style={{ height: '100vh'}}>
                <canvas ref={canvasRef} style={{ display: 'none' }} />
                <div style={{ position: 'relative', width: '100%', height: '100%' }}>
                    <TransformWrapper
                        ref={transformGridRef}
                        initialScale={transformState.scale}
                        initialPositionX={transformState.positionX}
                        initialPositionY={transformState.positionY}
                        onPanningStop={handleTransformEnd}
                        onPinchingStop={handleTransformEnd}
                        onInit={(ref) => {
                            transformGridRef.current = ref;
                            // Apply saved transform immediately after initialization
                            ref.setTransform(
                                transformState.positionX,
                                transformState.positionY,
                                transformState.scale
                            );
                        }}
                        minScale={0.1}
                        limitToBounds={false}
                    >
                        {({ zoomIn, zoomOut, resetTransform, ...rest }) => (
                            <TransformComponent wrapperStyle={{ width: '100%', height: '100%' }}>
                                <div style={{ position: 'relative' }}>edit
                                    {imageSrc && (
                                        <>
                                            {imageLoaded && (
                                                <div style={{ position: 'absolute', zIndex: 100 }} id='GridBox'>
                                                    <HozAxis />
                                                    <GridLines />
                                                </div>
                                            )}
                                            <div style={{ position: 'relative', zIndex: 50 }}>
                                                <img
                                                    src={imageSrc}
                                                    alt="Saved Crop"
                                                    ref={(img) => {
                                                        imgRef.current = img;
                                                    }}
                                                    onLoad={() => {
                                                        setImageLoaded(true);
                                                        if (imgRef.current?.width) {
                                                            setVirtualRatio(imgRef.current.width / parseFloat(gridWidth));
                                                        }
                                                    }}
                                                    style={{ display: 'block', width: '100%' }}
                                                />
                                                <div
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
                                    {!imageSrc && <p>No image found. Please upload an image first.</p>}
                                </div>
                            </TransformComponent>
                        )}
                    </TransformWrapper>
                </div>
            </div>
        </div>
    );
}