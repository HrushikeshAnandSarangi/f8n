"use client"

export default function PolkaBackground() {
  return (
    <div
      aria-hidden="true"
      className="pointer-events-none fixed inset-0 -z-10"
      style={{
        backgroundColor: "var(--polka-bg)",
        backgroundImage:
          "radial-gradient(rgba(0, 0, 0, var(--polka-opacity)) var(--polka-size), transparent var(--polka-size))",
        backgroundSize: "var(--polka-gap) var(--polka-gap)",
        backgroundPosition: "0 0",
      }}
    />
  )
}
