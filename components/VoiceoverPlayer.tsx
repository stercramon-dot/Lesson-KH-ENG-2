
import React, { useState, useEffect, useRef } from 'react';

interface VoiceoverPlayerProps {
  buffer: AudioBuffer;
}

const VoiceoverPlayer: React.FC<VoiceoverPlayerProps> = ({ buffer }) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const audioContextRef = useRef<AudioContext | null>(null);
  const sourceRef = useRef<AudioBufferSourceNode | null>(null);
  const startTimeRef = useRef<number>(0);
  const requestRef = useRef<number>();

  const play = () => {
    if (!audioContextRef.current) {
      audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
    }

    const source = audioContextRef.current.createBufferSource();
    source.buffer = buffer;
    source.connect(audioContextRef.current.destination);
    
    source.onended = () => {
      setIsPlaying(false);
      setProgress(0);
      cancelAnimationFrame(requestRef.current!);
    };

    startTimeRef.current = audioContextRef.current.currentTime;
    source.start(0);
    sourceRef.current = source;
    setIsPlaying(true);
    
    const updateProgress = () => {
      if (audioContextRef.current && buffer) {
        const elapsed = audioContextRef.current.currentTime - startTimeRef.current;
        setProgress((elapsed / buffer.duration) * 100);
        requestRef.current = requestAnimationFrame(updateProgress);
      }
    };
    updateProgress();
  };

  const stop = () => {
    if (sourceRef.current) {
      sourceRef.current.stop();
      sourceRef.current = null;
    }
    setIsPlaying(false);
  };

  useEffect(() => {
    return () => {
      stop();
      cancelAnimationFrame(requestRef.current!);
    };
  }, []);

  return (
    <div className="flex items-center gap-3 bg-slate-900/80 px-4 py-2 rounded-2xl border border-indigo-500/20 w-full max-w-xs">
      <button
        onClick={isPlaying ? stop : play}
        className="w-8 h-8 rounded-full bg-indigo-600 flex items-center justify-center hover:bg-indigo-500 transition-colors shadow-lg shadow-indigo-500/20"
      >
        {isPlaying ? (
          <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 24 24">
            <path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z" />
          </svg>
        ) : (
          <svg className="w-4 h-4 text-white ml-0.5" fill="currentColor" viewBox="0 0 24 24">
            <path d="M8 5v14l11-7z" />
          </svg>
        )}
      </button>
      <div className="flex-1 h-1.5 bg-slate-800 rounded-full overflow-hidden">
        <div 
          className="h-full bg-indigo-500 transition-all duration-100 ease-linear" 
          style={{ width: `${Math.min(100, progress)}%` }}
        />
      </div>
      <span className="text-[10px] font-mono text-slate-500">
        {buffer.duration.toFixed(1)}s
      </span>
    </div>
  );
};

export default VoiceoverPlayer;
