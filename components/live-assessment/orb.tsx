"use client"

import { useEffect, useRef } from "react"
import { motion, useAnimation } from "framer-motion"
import { cn } from "@/lib/utils"

interface GlowingOrbProps {
    status: "idle" | "listening" | "processing" | "speaking"
    audioLevel: number // 0 to 1
    statusLabel?: string
}

export function GlowingOrb({ status, audioLevel, statusLabel }: GlowingOrbProps) {
    // Base size of the orb
    const BASE_SIZE = 200

    // Create multiple rings for the glow effect
    // Status colors
    const colors = {
        idle: "bg-blue-400",
        listening: "bg-green-400",
        processing: "bg-purple-400",
        speaking: "bg-cyan-400"
    }

    const currentColor = colors[status] || colors.idle

    return (
        <div className="relative flex items-center justify-center w-full h-full min-h-[400px]">
            {/* Core Orb */}
            <motion.div
                className={cn("relative z-10 rounded-full blur-md", currentColor)}
                animate={{
                    scale: 1 + audioLevel * 0.5,
                    opacity: 0.8 + audioLevel * 0.2,
                }}
                transition={{ type: "spring", stiffness: 300, damping: 20 }}
                style={{
                    width: BASE_SIZE,
                    height: BASE_SIZE,
                    boxShadow: `0 0 ${40 + audioLevel * 100}px ${currentColor.replace("bg-", "var(--")}`
                    // Note: simple box shadow doesn't take class names, this is approximate.
                    // Better to use opacity layers.
                }}
            >
                <div className={cn("absolute inset-0 rounded-full opacity-50 blur-xl", currentColor)} />
            </motion.div>

            {/* Pulsing Rings */}
            {[1, 2, 3].map((i) => (
                <motion.div
                    key={i}
                    className={cn("absolute rounded-full opacity-20", currentColor)}
                    animate={{
                        scale: [1, 1.5 + (audioLevel * i)],
                        opacity: [0.3, 0]
                    }}
                    transition={{
                        duration: 2,
                        repeat: Infinity,
                        delay: i * 0.4,
                        ease: "easeOut"
                    }}
                    style={{
                        width: BASE_SIZE,
                        height: BASE_SIZE,
                    }}
                />
            ))}

            {/* Status Text (Optional, below orb) */}
            <div className="absolute bottom-10 font-medium text-lg uppercase tracking-widest opacity-60">
                {statusLabel || status}
            </div>
        </div>
    )
}
