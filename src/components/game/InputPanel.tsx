"use client"

import type React from "react"

import { useState, useRef } from "react"
import { Send, Square } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"

interface InputPanelProps {
  onSend: (message: string) => void
  onStop: () => void
  isStreaming: boolean
  disabled?: boolean
  placeholder?: string
}

export function InputPanel({ onSend, onStop, isStreaming, disabled, placeholder }: InputPanelProps) {
  const [input, setInput] = useState("")
  const inputRef = useRef<HTMLInputElement>(null)

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (input.trim() && !isStreaming) {
      onSend(input.trim())
      setInput("")
    }
  }

  return (
    <div className="border-t border-zinc-800 bg-zinc-950/95 backdrop-blur supports-[backdrop-filter]:bg-zinc-950/80 px-4 py-3">
      <form onSubmit={handleSubmit} className="max-w-3xl mx-auto flex gap-2">
        <Input
          ref={inputRef}
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder={placeholder || "输入你的行动……也可以自由输入任何内容"}
          disabled={disabled || isStreaming}
          className="flex-1 h-10 border-zinc-700 bg-zinc-900/50 text-zinc-100 placeholder:text-zinc-500 focus-visible:ring-primary/50 focus-visible:border-primary/50"
        />
        {isStreaming ? (
          <Button
            type="button"
            variant="destructive"
            size="icon"
            onClick={onStop}
            className="shrink-0"
          >
            <Square className="size-4 fill-current" />
          </Button>
        ) : (
          <Button
            type="submit"
            variant="default"
            size="icon"
            disabled={!input.trim() || disabled}
            className="shrink-0"
          >
            <Send className="size-4" />
          </Button>
        )}
      </form>
    </div>
  )
}