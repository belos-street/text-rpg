"use client"

import type { Choice } from "@/types"
import { Button } from "@/components/ui/button"

interface ChoicePanelProps {
  choices: Choice[]
  onChoice: (choiceId: string) => void
  disabled?: boolean
}

const VARIANT_MAP = ["default", "secondary", "outline", "ghost"] as const

export function ChoicePanel({ choices, onChoice, disabled }: ChoicePanelProps) {
  if (choices.length === 0) return null

  return (
    <div className="border-t border-zinc-800 bg-zinc-950/95 backdrop-blur supports-[backdrop-filter]:bg-zinc-950/80 px-4 py-3">
      <div className="max-w-3xl mx-auto">
        <p className="text-xs text-zinc-500 mb-2 font-medium uppercase tracking-wider">你的选择</p>
        <div className="flex flex-col gap-2">
          {choices.map((choice, i) => (
            <Button
              key={choice.id}
              variant={VARIANT_MAP[i % VARIANT_MAP.length]}
              className="justify-start h-auto py-3 px-4 text-sm text-left whitespace-normal break-words hover:shadow-[0_0_20px_rgba(94,106,210,0.15)]"
              onClick={() => onChoice(choice.id)}
              disabled={disabled}
            >
              <span className="text-muted-foreground font-mono text-xs mr-3 shrink-0">
                {String.fromCharCode(65 + i)}
              </span>
              <span className="min-w-0">{choice.text}</span>
            </Button>
          ))}
        </div>
      </div>
    </div>
  )
}