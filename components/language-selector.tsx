"use client"

import { useState } from "react"
import { Check, ChevronDown, Globe, Search } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { cn } from "@/lib/utils"
import { SUPPORTED_LANGUAGES, type Language } from "@/lib/languages"

interface LanguageSelectorProps {
  selectedLanguage: Language
  onSelectLanguage: (language: Language) => void
  label?: string
}

const languageGroups = [
  {
    name: "Indian Languages",
    languages: ["hi", "bn", "ta", "te", "mr", "gu", "kn", "ml", "pa", "or"],
  },
  {
    name: "European Languages",
    languages: ["en", "es", "fr", "de", "it", "pt", "ru"],
  },
  {
    name: "Asian Languages",
    languages: ["zh", "ja", "ko", "th", "vi", "id"],
  },
  {
    name: "Middle Eastern Languages",
    languages: ["ar", "tr"],
  },
]

export function LanguageSelector({ 
  selectedLanguage, 
  onSelectLanguage,
  label 
}: LanguageSelectorProps) {
  const [open, setOpen] = useState(false)

  const getLanguagesForGroup = (codes: string[]) => {
    return SUPPORTED_LANGUAGES.filter(lang => codes.includes(lang.code))
  }

  return (
    <div className="flex flex-col gap-2">
      {label && (
        <label className="text-sm font-medium text-muted-foreground flex items-center gap-2">
          <Globe className="h-4 w-4" />
          {label}
        </label>
      )}
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            role="combobox"
            aria-expanded={open}
            className="w-full justify-between bg-card border-border hover:bg-muted/50"
          >
            <span className="flex items-center gap-2">
              <span className="text-lg">{getFlagEmoji(selectedLanguage.flag)}</span>
              <span>{selectedLanguage.nativeName}</span>
              <span className="text-muted-foreground">({selectedLanguage.name})</span>
            </span>
            <ChevronDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-[340px] p-0" align="start">
          <Command>
            <CommandInput placeholder="Search language..." />
            <CommandList className="max-h-[400px]">
              <CommandEmpty>No language found.</CommandEmpty>
              {languageGroups.map((group) => (
                <CommandGroup key={group.name} heading={group.name}>
                  {getLanguagesForGroup(group.languages).map((language) => (
                    <CommandItem
                      key={language.code}
                      value={`${language.name} ${language.nativeName}`}
                      onSelect={() => {
                        onSelectLanguage(language)
                        setOpen(false)
                      }}
                      className="cursor-pointer"
                    >
                      <Check
                        className={cn(
                          "mr-2 h-4 w-4",
                          selectedLanguage.code === language.code
                            ? "opacity-100"
                            : "opacity-0"
                        )}
                      />
                      <span className="text-lg mr-2">{getFlagEmoji(language.flag)}</span>
                      <span className="font-medium">{language.nativeName}</span>
                      <span className="ml-2 text-muted-foreground text-sm">
                        {language.name}
                      </span>
                    </CommandItem>
                  ))}
                </CommandGroup>
              ))}
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>
    </div>
  )
}

// Convert country code to flag emoji
function getFlagEmoji(countryCode: string): string {
  const codePoints = countryCode
    .toUpperCase()
    .split("")
    .map((char) => 127397 + char.charCodeAt(0))
  return String.fromCodePoint(...codePoints)
}
