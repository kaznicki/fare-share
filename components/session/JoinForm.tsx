'use client'
import { useState } from 'react'

interface Props {
  onSubmit: (name: string) => void
}

export default function JoinForm({ onSubmit }: Props) {
  const [name, setName] = useState('')

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim()) return
    onSubmit(name.trim())
  }

  return (
    <div className="max-w-sm mx-auto w-full">
      <div className="bg-white rounded-2xl shadow-md p-6 flex flex-col gap-4">
        <h1 className="text-2xl font-bold text-center">Join the table</h1>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <input
            type="text"
            placeholder="Your name"
            autoFocus
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full py-3 px-4 rounded-xl border border-gray-200 text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <button
            type="submit"
            disabled={!name.trim()}
            className="w-full py-3 px-4 rounded-xl bg-blue-600 text-white font-medium hover:bg-blue-700 transition-colors disabled:opacity-50"
          >
            Join
          </button>
        </form>
      </div>
    </div>
  )
}
