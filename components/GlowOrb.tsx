'use client'
interface Props { className?: string; color?: string; blur?: number }
export default function GlowOrb({ className='', color='#6366f1', blur=80 }: Props) {
  return (
    <div className={`absolute rounded-full pointer-events-none ${className}`}
      style={{ background: `radial-gradient(circle, ${color}1a 0%, transparent 70%)`, filter: `blur(${blur}px)` }} />
  )
}
