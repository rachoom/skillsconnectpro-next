
import React, { useRef, useState, useEffect } from 'react';
import { PlayIcon, PauseIcon, ShareIcon, MusicIcon, WandIcon, ScissorIcon } from './Icons';
import { ViralClip } from '../types';

interface ClipPlayerProps {
  clip: ViralClip;
  videoUrl: string;
  videoDuration: number;
  onTitleChange?: (newTitle: string) => void;
  onTimeChange?: (start: number, end: number) => void;
  onGenerateMusic: () => void;
  isActive: boolean;
  isGeneratingMusic?: boolean;
}

const ClipPlayer: React.FC<ClipPlayerProps> = ({ 
  clip,
  videoUrl, 
  videoDuration,
  onTitleChange,
  onTimeChange,
  onGenerateMusic,
  isActive,
  isGeneratingMusic
}) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const audioRef = useRef<HTMLAudioElement>(null);
  
  const [isPlaying, setIsPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const [volumeMix, setVolumeMix] = useState(0.5);
  const [isTrimMode, setIsTrimMode] = useState(false);

  useEffect(() => {
    if (isActive && videoRef.current) {
        videoRef.current.currentTime = clip.startTime;
        videoRef.current.play().then(() => setIsPlaying(true)).catch(e => console.log("Autoplay blocked", e));
        if (audioRef.current && clip.musicUrl) {
            audioRef.current.play().catch(() => {});
        }
    } else if (!isActive && videoRef.current) {
        videoRef.current.pause();
        if (audioRef.current) audioRef.current.pause();
        setIsPlaying(false);
    }
  }, [isActive, clip.startTime, clip.musicUrl]);

  const handleTimeUpdate = () => {
    if (!videoRef.current) return;
    const current = videoRef.current.currentTime;
    
    if (current >= clip.endTime) {
      videoRef.current.currentTime = clip.startTime;
      videoRef.current.play();
      if (audioRef.current && clip.musicUrl) audioRef.current.play();
    }

    const duration = clip.endTime - clip.startTime;
    const played = current - clip.startTime;
    setProgress((played / Math.max(0.1, duration)) * 100);
  };

  const togglePlay = () => {
    if (!videoRef.current) return;
    if (isPlaying) {
      videoRef.current.pause();
      if (audioRef.current) audioRef.current.pause();
    } else {
        if (videoRef.current.currentTime < clip.startTime || videoRef.current.currentTime > clip.endTime) {
            videoRef.current.currentTime = clip.startTime;
        }
        videoRef.current.play();
        if (audioRef.current && clip.musicUrl) audioRef.current.play();
    }
    setIsPlaying(!isPlaying);
  };

  return (
    <div className="relative w-full h-full bg-black rounded-[3rem] overflow-hidden shadow-2xl border-4 border-oak-shiny group">
      <video
        ref={videoRef}
        src={videoUrl}
        className="w-full h-full object-cover"
        onTimeUpdate={handleTimeUpdate}
        muted={false}
        playsInline
      />

      {clip.musicUrl && <audio ref={audioRef} src={clip.musicUrl} loop />}
      
      {/* Overlay UI */}
      <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-transparent to-black/80 flex flex-col justify-between pointer-events-none z-10">
        
        {/* Top Controls */}
        <div className="flex justify-between items-start p-6 pointer-events-auto">
            <div className="flex flex-col space-y-3">
                <button 
                    className="p-3 bg-oak-brown/60 hover:bg-whatsapp-green text-white rounded-2xl backdrop-blur-md transition-all transform hover:scale-110 shadow-lg border border-white/10"
                    title="Share Clip"
                >
                    <ShareIcon />
                </button>
                <button 
                    onClick={() => setIsTrimMode(!isTrimMode)}
                    className={`p-3 rounded-2xl backdrop-blur-md transition-all transform hover:scale-110 shadow-lg border border-white/10 ${isTrimMode ? 'bg-red-600 text-white' : 'bg-oak-brown/60 hover:bg-brand-gold hover:text-oak-brown text-white'}`}
                >
                    <ScissorIcon />
                </button>
            </div>

            <button 
                onClick={onGenerateMusic}
                disabled={isGeneratingMusic}
                className={`flex items-center space-x-2 px-4 py-2.5 rounded-2xl backdrop-blur-md shadow-lg transition-all border ${clip.musicUrl ? 'bg-whatsapp-green text-white border-whatsapp-green' : 'bg-oak-brown/50 text-white border-white/20 hover:bg-oak-brown'}`}
            >
                {isGeneratingMusic ? <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> : <MusicIcon />}
                <span className="text-[10px] font-black uppercase tracking-widest">{clip.musicUrl ? clip.musicMood : 'AI Scoring'}</span>
            </button>
        </div>
        
        {/* Title and Captions */}
        <div className="p-8 space-y-4 pointer-events-auto">
             <div className="bg-whatsapp-green/90 backdrop-blur-md text-white px-6 py-3 rounded-2xl text-center font-black text-sm shadow-2xl animate-bounce">
                {clip.suggestedCaption}
             </div>
             <input 
                type="text"
                value={clip.title}
                onChange={(e) => onTitleChange?.(e.target.value)}
                className="w-full bg-transparent border-b border-white/10 focus:border-brand-gold text-brand-gold text-2xl font-black text-center placeholder-white/20 outline-none pb-2 transition-all"
             />
        </div>

        {/* Progress */}
        <div className="w-full h-2 bg-white/5">
            <div 
                className="h-full bg-whatsapp-green shadow-[0_0_15px_rgba(37,211,102,0.6)]"
                style={{ width: `${progress}%` }}
            />
        </div>
      </div>

      {/* Play/Pause Overlay */}
      <div 
        className={`absolute inset-0 flex items-center justify-center bg-black/10 transition-opacity duration-200 cursor-pointer pointer-events-auto z-0 ${isPlaying ? 'opacity-0 group-hover:opacity-100' : 'opacity-100'}`}
        onClick={togglePlay}
      >
        <div className="bg-whatsapp-green text-white p-6 rounded-3xl shadow-2xl backdrop-blur-sm transform transition-transform hover:scale-110">
            {isPlaying ? <PauseIcon /> : <PlayIcon />}
        </div>
      </div>
    </div>
  );
};

export default ClipPlayer;
