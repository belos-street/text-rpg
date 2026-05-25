import type { Metadata } from "next"
import { loadStoryConfig } from "@/lib/game-data"
import "./globals.css"

const config = loadStoryConfig()

export const metadata: Metadata = {
  title: `${config.title} - AI文字RPG`,
  description: config.subtitle || "AI驱动的文字冒险游戏",
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="zh-CN">
      <body className="min-h-screen bg-transparent text-zinc-100 antialiased">
        {children}
      </body>
    </html>
  )
}