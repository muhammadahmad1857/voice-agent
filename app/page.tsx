// "use client";

// import { useState, useRef, useEffect } from "react";
// import { Mic, Loader2, Square } from "lucide-react";
// import axios from "axios";
// import AudioPlayer from "@/components/main/audio-player";
// import { motion, AnimatePresence } from "framer-motion";
// import { toast } from "sonner";
// import UserAvatar from "@/components/main/user-avatar";
// import { apiWithAuth, apiWithoutAuth } from "@/lib/api";

// interface Message {
//   content: string;
//   sender: "user" | "ai";
//   timestamp: string;
//   audioUrl?: string;
// }

// // Define error state interface
// interface ErrorState {
//   isError: boolean;
//   message: string;
// }

// // Define API response interface
// interface ApiResponse {
//   user_transcribed_text: string;
//   assistant_response: string;
//   user_audio: { _url: string };
//   response_audio_url: { _url: string };
// }

// export default function VoiceAssistant() {
//   const [messages, setMessages] = useState<Message[]>([]);
//   const [isRecording, setIsRecording] = useState(false);
//   const [isProcessing, setIsProcessing] = useState(false);
//   // eslint-disable-next-line @typescript-eslint/no-unused-vars
//   const [error, setError] = useState<ErrorState>({
//     isError: false,
//     message: "",
//   });
//   const mediaRecorderRef = useRef<MediaRecorder | null>(null);
//   const audioChunksRef = useRef<Blob[]>([]);
//   const [isSilent, setIsSilent] = useState(false);
//   const silenceTimeoutRef = useRef<NodeJS.Timeout | null>(null);
//   const audioContextRef = useRef<AudioContext | null>(null);
//   const analyserRef = useRef<AnalyserNode | null>(null);
//   const silenceThreshold = 5; // Lowered threshold to make it more sensitive
//   const silenceDetectionIntervalRef = useRef<NodeJS.Timeout | null>(null);

//   // Add this after the state declarations and before the startRecording function
//   useEffect(() => {
//     const handleBeforeUnload = () => {
//       // Send request to clear chat history when page is closed or refreshed
//       if (navigator.sendBeacon) {
//         navigator.sendBeacon(
//           "https://voice-agent.kognifi.ai/clear-chat-history"
//         );
//       } else {
//         // Fallback to axios for browsers that don't support sendBeacon
//         apiWithoutAuth
//           .post(
//             "/clear-chat-history/",
//             {},
//             {
//               // Setting timeout to a small value since the page is unloading
//               timeout: 300,
//             }
//           )
//           .catch((err) => {
//             // Silent catch as the page is unloading anyway
//             console.error("Failed to clear chat history:", err);
//           });
//       }
//     };

//     // Add event listener for beforeunload
//     window.addEventListener("beforeunload", handleBeforeUnload);

//     // Clean up event listener
//     return () => {
//       window.removeEventListener("beforeunload", handleBeforeUnload);
//     };
//   }, []);

//   const startRecording = async () => {
//     try {
//       // Clear any previous errors
//       setError({ isError: false, message: "" });

//       const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
//       const mediaRecorder = new MediaRecorder(stream);
//       mediaRecorderRef.current = mediaRecorder;
//       audioChunksRef.current = [];

//       // Set up audio analysis for silence detection
//       const audioContext = new AudioContext();
//       audioContextRef.current = audioContext;
//       const analyser = audioContext.createAnalyser();
//       analyserRef.current = analyser;
//       analyser.fftSize = 256;

//       const source = audioContext.createMediaStreamSource(stream);
//       source.connect(analyser);

//       const bufferLength = analyser.frequencyBinCount;
//       const dataArray = new Uint8Array(bufferLength);

//       // Function to detect silence using an interval instead of requestAnimationFrame
//       const detectSilence = () => {
//         if (!analyserRef.current) return;

//         analyserRef.current.getByteFrequencyData(dataArray);

//         // Calculate average volume
//         let sum = 0;
//         for (let i = 0; i < bufferLength; i++) {
//           sum += dataArray[i];
//         }
//         const average = sum / bufferLength;

//         console.log("Audio level:", average, "Threshold:", silenceThreshold);

