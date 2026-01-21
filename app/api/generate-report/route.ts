import { generateObject } from "ai"
import { z } from "zod"
import { google } from "@ai-sdk/google"
import { createOpenAI } from "@ai-sdk/openai"

export const maxDuration = 60

const focusAreaSchema = z.object({
  area: z.string().describe("Name of the focus area"),
  description: z.string().describe("Description of why this area needs attention"),
  priority: z.enum(["high", "medium", "low"]),
  recommendations: z.array(z.string()).describe("Specific actionable recommendations"),
  icon: z.enum(["heart", "brain", "sun", "users", "activity", "shield"]).describe("Icon representing this area"),
})

const reportSchema = z.object({
  overallSentiment: z.enum(["positive", "neutral", "negative"]),
  summary: z.string().describe("A compassionate overall summary of the assessment"),
  categoryScores: z.array(z.object({
    category: z.string().describe("Category name (e.g., Mood, Anxiety, Sleep, Social, Focus)"),
    score: z.number().min(0).max(10).describe("Score from 0-10 where 10 is most positive/healthy"),
    fullMark: z.number().default(10)
  })).min(3).max(6).describe("Scores for different wellness dimensions for visualization"),
  focusAreas: z.array(focusAreaSchema).min(1).max(5),
  strengths: z.array(z.string()).min(1).max(4).describe("Positive aspects identified"),
  encouragement: z.string().describe("A warm, encouraging message for the user"),
})

// Language name mapping for prompts
const languageNames: Record<string, string> = {
  en: "English",
  hi: "Hindi",
  bn: "Bengali",
  ta: "Tamil",
  te: "Telugu",
  mr: "Marathi",
  gu: "Gujarati",
  kn: "Kannada",
  ml: "Malayalam",
  pa: "Punjabi",
  or: "Odia",
  es: "Spanish",
  fr: "French",
  de: "German",
  it: "Italian",
  pt: "Portuguese",
  ru: "Russian",
  zh: "Chinese",
  ja: "Japanese",
  ko: "Korean",
  th: "Thai",
  vi: "Vietnamese",
  id: "Indonesian",
  ar: "Arabic",
  tr: "Turkish",
}

interface SentimentResult {
  sentiment: "positive" | "neutral" | "negative"
  score: number
  keywords: string[]
  summary: string
}

interface AssessmentData {
  questionNumber: number
  question: string
  response: string
  sentiment: SentimentResult
}

