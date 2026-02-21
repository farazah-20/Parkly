'use client'

import { useRef, useState, useCallback } from 'react'
import { RotateCcw, Download, Pen } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface SignatureCanvasProps {
  onSave: (dataUrl: string) => void
  width?:  number
  height?: number
  label?:  string
}

export function SignatureCanvas({
  onSave,
  width  = 600,
  height = 200,
  label  = 'Unterschrift des Kunden',
}: SignatureCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [drawing,  setDrawing]  = useState(false)
  const [hasLines, setHasLines] = useState(false)
  const [saved,    setSaved]    = useState(false)

  // ── Drawing helpers ─────────────────────────────────────────────────────────
  const getPos = (e: React.MouseEvent | React.TouchEvent, canvas: HTMLCanvasElement) => {
    const rect = canvas.getBoundingClientRect()
    const scaleX = canvas.width  / rect.width
    const scaleY = canvas.height / rect.height

    if ('touches' in e) {
      const touch = e.touches[0]
      return {
        x: (touch.clientX - rect.left) * scaleX,
        y: (touch.clientY - rect.top)  * scaleY,
      }
    }
    return {
      x: (e.clientX - rect.left) * scaleX,
      y: (e.clientY - rect.top)  * scaleY,
    }
  }

  const startDraw = useCallback((e: React.MouseEvent | React.TouchEvent) => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return
    e.preventDefault()
    const { x, y } = getPos(e, canvas)
    ctx.beginPath()
    ctx.moveTo(x, y)
    setDrawing(true)
    setSaved(false)
  }, [])

  const draw = useCallback((e: React.MouseEvent | React.TouchEvent) => {
    if (!drawing) return
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return
    e.preventDefault()
    const { x, y } = getPos(e, canvas)
    ctx.lineWidth   = 2
    ctx.lineCap     = 'round'
    ctx.strokeStyle = '#1d4ed8'
    ctx.lineTo(x, y)
    ctx.stroke()
    setHasLines(true)
  }, [drawing])

  const stopDraw = useCallback(() => setDrawing(false), [])

  const clear = () => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return
    ctx.clearRect(0, 0, canvas.width, canvas.height)
    setHasLines(false)
    setSaved(false)
  }

  const save = () => {
    const canvas = canvasRef.current
    if (!canvas || !hasLines) return
    const dataUrl = canvas.toDataURL('image/png')
    onSave(dataUrl)
    setSaved(true)
  }

  return (
    <div className="flex flex-col gap-3">
      {label && (
        <label className="flex items-center gap-2 text-sm font-medium text-gray-700">
          <Pen className="h-4 w-4 text-gray-400" />
          {label}
        </label>
      )}

      <div className="overflow-hidden rounded-lg border-2 border-dashed border-gray-300 bg-white">
        <canvas
          ref={canvasRef}
          width={width}
          height={height}
          className="w-full touch-none cursor-crosshair"
          style={{ aspectRatio: `${width}/${height}` }}
          onMouseDown={startDraw}
          onMouseMove={draw}
          onMouseUp={stopDraw}
          onMouseLeave={stopDraw}
          onTouchStart={startDraw}
          onTouchMove={draw}
          onTouchEnd={stopDraw}
        />
        {!hasLines && (
          <p className="pointer-events-none absolute inset-0 flex items-center justify-center text-sm text-gray-400 select-none">
            Hier unterschreiben
          </p>
        )}
      </div>

      <div className="flex items-center gap-2">
        <Button variant="outline" size="sm" onClick={clear} disabled={!hasLines}>
          <RotateCcw className="h-4 w-4" />
          Löschen
        </Button>
        <Button size="sm" onClick={save} disabled={!hasLines} variant={saved ? 'secondary' : 'primary'}>
          <Download className="h-4 w-4" />
          {saved ? 'Gespeichert ✓' : 'Unterschrift speichern'}
        </Button>
      </div>
    </div>
  )
}
