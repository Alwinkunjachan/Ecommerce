import { useState, useRef, MouseEvent } from 'react';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { X } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface ImageZoomProps {
  src: string;
  alt: string;
  className?: string;
}

export const ImageZoom = ({ src, alt, className = '' }: ImageZoomProps) => {
  const [isHovering, setIsHovering] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [zoomPosition, setZoomPosition] = useState({ x: 50, y: 50 });
  const containerRef = useRef<HTMLDivElement>(null);

  const handleMouseMove = (e: MouseEvent<HTMLDivElement>) => {
    if (!containerRef.current) return;

    const rect = containerRef.current.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;

    setZoomPosition({ x, y });
  };

  const handleMouseEnter = () => {
    setIsHovering(true);
  };

  const handleMouseLeave = () => {
    setIsHovering(false);
    setZoomPosition({ x: 50, y: 50 });
  };

  const handleClick = () => {
    setIsModalOpen(true);
  };

  return (
    <>
      <div
        ref={containerRef}
        className={`relative overflow-hidden cursor-zoom-in ${className}`}
        onMouseMove={handleMouseMove}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        onClick={handleClick}
      >
        {/* Base Image */}
        <img
          src={src}
          alt={alt}
          className="h-full w-full object-cover transition-transform duration-300"
          style={{
            transform: isHovering ? 'scale(1.1)' : 'scale(1)',
          }}
        />

        {/* Zoom Overlay - Shows magnified portion on hover */}
        {isHovering && (
          <div
            className="absolute inset-0 pointer-events-none"
            style={{
              backgroundImage: `url(${src})`,
              backgroundSize: '200%',
              backgroundPosition: `${zoomPosition.x}% ${zoomPosition.y}%`,
              opacity: 1,
            }}
          />
        )}

        {/* Zoom indicator */}
        <div className={`absolute bottom-3 right-3 bg-background/80 backdrop-blur-sm px-2 py-1 rounded text-xs font-medium transition-opacity ${isHovering ? 'opacity-100' : 'opacity-0'}`}>
          Click to enlarge
        </div>
      </div>

      {/* Full-screen Modal */}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="max-w-[95vw] max-h-[95vh] w-auto h-auto p-0 bg-transparent border-none">
          <div className="relative">
            <Button
              variant="secondary"
              size="icon"
              className="absolute top-2 right-2 z-10 rounded-full"
              onClick={() => setIsModalOpen(false)}
            >
              <X className="h-4 w-4" />
            </Button>
            <img
              src={src}
              alt={alt}
              className="max-w-[90vw] max-h-[90vh] object-contain rounded-lg"
            />
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};
