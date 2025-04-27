/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useState, useRef, useEffect } from "react";
import { Mic, Loader2, Square } from "lucide-react";
import axios from "axios";
import AudioPlayer from "@/components/main/audio-player";
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

// Define API response interface
interface ApiResponse {
  user_transcribed_text: string;
  assistant_response: string;
  user_audio: { _url: string };
  response_audio_url: { _url: string };
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
  const silenceThreshold = 0.000000005; // Lowered threshold to make it more sensitive
  const silenceDetectionIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Add this after the state declarations and before the startRecording function
  useEffect(() => {
    const handleBeforeUnload = () => {
      console.log("I called");
      // Send request to clear chat history when page is closed or refreshed
      if (navigator.sendBeacon) {
        navigator.sendBeacon(
          "https://voice-agent.kognifi.ai/clear-chat-history"
        );
      } else {
        // Fallback to axios for browsers that don't support sendBeacon
        apiWithAuth
          .post(
            "/clear-chat-history/",
            {},
            {
              // Setting timeout to a small value since the page is unloading
              timeout: 300,
            }
          )
          .catch((err) => {
            // Silent catch as the page is unloading anyway
            console.error("Failed to clear chat history:", err);
          });
      }
    };

    // Add event listener for beforeunload
    window.addEventListener("beforeunload", handleBeforeUnload);

    // Clean up event listener
    return () => {
      window.removeEventListener("beforeunload", handleBeforeUnload);
    };
  }, []);

  const startRecording = async () => {
    try {
      const globalAudio = (window as any).__currentAudio as
        | HTMLAudioElement
        | undefined;
      if (globalAudio) {
        globalAudio.pause();
        delete (window as any).__currentAudio;
      }
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      // Set up audio analysis for silence detection
      const audioContext = new AudioContext();
      audioContextRef.current = audioContext;
      const analyser = audioContext.createAnalyser();
      analyserRef.current = analyser;
      analyser.fftSize = 256;

      const source = audioContext.createMediaStreamSource(stream);
      source.connect(analyser);

      const bufferLength = analyser.frequencyBinCount;
      const dataArray = new Uint8Array(bufferLength);

      // Function to detect silence using an interval instead of requestAnimationFrame
      const detectSilence = () => {
        if (!analyserRef.current) return;

        analyserRef.current.getByteFrequencyData(dataArray);

        // Calculate average volume
        let sum = 0;
        for (let i = 0; i < bufferLength; i++) {
          sum += dataArray[i];
        }
        const average = sum / bufferLength;

        console.log("Audio level:", average, "Threshold:", silenceThreshold);

        // Check if volume is below threshold (silence)
        if (average < silenceThreshold) {
          if (!isSilent) {
            console.log("Silence detected, starting timer");
            setIsSilent(true);
            // Start silence timer
            if (silenceTimeoutRef.current) {
              clearTimeout(silenceTimeoutRef.current);
            }
            silenceTimeoutRef.current = setTimeout(() => {
              console.log("Stopping recording due to silence");
              if (isRecording) {
                stopRecording();
              }
            }, 2000); // 2 seconds of silence
          }
        } else {
          // If there's sound, clear the timeout and reset silence state
          if (isSilent) {
            console.log("Sound detected, clearing timer");
            setIsSilent(false);
            if (silenceTimeoutRef.current) {
              clearTimeout(silenceTimeoutRef.current);
              silenceTimeoutRef.current = null;
            }
          }
        }
      };

      // Start silence detection using an interval (more reliable than requestAnimationFrame)
      silenceDetectionIntervalRef.current = setInterval(detectSilence, 100);

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = () => {
        processAudio();

        // Clean up audio context and analyser
        if (
          audioContextRef.current &&
          audioContextRef.current.state !== "closed"
        ) {
          audioContextRef.current.close();
        }

        // Clear any pending silence timeout
        if (silenceTimeoutRef.current) {
          clearTimeout(silenceTimeoutRef.current);
          silenceTimeoutRef.current = null;
        }

        // Clear silence detection interval
        if (silenceDetectionIntervalRef.current) {
          clearInterval(silenceDetectionIntervalRef.current);
          silenceDetectionIntervalRef.current = null;
        }

        // Stop all tracks in the stream
        stream.getTracks().forEach((track) => track.stop());
      };

      mediaRecorder.start();
      setIsRecording(true);
    } catch (error) {
      console.error("Error accessing microphone:", error);

      toast.error("Could not access microphone. Please check permissions.");
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      setIsProcessing(true);

      // Clear any pending silence timeout
      if (silenceTimeoutRef.current) {
        clearTimeout(silenceTimeoutRef.current);
        silenceTimeoutRef.current = null;
      }

      // Clear silence detection interval
      if (silenceDetectionIntervalRef.current) {
        clearInterval(silenceDetectionIntervalRef.current);
        silenceDetectionIntervalRef.current = null;
      }

      setIsSilent(false);
    }
  };

