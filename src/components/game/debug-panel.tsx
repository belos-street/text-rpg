"use client"

import { useState } from "react"

/**
 * D4 调试面板（最小版）：URL 带 ?debug=1 时显示，
 * 每回合展示服务端诊断数据（请求提示词预览/原始输出/解析结果）。
 */
export function DebugPanel({ data }: { data: Record<string, unknown> | null }) {
  const [open, setOpen] = useState(false)

  if (!data) return null

  return (
    <div className="fixed bottom-4 right-4 z-50 print:hidden">
      <button
        onClick={() => setOpen((prev) => !prev)}
        className="rounded-full border border-zinc-700 bg-zinc-900/90 px-3 py-1.5 text-xs text-zinc-400 shadow-[0_2px_8px_rgba(0,0,0,0.4)] transition-colors hover:text-zinc-200"
      >
        {open ? "收起调试" : "🐞 调试面板"}
      </button>
      {open && (
        <pre className="absolute bottom-11 right-0 max-h-[70vh] w-[520px] overflow-auto whitespace-pre-wrap break-all rounded-xl border border-zinc-700 bg-zinc-950/95 p-3 text-xs leading-relaxed text-zinc-300 shadow-[0_4px_16px_rgba(0,0,0,0.5)]">
          {JSON.stringify(data, null, 2)}
        </pre>
      )}
    </div>
  )
}
