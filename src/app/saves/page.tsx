"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { SaveSlot } from "@/components/saves/SaveSlot"
import { Button } from "@/components/ui/button"
import { ArrowLeft } from "lucide-react"
import type { SaveMeta } from "@/types"

export default function SavesPage() {
  const router = useRouter()
  const [saves, setSaves] = useState<SaveMeta[]>([])

  useEffect(() => {
    fetchSaves()
  }, [])

  async function fetchSaves() {
    try {
      const res = await fetch("/api/saves")
      const data = await res.json()
      setSaves(data.saves || [])
    } catch {
      // silent
    }
  }

  async function handleLoad(id: string) {
    router.push(`/?load=${id}`)
  }

  async function handleDelete(id: string) {
    try {
      await fetch(`/api/saves/${id}`, { method: "DELETE" })
      fetchSaves()
    } catch {
      // silent
    }
  }

  function handleNew() {
    router.push("/")
  }

  const slots = Array.from({ length: 10 }, (_, i) => {
    const slotNum = i + 1
    const save = saves.find((s) => s.slot === slotNum) || null
    return { slot: slotNum, save }
  })

  return (
    <div className="min-h-screen bg-transparent relative">
      <header className="border-b border-zinc-800 bg-zinc-950/95 px-4 py-3">
        <div className="max-w-4xl mx-auto flex items-center gap-3">
          <Button variant="ghost" size="icon" className="h-8 w-8 text-zinc-500" onClick={() => router.push("/")}>
            <ArrowLeft className="size-4" />
          </Button>
          <h1 className="text-sm font-medium text-zinc-300">存档管理</h1>
        </div>
      </header>
      <main className="max-w-4xl mx-auto px-4 py-8">
        <div className="grid gap-4 sm:grid-cols-2">
          {slots.map(({ slot, save }) => (
            <SaveSlot
              key={slot}
              slotNumber={slot}
              save={save}
              onLoad={handleLoad}
              onDelete={handleDelete}
              onNew={handleNew}
            />
          ))}
        </div>
      </main>
    </div>
  )
}