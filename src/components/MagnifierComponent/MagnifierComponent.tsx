import React, { useState, useRef, useEffect } from 'react';
import html2canvas from 'html2canvas';

interface MagnifierProps {
  children: React.ReactNode;
  magnifierSize?: number; // Kích thước kính lúp (mặc định 8cm ≈ 300px)
  zoomLevel?: number; // Mức độ phóng to (mặc định 2x)
  sourceSize?: number; // Kích thước vùng được phóng to (mặc định 4cm ≈ 150px)
}

const MagnifierComponent: React.FC<MagnifierProps> = ({
  children,
  magnifierSize = 300, // 8cm ≈ 300px
  zoomLevel = 2,
  sourceSize = 150, // 4cm ≈ 150px
}) => {
  const [isVisible, setIsVisible] = useState(false);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [backgroundPosition, setBackgroundPosition] = useState('0px 0px');
  const containerRef = useRef<HTMLDivElement>(null);
  const magnifierRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    if (isVisible && containerRef.current && magnifierRef.current) {
      // Create canvas for capturing content
      const canvas = document.createElement('canvas');
      canvasRef.current = canvas;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      const rect = containerRef.current.getBoundingClientRect();
      const devicePixelRatio = window.devicePixelRatio || 1;

      canvas.width = rect.width * devicePixelRatio;
      canvas.height = rect.height * devicePixelRatio;
      canvas.style.width = `${rect.width}px`;
      canvas.style.height = `${rect.height}px`;

      ctx.scale(devicePixelRatio, devicePixelRatio);

      // Use html2canvas to capture the element
      html2canvas(containerRef.current, {
        canvas: canvas,
        width: rect.width,
        height: rect.height,
        scale: devicePixelRatio,
        useCORS: true,
        allowTaint: true,
        backgroundColor: '#ffffff',
        logging: false,
      }).then((renderedCanvas: HTMLCanvasElement) => {
        if (magnifierRef.current) {
          const dataURL = renderedCanvas.toDataURL('image/png', 1.0);
          magnifierRef.current.style.backgroundImage = `url(${dataURL})`;
        }
      }).catch((error) => {
        console.error('Error capturing content with html2canvas:', error);
      });
    }

    // Cleanup on unmount or when isVisible changes
    return () => {
      if (canvasRef.current) {
        canvasRef.current = null;
      }
    };
  }, [isVisible]);

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!containerRef.current || !magnifierRef.current) return;

    const rect = containerRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    // Calculate magnifier position (offset to avoid covering the cursor)
    let magnifierX = x + 20;
    let magnifierY = y - magnifierSize - 20;

    // Adjust position to keep magnifier within viewport
    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;
    const absoluteX = e.clientX + 20;
    const absoluteY = e.clientY - magnifierSize - 20;

    if (absoluteX + magnifierSize > viewportWidth) {
      magnifierX = x - magnifierSize - 20;
    }
    if (absoluteY < 0) {
      magnifierY = y + 20;
    }

    setPosition({ x: magnifierX, y: magnifierY });

    // Calculate background position for zoomed content
    const backgroundX = -((x - sourceSize / 2) * zoomLevel);
    const backgroundY = -((y - sourceSize / 2) * zoomLevel);
    setBackgroundPosition(`${backgroundX}px ${backgroundY}px`);
  };

  const handleMouseEnter = () => {
    setIsVisible(true);
  };

  const handleMouseLeave = () => {
    setIsVisible(false);
  };

  return (
    <div
      ref={containerRef}
      className="magnifier-container"
      style={{ position: 'relative', display: 'inline-block' }}
      onMouseMove={handleMouseMove}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      {children}
      {isVisible && (
        <div
          ref={magnifierRef}
          className="magnifier-glass"
          style={{
            position: 'absolute',
            width: `${magnifierSize}px`,
            height: `${magnifierSize}px`,
            border: '3px solid #000',
            backgroundColor: '#fff',
            boxShadow: '0 0 10px rgba(0,0,0,0.5)',
            pointerEvents: 'none',
            zIndex: 1000,
            left: `${position.x}px`,
            top: `${position.y}px`,
            backgroundSize: `${containerRef.current?.offsetWidth! * zoomLevel}px ${containerRef.current?.offsetHeight! * zoomLevel}px`,
            backgroundPosition: backgroundPosition,
            backgroundRepeat: 'no-repeat',
          }}
        />
      )}
    </div>
  );
};

export default MagnifierComponent;