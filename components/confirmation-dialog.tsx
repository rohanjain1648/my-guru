"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { SentimentDisplay } from "./sentiment-display"
import type { SentimentResult } from "@/lib/types"
import { Check, X, HelpCircle } from "lucide-react"
import { getTranslation, type Language } from "@/lib/languages"
import { useState, useEffect } from "react"

interface ConfirmationDialogProps {
  sentimentResults: Array<{
    questionNumber: number
    question: string
    response: string
    sentiment: SentimentResult
  }>
  onConfirm: (agreement: "yes" | "no" | "maybe", modifiedResults?: Array<{
    questionNumber: number
    question: string
    response: string
    sentiment: SentimentResult
  }>) => void
  language: Language
}

export function ConfirmationDialog({ sentimentResults, onConfirm, language }: ConfirmationDialogProps) {
  const t = getTranslation(language.code)

  const [results, setResults] = useState(sentimentResults)

  useEffect(() => {
    setResults(sentimentResults)
  }, [sentimentResults])

  const handleSentimentChange = (index: number, newSentiment: "positive" | "neutral" | "negative") => {
    const newResults = [...results]
    newResults[index] = {
      ...newResults[index],
      sentiment: {
        ...newResults[index].sentiment,
        sentiment: newSentiment
      }
    }
    setResults(newResults)
  }

  const positiveCount = results.filter(r => r.sentiment.sentiment === "positive").length
  const negativeCount = results.filter(r => r.sentiment.sentiment === "negative").length
  const neutralCount = results.filter(r => r.sentiment.sentiment === "neutral").length

  return (
    <Card className="border-wellness/20 bg-card/80 backdrop-blur-sm">
      <CardHeader>
        <CardTitle className="text-xl">{t.reviewResponses}</CardTitle>
        <CardDescription>
          {t.reviewDesc}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Summary Stats */}
        <div className="grid grid-cols-3 gap-4">
          <div className="text-center p-4 rounded-lg bg-positive/10">
            <p className="text-2xl font-bold text-positive">{positiveCount}</p>
            <p className="text-sm text-muted-foreground">{t.overridePositive}</p>
          </div>
          <div className="text-center p-4 rounded-lg bg-calm/10">
            <p className="text-2xl font-bold text-calm">{neutralCount}</p>
            <p className="text-sm text-muted-foreground">{t.overrideNeutral}</p>
          </div>
          <div className="text-center p-4 rounded-lg bg-concern/10">
            <p className="text-2xl font-bold text-concern">{negativeCount}</p>
            <p className="text-sm text-muted-foreground">{t.overrideNegative}</p>
          </div>
        </div>

        {/* Individual Results */}
        <div className="space-y-3 max-h-64 overflow-y-auto">
          {results.map((result, i) => (
            <SentimentDisplay
              key={i}
              questionNumber={result.questionNumber}
              question={result.question}
              response={result.response}
              result={result.sentiment}
              onChange={(val) => handleSentimentChange(i, val)}
              language={language}
            />
          ))}
        </div>

        {/* Agreement Question */}
        <div className="pt-4 border-t border-border">
          <p className="text-center text-foreground font-medium mb-4">
            {t.doYouAgree}
          </p>
          <div className="flex flex-col sm:flex-row gap-3">
            <Button
              onClick={() => onConfirm("yes", results)}
              className="flex-1 bg-positive hover:bg-positive/90 text-white"
            >
              <Check className="h-4 w-4 mr-2" />
              {t.yes}
            </Button>
            <Button
              onClick={() => onConfirm("maybe", results)}
              variant="outline"
              className="flex-1 border-calm text-calm hover:bg-calm/10"
            >
              <HelpCircle className="h-4 w-4 mr-2" />
              {t.maybe}
            </Button>
            <Button
              onClick={() => onConfirm("no", results)}
              variant="outline"
              className="flex-1 border-concern text-concern hover:bg-concern/10"
            >
              <X className="h-4 w-4 mr-2" />
              {t.no}
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
