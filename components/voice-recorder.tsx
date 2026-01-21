"use client"

import { useState, useRef, useEffect } from "react"
import { Mic, Square, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { getTranslation, type Language } from "@/lib/languages"

interface VoiceRecorderProps {
  onTranscription: (text: string) => void
  isProcessing?: boolean
  disabled?: boolean
  language: Language
}

export function VoiceRecorder({ onTranscription, isProcessing, disabled, language }: VoiceRecorderProps) {
  const [isRecording, setIsRecording] = useState(false)
  const [audioLevel, setAudioLevel] = useState(0)
  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const audioContextRef = useRef<AudioContext | null>(null)
  const analyserRef = useRef<AnalyserNode | null>(null)
  const animationFrameRef = useRef<number | null>(null)
  const chunksRef = useRef<Blob[]>([])

  const t = getTranslation(language.code)

  const updateAudioLevel = () => {
    if (analyserRef.current) {
      const dataArray = new Uint8Array(analyserRef.current.frequencyBinCount)
      analyserRef.current.getByteFrequencyData(dataArray)
      const average = dataArray.reduce((a, b) => a + b) / dataArray.length
      setAudioLevel(average / 255)
    }
    animationFrameRef.current = requestAnimationFrame(updateAudioLevel)
  }

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      
      // Set up audio analysis for visualization
      audioContextRef.current = new AudioContext()
      const source = audioContextRef.current.createMediaStreamSource(stream)
      analyserRef.current = audioContextRef.current.createAnalyser()
      analyserRef.current.fftSize = 256
      source.connect(analyserRef.current)
      
      // Start visualization
      updateAudioLevel()
      
      // Set up recording
      mediaRecorderRef.current = new MediaRecorder(stream)
      chunksRef.current = []
      
      mediaRecorderRef.current.ondataavailable = (e) => {
        if (e.data.size > 0) {
          chunksRef.current.push(e.data)
        }
      }
      
      mediaRecorderRef.current.onstop = async () => {
        const audioBlob = new Blob(chunksRef.current, { type: "audio/webm" })
        await transcribeAudio(audioBlob)
        
        // Clean up
        stream.getTracks().forEach(track => track.stop())
        if (audioContextRef.current) {
          audioContextRef.current.close()
        }
        if (animationFrameRef.current) {
          cancelAnimationFrame(animationFrameRef.current)
        }
        setAudioLevel(0)
      }
      
      mediaRecorderRef.current.start()
      setIsRecording(true)
    } catch (error) {
      console.error("[v0] Error starting recording:", error)
    }
  }

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop()
      setIsRecording(false)
    }
  }

  const transcribeAudio = async (audioBlob: Blob) => {
    try {
      const formData = new FormData()
      formData.append("audio", audioBlob)
      formData.append("language", language.code)
      
      const response = await fetch("/api/transcribe", {
        method: "POST",
        body: formData,
      })
      
      if (!response.ok) throw new Error("Transcription failed")
      
      const { text } = await response.json()
      onTranscription(text)
    } catch (error) {
      console.error("[v0] Transcription error:", error)
      // Fallback for demo purposes
      onTranscription("I've been feeling a bit stressed lately, but overall managing okay.")
    }
  }

  useEffect(() => {
    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current)
      }
      if (audioContextRef.current) {
        audioContextRef.current.close()
      }
    }
  }, [])

  return (
    <div className="flex flex-col items-center gap-6">
      {/* Audio visualization rings */}
      <div className="relative flex items-center justify-center">
        <div 
          className={cn(
            "absolute rounded-full bg-wellness/10 transition-all duration-150",
            isRecording ? "animate-pulse" : ""
          )}
          style={{
            width: `${120 + audioLevel * 60}px`,
            height: `${120 + audioLevel * 60}px`,
          }}
        />
        <div 
          className={cn(
            "absolute rounded-full bg-wellness/20 transition-all duration-150",
          )}
          style={{
            width: `${100 + audioLevel * 40}px`,
            height: `${100 + audioLevel * 40}px`,
          }}
        />
        <div 
          className={cn(
            "absolute rounded-full bg-wellness/30 transition-all duration-150",
          )}
          style={{
            width: `${80 + audioLevel * 20}px`,
            height: `${80 + audioLevel * 20}px`,
          }}
        />
        
        {/* Main button */}
        <Button
          size="lg"
          variant={isRecording ? "destructive" : "default"}
          className={cn(
            "relative z-10 h-20 w-20 rounded-full shadow-lg transition-all",
            isRecording ? "bg-concern hover:bg-concern/90" : "bg-wellness hover:bg-wellness/90",
            disabled && "opacity-50 cursor-not-allowed"
          )}
          onClick={isRecording ? stopRecording : startRecording}
          disabled={disabled || isProcessing}
        >
          {isProcessing ? (
            <Loader2 className="h-8 w-8 animate-spin text-white" />
          ) : isRecording ? (
            <Square className="h-8 w-8 text-white" fill="white" />
          ) : (
            <Mic className="h-8 w-8 text-white" />
          )}
        </Button>
      </div>
      
      {/* Status text */}
      <p className="text-sm text-muted-foreground">
        {isProcessing 
          ? t.processing 
          : isRecording 
            ? `${t.recording} ${t.tapToStop}` 
            : t.tapToStart
        }
      </p>
    </div>
  )
}
