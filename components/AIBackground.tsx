'use client'
import { useEffect, useRef } from 'react'

interface Node {
  x: number; y: number
  vx: number; vy: number
  r: number
  pulse: number
  pulseSpeed: number
}

interface Particle {
  x: number; y: number
  vy: number
  opacity: number
  char: string
  fontSize: number
  color: string
}

const CODE_CHARS = '01アイウエオ{}[]()<>/\\|#@!?=+'

export default function AIBackground() {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    let animId: number
    let W = 0, H = 0

    // — Theme-aware colours (reads CSS variables) —
    const getAccent  = () => getComputedStyle(document.documentElement).getPropertyValue('--accent').trim()  || '#e11d48'
    const getAccent2 = () => getComputedStyle(document.documentElement).getPropertyValue('--accent2').trim() || '#fb7185'
    const getGold    = () => getComputedStyle(document.documentElement).getPropertyValue('--gold').trim()    || '#f59e0b'

    // — Neural nodes —
    const NODES = 38
    const nodes: Node[] = []

    // — Matrix rain drops —
    const DROPS = 28
    const particles: Particle[] = []

    const resize = () => {
      W = canvas.width  = window.innerWidth
      H = canvas.height = window.innerHeight

      // Re-init nodes on resize
      nodes.length = 0
      for (let i = 0; i < NODES; i++) {
        nodes.push({
          x: Math.random() * W,
          y: Math.random() * H,
          vx: (Math.random() - 0.5) * 0.35,
          vy: (Math.random() - 0.5) * 0.35,
          r:  Math.random() * 2.5 + 1.5,
          pulse: Math.random() * Math.PI * 2,
          pulseSpeed: Math.random() * 0.02 + 0.008,
        })
      }

      // Re-init matrix particles
      particles.length = 0
      for (let i = 0; i < DROPS; i++) {
        particles.push({
          x: Math.random() * W,
          y: Math.random() * H * 1.5 - H * 0.25,
          vy: Math.random() * 0.8 + 0.3,
          opacity: Math.random() * 0.18 + 0.04,
          char: CODE_CHARS[Math.floor(Math.random() * CODE_CHARS.length)],
          fontSize: Math.random() * 8 + 9,
          color: Math.random() > 0.5 ? 'accent' : 'gold',
        })
      }
    }

    const draw = () => {
      ctx.clearRect(0, 0, W, H)

      const accent  = getAccent()
      const accent2 = getAccent2()
      const gold    = getGold()

      // — Matrix rain characters —
      for (const p of particles) {
        p.y += p.vy
        if (p.y > H + 20) {
          p.y = -20
          p.x = Math.random() * W
          p.char = CODE_CHARS[Math.floor(Math.random() * CODE_CHARS.length)]
        }
        // Randomly flicker character
        if (Math.random() < 0.01) {
          p.char = CODE_CHARS[Math.floor(Math.random() * CODE_CHARS.length)]
        }
        const col = p.color === 'accent' ? accent : gold
        ctx.save()
        ctx.globalAlpha = p.opacity
        ctx.fillStyle = col
        ctx.font = `${p.fontSize}px 'JetBrains Mono', monospace`
        ctx.fillText(p.char, p.x, p.y)
        ctx.restore()
      }

      // — Node connections —
      const MAX_DIST = Math.min(W, H) * 0.22
      for (let i = 0; i < nodes.length; i++) {
        for (let j = i + 1; j < nodes.length; j++) {
          const dx = nodes[i].x - nodes[j].x
          const dy = nodes[i].y - nodes[j].y
          const dist = Math.sqrt(dx * dx + dy * dy)
          if (dist < MAX_DIST) {
            const alpha = (1 - dist / MAX_DIST) * 0.22
            ctx.save()
            ctx.globalAlpha = alpha
            // Alternate connection colour between accent and gold
            const useGold = (i + j) % 3 === 0
            ctx.strokeStyle = useGold ? gold : accent
            ctx.lineWidth = 0.6
            ctx.beginPath()
            ctx.moveTo(nodes[i].x, nodes[i].y)
            ctx.lineTo(nodes[j].x, nodes[j].y)
            ctx.stroke()
            ctx.restore()
          }
        }
      }

      // — Neural nodes —
      for (const n of nodes) {
        // Move
        n.x += n.vx
        n.y += n.vy
        n.pulse += n.pulseSpeed
        // Bounce off walls
        if (n.x < 0 || n.x > W) n.vx *= -1
        if (n.y < 0 || n.y > H) n.vy *= -1
        n.x = Math.max(0, Math.min(W, n.x))
        n.y = Math.max(0, Math.min(H, n.y))

        const glow = Math.sin(n.pulse) * 0.5 + 0.5   // 0–1
        const outerR = n.r * (2.5 + glow * 2)

        // Outer glow ring
        const grad = ctx.createRadialGradient(n.x, n.y, 0, n.x, n.y, outerR)
        const col = (n.pulse % (Math.PI * 2)) < Math.PI ? accent2 : gold
        grad.addColorStop(0,   col + 'aa')
        grad.addColorStop(0.4, col + '44')
        grad.addColorStop(1,   col + '00')
        ctx.save()
        ctx.globalAlpha = 0.55 + glow * 0.3
        ctx.beginPath()
        ctx.arc(n.x, n.y, outerR, 0, Math.PI * 2)
        ctx.fillStyle = grad
        ctx.fill()
        ctx.restore()

        // Core dot
        ctx.save()
        ctx.globalAlpha = 0.75 + glow * 0.25
        ctx.beginPath()
        ctx.arc(n.x, n.y, n.r, 0, Math.PI * 2)
        ctx.fillStyle = col
        ctx.shadowBlur = 8
        ctx.shadowColor = col
        ctx.fill()
        ctx.restore()
      }

      animId = requestAnimationFrame(draw)
    }

    resize()
    window.addEventListener('resize', resize)
    draw()

    return () => {
      cancelAnimationFrame(animId)
      window.removeEventListener('resize', resize)
    }
  }, [])

  return (
    <canvas
      ref={canvasRef}
      className="absolute inset-0 w-full h-full pointer-events-none"
      style={{ zIndex: 0, opacity: 0.65 }}
    />
  )
}
