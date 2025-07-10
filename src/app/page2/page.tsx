"use client";

import { useEffect, useRef, useState } from "react";
import { TransformWrapper, TransformComponent, ReactZoomPanPinchRef } from "react-zoom-pan-pinch";

export default function CameraFeed() {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const transformRef = useRef<ReactZoomPanPinchRef | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [imageSrc, setImageSrc] = useState<string | null>(null);
  const [transformState, setTransformState] = useState({
    scale: 1,
    positionX: 0,
    positionY: 0
  });
  const [opacity, setOpacity] = useState(0.5); // Default to 50 percent

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
    const savedImage = localStorage.getItem('savedImage');
    if (savedImage) {
      setImageSrc(savedImage);
    }
  }, []);

  useEffect(() => {
    if (typeof navigator === "undefined" || !navigator.mediaDevices?.getUserMedia) {
      setError("Camera not supported.");
      return;
    }

    const startCamera = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: "environment" },
          audio: false,
        });

        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          videoRef.current.play();
        }
      } catch (err) {
        console.error("Camera access error:", err);
        setError("Could not access camera.");
      }
    };

    startCamera();

    return () => {
      if (videoRef.current?.srcObject) {
        const tracks = (videoRef.current.srcObject as MediaStream).getTracks();
        tracks.forEach((track) => track.stop());
      }
    };
  }, []);

  return (
    <div style={{ width: "100%", margin: "0 auto", position: "relative", display: "flex", flexDirection: "column", height: "80vh" }}>
      {/* Transform Wrapper for zoom/pan */}
      <div style={{ flex: 1, position: "relative" }}>
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
          {() => (
            <TransformComponent wrapperStyle={{ width: "100%", height: "100%" }}>
              {imageSrc ? (
                <img 
                  src={imageSrc} 
                  alt="Saved Crop" 
                  style={{ 
                    maxWidth: '100%',
                    touchAction: 'none',
                    opacity: opacity // Apply the opacity value here
                  }} 
                />
              ) : (
                <div style={{ 
                  width: "100%", 
                  height: "100%", 
                  display: "flex", 
                  alignItems: "center", 
                  justifyContent: "center",
                  backgroundColor: "#f0f0f0"
                }}>
                  <p>No image found. Please upload an image first.</p>
                </div>
              )}
            </TransformComponent>
          )}
        </TransformWrapper>

        {/* Video overlay */}
        {error ? (
          <p style={{ color: "red", position: "absolute", top: 10, left: 10, zIndex: 30 }}>{error}</p>
        ) : (
          <video
            ref={videoRef}
            playsInline
            muted
            style={{ 
              width: "100%", 
              height: "auto", 
              backgroundColor: "#000", 
              zIndex: 20, 
              position: "absolute", 
              top: 0,
              pointerEvents: "none"
            }}
          />
        )}
      </div>

      {/* Opacity slider controls */}
      <div style={{ padding: "16px", backgroundColor: "#f5f5f5", borderTop: "1px solid #ddd" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
          <span>Opacity:</span>
          <input
            type="range"
            min="0"
            max="1"
            step="0.01"
            value={opacity}
            onChange={(e) => setOpacity(parseFloat(e.target.value))}
            style={{ flex: 1 }}
          />
          <span style={{ width: "40px", textAlign: "right" }}>
            {Math.round(opacity * 100)}%
          </span>
        </div>
      </div>
    </div>
  );
}