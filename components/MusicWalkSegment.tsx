
import React, { useEffect, useState, useRef } from 'react';

interface MusicWalkSegmentProps {
  onDoorOpen: () => void;
}

export const MusicWalkSegment: React.FC<MusicWalkSegmentProps> = ({ onDoorOpen }) => {
  const [position, setPosition] = useState({ x: 10 });
  const [showPrompt, setShowPrompt] = useState(false);
  const audioCtxRef = useRef<AudioContext | null>(null);
  
  // Door is at the far right
  const DOOR_X = 85;
  const PROXIMITY_THRESHOLD = 15;

  useEffect(() => {
    // Piano sound effect loop
    const playPianoNote = () => {
        if (!audioCtxRef.current) {
             const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
             if (AudioContext) audioCtxRef.current = new AudioContext();
        }
        
        const ctx = audioCtxRef.current;
        if (!ctx) return;
        if (ctx.state === 'suspended') ctx.resume();

        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        
        osc.connect(gain);
        gain.connect(ctx.destination);
        
        // Random dissonant piano-ish notes
        const freq = [261.63, 277.18, 293.66, 311.13][Math.floor(Math.random() * 4)]; // C4, C#4, D4, D#4
        osc.frequency.setValueAtTime(freq, ctx.currentTime);
        osc.type = 'triangle';
        
        gain.gain.setValueAtTime(0, ctx.currentTime);
        gain.gain.linearRampToValueAtTime(0.1, ctx.currentTime + 0.1);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 1.5);
        
        osc.start();
        osc.stop(ctx.currentTime + 1.5);
    };

    const interval = setInterval(playPianoNote, 2000); // Play note every 2 seconds
    return () => {
        clearInterval(interval);
        if (audioCtxRef.current) audioCtxRef.current.close();
    };
  }, []);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      setPosition(prev => {
        let newX = prev.x;
        const step = 2.5;

        if (e.key === 'ArrowLeft') newX = Math.max(5, prev.x - step);
        if (e.key === 'ArrowRight') newX = Math.min(95, prev.x + step);

        return { x: newX };
      });

      if (e.key.toLowerCase() === 'e') {
          if (Math.abs(position.x - DOOR_X) < PROXIMITY_THRESHOLD) {
              onDoorOpen();
          }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [position.x, onDoorOpen]);

  useEffect(() => {
      if (Math.abs(position.x - DOOR_X) < PROXIMITY_THRESHOLD) {
          setShowPrompt(true);
      } else {
          setShowPrompt(false);
      }
  }, [position.x]);

  return (
    <div className="absolute inset-0 z-10 bg-black overflow-hidden">
      {/* Dark Hallway Background */}
      <div className="absolute inset-0 bg-[#0f0f0f] flex flex-col pointer-events-none">
          <div className="h-2/3 bg-gray-900 relative border-b-8 border-black shadow-[inset_0_0_100px_black]">
             
             {/* Arrows on Wall */}
             <div className="absolute top-1/3 left-1/4 text-purple-900/40 text-6xl font-horror rotate-12">
                 MUSIC &rarr;
             </div>
             
             {/* Musical Notes Visuals */}
             <div className="absolute top-10 left-10 text-4xl text-gray-800 animate-pulse">♩</div>
             <div className="absolute bottom-20 left-1/2 text-6xl text-gray-800 animate-bounce">♫</div>

             {/* The Music Door */}
             <div className="absolute top-10 right-10 w-40 h-full bg-[#1a0f0f] border-4 border-purple-900/30 flex items-center justify-center">
                 <div className="text-purple-300/50 font-serif font-bold tracking-widest bg-black/50 px-2">MUSIC ROOM</div>
                 <div className="absolute right-4 top-1/2 w-2 h-2 bg-yellow-600 rounded-full"></div>
             </div>
          </div>
          <div className="h-1/3 bg-[#111] bg-[url('https://www.transparenttextures.com/patterns/dark-wood.png')]"></div>
      </div>

      {/* Prompt */}
      {showPrompt && (
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-purple-900/80 text-white px-6 py-2 rounded text-xl font-bold animate-pulse border-2 border-black z-50">
              PRESS [E] TO ENTER
          </div>
      )}

      {/* Player Character */}
      <div 
        className="absolute w-24 h-48 transition-all duration-75 ease-linear flex flex-col items-center justify-end pointer-events-none opacity-50"
        style={{ left: `${position.x}%`, top: '65%', transform: 'translateX(-50%)' }}
      >
         <div className="w-12 h-12 bg-gray-500 rounded-full mb-1"></div>
         <div className="w-16 h-24 bg-gray-600 rounded-t-lg"></div>
      </div>
      
      {/* Heavy Vignette */}
      <div className="absolute inset-0 pointer-events-none shadow-[inset_0_0_300px_rgba(0,0,0,1)]"></div>
    </div>
  );
};
