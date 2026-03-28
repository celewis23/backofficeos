import { Resend } from "resend"

// Fall back to a placeholder so the constructor doesn't throw at build time
// when RESEND_API_KEY is absent. Real sends will fail at runtime if the key
// is still missing, which is the correct behaviour.
export const resend = new Resend(process.env.RESEND_API_KEY || "re_placeholder")

export interface SendEmailOptions {
  to: string | string[]
  subject: string
  react: React.ReactElement
  from?: string
  replyTo?: string
}

export async function sendEmail({
  to,
  subject,
  react,
  from = `ArcheionOS <noreply@${process.env.EMAIL_DOMAIN ?? "backoffice.os"}>`,
  replyTo,
}: SendEmailOptions) {
  const { data, error } = await resend.emails.send({
    from,
    to: Array.isArray(to) ? to : [to],
    subject,
    react,
    replyTo,
  })

  if (error) {
    throw new Error(`Failed to send email: ${error.message}`)
  }

  return data
}

export { WelcomeEmail } from "./templates/welcome"
export { InvoiceEmail } from "./templates/invoice"
export { PaymentReminderEmail } from "./templates/payment-reminder"
export { BookingConfirmationEmail } from "./templates/booking-confirmation"
export { InviteEmail } from "./templates/invite"
