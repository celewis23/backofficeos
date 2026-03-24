import { Body, Button, Container, Head, Heading, Hr, Html, Preview, Text } from "@react-email/components"
import * as React from "react"

interface BookingConfirmationEmailProps {
  guestName: string
  orgName: string
  eventName: string
  startAt: string
  endAt: string
  videoUrl?: string
  location?: string
  cancelUrl: string
}

export function BookingConfirmationEmail({
  guestName,
  orgName,
  eventName,
  startAt,
  endAt,
  videoUrl,
  location,
  cancelUrl,
}: BookingConfirmationEmailProps) {
  return (
    <Html>
      <Head />
      <Preview>Booking confirmed: {eventName} with {orgName}</Preview>
      <Body style={main}>
        <Container style={container}>
          <div style={badge}>CONFIRMED</div>
          <Heading style={h1}>Your booking is confirmed</Heading>
          <Text style={text}>Hi {guestName},</Text>
          <Text style={text}>
            Your {eventName} with {orgName} has been confirmed.
          </Text>
          <div style={detailBox}>
            <Text style={detailLabel}>Date &amp; Time</Text>
            <Text style={detailValue}>{startAt} — {endAt}</Text>
            {location && (
              <>
                <Text style={detailLabel}>Location</Text>
                <Text style={detailValue}>{location}</Text>
              </>
            )}
            {videoUrl && (
              <>
                <Text style={detailLabel}>Video Call</Text>
                <Text style={detailValue}>
                  <a href={videoUrl} style={{ color: "#6366f1" }}>{videoUrl}</a>
                </Text>
              </>
            )}
          </div>
          <Hr style={{ borderColor: "#e6e6e6", margin: "24px 0" }} />
          <Text style={cancelText}>
            Need to cancel or reschedule?{" "}
            <a href={cancelUrl} style={{ color: "#6366f1" }}>
              Click here
            </a>
          </Text>
        </Container>
      </Body>
    </Html>
  )
}

const main = { backgroundColor: "#f6f9fc", fontFamily: "-apple-system, sans-serif" }
const container = { backgroundColor: "#fff", margin: "0 auto", padding: "40px 32px", maxWidth: "520px", borderRadius: "8px" }
const badge = { backgroundColor: "#f0fdf4", border: "1px solid #bbf7d0", borderRadius: "4px", color: "#16a34a", fontSize: "11px", fontWeight: "700", letterSpacing: "2px", padding: "6px 12px", marginBottom: "24px", display: "inline-block" }
const h1 = { color: "#1a1a1a", fontSize: "22px", fontWeight: "600", margin: "0 0 16px" }
const text = { color: "#444", fontSize: "15px", lineHeight: "1.6", margin: "0 0 12px" }
const detailBox = { backgroundColor: "#f9fafb", borderRadius: "8px", padding: "20px 24px", margin: "20px 0" }
const detailLabel = { color: "#6b7280", fontSize: "11px", fontWeight: "700", textTransform: "uppercase" as const, letterSpacing: "0.5px", margin: "12px 0 2px" }
const detailValue = { color: "#1a1a1a", fontSize: "15px", fontWeight: "500", margin: "0" }
const cancelText = { color: "#6b7280", fontSize: "13px" }
