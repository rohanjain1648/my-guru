"use client"

import { cn } from "@/lib/utils"
import { Card, CardContent } from "@/components/ui/card"
import { TrendingUp, TrendingDown, Minus } from "lucide-react"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { getTranslation, type Language } from "@/lib/languages"
import type { SentimentResult } from "@/lib/types"

interface SentimentDisplayProps {
  result: SentimentResult
  questionNumber: number
  question?: string
  response: string
  onChange?: (value: "positive" | "neutral" | "negative") => void
  language?: Language
}

export function SentimentDisplay({ result, questionNumber, question, response, onChange, language }: SentimentDisplayProps) {
  const t = language ? getTranslation(language.code) : null

  if (!result) return null;

  const sentimentConfig = {
    positive: {
      color: "text-positive",
      bgColor: "bg-positive/10",
      borderColor: "border-positive/20",
      icon: TrendingUp,
      label: t ? t.overridePositive : "Positive",
    },
    neutral: {
      color: "text-calm",
      bgColor: "bg-calm/10",
      borderColor: "border-calm/20",
      icon: Minus,
      label: t ? t.overrideNeutral : "Neutral",
    },
    negative: {
      color: "text-concern",
      bgColor: "bg-concern/10",
      borderColor: "border-concern/20",
      icon: TrendingDown,
      label: t ? t.overrideNegative : "Needs Attention",
    },
  }

  const config = sentimentConfig[result.sentiment] || sentimentConfig.neutral
  const Icon = config.icon

  return (
    <Card className={cn("border transition-all", config.borderColor)}>
      <CardContent className="pt-4">
        <div className="flex items-start gap-4">
          <div className={cn("p-2 rounded-lg shrink-0", config.bgColor)}>
            <Icon className={cn("h-5 w-5", config.color)} />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between gap-2 mb-2">
              <span className="text-sm font-medium text-muted-foreground">
                Question {questionNumber}
              </span>
              {question && (
                <p className="text-xs text-muted-foreground mt-0.5 mb-1 italic">
                  "{question}"
                </p>
              )}
              {onChange ? (
                <Select
                  value={result.sentiment}
                  onValueChange={(val: "positive" | "neutral" | "negative") => onChange(val)}
                >
                  <SelectTrigger className={cn("w-[140px] h-8 text-xs font-medium border-0 focus:ring-0 focus:ring-offset-0", config.bgColor, config.color)}>
                    <SelectValue>{config.label}</SelectValue>
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="positive" className="text-positive focus:text-positive focus:bg-positive/10">{t?.overridePositive || "Positive"}</SelectItem>
                    <SelectItem value="neutral" className="text-calm focus:text-calm focus:bg-calm/10">{t?.overrideNeutral || "Neutral"}</SelectItem>
                    <SelectItem value="negative" className="text-concern focus:text-concern focus:bg-concern/10">{t?.overrideNegative || "Needs Attention"}</SelectItem>
                  </SelectContent>
                </Select>
              ) : (
                <span className={cn("text-sm font-medium px-2 py-0.5 rounded-full", config.bgColor, config.color)}>
                  {config.label}
                </span>
              )}
            </div>
            <p className="text-sm text-foreground mb-2 line-clamp-2">
              {`"${response}"`}
            </p>
            {result.keywords && result.keywords.length > 0 && (
              <div className="flex flex-wrap gap-1.5">
                {(result.keywords || []).slice(0, 4).map((keyword, i) => (
                  <span
                    key={i}
                    className="text-xs px-2 py-0.5 rounded-full bg-muted text-muted-foreground"
                  >
                    {keyword}
                  </span>
                ))}
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card >
  )
}
