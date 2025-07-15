import type { Metadata } from "next"
import { Inter_Tight } from "next/font/google"
import "./globals.css"
import { AuthProvider } from "@/lib/auth-context"

const interTight = Inter_Tight({
  subsets: ["latin"],
  variable: "--font-inter-tight",
})

export const metadata: Metadata = {
  title: "Elite Speaks",
  description: "English Communication Solutions",
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" className="scroll-smooth">
      <body className={`${interTight.variable} antialiased`}>
        <AuthProvider>
          {children}
        </AuthProvider>
      </body>
    </html>
  )
}