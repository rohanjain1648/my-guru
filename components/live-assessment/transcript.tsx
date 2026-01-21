"use client"

import { useEffect, useRef } from "react"
import { cn } from "@/lib/utils"
import { type Message } from "@/hooks/use-seamless-assessment"
import { Bot, User } from "lucide-react"

interface TranscriptProps {
    messages: Message[]
}

export function Transcript({ messages }: TranscriptProps) {
    const scrollRef = useRef<HTMLDivElement>(null)

    // Auto-scroll to bottom
    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight
        }
    }, [messages])

    return (
        <div className="h-full flex flex-col bg-black/5 rounded-2xl p-6 overflow-hidden border border-white/10">
            <div className="flex-1 overflow-y-auto space-y-6 pr-4 custom-scrollbar" ref={scrollRef}>
                {messages.length === 0 && (
                    <div className="h-full flex items-center justify-center text-muted-foreground italic">
                        Conversation will appear here...
                    </div>
                )}

                {messages.map((msg) => (
                    <div
                        key={msg.id}
                        className={cn(
                            "flex w-full gap-4",
                            msg.role === "user" ? "flex-row-reverse" : "flex-row"
                        )}
                    >
                        {/* Avatar */}
                        <div className={cn(
                            "flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center",
                            msg.role === "user" ? "bg-blue-500" : "bg-purple-500"
                        )}>
                            {msg.role === "user" ? <User size={16} className="text-white" /> : <Bot size={16} className="text-white" />}
                        </div>

                        {/* Bubble */}
                        <div
                            className={cn(
                                "max-w-[80%] rounded-2xl px-5 py-3 text-sm leading-relaxed",
                                msg.role === "user"
                                    ? "bg-blue-500 text-white rounded-tr-none"
                                    : "bg-white/10 text-foreground rounded-tl-none border border-white/5"
                            )}
                        >
                            {msg.content}
                        </div>
                    </div>
                ))}
            </div>
        </div>
    )
}
