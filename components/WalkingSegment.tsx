import React, { useEffect, useState, useRef } from 'react';

interface WalkingSegmentProps {
  onComplete: () => void;
}

export const WalkingSegment: React.FC<WalkingSegmentProps> = ({ onComplete }) => {
  const [position, setPosition] = useState({ x: 50, y: 50 }); // Percentage
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // 10 second timer to end game
    const timer = setTimeout(() => {
      onComplete();
    }, 10000);

    return () => clearTimeout(timer);
  }, [onComplete]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      setPosition(prev => {
        let newX = prev.x;
        let newY = prev.y;
        const step = 2;

        if (e.key === 'ArrowUp') newY = Math.max(10, prev.y - step);
        if (e.key === 'ArrowDown') newY = Math.min(90, prev.y + step);
        if (e.key === 'ArrowLeft') newX = Math.max(5, prev.x - step);
        if (e.key === 'ArrowRight') newX = Math.min(95, prev.x + step);

        return { x: newX, y: newY };
      });
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  return (
    <div ref={containerRef} className="absolute inset-0 z-10 bg-gray-900 overflow-hidden">
      {/* Dark Classroom Background */}
      <div className="absolute inset-0 bg-[#0f172a] flex flex-col pointer-events-none">
          <div className="h-2/3 bg-[#1e293b] relative border-b-8 border-[#0f172a]">
              {/* Blackboard */}
              <div className="absolute top-10 left-1/2 -translate-x-1/2 w-3/4 h-3/5 bg-[#0f110f] border-8 border-[#2e1d11] shadow-2xl rounded-sm p-4 overflow-hidden flex items-center justify-center">
                  <p className="text-red-600 font-horror text-5xl animate-pulse tracking-widest text-center">
                      I'M ON YOUR ROOF
                  </p>
              </div>
          </div>
          <div className="h-1/3 bg-[#3f2e18] opacity-50"></div>
      </div>

      {/* Player Character (Circle) */}
      <div 
        className="absolute w-12 h-12 bg-white rounded-full shadow-[0_0_20px_rgba(255,255,255,0.5)] transition-all duration-75 ease-linear flex items-center justify-center"
        style={{ left: `${position.x}%`, top: `${position.y}%`, transform: 'translate(-50%, -50%)' }}
      >
        <div className="w-10 h-10 bg-gray-200 rounded-full"></div>
      </div>

      {/* Overlay Vignette */}
      <div className="absolute inset-0 pointer-events-none shadow-[inset_0_0_200px_rgba(0,0,0,1)]"></div>
      
      {/* Instructions */}
      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 text-gray-500 font-mono text-sm">
        Use Arrow Keys to Move
      </div>
    </div>
  );
};