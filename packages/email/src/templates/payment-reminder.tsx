import { Body, Button, Container, Head, Heading, Hr, Html, Preview, Text } from "@react-email/components"
import * as React from "react"

interface PaymentReminderEmailProps {
  orgName: string
  clientName: string
  invoiceNumber: string
  amount: number
  currency: string
  dueDate: string
  daysOverdue: number
  paymentUrl: string
}

export function PaymentReminderEmail({
  orgName,
  clientName,
  invoiceNumber,
  amount,
  currency,
  dueDate,
  daysOverdue,
  paymentUrl,
}: PaymentReminderEmailProps) {
  const fmt = (n: number) =>
    new Intl.NumberFormat("en-US", { style: "currency", currency }).format(n)

  const isOverdue = daysOverdue > 0

  return (
    <Html>
      <Head />
      <Preview>
        {isOverdue
          ? `Payment overdue: Invoice ${invoiceNumber} was due ${daysOverdue} days ago`
          : `Payment reminder: Invoice ${invoiceNumber} due ${dueDate}`}
      </Preview>
      <Body style={main}>
        <Container style={container}>
          {isOverdue && <div style={overdueBar}>OVERDUE</div>}
          <Heading style={h1}>
            {isOverdue ? "Payment Overdue" : "Payment Reminder"}
          </Heading>
          <Text style={text}>Hi {clientName},</Text>
          <Text style={text}>
            {isOverdue
              ? `Invoice ${invoiceNumber} from ${orgName} is ${daysOverdue} day${daysOverdue !== 1 ? "s" : ""} overdue. The amount of ${fmt(amount)} was due on ${dueDate}.`
              : `This is a friendly reminder that invoice ${invoiceNumber} from ${orgName} for ${fmt(amount)} is due on ${dueDate}.`}
          </Text>
          <div style={amountBox}>
            <Text style={amountLabel}>Amount Due</Text>
            <Text style={amountValue}>{fmt(amount)}</Text>
            <Text style={amountDue}>Due: {dueDate}</Text>
          </div>
          <div style={{ textAlign: "center", margin: "24px 0" }}>
            <Button style={button} href={paymentUrl}>
              Pay Now
            </Button>
          </div>
          <Hr style={{ borderColor: "#e6e6e6" }} />
          <Text style={footer}>
            If you&apos;ve already paid, please disregard this email. Sent by {orgName} via BackOfficeOS.
          </Text>
        </Container>
      </Body>
    </Html>
  )
}

const main = { backgroundColor: "#f6f9fc", fontFamily: "-apple-system, sans-serif" }
const container = { backgroundColor: "#fff", margin: "0 auto", padding: "40px 32px", maxWidth: "520px", borderRadius: "8px" }
const overdueBar = { backgroundColor: "#fef2f2", border: "1px solid #fecaca", borderRadius: "4px", color: "#dc2626", fontSize: "11px", fontWeight: "700", letterSpacing: "2px", padding: "6px 12px", marginBottom: "24px", display: "inline-block" }
const h1 = { color: "#1a1a1a", fontSize: "22px", fontWeight: "600", margin: "0 0 16px" }
const text = { color: "#444", fontSize: "15px", lineHeight: "1.6", margin: "0 0 16px" }
const amountBox = { backgroundColor: "#f9fafb", borderRadius: "8px", padding: "20px 24px", textAlign: "center" as const, margin: "24px 0" }
const amountLabel = { color: "#6b7280", fontSize: "12px", fontWeight: "600", textTransform: "uppercase" as const, letterSpacing: "0.5px", margin: "0 0 4px" }
const amountValue = { color: "#6366f1", fontSize: "32px", fontWeight: "700", margin: "0" }
const amountDue = { color: "#6b7280", fontSize: "13px", margin: "4px 0 0" }
const button = { backgroundColor: "#6366f1", borderRadius: "6px", color: "#fff", fontSize: "15px", fontWeight: "600", padding: "14px 32px", textDecoration: "none" }
const footer = { color: "#9ca3af", fontSize: "12px" }
