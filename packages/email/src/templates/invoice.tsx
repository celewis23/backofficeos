import {
  Body,
  Button,
  Container,
  Head,
  Heading,
  Hr,
  Html,
  Preview,
  Row,
  Column,
  Section,
  Text,
} from "@react-email/components"
import * as React from "react"

interface InvoiceItem {
  description: string
  quantity: number
  unitPrice: number
  amount: number
}

interface InvoiceEmailProps {
  orgName: string
  orgLogo?: string
  clientName: string
  invoiceNumber: string
  issueDate: string
  dueDate: string
  items: InvoiceItem[]
  subtotal: number
  taxAmount: number
  total: number
  currency: string
  paymentUrl: string
  notes?: string
}

export function InvoiceEmail({
  orgName,
  clientName,
  invoiceNumber,
  issueDate,
  dueDate,
  items,
  subtotal,
  taxAmount,
  total,
  currency,
  paymentUrl,
  notes,
}: InvoiceEmailProps) {
  const fmt = (n: number) =>
    new Intl.NumberFormat("en-US", { style: "currency", currency }).format(n)

  return (
    <Html>
      <Head />
      <Preview>Invoice {invoiceNumber} from {orgName} — {fmt(total)} due {dueDate}</Preview>
      <Body style={main}>
        <Container style={container}>
          <Row>
            <Column>
              <Heading style={h1}>{orgName}</Heading>
            </Column>
            <Column style={{ textAlign: "right" }}>
              <Text style={invoiceLabel}>INVOICE</Text>
              <Text style={invoiceNumber_}>{invoiceNumber}</Text>
            </Column>
          </Row>

          <Section style={meta}>
            <Row>
              <Column>
                <Text style={metaLabel}>Bill To</Text>
                <Text style={metaValue}>{clientName}</Text>
              </Column>
              <Column style={{ textAlign: "right" }}>
                <Text style={metaLabel}>Issue Date</Text>
                <Text style={metaValue}>{issueDate}</Text>
                <Text style={metaLabel}>Due Date</Text>
                <Text style={{ ...metaValue, color: "#ef4444" }}>{dueDate}</Text>
              </Column>
            </Row>
          </Section>

          <Section style={tableSection}>
            <Row style={tableHeader}>
              <Column style={{ width: "50%" }}>
                <Text style={th}>Description</Text>
              </Column>
              <Column style={{ width: "15%" }}>
                <Text style={{ ...th, textAlign: "center" }}>Qty</Text>
              </Column>
              <Column style={{ width: "15%" }}>
                <Text style={{ ...th, textAlign: "right" }}>Price</Text>
              </Column>
              <Column style={{ width: "20%" }}>
                <Text style={{ ...th, textAlign: "right" }}>Amount</Text>
              </Column>
            </Row>
            {items.map((item, i) => (
              <Row key={i} style={tableRow}>
                <Column style={{ width: "50%" }}>
                  <Text style={td}>{item.description}</Text>
                </Column>
                <Column style={{ width: "15%" }}>
                  <Text style={{ ...td, textAlign: "center" }}>{item.quantity}</Text>
                </Column>
                <Column style={{ width: "15%" }}>
                  <Text style={{ ...td, textAlign: "right" }}>{fmt(item.unitPrice)}</Text>
                </Column>
                <Column style={{ width: "20%" }}>
                  <Text style={{ ...td, textAlign: "right" }}>{fmt(item.amount)}</Text>
                </Column>
              </Row>
            ))}
          </Section>

          <Section style={totals}>
            <Row>
              <Column style={{ width: "60%" }} />
              <Column style={{ width: "40%" }}>
                <Row>
                  <Column><Text style={totalLabel}>Subtotal</Text></Column>
                  <Column style={{ textAlign: "right" }}><Text style={totalValue}>{fmt(subtotal)}</Text></Column>
                </Row>
                {taxAmount > 0 && (
                  <Row>
                    <Column><Text style={totalLabel}>Tax</Text></Column>
                    <Column style={{ textAlign: "right" }}><Text style={totalValue}>{fmt(taxAmount)}</Text></Column>
                  </Row>
                )}
                <Hr style={{ borderColor: "#e6e6e6", margin: "8px 0" }} />
                <Row>
                  <Column><Text style={grandTotalLabel}>Total Due</Text></Column>
                  <Column style={{ textAlign: "right" }}><Text style={grandTotalValue}>{fmt(total)}</Text></Column>
                </Row>
              </Column>
            </Row>
          </Section>

          {notes && (
            <Section style={{ margin: "24px 0" }}>
              <Text style={notesLabel}>Notes</Text>
              <Text style={notesText}>{notes}</Text>
            </Section>
          )}

          <Section style={{ textAlign: "center", margin: "32px 0" }}>
            <Button style={button} href={paymentUrl}>
              Pay Now — {fmt(total)}
            </Button>
          </Section>

          <Hr style={{ borderColor: "#e6e6e6" }} />
          <Text style={footer}>
            Sent by {orgName} via BackOfficeOS
          </Text>
        </Container>
      </Body>
    </Html>
  )
}

const main = { backgroundColor: "#f6f9fc", fontFamily: "-apple-system, sans-serif" }
const container = { backgroundColor: "#fff", margin: "0 auto", padding: "40px 32px", maxWidth: "600px", borderRadius: "8px" }
const h1 = { color: "#1a1a1a", fontSize: "22px", fontWeight: "700", margin: "0 0 4px" }
const invoiceLabel = { color: "#6366f1", fontSize: "11px", fontWeight: "700", letterSpacing: "2px", textTransform: "uppercase" as const, margin: "0" }
const invoiceNumber_ = { color: "#1a1a1a", fontSize: "18px", fontWeight: "600", margin: "0" }
const meta = { backgroundColor: "#f9fafb", borderRadius: "6px", padding: "16px 20px", margin: "24px 0" }
const metaLabel = { color: "#6b7280", fontSize: "11px", fontWeight: "600", textTransform: "uppercase" as const, letterSpacing: "0.5px", margin: "0 0 2px" }
const metaValue = { color: "#1a1a1a", fontSize: "14px", margin: "0 0 8px" }
const tableSection = { margin: "24px 0" }
const tableHeader = { borderBottom: "2px solid #e6e6e6" }
const tableRow = { borderBottom: "1px solid #f3f4f6" }
const th = { color: "#6b7280", fontSize: "11px", fontWeight: "700", textTransform: "uppercase" as const, letterSpacing: "0.5px", padding: "8px 4px" }
const td = { color: "#374151", fontSize: "14px", padding: "10px 4px" }
const totals = { margin: "16px 0" }
const totalLabel = { color: "#6b7280", fontSize: "14px", margin: "4px 0" }
const totalValue = { color: "#374151", fontSize: "14px", margin: "4px 0" }
const grandTotalLabel = { color: "#1a1a1a", fontSize: "15px", fontWeight: "700", margin: "4px 0" }
const grandTotalValue = { color: "#6366f1", fontSize: "18px", fontWeight: "700", margin: "4px 0" }
const notesLabel = { color: "#6b7280", fontSize: "11px", fontWeight: "700", textTransform: "uppercase" as const, margin: "0 0 4px" }
const notesText = { color: "#374151", fontSize: "14px" }
const button = { backgroundColor: "#6366f1", borderRadius: "6px", color: "#fff", fontSize: "15px", fontWeight: "600", padding: "14px 28px", textDecoration: "none" }
const footer = { color: "#9ca3af", fontSize: "12px", textAlign: "center" as const }
