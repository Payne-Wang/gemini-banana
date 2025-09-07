/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/

import React, { useState, useRef, useEffect, WheelEvent, MouseEvent } from 'react';
import { CloseIcon } from './icons';

interface ImagePreviewModalProps {
  imageUrl: string;
  onClose: () => void;
}

const ImagePreviewModal: React.FC<ImagePreviewModalProps> = ({ imageUrl, onClose }) => {
  const [transform, setTransform] = useState({ scale: 1, x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const lastMousePosition = useRef({ x: 0, y: 0 });

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  const handleWheel = (e: WheelEvent<HTMLDivElement>) => {
    e.preventDefault();
    if (!containerRef.current) return;

    const scaleAmount = -e.deltaY * 0.001;
    const newScale = Math.min(Math.max(0.1, transform.scale + scaleAmount), 10);
    
    const rect = containerRef.current.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;

    const newX = mouseX - (mouseX - transform.x) * (newScale / transform.scale);
    const newY = mouseY - (mouseY - transform.y) * (newScale / transform.scale);

    setTransform({ scale: newScale, x: newX, y: newY });
  };
  
  const handleMouseDown = (e: MouseEvent<HTMLImageElement>) => {
    e.preventDefault();
    setIsDragging(true);
    lastMousePosition.current = { x: e.clientX, y: e.clientY };
  };

  const handleMouseMove = (e: MouseEvent<HTMLDivElement>) => {
    if (!isDragging) return;
    e.preventDefault();
    const dx = e.clientX - lastMousePosition.current.x;
    const dy = e.clientY - lastMousePosition.current.y;
    lastMousePosition.current = { x: e.clientX, y: e.clientY };
    setTransform(prev => ({ ...prev, x: prev.x + dx, y: prev.y + dy }));
  };

  const handleMouseUpOrLeave = (e: MouseEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
  };
  
  const handleReset = () => {
    setTransform({ scale: 1, x: 0, y: 0 });
  };


  return (
    <div 
      className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center animate-fade-in" 
      onClick={onClose}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUpOrLeave}
      onMouseLeave={handleMouseUpOrLeave}
    >
      <div 
        ref={containerRef}
        className="relative w-full h-full overflow-hidden" 
        onClick={(e) => e.stopPropagation()} 
        onWheel={handleWheel}
      >
        <img
          src={imageUrl}
          alt="全屏预览"
          className="absolute h-auto w-auto max-w-none max-h-none transition-transform duration-100 ease-out top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2"
          style={{ 
            cursor: isDragging ? 'grabbing' : 'grab',
            transform: `translate(${transform.x}px, ${transform.y}px) scale(${transform.scale})`,
          }}
          onMouseDown={handleMouseDown}
        />
      </div>
      <button 
        onClick={onClose} 
        className="absolute top-4 right-4 p-3 bg-white/10 rounded-full text-gray-200 hover:bg-white/20 transition-colors z-10" 
        aria-label="关闭预览"
      >
        <CloseIcon className="w-6 h-6" />
      </button>
       <button 
        onClick={handleReset} 
        className="absolute bottom-4 right-4 px-4 py-2 bg-white/10 rounded-lg text-gray-200 hover:bg-white/20 transition-colors z-10" 
        aria-label="重置视图"
      >
        重置
      </button>
    </div>
  );
};

export default ImagePreviewModal;