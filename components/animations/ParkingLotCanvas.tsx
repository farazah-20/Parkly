'use client'

import { useEffect, useRef } from 'react'

// ─── Colours ──────────────────────────────────────────────────────────────────
const CAR_COLORS = [
  'rgba(147, 197, 253, 0.95)', // sky blue
  'rgba(110, 231, 183, 0.85)', // emerald
  'rgba(253, 224, 71,  0.80)', // yellow
  'rgba(216, 180, 254, 0.85)', // purple
  'rgba(252, 165, 165, 0.80)', // red
  'rgba(255, 255, 255, 0.70)', // white
]

// ─── Types ────────────────────────────────────────────────────────────────────
type Phase = 'entering' | 'turning' | 'parked' | 'reversing' | 'leaving'

interface Car {
  id:             number
  laneY:          number
  spotX:          number
  spotY:          number
  x:              number
  y:              number
  color:          string
  phase:          Phase
  timer:          number
  parkDuration:   number
  speed:          number
  dir:            1 | -1   // horizontal travel direction in lane
}

// ─── Constants ────────────────────────────────────────────────────────────────
const SPACE_W   = 50
const SPACE_H   = 38
const LANE_H    = 56
const ROW_H     = SPACE_H * 2 + LANE_H     // 132
const ROW_GAP   = 18
const CAR_W     = 24                        // car long axis (horizontal)
const CAR_H     = 14                        // car short axis
const CAR_R     = 3                         // corner radius
const LINE_CLR  = 'rgba(147, 197, 253, 0.10)'
const LANE_CLR  = 'rgba(147, 197, 253, 0.05)'
const GLOW_CLR  = 'rgba(147, 197, 253, 0.30)'

