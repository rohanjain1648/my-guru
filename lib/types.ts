export interface FocusArea {
    area: string
    description: string
    priority: "high" | "medium" | "low"
    recommendations: string[]
    icon: string
}

export interface CategoryScore {
    category: string
    score: number
    fullMark: number
}

export interface AssessmentReport {
    overallSentiment: "positive" | "neutral" | "negative"
    // overallScore removed
    summary: string
    categoryScores: CategoryScore[]
    focusAreas: FocusArea[]
    strengths: string[]
    encouragement: string
    userAgreement: "yes" | "no" | "maybe"
}

export interface SentimentResult {
    sentiment: "positive" | "neutral" | "negative"
    score: number
    keywords: string[]
    summary: string
}

export interface AssessmentResponse {
    questionNumber: number
    question: string
    response: string
    sentiment: SentimentResult
}
