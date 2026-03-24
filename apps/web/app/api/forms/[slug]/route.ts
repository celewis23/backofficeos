import { NextRequest, NextResponse } from "next/server"
import { db } from "@backoffice-os/database"

export async function POST(request: NextRequest, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const ipAddress = request.headers.get("x-forwarded-for")?.split(",")[0] ?? request.headers.get("x-real-ip")

  try {
    const form = await db.intakeForm.findFirst({
      where: { slug, isActive: true },
    })

    if (!form) {
      return NextResponse.json({ error: "Form not found" }, { status: 404 })
    }

    const body = await request.json()
    const data = body.data ?? {}

    await db.intakeSubmission.create({
      data: {
        formId: form.id,
        data,
        ipAddress,
      },
    })

    return NextResponse.json({ success: true })
  } catch {
    return NextResponse.json({ error: "Failed to submit form" }, { status: 500 })
  }
}
