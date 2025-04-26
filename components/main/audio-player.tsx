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
// "use client"

// import { useState, useRef, useEffect } from "react"
// import { Play, Pause, Loader2 } from "lucide-react"
// import { motion } from "framer-motion"

// interface AudioPlayerProps {
//   audioUrl: string
//   autoPlay?: boolean
// }

// export default function AudioPlayer({ audioUrl, autoPlay = false }: AudioPlayerProps) {
//   const [isPlaying, setIsPlaying] = useState(false)
//   const [isLoaded, setIsLoaded] = useState(false)
//   const [isBuffering, setIsBuffering] = useState(true)
//   const audioRef = useRef<HTMLAudioElement | null>(null)
//   const [audioLevel, setAudioLevel] = useState(0)
//   const animationRef = useRef<number | null>(null)

//   useEffect(() => {
//     const audio = new Audio(audioUrl)
//     audioRef.current = audio

//     audio.onloadeddata = () => {
//       setIsLoaded(true)
//       setIsBuffering(false)
//       if (autoPlay) {
//         playAudio()
//       }
//     }

//     audio.onwaiting = () => setIsBuffering(true)
//     audio.onplaying = () => {
//       setIsBuffering(false)
//       setIsPlaying(true)
//     }
//     audio.onended = () => {
//       setIsPlaying(false)
//       if (animationRef.current) cancelAnimationFrame(animationRef.current)
//       setAudioLevel(0)
//     }
//     audio.onerror = () => {
//       setIsBuffering(false)
//       setIsLoaded(false)
//       console.error("Error loading audio:", audio.error)
//     }

//     const handleGlobalAudioStop = () => {
//       if (isPlaying && audioRef.current) {
//         audioRef.current.pause()
//         setIsPlaying(false)
//         if (animationRef.current) cancelAnimationFrame(animationRef.current)
//       }
//     }

//     window.addEventListener("stop-all-audio", handleGlobalAudioStop)

//     return () => {
//       if (audio) {
//         audio.pause()
//         audio.src = ""
//         audio.onloadeddata = null
//         audio.onwaiting = null
//         audio.onplaying = null
//         audio.onended = null
//         audio.onerror = null
//       }
//       window.removeEventListener("stop-all-audio", handleGlobalAudioStop)
//       if (animationRef.current) cancelAnimationFrame(animationRef.current)
//     }
//   }, [audioUrl, autoPlay])

//   const playAudio = () => {
//     if (audioRef.current && isLoaded) {
//       const stopEvent = new Event("stop-all-audio")
//       window.dispatchEvent(stopEvent)
//       audioRef.current.play().then(() => {
//         setIsPlaying(true)
//         animateAudioLevel()
//       }).catch(err => {
//         console.error("Failed to play audio:", err)
//         setIsBuffering(false)
//       })
//     }
//   }

//   const pauseAudio = () => {
//     if (audioRef.current) {
//       audioRef.current.pause()
//       setIsPlaying(false)
//       if (animationRef.current) cancelAnimationFrame(animationRef.current)
//     }
//   }

//   const togglePlayPause = () => {
//     if (isPlaying) pauseAudio()
//     else playAudio()
//   }

//   const animateAudioLevel = () => {
//     if (!isPlaying) return
//     setAudioLevel(Math.random() * 0.5 + 0.5)
//     animationRef.current = requestAnimationFrame(animateAudioLevel)
//   }

//   return (
//     <motion.div
//       whileHover={{ scale: 1.1 }}
//       whileTap={{ scale: 0.95 }}
//       className="w-10 h-10 rounded-full bg-[#1e1e1e] flex items-center justify-center cursor-pointer relative overflow-hidden"
//       onClick={togglePlayPause}
//     >
//       <div className="absolute inset-0 bg-gradient-to-br from-purple-800 to-black opacity-80"></div>
//       {isPlaying && (
//         <motion.div
//           className="absolute inset-0 bg-purple-500 opacity-30"
//           animate={{ scale: [1, audioLevel * 1.2, 1] }}
//           transition={{ repeat: Number.POSITIVE_INFINITY, duration: 1, ease: "easeInOut" }}
//         />
//       )}
//       <div className="relative z-10">
//         {isBuffering ? (
//           <Loader2 className="h-5 w-5 text-white animate-spin" />
//         ) : isPlaying ? (
//           <Pause className="h-5 w-5 text-white" />
//         ) : (
//           <Play className="h-5 w-5 text-white" />
//         )}
//       </div>
//     </motion.div>
//   )
// }