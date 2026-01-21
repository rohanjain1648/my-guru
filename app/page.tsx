"use client"

import { useAssessment } from "@/hooks/use-assessment"
import { IntroSection } from "@/components/intro-section"
import { QuestionSection } from "@/components/question-section"
import { ConfirmationDialog } from "@/components/confirmation-dialog"
import { AssessmentReport } from "@/components/assessment-report"
import { Loader2 } from "lucide-react"
import { getTranslation } from "@/lib/languages"
import { LiveAssessmentContainer } from "@/components/live-assessment/container"

export default function Home() {
  const {
    phase,
    currentQuestion,
    currentQuestionIndex,
    totalQuestions,
    completedQuestions,
    responses,
    report,
    isAnalyzing,
    isGeneratingReport,
    startAssessment,
    submitResponse,
    submitAgreement,
    restart,
    selectedLanguage,
    changeLanguage,
    handleExternalCompleted,
  } = useAssessment()

  const t = getTranslation(selectedLanguage.code)

  return (
    <main className="min-h-screen bg-background">
      {/* Subtle gradient background */}
      <div className="fixed inset-0 bg-gradient-to-b from-wellness/5 via-transparent to-calm/5 pointer-events-none" />

      <div className="relative z-10">
        {phase === "intro" && (
          <IntroSection
            onStart={startAssessment}
            selectedLanguage={selectedLanguage}
            onLanguageChange={changeLanguage}
          />
        )}

        {phase === "questions" && (
          <div className="fixed inset-0 z-50 bg-background">
            <LiveAssessmentContainer
              onComplete={(reportData: any) => {
                handleExternalCompleted(reportData)
              }}


              onExit={restart}
              language={selectedLanguage}
            />
          </div>
        )}

        {phase === "review" && (
          <div className="min-h-screen flex items-center justify-center px-4 py-8">
            <div className="w-full max-w-2xl mx-auto">
              <ConfirmationDialog
                sentimentResults={responses.map(r => ({
                  questionNumber: r.questionNumber,
                  question: r.question,
                  response: r.response,
                  sentiment: r.sentiment,
                }))}
                onConfirm={submitAgreement}
                language={selectedLanguage}
              />
            </div>
          </div>
        )}

        {phase === "report" && report && (
          <div className="min-h-screen px-4 py-8">
            <div className="w-full max-w-2xl mx-auto">
              <AssessmentReport
                report={report}
                onRestart={restart}
                language={selectedLanguage}
              />
            </div>
          </div>
        )}

        {/* Loading overlay for report generation */}
        {isGeneratingReport && (
          <div className="fixed inset-0 bg-background/80 backdrop-blur-sm flex items-center justify-center z-50">
            <div className="text-center space-y-4">
              <Loader2 className="h-12 w-12 animate-spin text-wellness mx-auto" />
              <p className="text-lg font-medium text-foreground">{t.generatingReport}</p>
              <p className="text-sm text-muted-foreground">{t.generatingReportDesc}</p>
            </div>
          </div>
        )}
      </div>
    </main>
  )
}
