"use client"

import * as React from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Send } from "lucide-react"

export function PortalMessageForm({ token }: { token: string }) {
  const [subject, setSubject] = React.useState("")
  const [body, setBody] = React.useState("")
  const [sending, setSending] = React.useState(false)
  const [sent, setSent] = React.useState(false)
  const [error, setError] = React.useState("")

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!body.trim()) return
    setSending(true)
    setError("")
    try {
      const res = await fetch("/api/portal/message", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, subject, body }),
      })
      const data = await res.json()
      if (data.success) {
        setSent(true)
        setSubject("")
        setBody("")
      } else {
        setError(data.error ?? "Failed to send message")
      }
    } catch {
      setError("Failed to send message")
    } finally {
      setSending(false)
    }
  }

  if (sent) {
    return (
      <div className="rounded-xl border border-green-200 bg-green-50 dark:bg-green-900/20 dark:border-green-800 p-5 text-center">
        <p className="text-sm font-medium text-green-700 dark:text-green-400">Message sent successfully!</p>
        <p className="text-xs text-muted-foreground mt-1">Your team will respond soon.</p>
        <Button variant="outline" size="sm" className="mt-3" onClick={() => setSent(false)}>
          Send another
        </Button>
      </div>
    )
  }

  return (
    <div className="rounded-xl border border-border p-5">
      <h2 className="text-sm font-semibold mb-4">Send a message</h2>
      <form onSubmit={handleSubmit} className="space-y-3">
        <div className="space-y-1.5">
          <Label className="text-xs">Subject <span className="text-muted-foreground">(optional)</span></Label>
          <Input
            placeholder="What is this about?"
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
            className="h-8 text-sm"
          />
        </div>
        <div className="space-y-1.5">
          <Label className="text-xs">Message</Label>
          <textarea
            className="w-full text-sm rounded-md border border-input bg-background px-3 py-2 min-h-24 resize-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            placeholder="Type your message here..."
            value={body}
            onChange={(e) => setBody(e.target.value)}
            required
          />
        </div>
        {error && <p className="text-xs text-destructive">{error}</p>}
        <div className="flex justify-end">
          <Button type="submit" size="sm" disabled={sending || !body.trim()} className="gap-1.5">
            <Send className="size-3.5" />
            {sending ? "Sending..." : "Send message"}
          </Button>
        </div>
      </form>
    </div>
  )
}
