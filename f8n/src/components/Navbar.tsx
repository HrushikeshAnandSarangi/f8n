"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { useState } from "react"
import { cn } from "@/lib/utils"

type Tab = { name: string; href: string }

const TABS: Tab[] = [
  { name: "Home", href: "/" },
  { name: "How It Works", href: "/how-it-works" },
  { name: "Dashboard", href: "/dashboard" },
  { name: "Workflows", href: "/workflows" },
  { name: "Credentials", href: "/credentials" },
  { name: "History", href: "/history" },
]

function isActive(pathname: string, href: string) {
  if (href === "/") return pathname === "/"
  return pathname.startsWith(href)
}

function NavItem({
  tab,
  pathname,
  onNavigate,
}: {
  tab: Tab
  pathname: string
  onNavigate?: () => void
}) {
  const active = isActive(pathname, tab.href)
  return (
    <Link
      href={tab.href}
      onClick={onNavigate}
      className={cn(
        // minimal text with only approved colors: default black, active/hover pink
        "relative text-sm transition-colors duration-200 ease-out",
        active ? "text-primary" : "text-foreground hover:text-primary",
      )}
      aria-current={active ? "page" : undefined}
    >
      {tab.name}
      {/* animated underline that scales when active */}
      <span
        aria-hidden="true"
        className={cn(
          "pointer-events-none absolute -bottom-3 left-0 right-0 h-0.5 origin-center transform bg-primary transition-transform duration-300 ease-out",
          active ? "scale-x-100" : "scale-x-0",
        )}
      />
    </Link>
  )
}

export default function Navbar() {
  const pathname = usePathname()
  const [open, setOpen] = useState(false)
  const handleNavigate = () => setOpen(false)

  return (
    <header className="sticky top-0 z-50 bg-background/80 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <nav aria-label="Main" className="mx-auto max-w-7xl px-4 md:px-6">
        <div className="flex h-14 items-center justify-between">
          {/* Logo: using provided placeholder; replace with your attached asset path when ready */}
          <Link href="/" className="flex items-center gap-2" aria-label="Home">
            <img src="/f8n.svg" alt="Brand logo" className=" h-16 w-auto" />
          </Link>

          {/* Desktop nav */}
          <div className="hidden items-center gap-6 md:flex">
            {TABS.map((tab) => (
              <div key={tab.href} className="relative">
                <NavItem tab={tab} pathname={pathname} />
              </div>
            ))}
          </div>

          {/* Mobile trigger */}
          <div className="md:hidden">
            <button
              type="button"
              onClick={() => setOpen((v) => !v)}
              className="inline-flex items-center justify-center rounded-md border px-3 py-2 text-sm text-foreground hover:text-primary transition-colors"
              aria-controls="mobile-menu"
              aria-expanded={open}
              aria-label={open ? "Close menu" : "Open menu"}
            >
              <span className="sr-only">{open ? "Close menu" : "Open menu"}</span>
              <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                {open ? (
                  <path d="M6 6l12 12M6 18L18 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                ) : (
                  <path d="M4 7h16M4 12h16M4 17h16" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                )}
              </svg>
            </button>
          </div>
        </div>

        {/* Mobile menu with subtle entrance animation */}
        {open ? (
          <div id="mobile-menu" className="md:hidden animate-in fade-in-0 slide-in-from-top-2 duration-200">
            <div className="flex flex-col gap-2 pb-4 pt-2">
              {TABS.map((tab) => (
                <NavItem key={tab.href} tab={tab} pathname={pathname} onNavigate={handleNavigate} />
              ))}
            </div>
          </div>
        ) : null}
      </nav>
    </header>
  )
}
