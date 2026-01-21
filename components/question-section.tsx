"use client"

import { useState } from "react"
import { QuestionDisplay } from "./question-display"
import { VoiceRecorder } from "./voice-recorder"
import { ProgressIndicator } from "./progress-indicator"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent } from "@/components/ui/card"
import { Keyboard, Mic } from "lucide-react"
import { getTranslation, type Language } from "@/lib/languages"

interface QuestionSectionProps {
  question: string
  questionNumber: number
  totalQuestions: number
  completedQuestions: number[]
  onSubmit: (response: string) => void
  isProcessing: boolean
  language: Language
}

export function QuestionSection({
  question,
  questionNumber,
  totalQuestions,
  completedQuestions,
  onSubmit,
  isProcessing,
  language,
}: QuestionSectionProps) {
  const [inputMode, setInputMode] = useState<"voice" | "text">("voice")
  const [textInput, setTextInput] = useState("")

  const t = getTranslation(language.code)

  const handleTextSubmit = () => {
    if (textInput.trim()) {
      onSubmit(textInput.trim())
      setTextInput("")
    }
  }

  return (
    <div className="min-h-[80vh] flex flex-col items-center justify-center px-4 py-8">
      <div className="w-full max-w-xl mx-auto space-y-8">
        {/* Progress */}
        <ProgressIndicator
          current={questionNumber - 1}
          total={totalQuestions}
          completedQuestions={completedQuestions}
        />

        {/* Question */}
        <QuestionDisplay
          question={question}
          questionNumber={questionNumber}
          totalQuestions={totalQuestions}
          autoSpeak={inputMode === "voice"}
          language={language}
        />

        {/* Input Area */}
        <Card className="border-wellness/20">
          <CardContent className="pt-6">
            {inputMode === "voice" ? (
              <VoiceRecorder
                onTranscription={onSubmit}
                isProcessing={isProcessing}
                language={language}
              />
            ) : (
              <div className="space-y-4">
                <Textarea
                  value={textInput}
                  onChange={(e) => setTextInput(e.target.value)}
                  placeholder={t.typeResponse}
                  className="min-h-32 resize-none"
                  disabled={isProcessing}
                  dir={language.code === "ar" ? "rtl" : "ltr"}
                />
                <Button
                  onClick={handleTextSubmit}
                  disabled={!textInput.trim() || isProcessing}
                  className="w-full bg-wellness hover:bg-wellness/90 text-white"
                >
                  {isProcessing ? t.processing : t.submit}
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Mode Toggle */}
        <div className="flex justify-center">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setInputMode(inputMode === "voice" ? "text" : "voice")}
            className="text-muted-foreground hover:text-foreground"
          >
            {inputMode === "voice" ? (
              <>
                <Keyboard className="h-4 w-4 mr-2" />
                {t.typeResponse.replace("...", "?")}
              </>
            ) : (
              <>
                <Mic className="h-4 w-4 mr-2" />
                {t.tapToStart}
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  )
}
