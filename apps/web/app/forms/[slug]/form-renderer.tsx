"use client"

import * as React from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { CheckCircle2 } from "lucide-react"

type Field = {
  id: string
  type: string
  label: string
  required: boolean
  placeholder?: string
  options?: string[]
}

export function FormRenderer({ formId, slug, fields }: { formId: string; slug: string; fields: Field[] }) {
  const [values, setValues] = React.useState<Record<string, string>>({})
  const [submitting, setSubmitting] = React.useState(false)
  const [submitted, setSubmitted] = React.useState(false)
  const [error, setError] = React.useState("")

  function setValue(id: string, value: string) {
    setValues((prev) => ({ ...prev, [id]: value }))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError("")

    // Validate required fields
    const missing = fields.filter((f) => f.required && !values[f.id]?.trim())
    if (missing.length > 0) {
      setError(`Please fill in: ${missing.map((f) => f.label).join(", ")}`)
      return
    }

    setSubmitting(true)
    try {
      const res = await fetch(`/api/forms/${slug}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ data: values }),
      })

      if (!res.ok) {
        const d = await res.json()
        setError(d.error ?? "Submission failed. Please try again.")
        return
      }

      setSubmitted(true)
    } catch {
      setError("Network error. Please try again.")
    } finally {
      setSubmitting(false)
    }
  }

  if (submitted) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <CheckCircle2 className="size-12 text-green-500 mb-4" />
        <h2 className="text-lg font-semibold">Thank you!</h2>
        <p className="text-sm text-muted-foreground mt-1">Your response has been submitted successfully.</p>
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      {fields.map((field) => (
        <div key={field.id} className="space-y-1.5">
          <Label>
            {field.label}
            {field.required && <span className="text-destructive ml-1">*</span>}
          </Label>

          {field.type === "textarea" ? (
            <textarea
              className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm min-h-[80px] resize-y focus:outline-none focus:ring-2 focus:ring-ring"
              placeholder={field.placeholder}
              value={values[field.id] ?? ""}
              onChange={(e) => setValue(field.id, e.target.value)}
            />
          ) : field.type === "select" ? (
            <select
              className="w-full h-9 rounded-md border border-input bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
              value={values[field.id] ?? ""}
              onChange={(e) => setValue(field.id, e.target.value)}
            >
              <option value="">Select an option...</option>
              {field.options?.map((opt) => (
                <option key={opt} value={opt}>{opt}</option>
              ))}
            </select>
          ) : field.type === "radio" ? (
            <div className="space-y-2">
              {field.options?.map((opt) => (
                <label key={opt} className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    name={field.id}
                    value={opt}
                    checked={values[field.id] === opt}
                    onChange={() => setValue(field.id, opt)}
                    className="accent-primary"
                  />
                  <span className="text-sm">{opt}</span>
                </label>
              ))}
            </div>
          ) : field.type === "checkbox" ? (
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={values[field.id] === "true"}
                onChange={(e) => setValue(field.id, e.target.checked ? "true" : "false")}
                className="accent-primary size-4"
              />
              <span className="text-sm">{field.placeholder ?? "Yes"}</span>
            </label>
          ) : (
            <Input
              type={field.type === "email" ? "email" : field.type === "phone" ? "tel" : field.type === "number" ? "number" : field.type === "date" ? "date" : "text"}
              placeholder={field.placeholder}
              value={values[field.id] ?? ""}
              onChange={(e) => setValue(field.id, e.target.value)}
            />
          )}
        </div>
      ))}

      {error && (
        <p className="text-sm text-destructive rounded-md bg-destructive/10 px-3 py-2">{error}</p>
      )}

      <Button type="submit" className="w-full" disabled={submitting}>
        {submitting ? "Submitting..." : "Submit"}
      </Button>
    </form>
  )
}
