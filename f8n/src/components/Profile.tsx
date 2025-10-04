"use client"

import React from "react"

type Profile = {
  name: string
  email: string
  username: string
}

const STORAGE_KEYS = {
  name: "profile.name",
  email: "profile.email",
  username: "profile.username",
} as const

export function ProfileForm() {
  const [profile, setProfile] = React.useState<Profile>({
    name: "",
    email: "",
    username: "",
  })
  const [isLoaded, setIsLoaded] = React.useState(false)

  // Load from localStorage on mount and sync with storage events
  React.useEffect(() => {
    try {
      const name = localStorage.getItem(STORAGE_KEYS.name) || ""
      const email = localStorage.getItem(STORAGE_KEYS.email) || ""
      const username = localStorage.getItem(STORAGE_KEYS.username) || ""
      setProfile({ name, email, username })
      setIsLoaded(true)
    } catch {
      // no-op
      setIsLoaded(true)
    }

    const onStorage = (e: StorageEvent) => {
      if (!e.key) return
      if (e.key === STORAGE_KEYS.name || e.key === STORAGE_KEYS.email || e.key === STORAGE_KEYS.username) {
        try {
          const name = localStorage.getItem(STORAGE_KEYS.name) || ""
          const email = localStorage.getItem(STORAGE_KEYS.email) || ""
          const username = localStorage.getItem(STORAGE_KEYS.username) || ""
          setProfile({ name, email, username })
        } catch {
          // no-op
        }
      }
    }
    window.addEventListener("storage", onStorage)
    return () => window.removeEventListener("storage", onStorage)
  }, [])

  const onChange = (key: keyof Profile) => (e: React.ChangeEvent<HTMLInputElement>) => {
    setProfile((p) => ({ ...p, [key]: e.target.value }))
  }

  const handleSave = () => {
    try {
      localStorage.setItem(STORAGE_KEYS.name, profile.name.trim())
      localStorage.setItem(STORAGE_KEYS.email, profile.email.trim())
      localStorage.setItem(STORAGE_KEYS.username, profile.username.trim())
    } catch {
      // no-op
    }
  }

  const handleClear = () => {
    try {
      localStorage.removeItem(STORAGE_KEYS.name)
      localStorage.removeItem(STORAGE_KEYS.email)
      localStorage.removeItem(STORAGE_KEYS.username)
      setProfile({ name: "", email: "", username: "" })
    } catch {
      // no-op
    }
  }

  return (
    <section aria-labelledby="profile-title" className="w-full">
      <header className="mb-4">
        <h2 id="profile-title" className="text-2xl font-semibold text-balance">
          {"Your Profile"}
        </h2>
        <p className="mt-1 text-sm text-foreground/70 text-pretty">
          {"Tell us a bit about you. This info is stored locally in your browser."}
        </p>
      </header>

      <div className="rounded-lg border border-border p-4 md:p-6">
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <div className="flex flex-col gap-2">
            <label htmlFor="name" className="text-sm font-medium">
              {"Full name"}
            </label>
            <input
              id="name"
              name="name"
              type="text"
              autoComplete="name"
              placeholder="Jane Doe"
              value={profile.name}
              onChange={onChange("name")}
              className="rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground outline-none transition-shadow focus-visible:ring-2 focus-visible:ring-[var(--brand,#FE328E)]"
            />
          </div>

          <div className="flex flex-col gap-2">
            <label htmlFor="email" className="text-sm font-medium">
              {"Email"}
            </label>
            <input
              id="email"
              name="email"
              type="email"
              autoComplete="email"
              placeholder="jane@example.com"
              value={profile.email}
              onChange={onChange("email")}
              className="rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground outline-none transition-shadow focus-visible:ring-2 focus-visible:ring-[var(--brand,#FE328E)]"
            />
          </div>

          <div className="flex flex-col gap-2 md:col-span-2">
            <label htmlFor="username" className="text-sm font-medium">
              {"Username"}
            </label>
            <input
              id="username"
              name="username"
              type="text"
              autoComplete="username"
              placeholder="janedoe"
              value={profile.username}
              onChange={onChange("username")}
              className="rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground outline-none transition-shadow focus-visible:ring-2 focus-visible:ring-[var(--brand,#FE328E)]"
            />
          </div>
        </div>

        <div className="mt-4 flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={handleSave}
            className="inline-flex items-center rounded-md bg-primary px-3 py-2 text-sm font-semibold text-primary-foreground transition-colors hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-[var(--brand,#FE328E)]"
          >
            {"Save Profile"}
          </button>
          <button
            type="button"
            onClick={handleClear}
            className="inline-flex items-center rounded-md border border-border px-3 py-2 text-sm font-medium text-foreground transition-colors hover:bg-foreground hover:text-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-[var(--brand,#FE328E)]"
          >
            {"Clear Profile"}
          </button>
          {!isLoaded ? <span className="ml-auto text-xs text-foreground/60">{"Loading..."}</span> : null}
        </div>
      </div>
    </section>
  )
}
