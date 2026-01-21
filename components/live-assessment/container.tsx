"use client"

import { useEffect, useState } from "react"
import { GlowingOrb } from "./orb"
import { Transcript } from "./transcript"
import { useSeamlessAssessment } from "@/hooks/use-seamless-assessment"
import { type Language, getTranslation } from "@/lib/languages"
import { Button } from "@/components/ui/button"
import { ArrowLeft } from "lucide-react"

interface LiveAssessmentContainerProps {
    onComplete: (results: any) => void
    onExit: () => void
    language: Language
}

export function LiveAssessmentContainer({ onComplete, onExit, language }: LiveAssessmentContainerProps) {
    const { status, transcript, audioLevel, startAssessment } = useSeamlessAssessment({
        onAssessmentComplete: onComplete,
        language
    })

    const [hasStarted, setHasStarted] = useState(false)

    const handleStart = () => {
        setHasStarted(true)
        startAssessment()
    }

    const t = getTranslation(language.code)

    const statusLabel = {
        idle: t.statusIdle,
        listening: t.statusListening,
        processing: t.statusProcessing,
        speaking: t.statusSpeaking
    }[status]

    return (
        <div className="flex flex-col h-screen max-h-screen overflow-hidden bg-background relative">
            {/* Header / Exit */}
            <div className="absolute top-4 left-4 z-50">
                <Button variant="ghost" onClick={onExit} className="gap-2">
                    <ArrowLeft size={20} />
                    {t.exitAssessment}
                </Button>
            </div>

            <div className="flex flex-1 w-full h-full relative">
                {/* Start Overlay */}
                {!hasStarted && (
                    <div className="absolute inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm">
                        <Button size="lg" onClick={handleStart} className="text-xl px-8 py-6 rounded-full shadow-2xl animate-pulse">
                            {t.tapToBegin}
                        </Button>
                    </div>
                )}

                {/* Left Side: Glowing Orb */}
                <div className="w-1/3 flex items-center justify-center bg-gradient-to-br from-wellness/5 to-transparent border-r border-border/50 relative overflow-hidden">
                    <div className="absolute inset-0 bg-grid-white/[0.02] bg-[length:20px_20px]" />
                    <GlowingOrb status={status} audioLevel={audioLevel} statusLabel={statusLabel} />
                </div>

                {/* Right Side: Transcript */}
                <div className="w-2/3 h-full p-8 bg-background/50 backdrop-blur-sm">
                    <div className="h-full flex flex-col max-w-3xl mx-auto">
                        <div className="mb-6">
                            <h2 className="text-2xl font-bold bg-gradient-to-r from-foreground to-foreground/60 bg-clip-text text-transparent">
                                {t.liveConversation}
                            </h2>
                            <p className="text-muted-foreground text-sm">
                                {t.liveConversationIntro}
                            </p>
                        </div>

                        <div className="flex-1 overflow-hidden">
                            <Transcript messages={transcript} />
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}
