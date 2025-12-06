import React from 'react';

export const ScienceVideo: React.FC = () => {
  return (
    <div className="absolute inset-0 z-20 flex items-center justify-center bg-black">
      <div className="relative w-full max-w-4xl aspect-video bg-gray-900 border-8 border-gray-700 shadow-2xl overflow-hidden">
        {/* Scanlines */}
        <div className="absolute inset-0 bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.25)_50%),linear-gradient(90deg,rgba(255,0,0,0.06),rgba(0,255,0,0.02),rgba(0,0,255,0.06))] z-10 bg-[length:100%_4px,6px_100%] pointer-events-none"></div>
        
        {/* The Eye */}
        <div className="absolute inset-0 flex items-center justify-center">
            <div className="relative w-64 h-64 bg-white rounded-full flex items-center justify-center overflow-hidden animate-pulse-slow">
                {/* Iris */}
                <div className="w-32 h-32 bg-gradient-to-br from-blue-400 to-purple-600 rounded-full flex items-center justify-center animate-shake relative">
                    {/* Pupil */}
                    <div className="w-16 h-16 bg-black rounded-full"></div>
                    {/* Highlight */}
                    <div className="absolute top-4 left-4 w-8 h-8 bg-white rounded-full opacity-50"></div>
                </div>
                {/* Veins */}
                <div className="absolute inset-0 opacity-20 bg-[url('https://www.transparenttextures.com/patterns/cracked-concrete.png')]"></div>
            </div>
        </div>

        {/* Glitch Overlay Text */}
        <div className="absolute bottom-4 left-4 text-green-500 font-mono text-xl animate-pulse">
            PLAYING: HUMAN_ANATOMY_V1.mp4
        </div>
        
        {/* Interaction Prompt */}
        <div className="absolute bottom-4 right-4 text-white/50 font-sans text-sm animate-bounce">
            [PRESS SPACE]
        </div>
      </div>
    </div>
  );
};