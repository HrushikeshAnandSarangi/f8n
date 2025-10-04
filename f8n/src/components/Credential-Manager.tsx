"use client"
import { CredentialItem } from "./Credential-Item"

type CredDef = { label: string; storageKey: string }

const CREDENTIALS: CredDef[] = [
  { label: "Alice Blue access token", storageKey: "aliceBlueAccessToken" },
  { label: "Reddit API key", storageKey: "redditApiKey" },
  { label: "Gemini API key", storageKey: "geminiApiKey" },
]

export function CredentialsManager() {
  // Could add search or grouping later; keep minimal now.
  return (
    <section aria-labelledby="credentials-title" className="w-full">
      <header className="mb-4">
        <h1 id="credentials-title" className="text-balance text-2xl font-semibold text-foreground">
          {"Credentials"}
        </h1>
        <p className="mt-1 text-pretty text-sm text-foreground/70">
          {"Store your keys locally in this browser. Saved values are hidden and represented by black dots."}
        </p>
      </header>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        {CREDENTIALS.map((c) => (
          <CredentialItem key={c.storageKey} label={c.label} storageKey={c.storageKey} />
        ))}
      </div>
    </section>
  )
}
