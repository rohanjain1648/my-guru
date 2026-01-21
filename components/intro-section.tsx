"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Mic, Brain, Shield, Heart } from "lucide-react"
import { LanguageSelector } from "@/components/language-selector"
import { getTranslation, type Language } from "@/lib/languages"

interface IntroSectionProps {
  onStart: () => void
  selectedLanguage: Language
  onLanguageChange: (language: Language) => void
}

export function IntroSection({ onStart, selectedLanguage, onLanguageChange }: IntroSectionProps) {
  const t = getTranslation(selectedLanguage.code)

  return (
    <div className="flex flex-col items-center justify-center min-h-[80vh] px-4">
      <div className="max-w-2xl mx-auto text-center space-y-8">
        {/* Logo / Brand */}
        <div className="flex items-center justify-center gap-3 mb-4">
          <div className="p-3 rounded-2xl bg-wellness/10">
            <Brain className="h-10 w-10 text-wellness" />
          </div>
        </div>
        
        <div>
          <h1 className="text-4xl font-bold text-foreground mb-4 text-balance">
            {t.brandName}
          </h1>
          <p className="text-xl text-muted-foreground text-balance">
            {t.tagline}
          </p>
        </div>

        {/* Language Selection */}
        <div className="max-w-sm mx-auto">
          <LanguageSelector
            selectedLanguage={selectedLanguage}
            onSelectLanguage={onLanguageChange}
            label={t.selectLanguage}
          />
        </div>

        <Card className="bg-card/80 backdrop-blur-sm border-wellness/20">
          <CardHeader>
            <CardTitle>{t.howItWorks}</CardTitle>
            <CardDescription>
              {t.howItWorksDesc}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-3 gap-6">
              <div className="flex flex-col items-center text-center p-4">
                <div className="h-12 w-12 rounded-full bg-wellness/10 flex items-center justify-center mb-3">
                  <Mic className="h-6 w-6 text-wellness" />
                </div>
                <h3 className="font-medium mb-1">{t.speakNaturally}</h3>
                <p className="text-sm text-muted-foreground">
                  {t.speakNaturallyDesc}
                </p>
              </div>
              <div className="flex flex-col items-center text-center p-4">
                <div className="h-12 w-12 rounded-full bg-calm/10 flex items-center justify-center mb-3">
                  <Brain className="h-6 w-6 text-calm" />
                </div>
                <h3 className="font-medium mb-1">{t.aiAnalysis}</h3>
                <p className="text-sm text-muted-foreground">
                  {t.aiAnalysisDesc}
                </p>
              </div>
              <div className="flex flex-col items-center text-center p-4">
                <div className="h-12 w-12 rounded-full bg-positive/10 flex items-center justify-center mb-3">
                  <Heart className="h-6 w-6 text-positive" />
                </div>
                <h3 className="font-medium mb-1">{t.personalReport}</h3>
                <p className="text-sm text-muted-foreground">
                  {t.personalReportDesc}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="space-y-4">
          <Button 
            size="lg" 
            onClick={onStart}
            className="bg-wellness hover:bg-wellness/90 text-white px-8"
          >
            <Mic className="h-5 w-5 mr-2" />
            {t.beginAssessment}
          </Button>
          
          <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
            <Shield className="h-4 w-4" />
            <span>{t.privateDisclaimer}</span>
          </div>
        </div>

        <p className="text-xs text-muted-foreground max-w-md mx-auto">
          {t.disclaimer}
        </p>
      </div>
    </div>
  )
}
