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

      {/* Plan 09-04 inserts the app description <p> and the 4-step <ol> here, between the hero and the card. Do not place anything else in this slot. */}

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
