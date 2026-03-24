"use client"

import * as React from "react"
import { useChat } from "ai/react"
import {
  Sparkles, X, Send, Loader2, User, Bot,
  ChevronDown, Plus, Trash2,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { useUIStore } from "@/lib/stores/ui-store"
import { cn } from "@/lib/utils"
import { motion, AnimatePresence } from "framer-motion"

export function AIPanel() {
  const { aiPanelOpen, setAIPanelOpen, pageContext } = useUIStore()
  const inputRef = React.useRef<HTMLTextAreaElement>(null)

  const { messages, input, handleInputChange, handleSubmit, isLoading, setMessages } = useChat({
    api: "/api/ai/chat",
    body: { context: pageContext },
    onError: (err) => {
      console.error("AI error:", err)
    },
  })

  React.useEffect(() => {
    if (aiPanelOpen && inputRef.current) {
      setTimeout(() => inputRef.current?.focus(), 100)
    }
  }, [aiPanelOpen])

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      if (input.trim() && !isLoading) {
        handleSubmit(e as any)
      }
    }
  }

  const SUGGESTIONS = [
    "What's my outstanding revenue?",
    "Show me overdue invoices",
    "What projects are active?",
    "Any meetings today?",
  ]

  return (
    <AnimatePresence>
      {aiPanelOpen && (
        <motion.div
          initial={{ width: 0, opacity: 0 }}
          animate={{ width: 360, opacity: 1 }}
          exit={{ width: 0, opacity: 0 }}
          transition={{ duration: 0.2, ease: "easeInOut" }}
          className="border-l border-border bg-background flex flex-col overflow-hidden shrink-0"
        >
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3.5 border-b border-border">
            <div className="flex items-center gap-2">
              <div className="size-6 rounded-md bg-primary flex items-center justify-center">
                <Sparkles className="size-3.5 text-primary-foreground" />
              </div>
              <span className="font-semibold text-sm">BackOffice AI</span>
              <span className="text-[10px] bg-primary/10 text-primary px-1.5 py-0.5 rounded-full font-medium">
                Beta
              </span>
            </div>
            <div className="flex items-center gap-1">
              {messages.length > 0 && (
                <Button
                  variant="ghost"
                  size="icon"
                  className="size-7"
                  onClick={() => setMessages([])}
                  title="Clear conversation"
                >
                  <Trash2 className="size-3.5" />
                </Button>
              )}
              <Button
                variant="ghost"
                size="icon"
                className="size-7"
                onClick={() => setAIPanelOpen(false)}
              >
                <X className="size-4" />
              </Button>
            </div>
          </div>

          {/* Context indicator */}
          {pageContext?.module && (
            <div className="px-4 py-1.5 bg-muted/50 border-b border-border">
              <p className="text-[10px] text-muted-foreground">
                Context: <span className="font-medium text-foreground capitalize">{pageContext.module}</span>
                {pageContext.entityName && (
                  <> → <span className="font-medium text-foreground">{pageContext.entityName}</span></>
                )}
              </p>
            </div>
          )}

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {messages.length === 0 ? (
              <div className="space-y-4">
                <div className="text-center pt-4">
                  <div className="size-12 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-3">
                    <Sparkles className="size-6 text-primary" />
                  </div>
                  <p className="text-sm font-semibold text-foreground">BackOffice AI</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Your intelligent business assistant. Ask me anything about your clients, invoices, projects, or tasks.
                  </p>
                </div>

                <div className="space-y-2">
                  <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wide">
                    Suggestions
                  </p>
                  {SUGGESTIONS.map((suggestion) => (
                    <button
                      key={suggestion}
                      className="w-full text-left text-xs px-3 py-2 rounded-lg border border-border hover:bg-muted transition-colors text-foreground"
                      onClick={() => {
                        const event = { target: { value: suggestion } } as any
                        handleInputChange(event)
                        setTimeout(() => {
                          const submitEvent = new Event("submit") as any
                          handleSubmit(submitEvent)
                        }, 50)
                      }}
                    >
                      {suggestion}
                    </button>
                  ))}
                </div>
              </div>
            ) : (
              <>
                {messages.map((message) => (
                  <MessageBubble key={message.id} message={message} />
                ))}
                {isLoading && (
                  <div className="flex items-start gap-2.5">
                    <div className="size-6 rounded-full bg-primary/10 flex items-center justify-center shrink-0 mt-0.5">
                      <Sparkles className="size-3 text-primary" />
                    </div>
                    <div className="rounded-2xl rounded-tl-sm bg-muted px-3 py-2">
                      <Loader2 className="size-3.5 animate-spin text-muted-foreground" />
                    </div>
                  </div>
                )}
              </>
            )}
          </div>

          {/* Input */}
          <div className="p-4 border-t border-border">
            <form onSubmit={handleSubmit} className="relative">
              <textarea
                ref={inputRef}
                className="w-full resize-none rounded-xl border border-border bg-muted/30 px-4 py-3 pr-12 text-sm outline-none placeholder:text-muted-foreground focus:border-primary/50 transition-colors min-h-[80px] max-h-36"
                placeholder="Ask anything... (Enter to send, Shift+Enter for newline)"
                value={input}
                onChange={handleInputChange}
                onKeyDown={handleKeyDown}
                rows={2}
              />
              <Button
                type="submit"
                size="icon"
                className="absolute bottom-3 right-3 size-7"
                disabled={!input.trim() || isLoading}
              >
                {isLoading ? (
                  <Loader2 className="size-3.5 animate-spin" />
                ) : (
                  <Send className="size-3.5" />
                )}
              </Button>
            </form>
            <p className="text-[10px] text-muted-foreground text-center mt-2">
              AI can make mistakes. Verify important information.
            </p>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}

function MessageBubble({ message }: { message: any }) {
  const isUser = message.role === "user"

  return (
    <div className={cn("flex items-start gap-2.5", isUser && "flex-row-reverse")}>
      <div className={cn(
        "size-6 rounded-full flex items-center justify-center shrink-0 mt-0.5",
        isUser ? "bg-primary" : "bg-primary/10"
      )}>
        {isUser ? (
          <User className="size-3 text-primary-foreground" />
        ) : (
          <Sparkles className="size-3 text-primary" />
        )}
      </div>

      <div className={cn(
        "rounded-2xl px-3.5 py-2.5 text-sm max-w-[85%] leading-relaxed",
        isUser
          ? "bg-primary text-primary-foreground rounded-tr-sm"
          : "bg-muted text-foreground rounded-tl-sm"
      )}>
        {message.content}
        {message.toolInvocations?.map((tool: any) => (
          <ToolResult key={tool.toolCallId} tool={tool} />
        ))}
      </div>
    </div>
  )
}

function ToolResult({ tool }: { tool: any }) {
  if (tool.state !== "result") return null

  return (
    <div className="mt-2 pt-2 border-t border-border/30 text-[11px] text-muted-foreground">
      <span className="font-medium">Used: </span>{tool.toolName}
    </div>
  )
}