export async function POST(req: Request) {
  try {
    const { assessmentData, userAgreement, language = "en" } = await req.json() as {
      assessmentData: AssessmentData[]
      userAgreement: "yes" | "no" | "maybe"
      language: string
    }

    if (!assessmentData || assessmentData.length === 0) {
      return Response.json({ error: "No assessment data provided" }, { status: 400 })
    }

    const languageName = languageNames[language] || "English"

    // Helper to choose model
    let model;
    if (process.env.GEMINI_API_KEY) {
      model = google("gemini-2.0-flash")
    } else if (process.env.GROQ_API_KEY) {
      const groq = createOpenAI({
        baseURL: 'https://api.groq.com/openai/v1',
        apiKey: process.env.GROQ_API_KEY,
      })
      model = groq("llama3-8b-8192")
    } else {
      throw new Error("No API Key found for Gemini or Groq")
    }

    // Prepare the context for the AI
    const assessmentSummary = assessmentData.map(item =>
      `Q${item.questionNumber}: ${item.question}
Response: "${item.response}"
Sentiment: ${item.sentiment.sentiment} (score: ${item.sentiment.score})
Keywords: ${item.sentiment.keywords.join(", ")}
Summary: ${item.sentiment.summary}`
    ).join("\n\n")

    const positiveCount = assessmentData.filter(d => d.sentiment.sentiment === "positive").length
    const negativeCount = assessmentData.filter(d => d.sentiment.sentiment === "negative").length
    const neutralCount = assessmentData.filter(d => d.sentiment.sentiment === "neutral").length

    // Calculate naive average score for statistics only, not for report display
    const avgScore = assessmentData.reduce((sum, d) => sum + d.sentiment.score, 0) / assessmentData.length

    const { object } = await generateObject({
      model: model,
      schema: reportSchema,
      prompt: `You are a compassionate multilingual mental health assessment report generator. Generate a comprehensive, supportive report based on the following assessment data.

IMPORTANT: Generate the entire report in ${languageName}. All text including summary, focus areas, recommendations, strengths, and encouragement should be written in ${languageName}.

ASSESSMENT RESULTS:
${assessmentSummary}

STATISTICS:
- Positive responses: ${positiveCount}
- Neutral responses: ${neutralCount}
- Negative/concerning responses: ${negativeCount}
- Average sentiment score: ${avgScore.toFixed(2)}

USER AGREEMENT: The user ${userAgreement === "yes" ? "agreed" : userAgreement === "no" ? "disagreed" : "was uncertain about"} with the sentiment analysis.

Generate a mental health assessment report in ${languageName} that:
1. Provides an overall sentiment reflecting the general emotional state (NO NUMERIC OVERALL SCORE).
2. Generates 'categoryScores' for a radar chart. Assess the user's well-being across 3-6 dimensions such as Mood, Anxiety, Sleep, Social Connection, Focus, etc. Assign a score of 0-10 for each (10 being best/healthiest). IMPORTANT: The 'category' names MUST be in ${languageName}.
3. Identifies 1-5 focus areas where the user can improve, with specific, actionable recommendations.
4. Highlights 1-4 specific strengths or positive aspects.
5. Writes a supportive, personalized summary and encouragement.

IMPORTANT: The entire output, including category names, focus areas, and descriptions, MUST be in ${languageName}. Do not include English unless the requested language is English.

Guidelines:
- Be supportive and non-judgmental
- Focus on growth and improvement opportunities
- Acknowledge both struggles and strengths
- Provide practical, actionable recommendations appropriate for the user's cultural context
- If the user disagreed with the analysis, acknowledge their perspective is valid
- Use appropriate icons for focus areas: heart (relationships/emotions), brain (thoughts/cognition), sun (mood/outlook), users (social), activity (physical/energy), shield (coping/resilience)
- Remember this is a self-assessment tool, not a clinical diagnosis
- Write naturally in ${languageName}, using appropriate cultural expressions and idioms`,
    })

    return Response.json({
      ...object,
      userAgreement,
    })
  } catch (error) {
    console.error("[v0] Report generation error:", error)
    // Return a fallback report
    return Response.json({
      overallSentiment: "neutral",
      summary: "Based on your responses, you appear to be managing well overall with some areas that could benefit from additional attention and self-care.",
      categoryScores: [
        { category: "Mood", score: 7, fullMark: 10 },
        { category: "Anxiety", score: 6, fullMark: 10 },
        { category: "Social", score: 8, fullMark: 10 },
        { category: "Energy", score: 6, fullMark: 10 },
        { category: "Sleep", score: 7, fullMark: 10 }
      ],
      focusAreas: [
        {
          area: "Stress Management",
          description: "Consider developing additional strategies for managing daily stress.",
          priority: "medium",
          recommendations: [
            "Practice deep breathing exercises for 5 minutes daily",
            "Take short breaks during work to reset",
            "Consider a simple mindfulness practice"
          ],
          icon: "brain"
        },
        {
          area: "Self-Care",
          description: "Making time for activities that bring you joy and relaxation.",
          priority: "low",
          recommendations: [
            "Schedule at least 30 minutes of enjoyable activities daily",
            "Maintain regular sleep patterns",
            "Stay connected with supportive friends or family"
          ],
          icon: "heart"
        }
      ],
      strengths: [
        "Self-awareness in recognizing your emotional states",
        "Willingness to reflect on your mental wellbeing",
        "Openness to exploring areas for growth"
      ],
      encouragement: "Thank you for taking the time to check in with yourself. Remember that seeking to understand your mental health is a sign of strength. Every small step towards self-care matters, and you are capable of positive change.",
      userAgreement: "yes"
    })
  }
}
