"use client"

import { useEffect, useState, useCallback } from "react"
import { Volume2, VolumeX } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { getTranslation, type Language } from "@/lib/languages"

interface QuestionDisplayProps {
  question: string
  questionNumber: number
  totalQuestions: number
  autoSpeak?: boolean
  language: Language
}

export function QuestionDisplay({ 
  question, 
  questionNumber, 
  totalQuestions,
  autoSpeak = true,
  language
}: QuestionDisplayProps) {
  const [isSpeaking, setIsSpeaking] = useState(false)
  const [speechEnabled, setSpeechEnabled] = useState(true)

  const t = getTranslation(language.code)

  const speakQuestion = useCallback(() => {
    if (!speechEnabled || !window.speechSynthesis) return
    
    // Cancel any ongoing speech
    window.speechSynthesis.cancel()
    
    const utterance = new SpeechSynthesisUtterance(question)
    utterance.rate = 0.9
    utterance.pitch = 1
    utterance.volume = 1
    utterance.lang = language.speechCode
    
    // Try to find a voice for this language
    const voices = window.speechSynthesis.getVoices()
    const langVoice = voices.find(v => v.lang.startsWith(language.code))
    if (langVoice) {
      utterance.voice = langVoice
    }
    
    utterance.onstart = () => setIsSpeaking(true)
    utterance.onend = () => setIsSpeaking(false)
    utterance.onerror = () => setIsSpeaking(false)
    
    window.speechSynthesis.speak(utterance)
  }, [speechEnabled, question, language.speechCode, language.code])

  const toggleSpeech = () => {
    if (isSpeaking) {
      window.speechSynthesis.cancel()
      setIsSpeaking(false)
    } else {
      setSpeechEnabled(!speechEnabled)
    }
  }

  useEffect(() => {
    if (autoSpeak && speechEnabled) {
      // Load voices first, then speak
      const loadVoicesAndSpeak = () => {
        const timer = setTimeout(speakQuestion, 500)
        return () => clearTimeout(timer)
      }
      
      if (window.speechSynthesis.getVoices().length > 0) {
        return loadVoicesAndSpeak()
      }
      
      window.speechSynthesis.onvoiceschanged = () => {
        loadVoicesAndSpeak()
      }
    }
  }, [question, autoSpeak, speechEnabled, speakQuestion])

  useEffect(() => {
    return () => {
      window.speechSynthesis?.cancel()
    }
  }, [])

  return (
    <Card className="border-wellness/20 bg-card/80 backdrop-blur-sm shadow-sm">
      <CardContent className="pt-6">
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-3">
              <span className="inline-flex items-center justify-center h-6 w-6 rounded-full bg-wellness text-white text-xs font-medium">
                {questionNumber}
              </span>
              <span className="text-sm text-muted-foreground">
                {t.of} {totalQuestions}
              </span>
            </div>
            <p className="text-lg font-medium leading-relaxed text-foreground text-balance">
              {question}
            </p>
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={toggleSpeech}
            className="shrink-0 text-muted-foreground hover:text-wellness"
          >
            {speechEnabled ? (
              <Volume2 className={`h-5 w-5 ${isSpeaking ? "animate-pulse text-wellness" : ""}`} />
            ) : (
              <VolumeX className="h-5 w-5" />
            )}
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
