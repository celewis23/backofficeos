import type { Metadata } from "next"

export const metadata: Metadata = { title: "Welcome to BackOfficeOS" }

export default function OnboardingLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-muted/20 to-background flex items-center justify-center p-4">
      {children}
    </div>
  )
}