//         // Check if volume is below threshold (silence)
//         if (average < silenceThreshold) {
//           if (!isSilent) {
//             console.log("Silence detected, starting timer");
//             setIsSilent(true);
//             // Start silence timer
//             if (silenceTimeoutRef.current) {
//               clearTimeout(silenceTimeoutRef.current);
//             }
//             silenceTimeoutRef.current = setTimeout(() => {
//               console.log("Stopping recording due to silence");
//               if (isRecording) {
//                 stopRecording();
//               }
//             }, 2000); // 2 seconds of silence
//           }
//         } else {
//           // If there's sound, clear the timeout and reset silence state
//           if (isSilent) {
//             console.log("Sound detected, clearing timer");
//             setIsSilent(false);
//             if (silenceTimeoutRef.current) {
//               clearTimeout(silenceTimeoutRef.current);
//               silenceTimeoutRef.current = null;
//             }
//           }
//         }
//       };

//       // Start silence detection using an interval (more reliable than requestAnimationFrame)
//       silenceDetectionIntervalRef.current = setInterval(detectSilence, 100);

//       mediaRecorder.ondataavailable = (event) => {
//         if (event.data.size > 0) {
//           audioChunksRef.current.push(event.data);
//         }
//       };

//       mediaRecorder.onstop = () => {
//         processAudio();

//         // Clean up audio context and analyser
//         if (
//           audioContextRef.current &&
//           audioContextRef.current.state !== "closed"
//         ) {
//           audioContextRef.current.close();
//         }

//         // Clear any pending silence timeout
//         if (silenceTimeoutRef.current) {
//           clearTimeout(silenceTimeoutRef.current);
//           silenceTimeoutRef.current = null;
//         }

//         // Clear silence detection interval
//         if (silenceDetectionIntervalRef.current) {
//           clearInterval(silenceDetectionIntervalRef.current);
//           silenceDetectionIntervalRef.current = null;
//         }

//         // Stop all tracks in the stream
//         stream.getTracks().forEach((track) => track.stop());
//       };

//       mediaRecorder.start();
//       setIsRecording(true);
//     } catch (error) {
//       console.error("Error accessing microphone:", error);
//       setError({
//         isError: true,
//         message: "Could not access microphone. Please check permissions.",
//       });
//       toast.error("Could not access microphone. Please check permissions.");
//     }
//   };

//   const stopRecording = () => {
//     if (mediaRecorderRef.current && isRecording) {
//       mediaRecorderRef.current.stop();
//       setIsRecording(false);
//       setIsProcessing(true);

//       // Clear any pending silence timeout
//       if (silenceTimeoutRef.current) {
//         clearTimeout(silenceTimeoutRef.current);
//         silenceTimeoutRef.current = null;
//       }

//       // Clear silence detection interval
//       if (silenceDetectionIntervalRef.current) {
//         clearInterval(silenceDetectionIntervalRef.current);
//         silenceDetectionIntervalRef.current = null;
//       }

//       setIsSilent(false);
//     }
//   };

//   const processAudio = async () => {
//     // Create audio blob from recorded chunks
//     const audioBlob = new Blob(audioChunksRef.current, { type: "audio/wav" });

//     // Create form data to send to backend
//     const formData = new FormData();
//     formData.append("file", audioBlob, "recording.wav");

//     // Determine message type based on current state
//     const messageType = messages.length === 0 ? "first_message" : "follow_up";
//     console.log("FormData created with:");
//     console.log("- file: [Audio Blob]", audioBlob.size, "bytes");
//     try {
//       // Send the audio to the backend API
//       const response = await apiWithAuth.post("/voice-agent", formData, {
//         headers: {
//           "Content-Type": "multipart/form-data",
//         },
//         params: {
//           "message_type": messageType,
//         },
//       });

//       const data = response.data as ApiResponse;

//       // Get current time for timestamp
//       const currentTime = new Date();
//       const hours = currentTime.getHours();
//       const minutes = currentTime.getMinutes();
//       const formattedTime = `${hours}:${
//         minutes < 10 ? "0" + minutes : minutes
//       }`;

//       // Add user message with transcribed text from response
//       const userMessage: Message = {
//         content: data.user_transcribed_text || "Could not transcribe audio",
//         sender: "user",
//         timestamp: formattedTime,
//         audioUrl: data.user_audio?._url,
//       };

