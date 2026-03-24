import { createAuthClient } from "better-auth/react"
import { organizationClient } from "better-auth/client/plugins"

const withUrlProtocol = (value: string | undefined, fallback: string) => {
  const candidate = value?.trim() || fallback
  return /^[a-zA-Z][a-zA-Z\d+\-.]*:\/\//.test(candidate)
    ? candidate
    : `https://${candidate}`
}

export const authClient = createAuthClient({
  baseURL: withUrlProtocol(process.env.NEXT_PUBLIC_APP_URL, "http://localhost:3000"),
  plugins: [organizationClient()],
})

export const {
  signIn,
  signOut,
  signUp,
  useSession,
  organization,
} = authClient

export type { Session } from "better-auth"
