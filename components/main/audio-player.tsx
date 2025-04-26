/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useRef, useState, useEffect } from "react";
import { Play, Pause, Loader2 } from "lucide-react";
import { motion } from "framer-motion";

interface AudioPlayerProps {
  audioUrl: string;
  autoPlay?: boolean;
}

const AudioPlayer: React.FC<AudioPlayerProps> = ({
  audioUrl,
  autoPlay = false,
}) => {
  const audioRef = useRef<HTMLAudioElement>(new Audio());
  const [isPlaying, setIsPlaying] = useState(false);
  const [isBuffering, setIsBuffering] = useState(true);
  const [audioLevel, setAudioLevel] = useState(0);
  const animationRef = useRef<number | null>(null);

  const animateAudioLevel = () => {
    if (!isPlaying) return;
    setAudioLevel(Math.random() * 0.5 + 0.5);
    animationRef.current = requestAnimationFrame(animateAudioLevel);
  };

  const playAudio = () => {
    // Pause any other global audio
    const globalAudio = (window as any).__currentAudio as
      | HTMLAudioElement
      | undefined;
    if (globalAudio && globalAudio !== audioRef.current) {
      globalAudio.pause();
    }
    // Mark this as the global audio
    (window as any).__currentAudio = audioRef.current;

    // Start playback
    setIsBuffering(true);
    audioRef.current
      .play()
      .catch((err) => console.error("Failed to play audio:", err));
  };

  const pauseAudio = () => {
    audioRef.current.pause();
  };

  const togglePlayPause = () => {
    if (isPlaying) pauseAudio();
    else playAudio();
  };

  // Handlers for audio element events
  const handlePlaying = () => {
    setIsBuffering(false);
    setIsPlaying(true);
    animateAudioLevel();
  };

  const handlePause = () => {
    setIsBuffering(false);
    setIsPlaying(false);
    // Clear global audio reference if it's this one
    if ((window as any).__currentAudio === audioRef.current) {
      delete (window as any).__currentAudio;
    }
    // Stop animation
    if (animationRef.current) cancelAnimationFrame(animationRef.current);
  };

  useEffect(() => {
    // Ensure HTTPS
    const fixedUrl = audioUrl.replace(/^http:\/\//, "https://");
    const audio = audioRef.current;
    audio.src = fixedUrl;

    // Attach event listeners
    audio.oncanplay = () => {
      setIsBuffering(false);
      if (autoPlay) playAudio();
    };
    audio.onwaiting = () => setIsBuffering(true);
    audio.onplaying = handlePlaying;
    audio.onpause = handlePause;
    audio.onended = handlePause;
    audio.onerror = () => {
      console.error("Error loading audio:", audio.error);
      setIsBuffering(false);
    };

    return () => {
      // Cleanup listeners
      audio.oncanplay = null;
      audio.onwaiting = null;
      audio.onplaying = null;
      audio.onpause = null;
      audio.onended = null;
      audio.onerror = null;
      // Stop animation if still running
      if (animationRef.current) cancelAnimationFrame(animationRef.current);
    };
  }, [audioUrl, autoPlay]);

  return (
    <motion.div
      whileHover={{ scale: 1.1 }}
      whileTap={{ scale: 0.95 }}
      onClick={togglePlayPause}
      className="relative w-10 h-10 rounded-full bg-[#1e1e1e] flex items-center justify-center cursor-pointer overflow-hidden"
      aria-label={isPlaying ? "Pause audio" : "Play audio"}
    >
      {isBuffering ? (
        <Loader2 className="h-5 w-5 animate-spin text-white" />
      ) : isPlaying ? (
        <Pause className="h-5 w-5 text-white" />
      ) : (
        <Play className="h-5 w-5 text-white" />
      )}

      {isPlaying && (
        <motion.div
          className="absolute inset-0 bg-purple-500 opacity-30"
          animate={{ scale: [1, audioLevel * 1.2, 1] }}
          transition={{ repeat: Infinity, duration: 1, ease: "easeInOut" }}
        />
      )}
    </motion.div>
  );
};

export default AudioPlayer;