//       // Add AI response
//       const aiResponse: Message = {
//         content: data.assistant_response || "No response available",
//         sender: "ai",
//         timestamp: formattedTime,
//         audioUrl: data.response_audio_url?._url,
//       };

//       setMessages((prev) => [...prev, userMessage, aiResponse]);
//       setIsProcessing(false);
//     } catch (error) {
//       console.error("Error processing audio:", error);

//       // Extract error details from response if available
//       let errorMessage = "Failed to process audio";
//       if (axios.isAxiosError(error) && error.response?.data?.detail) {
//         errorMessage = error.response.data.detail;
//       }

//       setError({ isError: true, message: errorMessage });
//       setIsProcessing(false);

//       toast.error(errorMessage);
//     }
//   };

//   const clearChat = async () => {
//     try {
//       // Clear chat in the UI only
//       setMessages([]);
//       setError({ isError: false, message: "" });
//       apiWithoutAuth.post("/clear-chat-history");
//       toast.success("Your conversation has been cleared.");
//     } catch (error) {
//       console.error("Failed to clear chat:", error);
//       setError({ isError: true, message: "Failed to clear chat" });

//       toast.error("Failed to clear chat");
//     }
//   };

//   const handleMicButtonClick = () => {
//     if (isRecording) {
//       stopRecording();
//     } else {
//       startRecording();
//     }
//   };

//   const sendLastMessage = async () => {
//     try {
//       setIsProcessing(true);

//       // Create form data to send to backend
//       const formData = new FormData();
//       formData.append("message_type", "last_message");

//       // We still need to send a file, but it can be empty or minimal
//       const emptyBlob = new Blob([""], { type: "audio/wav" });
//       formData.append("file", emptyBlob, "empty.wav");

//       await axios.post("https://voice-agent.kognifi.ai/voice-agent", formData, {
//         headers: {
//           "Content-Type": "multipart/form-data",
//         },
//       });

//       setIsProcessing(false);

//       toast.success("Your conversation has been ended.");
//     } catch (error) {
//       console.error("Error sending last message:", error);

//       // Extract error details from response if available
//       let errorMessage = "Failed to send last message";
//       if (axios.isAxiosError(error) && error.response?.data?.detail) {
//         errorMessage = error.response.data.detail;
//       }

//       setError({ isError: true, message: errorMessage });
//       setIsProcessing(false);

//       toast.error(errorMessage);
//     }
//   };

//   useEffect(() => {
//     return () => {
//       // Clean up on component unmount
//       if (silenceTimeoutRef.current) {
//         clearTimeout(silenceTimeoutRef.current);
//       }

//       if (silenceDetectionIntervalRef.current) {
//         clearInterval(silenceDetectionIntervalRef.current);
//       }

//       if (
//         audioContextRef.current &&
//         audioContextRef.current.state !== "closed"
//       ) {
//         audioContextRef.current.close();
//       }

//       if (mediaRecorderRef.current && isRecording) {
//         mediaRecorderRef.current.stop();
//       }
//     };
//   }, [isRecording]);

//   return (
//     <div className="flex flex-col min-h-screen ">
//       {/* Header */}
//       <header className="p-6 flex justify-between items-center">
//         <h1 className="text-3xl font-bold">AI Voice Assistant</h1>
//         <UserAvatar />
//       </header>

//       {/* Processing Overlay */}
//       {isProcessing && (
//         <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
//           <motion.div
//             initial={{ scale: 0.8, opacity: 0 }}
//             animate={{ scale: 1, opacity: 1 }}
//             className="bg-[#2a2a2a] p-8 rounded-xl flex flex-col items-center"
//           >
//             <Loader2 className="h-12 w-12 animate-spin text-white mb-4" />
//             <p className="text-lg font-medium">Processing your request...</p>
//           </motion.div>
//         </div>
//       )}

