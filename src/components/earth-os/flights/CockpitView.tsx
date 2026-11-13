'use client'

import { useEffect, useRef } from 'react'
import { useEarthOsStore } from '@/stores/earth-os'

export function CockpitView() {
  const {
    cockpitViewOpen,
    setCockpitViewOpen,
    selectedFlight,
  } = useEarthOsStore()

  const canvasRef = useRef<HTMLCanvasElement | null>(null)
  const animRef = useRef<number | null>(null)

  // Listen for Escape key
  useEffect(() => {
    if (!cockpitViewOpen) return
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setCockpitViewOpen(false)
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [cockpitViewOpen, setCockpitViewOpen])

  // Canvas 3D Perspective Flight Renderer
  useEffect(() => {
    if (!cockpitViewOpen || !selectedFlight) return

    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    let width = (canvas.width = window.innerWidth)
    let height = (canvas.height = window.innerHeight)

    const handleResize = () => {
      if (!canvas) return
      width = canvas.width = window.innerWidth
      height = canvas.height = window.innerHeight
    }
    window.addEventListener('resize', handleResize)

    let forwardOffset = 0
    const heading = selectedFlight.heading || 0
    const altitude = selectedFlight.altitudeFeet || 25000
    const speed = selectedFlight.groundSpeedKnots || 450
    const verticalRate = selectedFlight.verticalRateFpm || 0

    // Pitch derived smoothly from vertical rate (approx 1° per 300 fpm)
    const pitchDeg = Math.max(-12, Math.min(15, verticalRate / 250))
    // Bank angle subtle simulation
    const bankDeg = 0

    const render = () => {
      forwardOffset = (forwardOffset + (speed * 0.05)) % 100

      ctx.clearRect(0, 0, width, height)

      const horizonY = height * 0.5 - (pitchDeg * (height / 60))

      // ─── 1. Sky & Atmosphere Gradient ─────────────────────────────────────
      const skyGrad = ctx.createLinearGradient(0, 0, 0, horizonY)
      if (altitude > 30000) {
        skyGrad.addColorStop(0, '#020617') // deep stratosphere
        skyGrad.addColorStop(0.6, '#0f172a')
        skyGrad.addColorStop(1, '#38bdf8') // atmospheric horizon haze
      } else {
        skyGrad.addColorStop(0, '#0369a1')
        skyGrad.addColorStop(0.7, '#38bdf8')
        skyGrad.addColorStop(1, '#bae6fd')
      }
      ctx.fillStyle = skyGrad
      ctx.fillRect(0, 0, width, horizonY)

      // ─── 2. Terrain / Earth Surface Perspective ───────────────────────────
      const groundGrad = ctx.createLinearGradient(0, horizonY, 0, height)
      groundGrad.addColorStop(0, '#064e3b') // dark forest / terrain
      groundGrad.addColorStop(0.3, '#065f46')
      groundGrad.addColorStop(1, '#022c22')
      ctx.fillStyle = groundGrad
      ctx.fillRect(0, horizonY, width, height - horizonY)

      // Dynamic Perspective Grid Lines (Simulation of motion)
      ctx.save()
      ctx.strokeStyle = 'rgba(52, 211, 153, 0.15)'
      ctx.lineWidth = 1

      // Horizon line
      ctx.beginPath()
      ctx.moveTo(0, horizonY)
      ctx.lineTo(width, horizonY)
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.4)'
      ctx.lineWidth = 1.5
      ctx.stroke()

      // Perspective longitudinal lines radiating from vanishing point
      const vpX = width / 2
      const vpY = horizonY
      for (let x = -width; x <= width * 2; x += 120) {
        ctx.beginPath()
        ctx.moveTo(vpX, vpY)
        ctx.lineTo(x, height)
        ctx.strokeStyle = 'rgba(16, 185, 129, 0.12)'
        ctx.stroke()
      }

      // Moving transverse distance rings
      for (let i = 1; i < 15; i++) {
        const factor = Math.pow((i + (forwardOffset / 100)) / 15, 2.5)
        const y = horizonY + factor * (height - horizonY)
        ctx.beginPath()
        ctx.moveTo(0, y)
        ctx.lineTo(width, y)
        ctx.strokeStyle = `rgba(16, 185, 129, ${0.05 + factor * 0.15})`
        ctx.stroke()
      }
      ctx.restore()

      // ─── 3. Synthetic Primary Flight Display (PFD) HUD Overlay ────────────
      const cx = width / 2
      const cy = height / 2

      ctx.save()
      ctx.strokeStyle = '#00ff66'
      ctx.fillStyle = '#00ff66'
      ctx.lineWidth = 2
      ctx.font = '12px "SF Mono", monospace'

      // Aircraft Boresight / Symbol (Yellow Center Crosshair)
      ctx.strokeStyle = '#ffd60a'
      ctx.lineWidth = 3
      ctx.beginPath()
      // Left wing
      ctx.moveTo(cx - 60, cy)
      ctx.lineTo(cx - 20, cy)
      ctx.lineTo(cx - 20, cy + 10)
      // Right wing
      ctx.moveTo(cx + 60, cy)
      ctx.lineTo(cx + 20, cy)
      ctx.lineTo(cx + 20, cy + 10)
      // Center dot
      ctx.stroke()
      ctx.beginPath()
      ctx.arc(cx, cy, 3, 0, Math.PI * 2)
      ctx.fillStyle = '#ffd60a'
      ctx.fill()

      // Pitch Ladder Lines
      ctx.strokeStyle = 'rgba(0, 255, 102, 0.75)'
      ctx.lineWidth = 1.5
      ctx.fillStyle = '#00ff66'
      ctx.font = '10px monospace'
      ctx.textAlign = 'right'

      for (let p = -20; p <= 20; p += 5) {
        if (p === 0) continue
        const lineY = horizonY + p * (height / 60)
        if (lineY < 120 || lineY > height - 120) continue

        const halfWidth = Math.abs(p) % 10 === 0 ? 50 : 30
        ctx.beginPath()
        ctx.moveTo(cx - halfWidth, lineY)
        ctx.lineTo(cx - 15, lineY)
        ctx.moveTo(cx + 15, lineY)
        ctx.lineTo(cx + halfWidth, lineY)
        ctx.stroke()

        ctx.fillText(`${Math.abs(p)}`, cx - halfWidth - 5, lineY + 3)
      }

      // ─── 4. Top Heading Compass Tape ──────────────────────────────────────
      const tapeY = 60
      const tapeWidth = 360
      ctx.fillStyle = 'rgba(5, 10, 20, 0.65)'
      ctx.fillRect(cx - tapeWidth / 2, tapeY - 24, tapeWidth, 34)
      ctx.strokeStyle = 'rgba(0, 255, 102, 0.4)'
      ctx.strokeRect(cx - tapeWidth / 2, tapeY - 24, tapeWidth, 34)

      // Center lubber line
      ctx.beginPath()
      ctx.moveTo(cx, tapeY + 12)
      ctx.lineTo(cx - 6, tapeY + 20)
      ctx.lineTo(cx + 6, tapeY + 20)
      ctx.closePath()
      ctx.fillStyle = '#ffd60a'
      ctx.fill()

      // Degree tick marks
      ctx.textAlign = 'center'
      ctx.fillStyle = '#00ff66'
      ctx.font = '11px monospace'

      for (let deg = heading - 40; deg <= heading + 40; deg += 5) {
        const normalized = ((Math.round(deg) % 360) + 360) % 360
        const xOffset = cx + (deg - heading) * 4
        if (xOffset < cx - tapeWidth / 2 || xOffset > cx + tapeWidth / 2) continue

        ctx.beginPath()
        ctx.moveTo(xOffset, tapeY - 20)
        ctx.lineTo(xOffset, tapeY - (normalized % 10 === 0 ? 8 : 14))
        ctx.strokeStyle = '#00ff66'
        ctx.stroke()

        if (normalized % 10 === 0) {
          const label = normalized === 0 ? 'N' : normalized === 90 ? 'E' : normalized === 180 ? 'S' : normalized === 270 ? 'W' : `${normalized / 10}`
          ctx.fillText(label, xOffset, tapeY - 2)
        }
      }

      // ─── 5. Airspeed Tape (Left) ──────────────────────────────────────────
      const speedX = cx - 220
      const speedBoxH = 220
      ctx.fillStyle = 'rgba(5, 10, 20, 0.65)'
      ctx.fillRect(speedX - 60, cy - speedBoxH / 2, 60, speedBoxH)
      ctx.strokeStyle = 'rgba(0, 255, 102, 0.4)'
      ctx.strokeRect(speedX - 60, cy - speedBoxH / 2, 60, speedBoxH)

      // Current Speed Window Indicator
      ctx.fillStyle = 'rgba(0, 20, 10, 0.9)'
      ctx.fillRect(speedX - 66, cy - 14, 66, 28)
      ctx.strokeStyle = '#00ff66'
      ctx.strokeRect(speedX - 66, cy - 14, 66, 28)
      ctx.fillStyle = '#ffffff'
      ctx.font = 'bold 13px monospace'
      ctx.textAlign = 'right'
      ctx.fillText(`${speed} KT`, speedX - 6, cy + 4)

      // ─── 6. Altitude Tape (Right) ─────────────────────────────────────────
      const altX = cx + 220
      const altBoxH = 220
      ctx.fillStyle = 'rgba(5, 10, 20, 0.65)'
      ctx.fillRect(altX, cy - altBoxH / 2, 74, altBoxH)
      ctx.strokeStyle = 'rgba(0, 255, 102, 0.4)'
      ctx.strokeRect(altX, cy - altBoxH / 2, 74, altBoxH)

      // Current Altitude Window Indicator
      ctx.fillStyle = 'rgba(0, 20, 10, 0.9)'
      ctx.fillRect(altX, cy - 14, 78, 28)
      ctx.strokeStyle = '#00ff66'
      ctx.strokeRect(altX, cy - 14, 78, 28)
      ctx.fillStyle = '#ffffff'
      ctx.font = 'bold 13px monospace'
      ctx.textAlign = 'left'
      ctx.fillText(`${altitude}`, altX + 6, cy + 4)

      ctx.restore()

      animRef.current = requestAnimationFrame(render)
    }

    render()

    return () => {
      window.removeEventListener('resize', handleResize)
      if (animRef.current) cancelAnimationFrame(animRef.current)
    }
  }, [cockpitViewOpen, selectedFlight])

  if (!cockpitViewOpen || !selectedFlight) return null

  const flight = selectedFlight

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 200,
        background: '#000000',
        overflow: 'hidden',
        userSelect: 'none',
      }}
      aria-label="Simulated Cockpit View"
    >
      {/* 3D Canvas Perspective */}
      <canvas
        ref={canvasRef}
        style={{
          width: '100%',
          height: '100%',
          display: 'block',
        }}
      />

      {/* Top Banner Notice: Clear Identification of Simulation */}
      <div
        style={{
          position: 'absolute',
          top: 14,
          left: '50%',
          transform: 'translateX(-50%)',
          background: 'var(--md-sys-color-surface-container)',
          border: '1px solid var(--md-sys-color-outline-variant)',
          padding: '6px 16px',
          borderRadius: 9999,
          display: 'flex',
          alignItems: 'center',
          gap: 10,
          color: 'var(--eos-text-primary)',
          fontSize: 11,
          fontWeight: 600,
          letterSpacing: '0.04em',
          boxShadow: '0 8px 24px rgba(0, 0, 0, 0.5)',
        }}
      >
        <span style={{ color: 'var(--eos-cyan)' }}>● SIMULATED COCKPIT PERSPECTIVE</span>
        <span style={{ color: 'var(--eos-text-tertiary)' }}>|</span>
        <span style={{ color: 'var(--eos-text-secondary)', fontWeight: 500 }}>
          {flight.callsign} · {flight.airline} · {flight.aircraftType || 'Jet'}
        </span>
      </div>

      {/* Exit Button */}
      <button
        onClick={() => setCockpitViewOpen(false)}
        style={{
          position: 'absolute',
          top: 16,
          right: 20,
          background: 'var(--md-sys-color-surface-container)',
          border: '1px solid var(--md-sys-color-outline-variant)',
          color: 'var(--md-sys-color-on-surface)',
          padding: '8px 16px',
          borderRadius: 'var(--md-sys-shape-corner-full)',
          fontSize: 12.5,
          fontWeight: 600,
          display: 'flex',
          alignItems: 'center',
          gap: 8,
          cursor: 'pointer',
          boxShadow: 'var(--md-sys-elevation-2)',
          transition: 'all 180ms ease',
        }}
      >
        <span>Exit Cockpit (Esc)</span>
        <span style={{ fontSize: 14 }}>✕</span>
      </button>

      {/* Bottom Live Flight Telemetry Deck */}
      <div
        style={{
          position: 'absolute',
          bottom: 24,
          left: '50%',
          transform: 'translateX(-50%)',
          background: 'var(--md-sys-color-surface-container)',
          border: '1px solid var(--md-sys-color-outline-variant)',
          borderRadius: 'var(--md-sys-shape-corner-large)',
          padding: '12px 24px',
          display: 'flex',
          alignItems: 'center',
          gap: 24,
          boxShadow: 'var(--md-sys-elevation-3)',
          fontFamily: 'var(--eos-font-mono)',
          fontSize: 12,
        }}
      >
        <div>
          <div style={{ fontSize: 10, textTransform: 'uppercase', color: 'var(--md-sys-color-outline)' }}>POS</div>
          <div style={{ color: 'var(--md-sys-color-primary)', fontWeight: 600 }}>
            {flight.latitude.toFixed(3)}°N {flight.longitude.toFixed(3)}°E
          </div>
        </div>

        <div style={{ width: 1, height: 24, background: 'var(--md-sys-color-outline-variant)' }} />

        <div>
          <div style={{ fontSize: 10, textTransform: 'uppercase', color: 'var(--md-sys-color-outline)' }}>TRK / HDG</div>
          <div style={{ color: 'var(--md-sys-color-primary)', fontWeight: 600 }}>
            {flight.heading ?? '—'}° TRUE
          </div>
        </div>

        <div style={{ width: 1, height: 24, background: 'var(--md-sys-color-outline-variant)' }} />

        <div>
          <div style={{ fontSize: 10, textTransform: 'uppercase', color: 'var(--md-sys-color-outline)' }}>GND SPD</div>
          <div style={{ color: 'var(--md-sys-color-primary)', fontWeight: 600 }}>
            {flight.groundSpeedKnots ?? 0} KT ({flight.groundSpeedKmh ?? 0} KM/H)
          </div>
        </div>

        <div style={{ width: 1, height: 24, background: 'var(--md-sys-color-outline-variant)' }} />

        <div>
          <div style={{ fontSize: 10, textTransform: 'uppercase', color: 'var(--md-sys-color-outline)' }}>ALT MSL</div>
          <div style={{ color: 'var(--md-sys-color-primary)', fontWeight: 600 }}>
            {flight.altitudeFeet?.toLocaleString() ?? 0} FT
          </div>
        </div>

        <div style={{ width: 1, height: 24, background: 'var(--md-sys-color-outline-variant)' }} />

        <div>
          <div style={{ fontSize: 10, textTransform: 'uppercase', color: 'var(--md-sys-color-outline)' }}>VSI</div>
          <div style={{ color: 'var(--md-sys-color-primary)', fontWeight: 600 }}>
            {flight.verticalRateFpm != null ? `${flight.verticalRateFpm > 0 ? '+' : ''}${flight.verticalRateFpm}` : '0'} FPM
          </div>
        </div>

        <div style={{ width: 1, height: 24, background: 'var(--md-sys-color-outline-variant)' }} />

        <div>
          <div style={{ fontSize: 10, textTransform: 'uppercase', color: 'var(--md-sys-color-outline)' }}>SQUAWK</div>
          <div style={{ color: 'var(--md-sys-color-warning)', fontWeight: 600 }}>
            {flight.squawk || '7000'}
          </div>
        </div>
      </div>
    </div>
  )
}
export default CockpitView
