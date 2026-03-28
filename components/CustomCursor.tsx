'use client'
import { useEffect, useState } from 'react'
export default function CustomCursor() {
  const [pos, setPos] = useState({ x: -100, y: -100 })
  useEffect(() => {
    const move = (e: MouseEvent) => setPos({ x: e.clientX, y: e.clientY })
    window.addEventListener('mousemove', move)
    return () => window.removeEventListener('mousemove', move)
  }, [])
  return <div className="cursor-dot hidden md:block" style={{ left: pos.x, top: pos.y }} />
}
