"use client"

import React from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Download, RefreshCw, Heart, Brain, Sun, Users, Activity, Shield } from "lucide-react"
import { cn } from "@/lib/utils"
import { getTranslation, type Language } from "@/lib/languages"
import {
  Radar,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  ResponsiveContainer,
  Tooltip
} from "recharts"
import type { AssessmentReport } from "@/lib/types"

interface AssessmentReportProps {
  report: AssessmentReport
  onRestart: () => void
  language: Language
}

const iconMap: Record<string, React.ElementType> = {
  heart: Heart,
  brain: Brain,
  sun: Sun,
  users: Users,
  activity: Activity,
  shield: Shield,
}

const priorityConfig = (t: any) => ({
  high: {
    color: "text-concern",
    bgColor: "bg-concern/10",
    borderColor: "border-concern/20",
    label: t.priorityHigh,
  },
  medium: {
    color: "text-warning",
    bgColor: "bg-warning/10",
    borderColor: "border-warning/20",
    label: t.priorityMedium,
  },
  low: {
    color: "text-calm",
    bgColor: "bg-calm/10",
    borderColor: "border-calm/20",
    label: t.priorityLow,
  },
})

export function AssessmentReport({ report, onRestart, language }: AssessmentReportProps) {
  const t = getTranslation(language.code)

  const overallConfig = {
    positive: { color: "text-positive", label: t.statusPositive, emoji: "Great!" },
    neutral: { color: "text-sky-400", label: t.statusBalanced, emoji: "Good" },
    negative: { color: "text-concern", label: t.statusNeedsSupport, emoji: "Take care" },
  }

  const config = overallConfig[report.overallSentiment]

  const downloadReport = () => {
    const reportText = `
MENTAL HEALTH ASSESSMENT REPORT
================================

Overall Wellbeing: ${config.label}

Summary:
${report.summary}

${report.userAgreement !== "yes" ? `Note: The user ${report.userAgreement === "no" ? "disagreed" : "was uncertain about"} this assessment.` : ""}

${t.aiAnalysis.toUpperCase()}
-----------------
${report.categoryScores.map(c => `${c.category}: ${c.score}/10`).join("\n")}

${t.strengths.toUpperCase()}
---------
${report.strengths.map((s, i) => `${i + 1}. ${s}`).join("\n")}

${t.focusAreas.toUpperCase()}
-----------------
${report.focusAreas.map(area => `
${area.area} (${priorityConfig(t)[area.priority].label})
${area.description}

Recommendations:
${area.recommendations.map((r, i) => `  ${i + 1}. ${r}`).join("\n")}
`).join("\n")}

${report.encouragement}

---
This is not a medical diagnosis. Please consult a healthcare professional for personalized advice.
`

    const blob = new Blob([reportText], { type: "text/plain" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = "mental-health-assessment.txt"
    a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card className="border-wellness/20 bg-gradient-to-br from-wellness/5 to-calm/5 overflow-hidden">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-2xl">{t.brandName}</CardTitle>
              <CardDescription>
                {t.personalReport}
              </CardDescription>
            </div>
            <div className="text-right">
              <p className={cn("text-lg font-medium", config.color)}>
                {config.label}
              </p>
            </div>
          </div>
        </CardHeader>
        <CardContent className="grid md:grid-cols-2 gap-6">
          <div className="space-y-4">
            <p className="text-foreground leading-relaxed">
              {report.summary}
            </p>
            {report.userAgreement !== "yes" && (
              <div className="p-3 rounded-lg bg-warning/10 border border-warning/20">
                <p className="text-sm text-warning">
                  {report.userAgreement === "no"
                    ? "You indicated that you disagree with this assessment. We encourage you to discuss your feelings with a trusted person or professional."
                    : "You indicated uncertainty about this assessment. Remember, these tools are just a starting point for self-reflection."
                  }
                </p>
              </div>
            )}
          </div>

          {/* Radar Chart */}
          <div className="h-[300px] w-full relative">
            <ResponsiveContainer width="100%" height="100%">
              <RadarChart cx="50%" cy="50%" outerRadius="80%" data={report.categoryScores}>
                <PolarGrid stroke="#334155" />
                <PolarAngleAxis dataKey="category" tick={{ fill: '#94a3b8', fontSize: 12 }} />
                <PolarRadiusAxis angle={30} domain={[0, 10]} tick={false} axisLine={false} />
                <Radar
                  name={t.aiAnalysis}
                  dataKey="score"
                  stroke="#2dd4bf"
                  fill="#2dd4bf"
                  fillOpacity={0.3}
                />
                <Tooltip
                  contentStyle={{ backgroundColor: '#1e293b', borderColor: '#334155', color: '#f8fafc' }}
                  itemStyle={{ color: '#2dd4bf' }}
                />
              </RadarChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      {/* Strengths */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg text-positive flex items-center gap-2">
            <Sun className="h-5 w-5" />
            {t.strengths}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="space-y-2">
            {report.strengths.map((strength, i) => (
              <li key={i} className="flex items-start gap-3">
                <span className="h-2 w-2 rounded-full bg-positive mt-2 shrink-0" />
                <span className="text-foreground">{strength}</span>
              </li>
            ))}
          </ul>
        </CardContent>
      </Card>

      {/* Focus Areas */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Activity className="h-5 w-5 text-wellness" />
            {t.focusAreas}
          </CardTitle>
          <CardDescription>
            {t.personalReportDesc}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {report.focusAreas.map((area, i) => {
            const Icon = iconMap[area.icon] || Heart
            const pConfig = priorityConfig(t)[area.priority]

            return (
              <div
                key={i}
                className={cn(
                  "p-4 rounded-lg border",
                  pConfig.bgColor,
                  pConfig.borderColor
                )}
              >
                <div className="flex items-start gap-3">
                  <div className={cn("p-2 rounded-lg bg-background")}>
                    <Icon className={cn("h-5 w-5", pConfig.color)} />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-1">
                      <h4 className="font-medium text-foreground">{area.area}</h4>
                      <span className={cn("text-xs px-2 py-0.5 rounded-full", pConfig.bgColor, pConfig.color)}>
                        {pConfig.label}
                      </span>
                    </div>
                    <p className="text-sm text-muted-foreground mb-3">{area.description}</p>
                    <div className="space-y-1.5">
                      {area.recommendations.map((rec, j) => (
                        <div key={j} className="flex items-start gap-2 text-sm">
                          <span className="text-muted-foreground">{j + 1}.</span>
                          <span className="text-foreground">{rec}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            )
          })}
        </CardContent>
      </Card>

      {/* Encouragement */}
      <Card className="border-wellness/30 bg-wellness/5">
        <CardContent className="pt-6">
          <div className="flex items-start gap-4">
            <Heart className="h-8 w-8 text-wellness shrink-0" />
            <div>
              <p className="text-muted-foreground leading-relaxed font-medium">
                {report.encouragement}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Disclaimer */}
      <Card className="bg-muted/50">
        <CardContent className="pt-6">
          <p className="text-xs text-muted-foreground text-center">
            {t.disclaimer}
          </p>
        </CardContent>
      </Card>

      {/* Actions */}
      <div className="flex flex-col sm:flex-row gap-3">
        <Button
          onClick={downloadReport}
          variant="outline"
          className="flex-1 bg-transparent"
        >
          <Download className="h-4 w-4 mr-2" />
          {t.downloadReport}
        </Button>
        <Button
          onClick={onRestart}
          className="flex-1 bg-wellness hover:bg-wellness/90 text-white"
        >
          <RefreshCw className="h-4 w-4 mr-2" />
          {t.startOver}
        </Button>
      </div>
    </div>
  )
}
