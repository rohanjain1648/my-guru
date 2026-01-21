import { generateObject } from "ai"
import { z } from "zod"
import { google } from "@ai-sdk/google"
import { createOpenAI } from "@ai-sdk/openai"

export const maxDuration = 30

const sentimentSchema = z.object({
  sentiment: z.enum(["positive", "neutral", "negative"]),
  score: z.number().min(0).max(1),
  keywords: z.array(z.string()).describe("Key emotional words or phrases identified"),
  summary: z.string().describe("Brief summary of the emotional content"),
})

// Language name mapping for prompts
const languageNames: Record<string, string> = {
  en: "English",
  // ... (keep existing mappings if possible, but for brevity I assume they are in scope or I should copy them?)
  // Actually I should re-include them if I am replacing the block
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

export async function POST(req: Request) {
  try {
    const { response, question, language = "en" } = await req.json()

    if (!response) {
      return Response.json({ error: "No response provided" }, { status: 400 })
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

    const { object } = await generateObject({
      model: model,
      schema: sentimentSchema,
      prompt: `You are a multilingual mental health sentiment analyzer. Analyze the following response to a mental health assessment question.

The user is communicating in ${languageName}. Understand and analyze their response in that language.

Question: ${question}

Response: "${response}"

Analyze the emotional sentiment of this response. Consider:
- Overall emotional tone (positive, neutral, or negative) - MUST BE IN ENGLISH
- Confidence score (0-1) where 1 is very confident about the sentiment
- Key emotional keywords or phrases (identify them in the original language)
- A brief summary of the emotional state expressed (provide in ${languageName})

CRITICAL: The value for 'sentiment' field MUST be 'positive', 'neutral', or 'negative'. Do not translate this value.

Be compassionate and understanding in your analysis. Look for both explicit and implicit emotional cues. Consider cultural context when interpreting emotional expressions.`,
    })

    return Response.json(object)
  } catch (error) {
    console.error("[v0] Sentiment analysis error:", error)
    return Response.json({ error: "Failed to analyze sentiment" }, { status: 500 })
  }
}
