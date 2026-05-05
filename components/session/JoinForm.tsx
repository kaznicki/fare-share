'use client'
import { useState } from 'react'

interface Props {
  onSubmit: (name: string) => void
  initialName?: string
}

export default function JoinForm({ onSubmit, initialName = '' }: Props) {
  const [name, setName] = useState(initialName)

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim()) return
    onSubmit(name.trim())
  }

  return (
    <div className="max-w-sm mx-auto w-full">
      {/* Hero lockup — ONBOARD-02 */}
      <div className="flex justify-center pt-6 pb-4">
        <img src="/logo-lockup.svg" alt="Fare Share" className="h-16 w-auto" />
      </div>

      {/* App description — ONBOARD-03 (verbatim per UI-SPEC) */}
      <p className="text-center text-ink-2 text-base mb-4">
        Fare Share splits a restaurant bill by the items each person ordered.
      </p>

      {/* Usage instructions — ONBOARD-04 (verbatim per UI-SPEC) */}
      <ol className="text-sm text-ink-2 mb-6 space-y-2 list-decimal list-inside">
        <li>Enter your name to join.</li>
        <li>Tap any item you ordered.</li>
        <li>Tap shared items to split them with others.</li>
        <li>When the host finalizes, you&apos;ll see exactly what you owe.</li>
      </ol>

      <div className="bg-paper-deep rounded-2xl shadow-md p-6 flex flex-col gap-4">
        <h1 className="text-2xl font-bold text-center text-ink">Join the table</h1>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <input
            type="text"
            placeholder="Your name"
            autoFocus
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full py-3 px-4 rounded-xl border border-rule text-ink placeholder-muted focus:outline-none focus:ring-2 focus:ring-accent"
          />
          <button
            type="submit"
            disabled={!name.trim()}
            className="w-full py-3 px-4 rounded-xl bg-accent text-paper font-medium hover:bg-accent-deep transition-colors disabled:opacity-50"
          >
            Join
          </button>
        </form>
      </div>
    </div>
  )
}
