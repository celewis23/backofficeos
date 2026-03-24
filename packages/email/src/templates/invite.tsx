import { Body, Button, Container, Head, Heading, Hr, Html, Preview, Text } from "@react-email/components"
import * as React from "react"

interface InviteEmailProps {
  inviterName: string
  orgName: string
  role: string
  inviteUrl: string
  expiresAt: string
}

export function InviteEmail({ inviterName, orgName, role, inviteUrl, expiresAt }: InviteEmailProps) {
  return (
    <Html>
      <Head />
      <Preview>{inviterName} invited you to join {orgName} on ArcheionOS</Preview>
      <Body style={main}>
        <Container style={container}>
          <Heading style={h1}>You&apos;re invited</Heading>
          <Text style={text}>
            <strong>{inviterName}</strong> has invited you to join{" "}
            <strong>{orgName}</strong> on ArcheionOS as a{" "}
            <strong>{role}</strong>.
          </Text>
          <Text style={text}>
            ArcheionOS is an all-in-one business operating system for managing
            clients, projects, billing, and more.
          </Text>
          <div style={{ textAlign: "center", margin: "32px 0" }}>
            <Button style={button} href={inviteUrl}>
              Accept Invitation
            </Button>
          </div>
          <Hr style={{ borderColor: "#e6e6e6" }} />
          <Text style={footer}>
            This invitation expires on {expiresAt}. If you didn&apos;t expect this,
            you can safely ignore it.
          </Text>
        </Container>
      </Body>
    </Html>
  )
}

const main = { backgroundColor: "#f6f9fc", fontFamily: "-apple-system, sans-serif" }
const container = { backgroundColor: "#fff", margin: "0 auto", padding: "40px 32px", maxWidth: "520px", borderRadius: "8px" }
const h1 = { color: "#1a1a1a", fontSize: "24px", fontWeight: "600", margin: "0 0 20px" }
const text = { color: "#444", fontSize: "15px", lineHeight: "1.6", margin: "0 0 14px" }
const button = { backgroundColor: "#6366f1", borderRadius: "6px", color: "#fff", fontSize: "15px", fontWeight: "600", padding: "14px 32px", textDecoration: "none" }
const footer = { color: "#9ca3af", fontSize: "12px" }
