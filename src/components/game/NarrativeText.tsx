"use client"

interface Segment {
  type: "narration" | "dialogue" | "thought" | "emphasis" | "action" | "character_dialogue"
  text: string
  full: string
  characterName?: string
}

function parseNarrative(text: string): Segment[] {
  const segments: Segment[] = []
  let remaining = text

  const patterns: { regex: RegExp; type: Segment["type"] }[] = [
    { regex: /【([^】]+)】「([^」]*)」/g, type: "character_dialogue" },
    { regex: /「([^」]*)」/g, type: "dialogue" },
    { regex: /『([^』]*)』/g, type: "thought" },
    { regex: /【([^】]+)】/g, type: "emphasis" },
    { regex: /（([^）]*)）/g, type: "action" },
  ]

  while (remaining.length > 0) {
    let earliestIndex = remaining.length
    let earliestMatch: RegExpExecArray | null = null
    let earliestType: Segment["type"] = "narration"
    let earliestLen = 0
    let earliestCharName: string | undefined

    for (const { regex, type } of patterns) {
      regex.lastIndex = 0
      const match = regex.exec(remaining)
      if (match && match.index < earliestIndex) {
        earliestIndex = match.index
        earliestMatch = match
        earliestType = type
        earliestLen = match[0].length
        if (type === "character_dialogue") {
          earliestCharName = match[1]
        }
      }
    }

    if (earliestMatch) {
      if (earliestIndex > 0) {
        segments.push({
          type: "narration",
          text: remaining.slice(0, earliestIndex),
          full: remaining.slice(0, earliestIndex),
        })
      }

      if (earliestType === "character_dialogue") {
        segments.push({
          type: "character_dialogue",
          text: earliestMatch[2],
          full: earliestMatch[0],
          characterName: earliestCharName,
        })
      } else {
        segments.push({
          type: earliestType,
          text: earliestMatch[1],
          full: earliestMatch[0],
        })
      }

      remaining = remaining.slice(earliestIndex + earliestLen)
    } else {
      segments.push({ type: "narration", text: remaining, full: remaining })
      remaining = ""
    }
  }

  return segments
}

const styleMap: Record<Segment["type"], string> = {
  narration: "text-zinc-100",
  dialogue: "text-amber-200",
  thought: "text-zinc-400 italic",
  emphasis: "text-cyan-300 font-medium",
  action: "text-zinc-400 italic text-sm",
  character_dialogue: "text-amber-200",
}

interface NarrativeTextProps {
  text: string
  characterEmoji?: Record<string, string>
}

export function NarrativeText({ text, characterEmoji = {} }: NarrativeTextProps) {
  const segments = parseNarrative(text)

  function getCharacterEmoji(name: string): string {
    return characterEmoji[name] || "👤"
  }

  return (
    <span className="whitespace-pre-wrap text-sm leading-relaxed">
      {segments.map((seg, i) => {
        if (seg.type === "character_dialogue") {
          const emoji = getCharacterEmoji(seg.characterName || "")
          return (
            <span key={i} className="inline-flex items-start gap-1.5 my-0.5">
              <span className="shrink-0 text-base leading-relaxed" title={seg.characterName}>
                {emoji}
              </span>
              <span className="text-amber-200">「{seg.text}」</span>
            </span>
          )
        }
        return (
          <span key={i} className={styleMap[seg.type]}>
            {seg.full}
          </span>
        )
      })}
    </span>
  )
}
