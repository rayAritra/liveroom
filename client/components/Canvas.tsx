'use client'

import { useEffect, useRef, useCallback } from 'react'
import socket from '@/lib/socket'

type Tool = 'pen' | 'eraser'

type DrawEvent = {
  x0: number; y0: number
  x1: number; y1: number
  color: string; size: number
  roomId: string
}

type Props = {
  roomId: string
  tool: Tool
  color: string
  size: number
  onClearTrigger: number
}
export default function Canvas({ roomId, tool, color, size, onClearTrigger }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const drawing = useRef(false)
  const lastPos = useRef({ x: 0, y: 0 })

  const getCtx = () => canvasRef.current?.getContext('2d') ?? null

  const drawSegment = useCallback((
    ctx: CanvasRenderingContext2D,
    x0: number, y0: number,
    x1: number, y1: number,
    col: string, sz: number
  ) => {
    ctx.beginPath()
    ctx.moveTo(x0, y0)
    ctx.lineTo(x1, y1)
    ctx.strokeStyle = col
    ctx.lineWidth = sz
    ctx.lineCap = 'round'
    ctx.lineJoin = 'round'
    ctx.stroke()
  }, [])

    useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    canvas.width = canvas.offsetWidth
    canvas.height = canvas.offsetHeight
    const ctx = getCtx()
    if (ctx) {
      ctx.fillStyle = '#030712'
      ctx.fillRect(0, 0, canvas.width, canvas.height)
    }

    const handleResize = () => {
      if (!canvas) return
      const imageData = ctx?.getImageData(0, 0, canvas.width, canvas.height)
      canvas.width = canvas.offsetWidth
      canvas.height = canvas.offsetHeight
      if (imageData) ctx?.putImageData(imageData, 0, 0)
    }
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])
useEffect(() => {
    const ctx = getCtx()
    const canvas = canvasRef.current
    if (!ctx || !canvas) return
    ctx.fillStyle = '#030712'
    ctx.fillRect(0, 0, canvas.width, canvas.height)
    socket.emit('clear-canvas', { roomId })
  }, [onClearTrigger, roomId])

  useEffect(() => {
    socket.on('draw', (data: DrawEvent) => {
      const ctx = getCtx()
      if (!ctx) return
      drawSegment(ctx, data.x0, data.y0, data.x1, data.y1, data.color, data.size)
    })

    socket.on('clear-canvas', () => {
      const ctx = getCtx()
      const canvas = canvasRef.current
      if (!ctx || !canvas) return
      ctx.fillStyle = '#030712'
      ctx.fillRect(0, 0, canvas.width, canvas.height)
    })
 return () => {
      socket.off('draw')
      socket.off('clear-canvas')
    }
  }, [drawSegment])

  const getPos = (e: React.MouseEvent | React.TouchEvent) => {
    const canvas = canvasRef.current!
    const rect = canvas.getBoundingClientRect()
    if ('touches' in e) {
      return {
        x: e.touches[0].clientX - rect.left,
        y: e.touches[0].clientY - rect.top,
      }
    }
    return { x: e.clientX - rect.left, y: e.clientY - rect.top }
  }

  const startDraw = (e: React.MouseEvent | React.TouchEvent) => {
    drawing.current = true
    lastPos.current = getPos(e)
  }
   const draw = (e: React.MouseEvent | React.TouchEvent) => {
    if (!drawing.current) return
    const ctx = getCtx()
    if (!ctx) return

    const pos = getPos(e)
    const drawColor = tool === 'eraser' ? '#030712' : color
    const drawSize = tool === 'eraser' ? size * 4 : size

    drawSegment(ctx, lastPos.current.x, lastPos.current.y, pos.x, pos.y, drawColor, drawSize)

    socket.emit('draw', {
      x0: lastPos.current.x, y0: lastPos.current.y,
      x1: pos.x, y1: pos.y,
      color: drawColor, size: drawSize,
      roomId,
    })

    lastPos.current = pos
  }

  const stopDraw = () => { drawing.current = false }

  return (
    <canvas
      ref={canvasRef}
      className="w-full h-full touch-none cursor-crosshair"
      onMouseDown={startDraw}
      onMouseMove={draw}
      onMouseUp={stopDraw}
      onMouseLeave={stopDraw}
      onTouchStart={startDraw}
      onTouchMove={draw}
      onTouchEnd={stopDraw}
    />
  )
}