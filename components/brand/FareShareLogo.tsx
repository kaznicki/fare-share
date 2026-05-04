'use client'

interface Props {
  size?: number
  className?: string
}

export default function FareShareLogo({ size = 32, className }: Props) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 96 96"
      fill="none"
      className={className}
      role="img"
      aria-label="Fare Share"
    >
      <path
        d="M22 10 L22 78 L28 74 L34 78 L40 74 L46 78 L52 74 L58 78 L64 74 L70 78 L70 10 Z"
        fill="var(--paper, #FAF7F2)"
        stroke="var(--ink, #1A1714)"
        strokeWidth="3"
        strokeLinejoin="round"
      />
      <path
        d="M46 6 L46 82"
        stroke="var(--accent, #C75B3D)"
        strokeWidth="3"
        strokeLinecap="round"
        strokeDasharray="2 4"
      />
      <path
        d="M28 24 L40 24 M52 24 L64 24"
        stroke="var(--ink, #1A1714)"
        strokeWidth="2"
        strokeLinecap="round"
      />
      <path
        d="M28 34 L42 34 M52 34 L62 34"
        stroke="var(--ink, #1A1714)"
        strokeWidth="2"
        strokeLinecap="round"
      />
      <path
        d="M28 44 L38 44 M52 44 L64 44"
        stroke="var(--ink, #1A1714)"
        strokeWidth="2"
        strokeLinecap="round"
      />
      <path
        d="M28 58 L42 58 M52 58 L64 58"
        stroke="var(--accent, #C75B3D)"
        strokeWidth="3"
        strokeLinecap="round"
      />
    </svg>
  )
}
