import fs from "node:fs"
import path from "node:path"
import { defineConfig, env } from "prisma/config"

const rootEnvPath = path.resolve(__dirname, "../../.env")

if (fs.existsSync(rootEnvPath)) {
  const envFile = fs.readFileSync(rootEnvPath, "utf8")

  for (const line of envFile.split(/\r?\n/)) {
    const trimmed = line.trim()

    if (!trimmed || trimmed.startsWith("#")) {
      continue
    }

    const separatorIndex = trimmed.indexOf("=")
    if (separatorIndex === -1) {
      continue
    }

    const key = trimmed.slice(0, separatorIndex).trim()
    const rawValue = trimmed.slice(separatorIndex + 1).trim()
    const unquotedValue = rawValue.replace(/^"(.*)"$/, "$1")

    if (!(key in process.env)) {
      process.env[key] = unquotedValue
    }
  }
}

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
  },
  datasource: {
    url: env("DATABASE_URL"),
    directUrl: env("DATABASE_DIRECT_URL"),
  },
})
