"use client"

import { useState, useCallback } from "react"
import useSWRMutation from "swr/mutation"
import { SUPPORTED_LANGUAGES, getQuestions, type Language } from "@/lib/languages"
import type { AssessmentReport, AssessmentResponse, SentimentResult } from "@/lib/types"

async function analyzeSentiment(url: string, { arg }: { arg: { response: string; question: string; language: string } }) {
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(arg),
  })
  return res.json()
}

async function generateReport(url: string, { arg }: { arg: { assessmentData: AssessmentResponse[]; userAgreement: string; language: string } }) {
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(arg),
  })
  return res.json()
}

export function useAssessment() {
  const [selectedLanguage, setSelectedLanguage] = useState<Language>(SUPPORTED_LANGUAGES[0])
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0)
  const [responses, setResponses] = useState<AssessmentResponse[]>([])
  const [phase, setPhase] = useState<"intro" | "questions" | "review" | "report">("intro")
  const [report, setReport] = useState<AssessmentReport | null>(null)

  const { trigger: triggerSentiment, isMutating: isAnalyzing } = useSWRMutation(
    "/api/analyze-sentiment",
    analyzeSentiment
  )

  const { trigger: triggerReport, isMutating: isGeneratingReport } = useSWRMutation(
    "/api/generate-report",
    generateReport
  )

  const questions = getQuestions(selectedLanguage.code)
  const currentQuestion = questions[currentQuestionIndex]
  const totalQuestions = questions.length
  const completedQuestions = responses.map(r => r.questionNumber - 1)

  const changeLanguage = useCallback((language: Language) => {
    setSelectedLanguage(language)
  }, [])

  const startAssessment = useCallback(() => {
    setPhase("questions")
  }, [])

  const submitResponse = useCallback(async (responseText: string) => {
    let sentiment = await triggerSentiment({
      response: responseText,
      question: currentQuestion,
      language: selectedLanguage.code,
    })

    if (!sentiment || !sentiment.sentiment) {
      sentiment = {
        sentiment: "neutral",
        score: 0.5,
        keywords: [],
        summary: "Analysis unavailable",
      }
    }

    const newResponse: AssessmentResponse = {
      questionNumber: currentQuestionIndex + 1,
      question: currentQuestion,
      response: responseText,
      sentiment,
    }

    setResponses(prev => [...prev, newResponse])

    if (currentQuestionIndex < totalQuestions - 1) {
      setCurrentQuestionIndex(prev => prev + 1)
    } else {
      setPhase("review")
    }
  }, [currentQuestionIndex, currentQuestion, totalQuestions, triggerSentiment, selectedLanguage.code])

  const submitAgreement = useCallback(async (agreement: "yes" | "no" | "maybe", modifiedResponses?: AssessmentResponse[]) => {
    // If we have modified responses, update the local state to match
    if (modifiedResponses) {
      setResponses(modifiedResponses)
    }

    const reportData = await triggerReport({
      assessmentData: modifiedResponses || responses,
      userAgreement: agreement,
      language: selectedLanguage.code,
    })
    setReport(reportData)
    setPhase("report")
  }, [responses, triggerReport, selectedLanguage.code])

  const restart = useCallback(() => {
    setCurrentQuestionIndex(0)
    setResponses([])
    setPhase("intro")
    setReport(null)
  }, [])

  const handleExternalCompleted = useCallback((externalResponses: AssessmentResponse[]) => {
    setResponses(externalResponses)
    setPhase("review")
  }, [])

  return {
    // State
    phase,
    currentQuestion,
    currentQuestionIndex,
    totalQuestions,
    completedQuestions,
    responses,
    report,
    selectedLanguage,

    // Loading states
    isAnalyzing,
    isGeneratingReport,

    // Actions
    startAssessment,
    submitResponse,
    submitAgreement,
    restart,
    changeLanguage,
    handleExternalCompleted,
  }
}
