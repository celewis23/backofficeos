import { AUTOMATION_TEMPLATES, TEMPLATE_CATEGORIES } from "@/lib/automation-templates"
import { TemplatesClient } from "./templates-client"

export default function TemplatesPage() {
  return <TemplatesClient templates={AUTOMATION_TEMPLATES} categories={TEMPLATE_CATEGORIES} />
}
