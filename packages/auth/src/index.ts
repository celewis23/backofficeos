import { betterAuth } from "better-auth"
import { prismaAdapter } from "better-auth/adapters/prisma"
import { organization } from "better-auth/plugins"
import { db } from "@backoffice-os/database"

const withUrlProtocol = (value: string | undefined, fallback: string) => {
  const candidate = value?.trim() || fallback
  return /^[a-zA-Z][a-zA-Z\d+\-.]*:\/\//.test(candidate)
    ? candidate
    : `https://${candidate}`
}

export const auth = betterAuth({
  baseURL: withUrlProtocol(
    process.env.BETTER_AUTH_URL ?? process.env.NEXT_PUBLIC_APP_URL,
    "http://localhost:3000"
  ),
  database: prismaAdapter(db, {
    provider: "postgresql",
  }),

  emailAndPassword: {
    enabled: true,
    requireEmailVerification: false,
    minPasswordLength: 8,
  },

  socialProviders: {
    google: {
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
      scope: [
        "openid",
        "email",
        "profile",
        "https://www.googleapis.com/auth/calendar",
        "https://www.googleapis.com/auth/gmail.readonly",
        "https://www.googleapis.com/auth/gmail.send",
      ],
    },
    microsoft: {
      clientId: process.env.MICROSOFT_CLIENT_ID!,
      clientSecret: process.env.MICROSOFT_CLIENT_SECRET!,
      tenantId: "common",
      scope: [
        "openid",
        "email",
        "profile",
        "Calendars.ReadWrite",
        "Mail.ReadWrite",
        "Mail.Send",
      ],
    },
  },

  plugins: [
    organization({
      allowUserToCreateOrganization: true,
      organizationLimit: 5,
    }),
  ],

  session: {
    expiresIn: 60 * 60 * 24 * 30, // 30 days
    updateAge: 60 * 60 * 24,       // refresh if older than 1 day
    cookieCache: {
      enabled: true,
      maxAge: 60 * 5, // 5 minutes
    },
  },

  user: {
    additionalFields: {
      phone: {
        type: "string",
        nullable: true,
      },
    },
  },

  trustedOrigins: [
    withUrlProtocol(process.env.NEXT_PUBLIC_APP_URL, "http://localhost:3000"),
    withUrlProtocol(process.env.NEXT_PUBLIC_PORTAL_URL, "http://localhost:3001"),
  ],
})

export type Auth = typeof auth
export type Session = typeof auth.$Infer.Session
export type User = typeof auth.$Infer.Session.user
