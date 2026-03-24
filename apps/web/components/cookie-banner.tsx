"use client"

import * as React from "react"
import { Button } from "@/components/ui/button"

const COOKIE_KEY = "archeionos-cookie-consent"

export function CookieBanner() {
  const [visible, setVisible] = React.useState(false)

  React.useEffect(() => {
    try {
      if (!localStorage.getItem(COOKIE_KEY)) setVisible(true)
    } catch {}
  }, [])

  function accept() {
    try { localStorage.setItem(COOKIE_KEY, "accepted") } catch {}
    setVisible(false)
  }

  if (!visible) return null

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 bg-background border-t border-border p-4">
      <div className="max-w-4xl mx-auto flex flex-col sm:flex-row items-start sm:items-center gap-4">
        <p className="text-sm text-muted-foreground flex-1">
          This site uses cookies to ensure basic functionality and improve your experience.
          By continuing to use this site, you agree to our use of cookies.
        </p>
        <div className="flex items-center gap-2 shrink-0">
          <Button size="sm" variant="outline" onClick={accept}>Decline</Button>
          <Button size="sm" onClick={accept}>Accept</Button>
        </div>
      </div>
    </div>
  )
}