//       {/* Chat Area */}
//       <div className="flex-1 p-4 overflow-y-auto space-y-4">
//         {messages.length === 0 ? (
//           <div className="flex items-center justify-center h-full">
//             <p className="text-gray-400">
//               Say something to start the conversation
//             </p>
//           </div>
//         ) : (
//           <AnimatePresence initial={false}>
//             {messages.map((message, index) => (
//               <motion.div
//                 key={index}
//                 initial={{ opacity: 0, y: 20, scale: 0.95 }}
//                 animate={{ opacity: 1, y: 0, scale: 1 }}
//                 transition={{ duration: 0.3, delay: index * 0.1 }}
//                 className={`flex ${
//                   message.sender === "user" ? "justify-end" : "justify-start"
//                 }`}
//               >
//                 {message.sender === "ai" && message.audioUrl && (
//                   <motion.div
//                     initial={{ scale: 0.8 }}
//                     animate={{ scale: [1, 1.05, 1] }}
//                     transition={{ duration: 0.5, repeat: 0 }}
//                     className="w-10 h-10 rounded-full overflow-hidden mr-2 flex-shrink-0"
//                   >
//                     <AudioPlayer
//                       audioUrl={message.audioUrl}
//                       autoPlay={index === messages.length - 1}
//                     />
//                   </motion.div>
//                 )}
//                 <motion.div
//                   whileHover={{ scale: 1.02 }}
//                   className={`max-w-[80%] rounded-3xl p-4 ${
//                     message.sender === "user"
//                       ? "bg-[#4285F4] text-white"
//                       : "bg-[#2a2a2a] text-white"
//                   }`}
//                 >
//                   <p>{message.content}</p>
//                   <p
//                     className={`text-xs mt-1 text-right ${
//                       message.sender === "user"
//                         ? "text-white/70"
//                         : "text-white/70"
//                     }`}
//                   >
//                     {message.timestamp}
//                   </p>
//                 </motion.div>
//               </motion.div>
//             ))}
//           </AnimatePresence>
//         )}
//       </div>

//       {/* Microphone Button */}
//       <div className="flex justify-center mb-8">
//         <motion.button
//           whileHover={{ scale: 1.1 }}
//           whileTap={{ scale: 0.95 }}
//           animate={
//             isRecording
//               ? {
//                   scale: [1, 1.1, 1],
//                   transition: {
//                     repeat: Number.POSITIVE_INFINITY,
//                     duration: 1.5,
//                   },
//                 }
//               : {}
//           }
//           className={`w-16 h-16 rounded-full flex items-center justify-center text-white cursor-pointer ${
//             isRecording
//               ? "bg-red-500 border-2 border-red-600"
//               : "bg-[#121212] border-2 border-[#4285F4]"
//           }`}
//           onClick={handleMicButtonClick}
//           disabled={isProcessing}
//           aria-label={isRecording ? "Stop recording" : "Start recording"}
//         >
//           {isProcessing ? (
//             <Loader2 className="h-8 w-8 animate-spin" />
//           ) : isRecording ? (
//             <Square size={24} className="text-white" />
//           ) : (
//             <Mic size={28} className="text-white" />
//           )}
//         </motion.button>
//       </div>

//       {/* Bottom Controls */}
//       <div className="flex justify-center gap-4 mb-8">
//         <motion.button
//           whileHover={{ scale: 1.05, backgroundColor: "#3a3a3a" }}
//           whileTap={{ scale: 0.95 }}
//           onClick={clearChat}
//           className="bg-[#2a2a2a] text-white px-6 py-3 rounded-full transition-colors cursor-pointer"
//           disabled={isProcessing || messages.length === 0}
//         >
//           Clear Chat
//         </motion.button>
//         <motion.button
//           whileHover={{ scale: 1.05, backgroundColor: "#3a3a3a" }}
//           whileTap={{ scale: 0.95 }}
//           onClick={sendLastMessage}
//           className="bg-[#2a2a2a] text-white px-6 py-3 rounded-full transition-colors cursor-pointer"
//           disabled={isProcessing || messages.length === 0}
//         >
//           End Conversation
//         </motion.button>
//       </div>
//     </div>
//   );
// }


"use client";

import { useState, useRef, useEffect } from "react";
import { Mic, Loader2, Play, Pause } from "lucide-react";
import axios from "axios";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";
import UserAvatar from "@/components/main/user-avatar";
import { apiWithAuth, apiWithoutAuth } from "@/lib/api";

