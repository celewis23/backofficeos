import {
  Body,
  Button,
  Container,
  Head,
  Heading,
  Hr,
  Html,
  Img,
  Link,
  Preview,
  Section,
  Text,
} from "@react-email/components"
import * as React from "react"

interface WelcomeEmailProps {
  userName: string
  orgName: string
  loginUrl: string
}

export function WelcomeEmail({ userName, orgName, loginUrl }: WelcomeEmailProps) {
  return (
    <Html>
      <Head />
      <Preview>Welcome to BackOfficeOS — your business operating system</Preview>
      <Body style={main}>
        <Container style={container}>
          <Heading style={h1}>Welcome to BackOfficeOS</Heading>
          <Text style={text}>Hi {userName},</Text>
          <Text style={text}>
            Your workspace <strong>{orgName}</strong> is ready. BackOfficeOS
            brings all your business tools — billing, projects, clients,
            scheduling, and more — into one place.
          </Text>
          <Section style={buttonContainer}>
            <Button style={button} href={loginUrl}>
              Open Your Workspace
            </Button>
          </Section>
          <Hr style={hr} />
          <Text style={footer}>
            You&apos;re receiving this because you signed up for BackOfficeOS.
            <Link href="https://backoffice.os/unsubscribe" style={link}>
              {" "}
              Unsubscribe
            </Link>
          </Text>
        </Container>
      </Body>
    </Html>
  )
}

const main = {
  backgroundColor: "#f6f9fc",
  fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
}

const container = {
  backgroundColor: "#ffffff",
  margin: "0 auto",
  padding: "40px 20px",
  maxWidth: "560px",
  borderRadius: "8px",
}

const h1 = {
  color: "#1a1a1a",
  fontSize: "24px",
  fontWeight: "600",
  margin: "0 0 24px",
}

const text = {
  color: "#444",
  fontSize: "16px",
  lineHeight: "1.6",
  margin: "0 0 16px",
}

const buttonContainer = { margin: "24px 0" }

const button = {
  backgroundColor: "#6366f1",
  borderRadius: "6px",
  color: "#fff",
  fontSize: "14px",
  fontWeight: "600",
  padding: "12px 24px",
  textDecoration: "none",
}

const hr = { borderColor: "#e6e6e6", margin: "32px 0 24px" }

const footer = { color: "#8898aa", fontSize: "12px" }

const link = { color: "#6366f1" }
