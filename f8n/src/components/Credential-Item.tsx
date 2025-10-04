"use client"

import React from "react"

type CredentialItemProps = {
  label: string
  storageKey: string
}

export function CredentialItem({ label, storageKey }: CredentialItemProps) {
  const [value, setValue] = React.useState("")
  const [isSaved, setIsSaved] = React.useState(false)
  const inputRef = React.useRef<HTMLInputElement | null>(null)

  // Initialize from localStorage and sync across tabs
  React.useEffect(() => {
    try {
      const stored = localStorage.getItem(storageKey)
      setIsSaved(!!stored)
      setValue("") // never preload the actual secret in the input
    } catch {
      // no-op
    }

    const onStorage = (e: StorageEvent) => {
      if (e.key === storageKey) {
        setIsSaved(!!e.newValue)
        setValue("")
      }
    }
    window.addEventListener("storage", onStorage)
    return () => window.removeEventListener("storage", onStorage)
  }, [storageKey])

  const handleSave = () => {
    if (!value.trim()) {
      // Keep it minimal; no toast required. Could add simple focus hint.
      inputRef.current?.focus()
      return
    }
    try {
      localStorage.setItem(storageKey, value.trim())
      setIsSaved(true)
      setValue("") // clear after saving; do not show the key
    } catch {
      // no-op
    }
  }

  const handleDelete = () => {
    try {
      localStorage.removeItem(storageKey)
      setIsSaved(false)
      setValue("")
      inputRef.current?.focus()
    } catch {
      // no-op
    }
  }

  return (
    <div
      className="rounded-lg border border-border p-4 transition-colors"
      role="group"
      aria-label={`${label} controls`}
    >
      <div className="flex items-center justify-between gap-4">
        <div className="min-w-0">
          <div className="text-sm font-medium text-foreground">{label}</div>
          {isSaved ? (
            <div className="mt-1 text-sm text-foreground/80" aria-live="polite" aria-label="Key stored. Value hidden.">
              {"●●●●●●●●"}
            </div>
          ) : (
            <div className="mt-1 text-sm text-foreground/70">{"Not set"}</div>
          )}
        </div>

        {isSaved ? (
          <div className="shrink-0">
            <button
              type="button"
              onClick={handleDelete}
              className="inline-flex items-center rounded-md border border-border px-3 py-1.5 text-sm font-medium text-foreground transition-colors hover:bg-foreground hover:text-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-[var(--brand,#FE328E)]"
              aria-label={`Delete ${label}`}
            >
              {"Delete Key"}
            </button>
          </div>
        ) : (
          <div className="flex w-full max-w-sm items-center gap-2">
            <input
              ref={inputRef}
              type="password"
              inputMode="text"
              autoComplete="off"
              placeholder="Enter key"
              value={value}
              onChange={(e) => setValue(e.target.value)}
              className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground outline-none transition-shadow focus-visible:ring-2 focus-visible:ring-[var(--brand,#FE328E)]"
              aria-label={`${label} input`}
            />
            <button
              type="button"
              onClick={handleSave}
              className="inline-flex items-center rounded-md border border-border px-3 py-2 text-sm font-semibold text-foreground transition-colors hover:bg-foreground hover:text-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-[var(--brand,#FE328E)]"
              aria-label={`Save ${label}`}
            >
              {"Save"}
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