interface Message {
  content: string;
  sender: "user" | "ai";
  timestamp: string;
  audioUrl?: string;
}


interface ApiResponse {
  user_transcribed_text: string;
  assistant_response: string;
  user_audio: { _url: string };
  response_audio_url: { _url: string };
}

// PlayButton with play/pause and loading, and overlay for first AI message
function PlayButton({ url, autoPlay = false, isFirst = false }: { url: string; autoPlay?: boolean; isFirst?: boolean }) {
  const audioRef = useRef<HTMLAudioElement>(null);
  const [playing, setPlaying] = useState(false);
  const [loading, setLoading] = useState(autoPlay);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;
    const onPlay = () => { setPlaying(true); setLoading(false); };
    const onPause = () => setPlaying(false);
    const onWaiting = () => setLoading(true);
    audio.addEventListener("play", onPlay);
    audio.addEventListener("pause", onPause);
    audio.addEventListener("waiting", onWaiting);
    if (autoPlay) audio.play();
    return () => {
      audio.removeEventListener("play", onPlay);
      audio.removeEventListener("pause", onPause);
      audio.removeEventListener("waiting", onWaiting);
    };
  }, [autoPlay]);

  const toggle = () => {
    const audio = audioRef.current;
    if (!audio) return;
    if (playing) audio.pause();
    else audio.play();
  };

  return (
    <div className="relative">
      <button
        onClick={toggle}
        className="w-10 h-10 bg-blue-500 text-white rounded-full flex items-center justify-center"
        aria-label={playing ? "Pause audio" : "Play audio"}
      >
        {loading ? <Loader2 className="animate-spin" /> : playing ? <Pause size={20} /> : <Play size={20} />}
      </button>
      {isFirst && loading && (
        <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-50 rounded-full">
          <Loader2 className="h-6 w-6 text-white animate-spin" />
        </div>
      )}
      <audio ref={audioRef} src={url} />
    </div>
  );
}

// Inline loader bubble for follow-up processing
function LoaderBubble() {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
      className="flex items-center space-x-2 bg-[#2a2a2a] text-white rounded-3xl p-3"
    >
      <Loader2 className="animate-spin" />
      <span>Processing...</span>
    </motion.div>
  );
}

