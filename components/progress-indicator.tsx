"use client"

import { cn } from "@/lib/utils"

interface ProgressIndicatorProps {
  current: number
  total: number
  completedQuestions: number[]
}

export function ProgressIndicator({ current, total, completedQuestions }: ProgressIndicatorProps) {
  return (
    <div className="w-full max-w-md mx-auto">
      <div className="flex items-center justify-between mb-2">
        <span className="text-sm font-medium text-foreground">
          Progress
        </span>
        <span className="text-sm text-muted-foreground">
          {completedQuestions.length} of {total} completed
        </span>
      </div>
      <div className="flex gap-1.5">
        {Array.from({ length: total }, (_, i) => (
          <div
            key={i}
            className={cn(
              "h-2 flex-1 rounded-full transition-all duration-300",
              completedQuestions.includes(i)
                ? "bg-wellness"
                : i === current
                  ? "bg-wellness/50"
                  : "bg-muted"
            )}
          />
        ))}
      </div>
    </div>
  )
}
