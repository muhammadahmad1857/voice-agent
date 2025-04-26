"use client"

import { useState, useRef, useEffect } from "react"
import { Play, Pause } from "lucide-react"
import { motion } from "framer-motion"

interface AudioPlayerProps {
  audioUrl: string
  autoPlay?: boolean
}

export default function AudioPlayer({ audioUrl, autoPlay = false }: AudioPlayerProps) {
  const [isPlaying, setIsPlaying] = useState(false)
  const [isLoaded, setIsLoaded] = useState(false)
  const audioRef = useRef<HTMLAudioElement | null>(null)
  const [audioLevel, setAudioLevel] = useState(0)
  const animationRef = useRef<number | null>(null)

  useEffect(() => {
    if (!audioRef.current) {
      audioRef.current = new Audio(audioUrl)

      audioRef.current.onloadeddata = () => {
        setIsLoaded(true)
        if (autoPlay) {
          playAudio()
        }
      }

      audioRef.current.onended = () => {
        setIsPlaying(false)
        if (animationRef.current) {
          cancelAnimationFrame(animationRef.current)
        }
        setAudioLevel(0)
      }
    }

    return () => {
      if (audioRef.current) {
        audioRef.current.pause()
        audioRef.current.src = ""
        audioRef.current = null
      }
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current)
      }
    }
  }, [audioUrl, autoPlay])

  const playAudio = () => {
    if (audioRef.current && isLoaded) {
      audioRef.current.play()
      setIsPlaying(true)
      animateAudioLevel()
    }
  }

  const pauseAudio = () => {
    if (audioRef.current) {
      audioRef.current.pause()
      setIsPlaying(false)
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current)
      }
    }
  }

  const togglePlayPause = () => {
    if (isPlaying) {
      pauseAudio()
    } else {
      playAudio()
    }
  }

  const animateAudioLevel = () => {
    if (!isPlaying) return

    // Simulate audio level for visualization
    setAudioLevel(Math.random() * 0.5 + 0.5) // Random value between 0.5 and 1

    animationRef.current = requestAnimationFrame(animateAudioLevel)
  }

  return (
    <motion.div
      whileHover={{ scale: 1.1 }}
      whileTap={{ scale: 0.95 }}
      className="w-full h-full rounded-full bg-[#1e1e1e] flex items-center justify-center cursor-pointer relative overflow-hidden"
      onClick={togglePlayPause}
    >
      {/* Cosmic background effect */}
      <div className="absolute inset-0 bg-gradient-radial from-purple-900 via-indigo-900 to-black opacity-80"></div>

      {/* Nebula-like effect */}
      <div className="absolute inset-0 bg-[url('https://hebbkx1anhila5yf.public.blob.vercel-storage.com/image-LcgF6J4a75thdrSZYyZ1Ao5cHSvmHt.png')] bg-cover bg-center"></div>

      {/* Audio visualization */}
      {isPlaying && (
        <motion.div
          className="absolute inset-0 bg-purple-500 opacity-30"
          animate={{
            scale: [1, audioLevel * 1.2, 1],
          }}
          transition={{
            repeat: Number.POSITIVE_INFINITY,
            duration: 1,
            ease: "easeInOut",
          }}
        />
      )}

      {/* Play/Pause button */}
      <div className="relative z-10">
        {isPlaying ? <Pause className="h-5 w-5 text-white" /> : <Play className="h-5 w-5 text-white" />}
      </div>
    </motion.div>
  )
}