export default function VoiceAssistant() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [isRecording, setIsRecording] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const [isSilent, setIsSilent] = useState(false);
  const silenceTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const silenceIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const silenceThreshold = 5;
  const chatRef = useRef<HTMLDivElement>(null);

  // Auto-scroll
  useEffect(() => {
    const el = chatRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [messages]);

  // Clear on unload
  useEffect(() => {
    const onUnload = () => {
      navigator.sendBeacon("/clear-chat-history")
    };
    window.addEventListener("beforeunload", onUnload);
    return () => window.removeEventListener("beforeunload", onUnload);
  }, []);

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream);
      mediaRecorderRef.current = recorder;
      audioChunksRef.current = [];

      // Silence detection
      const ctx = new AudioContext();
      audioContextRef.current = ctx;
      const analyser = ctx.createAnalyser();
      analyserRef.current = analyser;
      analyser.fftSize = 256;
      ctx.createMediaStreamSource(stream).connect(analyser);
      const data = new Uint8Array(analyser.frequencyBinCount);
      const detect = () => {
        analyser.getByteFrequencyData(data);
        const avg = data.reduce((a, b) => a + b, 0) / data.length;
        if (avg < silenceThreshold && !isSilent) {
          setIsSilent(true);
          silenceTimeoutRef.current = setTimeout(() => stopRecording(), 2000);
        } else if (avg >= silenceThreshold && isSilent) {
          clearTimeout(silenceTimeoutRef.current!);
          setIsSilent(false);
        }
      };
      silenceIntervalRef.current = setInterval(detect, 100);

      recorder.ondataavailable = (e) => e.data.size > 0 && audioChunksRef.current.push(e.data);
      recorder.onstop = () => {
        processAudio();
        ctx.close();
        clearInterval(silenceIntervalRef.current!);
        stream.getTracks().forEach((t) => t.stop());
      };

      recorder.start();
      setIsRecording(true);
      setIsProcessing(true);
    } catch {
      const msg = "Could not access microphone. Please check permissions.";
      toast.error(msg);
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
  };

  const processAudio = async () => {
    const blob = new Blob(audioChunksRef.current, { type: "audio/wav" });
    const fd = new FormData();
    fd.append("file", blob);
    const type = messages.length === 0 ? "first_message" : "follow_up";
    try {
      const res = await apiWithAuth.post<ApiResponse>("/voice-agent", fd, { params: { message_type: type } });
      const data = res.data;
      const now = new Date();
      const timestamp = `${now.getHours()}:${now.getMinutes().toString().padStart(2, '0')}`;
      setMessages((prev) => [
        ...prev,
        { sender: 'user', content: data.user_transcribed_text, timestamp, audioUrl: data.user_audio._url },
        { sender: 'ai', content: data.assistant_response, timestamp, audioUrl: data.response_audio_url._url },
      ]);
    } catch (e) {
      let msg = 'Failed to process audio.';
      if (axios.isAxiosError(e) && e.response?.data?.detail) msg = e.response.data.detail;
      toast.error(msg);
    } finally {
      setIsProcessing(false);
    }
  };

  const clearChat = async () => {
    setMessages([]);
    await apiWithoutAuth.post("/clear-chat-history")
    toast.success("Conversation cleared.");
  };


  useEffect(() => () => {
    clearTimeout(silenceTimeoutRef.current!);
    clearInterval(silenceIntervalRef.current!);
    audioContextRef.current?.close();
    mediaRecorderRef.current?.stop();
  }, [isRecording]);

  return (
    <div className="flex flex-col min-h-screen">
      <header className="p-6 flex justify-between items-center">
        <h1 className="text-3xl font-bold">AI Voice Assistant</h1>
        <UserAvatar />
      </header>

      <div ref={chatRef} className="flex-1 p-4 overflow-y-auto space-y-4">
        {messages.length === 0 ? (
          <div className="flex items-center justify-center h-full">
            <p className="text-gray-400">Say something to start the conversation</p>
          </div>
        ) : (
          <AnimatePresence initial={false}>
            {messages.map((msg, idx) => (
              <motion.div
                key={idx}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: idx * 0.05 }}
                className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div className="max-w-[80%] flex items-center space-x-2">
                  {msg.audioUrl && (
                    <PlayButton
                      url={msg.audioUrl}
                      autoPlay={msg.sender === 'ai' && idx === messages.length - 1}
                      isFirst={idx === 1 && msg.sender === 'ai'}
                    />
                  )}
                  <div className={`rounded-3xl p-4 ${msg.sender === 'user' ? 'bg-[#4285F4] text-white' : 'bg-[#2a2a2a] text-white'}`}>                 
                    <p>{msg.content}</p>
                    <p className="text-xs mt-1 text-right text-white/70">{msg.timestamp}</p>
                  </div>
                </div>
              </motion.div>
            ))}
            {isProcessing && (
              <div className="flex justify-start">
                <LoaderBubble />
              </div>
            )}
          </AnimatePresence>
        )}
      </div>

      <div className="flex justify-center mb-8">
        <motion.button
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.95 }}
          animate={isRecording ? { scale: [1, 1.1, 1], transition: { repeat: Infinity, duration: 1.5 } } : {}}
          onClick={() => (isRecording ? stopRecording() : startRecording())}
          disabled={isProcessing}
          aria-label={isRecording ? 'Stop recording' : 'Start recording'}
          className={`w-16 h-16 rounded-full flex items-center justify-center text-white cursor-pointer ${
            isRecording ? 'bg-red-500 border-2 border-red-600' : 'bg-[#121212] border-2 border-[#4285F4]'}
          `}
        >
          {isRecording ? <Mic size={28} /> : <Mic size={28} />}
        </motion.button>
      </div>

      <div className="flex justify-center gap-4 mb-8">
        <motion.button whileHover={{ scale: 1.05, backgroundColor: "#3a3a3a" }} whileTap={{ scale: 0.95 }} onClick={clearChat} disabled={isProcessing || messages.length === 0} className="bg-[#2a2a2a] text-white px-6 py-3 rounded-full">
          Clear Chat
        </motion.button>
        
      </div>
    </div>
  );
}
