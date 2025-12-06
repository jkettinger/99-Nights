import React, { useEffect, useState, useCallback, useRef } from 'react';

interface DialogueBoxProps {
  speaker: string;
  text: string;
  onNext?: () => void;
  visible: boolean;
}

export const DialogueBox: React.FC<DialogueBoxProps> = ({ speaker, text, onNext, visible }) => {
  const [displayedText, setDisplayedText] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Sound Effect Logic
  const playBeep = () => {
    try {
      const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioContext) return;
      
      const audioCtx = new AudioContext();
      const oscillator = audioCtx.createOscillator();
      const gainNode = audioCtx.createGain();
      
      oscillator.connect(gainNode);
      gainNode.connect(audioCtx.destination);
      
      oscillator.type = 'square';
      oscillator.frequency.setValueAtTime(150 + Math.random() * 50, audioCtx.currentTime);
      gainNode.gain.setValueAtTime(0.01, audioCtx.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.05);
      
      oscillator.start();
      oscillator.stop(audioCtx.currentTime + 0.05);
    } catch (e) {
      // Ignore audio errors (e.g., if user hasn't interacted yet)
    }
  }

  const cleanupInterval = () => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  };

  // Function to handle advancing the dialogue
  const handleAdvance = useCallback(() => {
    if (isTyping) {
      // Skip typing: show full text immediately
      cleanupInterval();
      setDisplayedText(text);
      setIsTyping(false);
    } else if (onNext) {
      // Move to next dialogue
      onNext();
    }
  }, [isTyping, text, onNext]);

  // Handle typing effect
  useEffect(() => {
    if (!visible) return;
    
    setDisplayedText('');
    setIsTyping(true);
    cleanupInterval();

    let i = 0;
    intervalRef.current = setInterval(() => {
      setDisplayedText(text.substring(0, i + 1));
      if (i % 2 === 0) playBeep(); // Beep every other character
      i++;
      if (i >= text.length) {
        cleanupInterval();
        setIsTyping(false);
      }
    }, 30); // Typing speed

    return cleanupInterval;
  }, [text, visible]);

  // Handle Enter/Space key press
  useEffect(() => {
    if (!visible) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      // Allow Enter or Space to advance
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        handleAdvance();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [visible, handleAdvance]);

  if (!visible) return null;

  return (
    <div 
      className="fixed bottom-24 left-4 right-4 md:left-20 md:right-20 bg-black/80 border-4 border-white rounded-lg p-6 text-white font-mono cursor-pointer z-40 shadow-[0_0_15px_rgba(255,255,255,0.2)] hover:border-yellow-400 transition-colors"
      onClick={handleAdvance}
    >
      <div className="text-yellow-400 font-bold text-xl mb-2 uppercase tracking-widest">{speaker}</div>
      <div className="text-lg leading-relaxed">{displayedText}</div>
      {!isTyping && (
        <div className="absolute bottom-4 right-4 animate-bounce text-yellow-400 text-2xl">
          ▼
        </div>
      )}
      <div className="absolute bottom-2 right-4 text-xs text-gray-500 font-sans hidden md:block opacity-50">
        [ENTER] or [CLICK] to continue
      </div>
    </div>
  );
};