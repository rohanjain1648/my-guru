"use client"

import { useState, useRef, useEffect, useCallback } from "react"
import { type Language, getQuestions, getTranslation } from "@/lib/languages"

export type SpeakerRole = "user" | "agent"

export interface Message {
    id: string
    role: SpeakerRole
    content: string
}

export type AssessmentStatus = "idle" | "listening" | "processing" | "speaking"

interface UseSeamlessAssessmentProps {
    onAssessmentComplete: (responses: any[]) => void
    language: Language
}

export function useSeamlessAssessment({ onAssessmentComplete, language }: UseSeamlessAssessmentProps) {
    const [status, setStatus] = useState<AssessmentStatus>("idle")
    const [transcript, setTranscript] = useState<Message[]>([])
    const [audioLevel, setAudioLevel] = useState(0)
    const [currentIndex, setCurrentIndex] = useState(0)
    const [responses, setResponses] = useState<any[]>([])
    const [isSkipConfirm, setIsSkipConfirm] = useState(false)
    const monitoringRef = useRef(false)

    // Refs
    const mediaRecorderRef = useRef<MediaRecorder | null>(null)
    const audioContextRef = useRef<AudioContext | null>(null)
    const analyserRef = useRef<AnalyserNode | null>(null)
    const silenceTimerRef = useRef<NodeJS.Timeout | null>(null)
    const streamRef = useRef<MediaStream | null>(null)
    const chunksRef = useRef<Blob[]>([])
    const animationFrameRef = useRef<number | null>(null)
    const hasSpokenRef = useRef(false)
    const currentIndexRef = useRef(0)
    const responsesRef = useRef<any[]>([])

    // Constants
    const SILENCE_THRESHOLD = 0.04 // Increased from 0.02 to reduce noise sensitivity
    const SILENCE_DURATION = 1500
    const MIN_SPEECH_DURATION = 300 // ms

    const t = getTranslation(language.code)
    const allQuestions = getQuestions(language.code)

    // Cleanup
    const cleanupAudio = useCallback(() => {
        if (streamRef.current) {
            streamRef.current.getTracks().forEach(track => track.stop())
        }
        if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
            audioContextRef.current.close()
        }
        if (animationFrameRef.current) {
            cancelAnimationFrame(animationFrameRef.current)
        }
        if (silenceTimerRef.current) {
            clearTimeout(silenceTimerRef.current)
        }
        setAudioLevel(0)
        speechStartTimeRef.current = null
    }, [])

    const speechStartTimeRef = useRef<number | null>(null)

    // Process User Audio
    const processAudio = async (audioBlob: Blob) => {
        setStatus("processing")

        try {
            const formData = new FormData()
            formData.append("audio", audioBlob)
            formData.append("language", language.code)

            // 1. Transcribe
            const transcribeRes = await fetch("/api/transcribe", {
                method: "POST",
                body: formData,
            })

            if (!transcribeRes.ok) {
                const errorData = await transcribeRes.text()
                console.error("Transcription API Error:", errorData)
                throw new Error(`Transcription failed: ${errorData}`)
            }
            const data = await transcribeRes.json()
            const userText = data.text

            if (!userText || !userText.trim()) {
                const output = t.assessmentFallback
                await speakResponse(output)
                startListening()
                return
            }

            // SKIP LOGIC
            if (isSkipConfirm) {
                const lower = userText.toLowerCase()
                const yesWords = ["yes", "yeah", "yep", "skip", "haan", "jee", "sì", "si", "hai", "ja", "oui"]
                // Simple keyword check for "Yes"
                if (yesWords.some(w => lower.includes(w))) {
                    // Confirm skip
                    const skipText = t.skipConfirmed || "Skipping."
                    const msg: Message = { id: Date.now().toString(), role: "user", content: userText + " (Skipped)" }
                    setTranscript(prev => [...prev, msg])
                    await speakResponse(skipText)
                    setIsSkipConfirm(false)
                    goToNextQuestion()
                    return
                } else {
                    // Start over with current question
                    setIsSkipConfirm(false)
                    const output = "Okay, please answer the question."
                    await speakResponse(output)
                    // Re-read question? No, just listen.
                    startListening()
                    return
                }
            }

            // NORMAL FLOW
            // ... (rest is the same)

            // Add to transcript
            const userMsg: Message = {
                id: Date.now().toString(),
                role: "user",
                content: userText
            }
            setTranscript(prev => [...prev, userMsg])

            // 2. Analyze Sentiment (Parallel)
            const currentIdx = currentIndexRef.current
            const currentQ = allQuestions[currentIdx]

            // We don't wait for this to speak the next question to keep flow fast,
            // but we need the result for the final report.
            // So we can await it or handle it optimistically. 
            // To ensure data integrity, I'll await it.

            const sentimentRes = await fetch("/api/analyze-sentiment", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    response: userText,
                    question: currentQ,
                    language: language.code
                })
            })

            const sentimentData = await sentimentRes.json()

            let sentiment = sentimentData
            if (!sentiment || !sentiment.sentiment || sentiment.error) {
                console.warn("Sentiment analysis failed or returned error, using fallback")
                sentiment = {
                    sentiment: "neutral",
                    score: 0.5,
                    keywords: [],
                    summary: "Analysis unavailable"
                }
            }

            const newResponse = {
                questionNumber: currentIdx + 1,
                question: currentQ,
                response: userText,
                sentiment: sentiment
            }

            const updatedResponses = [...responsesRef.current, newResponse]
            responsesRef.current = updatedResponses
            setResponses(updatedResponses)

            // 3. Move to next question or Finish
            goToNextQuestion()

        } catch (error) {
            console.error("Error processing audio:", error)
            // Retry or ask again? For now, just resume listening might loop error.
            // Better to speak "I didn't catch that."
            const output = t.assessmentFallback
            await speakResponse(output)
            startListening()
        }
    }

    const audioQueueRef = useRef<string[]>([])
    const isPlayingRef = useRef(false)
    const audioPlayerRef = useRef<HTMLAudioElement | null>(null)

    const speakResponse = async (text: string): Promise<void> => {
        setStatus("speaking")

        try {
            const speechCode = language.speechCode || language.code

            const res = await fetch("/api/tts", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    text,
                    languageCode: speechCode
                })
            })

            if (!res.ok) {
                console.error("TTS API Error")
                // Fallback or just resolve to continue flow
                return
            }

            const data = await res.json()
            const audioContent = data.audioContent // Base64

            if (!audioContent) return

            return new Promise((resolve) => {
                const audio = new Audio(`data:audio/mp3;base64,${audioContent}`)
                audioPlayerRef.current = audio

                audio.onended = () => {
                    setTimeout(resolve, 500)
                }

                audio.onerror = (e) => {
                    console.error("Audio Playback Error", e)
                    resolve()
                }

                audio.play().catch(e => {
                    console.error("Audio Play Error (Autoplay?)", e)
                    resolve()
                })
            })

        } catch (error) {
            console.error("TTS Fetch Error:", error)
        }
    }

    const startListening = async () => {
        try {
            cleanupAudio()
            hasSpokenRef.current = false

            const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
            streamRef.current = stream

            audioContextRef.current = new AudioContext()
            const source = audioContextRef.current.createMediaStreamSource(stream)
            analyserRef.current = audioContextRef.current.createAnalyser()
            analyserRef.current.fftSize = 256
            source.connect(analyserRef.current)

            mediaRecorderRef.current = new MediaRecorder(stream)
            chunksRef.current = []

            mediaRecorderRef.current.ondataavailable = (e) => {
                if (e.data.size > 0) chunksRef.current.push(e.data)
            }

            mediaRecorderRef.current.onstop = () => {
                const blob = new Blob(chunksRef.current, { type: "audio/webm" })
                // Strict VAD: Only process if speech was actually detected
                if (hasSpokenRef.current) {
                    processAudio(blob)
                }
            }

            monitoringRef.current = true
            mediaRecorderRef.current.start()
            setStatus("listening")

            // VAD Timeout (5s)
            startSilenceTimeout()

            monitorAudioLevel()

        } catch (error) {
            console.error("Error starting listening:", error)
            setStatus("idle")
        }
    }

    const startSilenceTimeout = () => {
        if (silenceTimerRef.current) clearTimeout(silenceTimerRef.current)

        silenceTimerRef.current = setTimeout(async () => {
            if (hasSpokenRef.current) return // Should have been cleared, but safety check

            // Timeout triggered means NO speech detected
            stopListening(false) // Stop, but don't process as answer

            // Enter Skip Confirmation Flow
            setIsSkipConfirm(true)
            const text = t.askToSkip || "I couldn't hear you. Do you want to skip this question?"
            await speakResponse(text)
            startListening()

        }, 5000)
    }

    const monitorAudioLevel = () => {
        if (!analyserRef.current || !mediaRecorderRef.current || mediaRecorderRef.current.state === "inactive") return

        const dataArray = new Uint8Array(analyserRef.current.frequencyBinCount)
        analyserRef.current.getByteFrequencyData(dataArray)

        const average = dataArray.reduce((a, b) => a + b) / dataArray.length
        const normalizedLevel = average / 255
        setAudioLevel(normalizedLevel)

        if (normalizedLevel > SILENCE_THRESHOLD) {
            // Speech detected
            if (!speechStartTimeRef.current) {
                speechStartTimeRef.current = Date.now()
            }

            const duration = Date.now() - speechStartTimeRef.current

            // Only confirm speech if it lasts longer than MIN_SPEECH_DURATION
            if (duration > MIN_SPEECH_DURATION) {
                hasSpokenRef.current = true

                // Clear the "Stop Silence" timeout if we are currently speaking
                if (silenceTimerRef.current) {
                    clearTimeout(silenceTimerRef.current)
                    silenceTimerRef.current = null
                }
            }
        } else {
            // Silence
            speechStartTimeRef.current = null // Reset speech timer

            // End-of-speech detection: Only stop if we have detected VALID speech previously
            if (hasSpokenRef.current) {
                if (!silenceTimerRef.current) {
                    silenceTimerRef.current = setTimeout(() => {
                        stopListening()
                    }, SILENCE_DURATION)
                }
            }
        }

        animationFrameRef.current = requestAnimationFrame(monitorAudioLevel)
    }

    const stopListening = (shouldProcess = true) => {
        if (silenceTimerRef.current) clearTimeout(silenceTimerRef.current)
        monitoringRef.current = false
        if (mediaRecorderRef.current && mediaRecorderRef.current.state !== "inactive") {
            // Updating the onstop handler if we DON'T want to process
            // But checking 'hasSpokenRef' is cleaner.
            // If shouldProcess is false, we can just clear chunks or hack the ref?
            if (!shouldProcess) {
                hasSpokenRef.current = false
            }
            mediaRecorderRef.current.stop()
            if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current)
        }
    }

    const goToNextQuestion = async () => {
        const currentIdx = currentIndexRef.current
        if (currentIdx < allQuestions.length - 1) {
            const nextIdx = currentIdx + 1
            currentIndexRef.current = nextIdx
            setCurrentIndex(nextIdx)
            const nextQuestion = allQuestions[nextIdx]

            const agentMsg: Message = {
                id: (Date.now() + 1).toString(),
                role: "agent",
                content: nextQuestion
            }
            setTranscript(prev => [...prev, agentMsg])

            await speakResponse(nextQuestion)
            startListening()
        } else {
            // Finished
            // Add a closing message
            const closing = t.assessmentClosing
            const closingMsg: Message = {
                id: (Date.now() + 2).toString(),
                role: "agent",
                content: closing
            }
            setTranscript(prev => [...prev, closingMsg])
            await speakResponse(closing)

            onAssessmentComplete(responsesRef.current)
            setStatus("idle")
        }
    }

    const startAssessment = async () => {
        // Initial Greeting
        currentIndexRef.current = 0
        setCurrentIndex(0)
        responsesRef.current = []
        setResponses([])
        // Ensure voices are loaded (hack for Chrome)
        window.speechSynthesis.getVoices()

        // Greeting
        const greeting = t.assessmentGreeting + " " + allQuestions[0]

        setTranscript([{ id: "init", role: "agent", content: greeting }])
        await speakResponse(greeting)
        startListening()
    }

    return {
        status,
        transcript,
        audioLevel,
        startAssessment
    }
}