export function ParkingLotCanvas() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const rafRef    = useRef<number>(0)
  const carsRef   = useRef<Car[]>([])
  const idRef     = useRef(0)
  const tickRef   = useRef(0)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')!

    // ── resize ────────────────────────────────────────────────────────────────
    const resize = () => {
      canvas.width  = canvas.offsetWidth
      canvas.height = canvas.offsetHeight
      carsRef.current = []              // reset on resize
      seedParkedCars()
    }

    // ── layout helpers ────────────────────────────────────────────────────────
    const rows = (): { laneY: number; topSpotY: number; botSpotY: number }[] => {
      const result = []
      let y = 16
      while (y + ROW_H < canvas.height + 20) {
        const laneY = y + SPACE_H + LANE_H / 2
        result.push({
          laneY,
          topSpotY: laneY - LANE_H / 2 - SPACE_H / 2,
          botSpotY: laneY + LANE_H / 2 + SPACE_H / 2,
        })
        y += ROW_H + ROW_GAP
      }
      return result
    }

    const spotsForRow = (laneY: number, spotY: number): { x: number; y: number }[] => {
      const cols = Math.ceil(canvas.width / SPACE_W) + 1
      return Array.from({ length: cols }, (_, i) => ({ x: i * SPACE_W + SPACE_W / 2, y: spotY }))
    }

    const occupiedKeys = () =>
      new Set(carsRef.current
        .filter(c => c.phase !== 'leaving')
        .map(c => `${Math.round(c.spotX)}|${Math.round(c.spotY)}`))

    // ── seed initial parked cars ───────────────────────────────────────────────
    const seedParkedCars = () => {
      const occ = occupiedKeys()
      for (const row of rows()) {
        for (const spotY of [row.topSpotY, row.botSpotY]) {
          for (const spot of spotsForRow(row.laneY, spotY)) {
            const key = `${Math.round(spot.x)}|${Math.round(spotY)}`
            if (occ.has(key) || Math.random() > 0.55) continue
            occ.add(key)
            carsRef.current.push({
              id:           idRef.current++,
              laneY:        row.laneY,
              spotX:        spot.x,
              spotY,
              x:            spot.x,
              y:            spotY,
              color:        CAR_COLORS[Math.floor(Math.random() * CAR_COLORS.length)],
              phase:        'parked',
              timer:        Math.random() * 400,
              parkDuration: Math.random() * 600 + 200,
              speed:        0,
              dir:          1,
            })
          }
        }
      }
    }

    // ── spawn a new driving car ────────────────────────────────────────────────
    const spawnCar = () => {
      const rList = rows()
      if (!rList.length) return
      const row  = rList[Math.floor(Math.random() * rList.length)]
      const side = Math.random() > 0.5 ? 'top' : 'bot'
      const spotY = side === 'top' ? row.topSpotY : row.botSpotY
      const spots = spotsForRow(row.laneY, spotY)
      const occ   = occupiedKeys()
      const free  = spots.filter(s => !occ.has(`${Math.round(s.x)}|${Math.round(spotY)}`))
      if (!free.length) return
      const spot  = free[Math.floor(Math.random() * free.length)]
      const dir   = (Math.random() > 0.5 ? 1 : -1) as 1 | -1
      carsRef.current.push({
        id:           idRef.current++,
        laneY:        row.laneY,
        spotX:        spot.x,
        spotY,
        x:            dir > 0 ? -CAR_W * 2 : canvas.width + CAR_W * 2,
        y:            row.laneY,
        color:        CAR_COLORS[Math.floor(Math.random() * CAR_COLORS.length)],
        phase:        'entering',
        timer:        0,
        parkDuration: Math.random() * 500 + 180,
        speed:        1.1 + Math.random() * 0.6,
        dir,
      })
    }

    // ── draw background grid ───────────────────────────────────────────────────
    const drawGrid = () => {
      ctx.strokeStyle = LINE_CLR
      ctx.lineWidth   = 1
      ctx.setLineDash([])

      for (const row of rows()) {
        const cols = Math.ceil(canvas.width / SPACE_W) + 1
        for (const baseY of [row.laneY - LANE_H / 2 - SPACE_H, row.laneY + LANE_H / 2]) {
          for (let c = 0; c < cols; c++) {
            ctx.strokeRect(c * SPACE_W, baseY, SPACE_W, SPACE_H)
          }
        }
        // Lane centre dashes
        ctx.setLineDash([6, 14])
        ctx.strokeStyle = LANE_CLR
        ctx.beginPath()
        ctx.moveTo(0, row.laneY)
        ctx.lineTo(canvas.width, row.laneY)
        ctx.stroke()
        ctx.setLineDash([])
        ctx.strokeStyle = LINE_CLR
      }
    }

    // ── draw one car ──────────────────────────────────────────────────────────
    const drawCar = (car: Car) => {
      const vertical = car.phase === 'turning' || car.phase === 'reversing'
      const cw = vertical ? CAR_H : CAR_W
      const ch = vertical ? CAR_W : CAR_H
      const x  = car.x - cw / 2
      const y  = car.y - ch / 2

      // Glow
      ctx.shadowColor = car.color
      ctx.shadowBlur  = 8

      ctx.fillStyle = car.color
      ctx.beginPath()
      ctx.moveTo(x + CAR_R, y)
      ctx.lineTo(x + cw - CAR_R, y)
      ctx.arcTo(x + cw, y,      x + cw, y + CAR_R,      CAR_R)
      ctx.lineTo(x + cw, y + ch - CAR_R)
      ctx.arcTo(x + cw, y + ch, x + cw - CAR_R, y + ch, CAR_R)
      ctx.lineTo(x + CAR_R, y + ch)
      ctx.arcTo(x, y + ch,      x, y + ch - CAR_R,      CAR_R)
      ctx.lineTo(x, y + CAR_R)
      ctx.arcTo(x, y,           x + CAR_R, y,            CAR_R)
      ctx.closePath()
      ctx.fill()

      // Windshield highlight
      ctx.shadowBlur  = 0
      ctx.fillStyle   = 'rgba(255,255,255,0.25)'
      const ww = vertical ? CAR_H * 0.5 : CAR_W * 0.35
      const wh = vertical ? CAR_W * 0.3  : CAR_H * 0.5
      const wx = vertical ? car.x - ww / 2 : (car.dir > 0 ? x + cw - ww - 2 : x + 2)
      const wy = car.y - wh / 2
      ctx.beginPath()
      ctx.roundRect(wx, wy, ww, wh, 2)
      ctx.fill()

      // Headlights
      ctx.shadowColor = GLOW_CLR
      ctx.shadowBlur  = 6
      ctx.fillStyle   = 'rgba(255,255,220,0.9)'
      const hlSize = 2.5
      if (!vertical) {
        const hx = car.dir > 0 ? x + cw - 1 : x + 1
        ctx.beginPath(); ctx.arc(hx, y + ch * 0.28, hlSize, 0, Math.PI * 2); ctx.fill()
        ctx.beginPath(); ctx.arc(hx, y + ch * 0.72, hlSize, 0, Math.PI * 2); ctx.fill()
      }
      ctx.shadowBlur = 0
    }

    // ── update one car's state ────────────────────────────────────────────────
    const updateCar = (car: Car) => {
      car.timer++
      const spd = car.speed

      if (car.phase === 'entering') {
        const dx = car.spotX - car.x
        if (Math.abs(dx) < spd * 1.5) { car.x = car.spotX; car.phase = 'turning'; car.timer = 0 }
        else car.x += Math.sign(dx) * spd * 1.5
      } else if (car.phase === 'turning') {
        const dy = car.spotY - car.y
        if (Math.abs(dy) < spd * 1.2) { car.x = car.spotX; car.y = car.spotY; car.phase = 'parked'; car.timer = 0 }
        else car.y += Math.sign(dy) * spd * 1.1
      } else if (car.phase === 'parked') {
        if (car.timer > car.parkDuration) { car.phase = 'reversing'; car.timer = 0 }
      } else if (car.phase === 'reversing') {
        const dy = car.laneY - car.y
        if (Math.abs(dy) < spd * 1.2) { car.y = car.laneY; car.phase = 'leaving'; car.timer = 0 }
        else car.y += Math.sign(dy) * spd * 1.0
      } else if (car.phase === 'leaving') {
        car.x += car.dir * spd * 1.6
      }
    }

    const isOffScreen = (c: Car) =>
      c.phase === 'leaving' && (c.x < -CAR_W * 3 || c.x > canvas.width + CAR_W * 3)

    // ── main loop ─────────────────────────────────────────────────────────────
    const SPAWN_EVERY = 80

    const loop = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height)
      drawGrid()

      tickRef.current++
      if (tickRef.current % SPAWN_EVERY === 0) spawnCar()

      carsRef.current = carsRef.current.filter(c => !isOffScreen(c))

      // Parked cars first (below), then moving cars (above)
      const parked  = carsRef.current.filter(c => c.phase === 'parked')
      const moving  = carsRef.current.filter(c => c.phase !== 'parked')
      parked.forEach(updateCar)
      parked.forEach(drawCar)
      moving.forEach(updateCar)
      moving.forEach(drawCar)

      rafRef.current = requestAnimationFrame(loop)
    }

    resize()
    loop()

    const ro = new ResizeObserver(resize)
    ro.observe(canvas)

    return () => {
      cancelAnimationFrame(rafRef.current)
      ro.disconnect()
    }
  }, [])

  return (
    <canvas
      ref={canvasRef}
      className="absolute inset-0 h-full w-full pointer-events-none"
      style={{ opacity: 0.28 }}
      aria-hidden
    />
  )
}