  const processAudio = async () => {
    // Create audio blob from recorded chunks
    const audioBlob = new Blob(audioChunksRef.current, { type: "audio/wav" });

    // Create form data to send to backend
    const formData = new FormData();
    formData.append("file", audioBlob, "recording.wav");

    // Determine message type based on current state
    const messageType = messages.length === 0 ? "first_message" : "follow_up";
    console.log("FormData created with:");
    console.log("- file: [Audio Blob]", audioBlob.size, "bytes");
    try {
      // Send the audio to the backend API
      const response = await axios.post("/api/voice-agent", formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
        params: {
          message_type: messageType,
        },
      });

      const data = response.data as ApiResponse;

      // Get current time for timestamp
      const currentTime = new Date();
      const hours = currentTime.getHours();
      const minutes = currentTime.getMinutes();
      const formattedTime = `${hours}:${
        minutes < 10 ? "0" + minutes : minutes
      }`;

      // Add user message with transcribed text from response
      const userMessage: Message = {
        content: data.user_transcribed_text || "Could not transcribe audio",
        sender: "user",
        timestamp: formattedTime,
        audioUrl: data.user_audio?._url,
      };

      // Add AI response
      const aiResponse: Message = {
        content: data.assistant_response || "No response available",
        sender: "ai",
        timestamp: formattedTime,
        audioUrl: data.response_audio_url?._url,
      };

      setMessages((prev) => [...prev, userMessage, aiResponse]);
      setIsProcessing(false);
    } catch (error) {
      console.error("Error processing audio:", error);

      // Extract error details from response if available
      let errorMessage = "Failed to process audio";
      if (axios.isAxiosError(error) && error.response?.data?.error) {
        errorMessage = error.response.data.error;
      }

      setIsProcessing(false);

      toast.error(errorMessage);
    }
  };

  const clearChat = async () => {
    try {
      // Clear chat in the UI only
      setMessages([]);
      apiWithoutAuth.post("/clear-chat-history");
      toast.success("Your conversation has been cleared.");
    } catch (error) {
      console.error("Failed to clear chat:", error);

      toast.error("Failed to clear chat");
    }
  };

  const handleMicButtonClick = () => {
    if (isRecording) {
      stopRecording();
    } else {
      startRecording();
    }
  };

  useEffect(() => {
    return () => {
      // Clean up on component unmount
      if (silenceTimeoutRef.current) {
        clearTimeout(silenceTimeoutRef.current);
      }

      if (silenceDetectionIntervalRef.current) {
        clearInterval(silenceDetectionIntervalRef.current);
      }

      if (
        audioContextRef.current &&
        audioContextRef.current.state !== "closed"
      ) {
        audioContextRef.current.close();
      }

      if (mediaRecorderRef.current && isRecording) {
        mediaRecorderRef.current.stop();
      }
    };
  }, [isRecording]);

  return (
    <div className="flex flex-col min-h-screen ">
      {/* Header */}
      <header className="p-6 flex justify-between items-center">
        <h1 className="text-3xl font-bold">AI Voice Assistant</h1>
        <UserAvatar />
      </header>

      {/* Processing Overlay */}
      {isProcessing && messages.length === 0 && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="bg-[#2a2a2a] p-8 rounded-xl flex flex-col items-center"
          >
            <Loader2 className="h-12 w-12 animate-spin text-white mb-4" />
            <p className="text-lg font-medium">Processing your request...</p>
          </motion.div>
        </div>
      )}

      {/* Chat Area */}
      <div className="flex-1 p-4 overflow-y-auto max-h-[calc(100vh-200px)] space-y-4">
        {messages.length === 0 ? (
          <div className="flex items-center justify-center h-full">
            <p className="text-gray-400">
              Say something to start the conversation
            </p>
          </div>
        ) : (
          <AnimatePresence initial={false}>
            {messages.map((message, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                transition={{ duration: 0.3, delay: index * 0.1 }}
                className={`flex ${
                  message.sender === "user" ? "justify-end" : "justify-start"
                }`}
              >
                {message.sender == "ai" && (
                  <motion.div
                    initial={{ scale: 0.8 }}
                    animate={{ scale: [1, 1.05, 1] }}
                    transition={{ duration: 0.5, repeat: 0 }}
                    className="w-10 h-10 rounded-full overflow-hidden mr-2 flex-shrink-0"
                  >
                    <AudioPlayer
                      audioUrl={message.audioUrl || ""}
                      autoPlay={message.sender == "ai"}
                    />
                  </motion.div>
                )}
                <motion.div
                  whileHover={{ scale: 1.02 }}
                  className={`max-w-[80%] rounded-3xl p-4 ${
                    message.sender === "user"
                      ? "bg-[#4285F4] text-white"
                      : "bg-[#2a2a2a] text-white"
                  }`}
                >
                  <p>{message.content}</p>
                  <p
                    className={`text-xs mt-1 text-right ${
                      message.sender === "user"
                        ? "text-white/70"
                        : "text-white/70"
                    }`}
                  >
                    {message.timestamp}
                  </p>
                </motion.div>
                {message.sender == "user" && (
                  <motion.div
                    initial={{ scale: 0.8 }}
                    animate={{ scale: [1, 1.05, 1] }}
                    transition={{ duration: 0.5, repeat: 0 }}
                    className="w-10 h-10 rounded-full overflow-hidden mr-2 flex-shrink-0"
                  >
                    <AudioPlayer
                      audioUrl={message.audioUrl || ""}
                      autoPlay={false}
                    />
                  </motion.div>
                )}
              </motion.div>
            ))}
          </AnimatePresence>
        )}
        {isProcessing && messages.length > 0 && (
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="bg-[#2a2a2a] gap-4 p-3 rounded-xl max-w-3xs mx-auto flex justify-end items-center"
          >
            <Loader2 className="size-6 animate-spin text-white " />
            <p className="text-lg font-medium">Processing your request...</p>
          </motion.div>
        )}
      </div>

      {/* Microphone Button */}
      <div className="flex justify-center mb-8">
        <motion.button
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.95 }}
          animate={
            isRecording
              ? {
                  scale: [1, 1.1, 1],
                  transition: {
                    repeat: Number.POSITIVE_INFINITY,
                    duration: 1.5,
                  },
                }
              : {}
          }
          className={`w-16 h-16 rounded-full flex items-center justify-center text-white cursor-pointer ${
            isRecording
              ? "bg-red-500 border-2 border-red-600"
              : "bg-[#121212] border-2 border-[#4285F4]"
          }`}
          onClick={handleMicButtonClick}
          disabled={isProcessing}
          aria-label={isRecording ? "Stop recording" : "Start recording"}
        >
          {isProcessing ? (
            <Loader2 className="h-8 w-8 animate-spin" />
          ) : isRecording ? (
            <Square size={24} className="text-white" />
          ) : (
            <Mic size={28} className="text-white" />
          )}
        </motion.button>
      </div>

      {/* Bottom Controls */}
      <div className="flex justify-center gap-4 mb-8">
        <motion.button
          whileHover={{ scale: 1.05, backgroundColor: "#3a3a3a" }}
          whileTap={{ scale: 0.95 }}
          onClick={clearChat}
          className="bg-[#2a2a2a] text-white px-6 py-3 rounded-full transition-colors cursor-pointer"
          disabled={isProcessing || messages.length === 0}
        >
          Clear Chat
        </motion.button>
      </div>
    </div>
  );
}
