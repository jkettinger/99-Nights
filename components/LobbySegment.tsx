
import React, { useEffect, useState } from 'react';

interface LobbySegmentProps {
  onTapeFound: () => void;
  onTheaterEnter: () => void;
  hasTape: boolean;
}

export const LobbySegment: React.FC<LobbySegmentProps> = ({ onTapeFound, onTheaterEnter, hasTape }) => {
  const [position, setPosition] = useState({ x: 50 });
  const [tapePosition] = useState(Math.floor(Math.random() * 80) + 10); // Random X between 10-90
  const [showPrompt, setShowPrompt] = useState<string | null>(null);

  const THEATER_DOOR_X = 90;
  const PROXIMITY_THRESHOLD = 10;

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      setPosition(prev => {
        let newX = prev.x;
        const step = 3;

        if (e.key === 'ArrowLeft') newX = Math.max(5, prev.x - step);
        if (e.key === 'ArrowRight') newX = Math.min(95, prev.x + step);

        return { x: newX };
      });

      if (e.key.toLowerCase() === 'e') {
          // Check Tape
          if (!hasTape && Math.abs(position.x - tapePosition) < PROXIMITY_THRESHOLD) {
              onTapeFound();
          }
          // Check Theater
          if (Math.abs(position.x - THEATER_DOOR_X) < PROXIMITY_THRESHOLD) {
              if (hasTape) {
                  onTheaterEnter();
              }
          }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [position.x, hasTape, onTapeFound, onTheaterEnter, tapePosition]);

  useEffect(() => {
      if (!hasTape && Math.abs(position.x - tapePosition) < PROXIMITY_THRESHOLD) {
          setShowPrompt("PRESS [E] TO PICK UP TAPE");
      } else if (Math.abs(position.x - THEATER_DOOR_X) < PROXIMITY_THRESHOLD) {
          if (hasTape) {
              setShowPrompt("PRESS [E] TO ENTER THEATER");
          } else {
              setShowPrompt("LOCKED - FIND TAPE FIRST");
          }
      } else {
          setShowPrompt(null);
      }
  }, [position.x, hasTape, tapePosition]);

  return (
    <div className="absolute inset-0 z-10 bg-gray-900 overflow-hidden">
      {/* Lobby Background */}
      <div className="absolute inset-0 bg-[#0f172a] flex flex-col pointer-events-none">
          <div className="h-2/3 bg-gray-800 relative border-b-8 border-gray-900 shadow-inner">
             {/* Trophy Case Background Decoration */}
             <div className="absolute top-20 left-10 w-40 h-64 bg-yellow-900/50 border-4 border-yellow-700"></div>
             
             {/* Theater Door */}
             <div className="absolute bottom-0 right-10 w-32 h-64 bg-red-900 border-4 border-black flex items-center justify-center">
                 <div className="text-yellow-500 font-bold bg-black px-2 tracking-widest text-xs mb-10">THEATER</div>
             </div>

             {/* Banners */}
             <div className="absolute top-0 left-1/2 -translate-x-1/2 w-64 h-24 bg-blue-900 rounded-b-lg border-x-2 border-b-2 border-yellow-500 flex items-center justify-center text-yellow-500 font-bold text-2xl">
                 GO TIGERS
             </div>
          </div>
          <div className="h-1/3 bg-gray-700 bg-[url('https://www.transparenttextures.com/patterns/black-scales.png')]"></div>
      </div>

      {/* The VHS Tape (if not found) */}
      {!hasTape && (
          <div 
            className="absolute bottom-1/3 w-10 h-6 bg-black border border-white animate-pulse"
            style={{ left: `${tapePosition}%` }}
          >
              <div className="w-full h-1 bg-white mt-1"></div>
          </div>
      )}

      {/* Prompt */}
      {showPrompt && (
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-black/80 text-white px-6 py-2 rounded text-xl font-bold animate-pulse border-2 border-yellow-500 z-50">
              {showPrompt}
          </div>
      )}

      {/* Player */}
      <div 
        className="absolute w-16 h-32 transition-all duration-75 ease-linear flex flex-col items-center justify-end pointer-events-none"
        style={{ left: `${position.x}%`, top: '65%', transform: 'translateX(-50%)' }}
      >
         <div className="w-8 h-8 bg-blue-300 rounded-full mb-1"></div>
         <div className="w-10 h-20 bg-blue-500 rounded-t-lg"></div>
      </div>
      
      <div className="absolute inset-0 pointer-events-none shadow-[inset_0_0_200px_rgba(0,0,0,1)]"></div>
    </div>
  );
};
