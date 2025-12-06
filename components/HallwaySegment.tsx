import React, { useEffect, useState, useRef } from 'react';

interface HallwaySegmentProps {
  onLockerOpen: () => void;
}

export const HallwaySegment: React.FC<HallwaySegmentProps> = ({ onLockerOpen }) => {
  const [position, setPosition] = useState({ x: 10, y: 80 }); // Start at left
  const [showPrompt, setShowPrompt] = useState(false);
  
  // Target locker position (approximate percentage)
  const TARGET_LOCKER_X = 70;
  const PROXIMITY_THRESHOLD = 10;

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      setPosition(prev => {
        let newX = prev.x;
        const step = 2; // Movement speed

        if (e.key === 'ArrowLeft') newX = Math.max(5, prev.x - step);
        if (e.key === 'ArrowRight') newX = Math.min(95, prev.x + step);

        return { x: newX, y: prev.y };
      });

      // Handle interaction
      if (e.key.toLowerCase() === 'e') {
          // Check distance
          if (Math.abs(position.x - TARGET_LOCKER_X) < PROXIMITY_THRESHOLD) {
              onLockerOpen();
          }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [position.x, onLockerOpen]);

  // Check proximity for prompt
  useEffect(() => {
      if (Math.abs(position.x - TARGET_LOCKER_X) < PROXIMITY_THRESHOLD) {
          setShowPrompt(true);
      } else {
          setShowPrompt(false);
      }
  }, [position.x]);

  return (
    <div className="absolute inset-0 z-10 bg-gray-900 overflow-hidden">
      {/* Hallway Background */}
      <div className="absolute inset-0 bg-[#1e293b] flex flex-col pointer-events-none">
          {/* Ceiling */}
          <div className="h-1/6 bg-gray-800 border-b border-gray-700"></div>
          
          {/* Wall with Lockers */}
          <div className="h-4/6 bg-gray-300 relative flex items-end justify-around px-10 border-b-8 border-gray-400">
             {/* Render a row of lockers */}
             {Array.from({ length: 12 }).map((_, i) => (
                 <div key={i} className="w-16 h-48 bg-gray-500 border-r border-gray-400 relative border-t border-b border-gray-600">
                     {/* Vents */}
                     <div className="absolute top-4 left-2 right-2 h-1 bg-gray-700 mb-1"></div>
                     <div className="absolute top-6 left-2 right-2 h-1 bg-gray-700 mb-1"></div>
                     <div className="absolute top-8 left-2 right-2 h-1 bg-gray-700"></div>
                     
                     {/* Handle */}
                     <div className="absolute top-1/2 right-2 w-1 h-6 bg-gray-800"></div>

                     {/* The Target Locker (index 8) */}
                     {i === 8 && (
                         <div className="absolute -top-16 left-1/2 -translate-x-1/2 flex flex-col items-center animate-bounce">
                             <span className="text-red-600 font-bold text-4xl">⬇</span>
                         </div>
                     )}
                 </div>
             ))}
          </div>

          {/* Floor */}
          <div className="h-2/6 bg-[#3f2e18] bg-[url('https://www.transparenttextures.com/patterns/wood-pattern.png')] opacity-80 perspective-origin-bottom"></div>
      </div>

      {/* Prompt */}
      {showPrompt && (
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-black/80 text-white px-6 py-2 rounded text-xl font-bold animate-pulse border-2 border-yellow-500 z-50">
              PRESS [E] TO OPEN
          </div>
      )}

      {/* Player Character */}
      <div 
        className="absolute w-24 h-48 transition-all duration-75 ease-linear flex flex-col items-center justify-end pointer-events-none"
        style={{ left: `${position.x}%`, top: '65%', transform: 'translateX(-50%)' }}
      >
         {/* Simple Player Sprite */}
         <div className="w-12 h-12 bg-blue-900 rounded-full mb-1"></div> {/* Head */}
         <div className="w-16 h-24 bg-blue-700 rounded-t-lg"></div> {/* Body */}
         <div className="absolute -bottom-4 text-white font-bold bg-black/50 px-2 rounded text-xs">YOU</div>
      </div>

      {/* Instructions */}
      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 text-white/70 font-mono text-sm bg-black/30 p-2 rounded">
        Arrow Keys to Move
      </div>
    </div>
  );
};