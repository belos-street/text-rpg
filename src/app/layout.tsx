import type { Metadata } from "next"
import "./globals.css"

export const metadata: Metadata = {
  title: "异世界后宫物语 - AI文字RPG",
  description: "AI驱动的异世界文字冒险游戏",
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="zh-CN">
      <body className="min-h-screen bg-zinc-950 text-zinc-100 antialiased">
        {children}
      </body>
    </html>
  )
}