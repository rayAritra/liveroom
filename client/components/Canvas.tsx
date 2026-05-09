'use client'

import { useEffect, useRef, useCallback, useState } from 'react'
import socket from '@/lib/socket'
import { v4 as uuidv4 } from 'uuid'

type Tool = 'pen' | 'eraser' | 'cursor'

type DrawEvent = {
  x0: number; y0: number
  x1: number; y1: number
  color: string; size: number
  roomId: string
  strokeId: string
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
  const currentStrokeId = useRef<string | null>(null)
  const myStrokeIds = useRef<string[]>([])
  const allDrawings = useRef<DrawEvent[]>([])
  const [isEmpty, setIsEmpty] = useState(true)

  const getCtx = () => canvasRef.current?.getContext('2d') ?? null

  const drawDotGrid = useCallback((ctx: CanvasRenderingContext2D, width: number, height: number) => {
    ctx.fillStyle = '#f8f9fa'
    ctx.fillRect(0, 0, width, height)
    ctx.fillStyle = '#d0d0d0'
    for (let x = 0; x < width; x += 20) {
      for (let y = 0; y < height; y += 20) {
        ctx.beginPath()
        ctx.arc(x, y, 0.8, 0, Math.PI * 2)
        ctx.fill()
      }
    }
  }, [])

  const drawSegment = useCallback((
    ctx: CanvasRenderingContext2D,
    x0: number, y0: number,
    x1: number, y1: number,
    col: string, sz: number
  ) => {
    ctx.globalCompositeOperation = 'source-over'
    ctx.beginPath()
    ctx.moveTo(x0, y0)
    ctx.lineTo(x1, y1)
    ctx.strokeStyle = col
    ctx.lineWidth = sz
    ctx.lineCap = 'round'
    ctx.lineJoin = 'round'
    ctx.stroke()
  }, [])

  const redrawCanvas = useCallback(() => {
    const canvas = canvasRef.current
    const ctx = getCtx()
    if (!canvas || !ctx) return
    
    drawDotGrid(ctx, canvas.width, canvas.height)
    
    allDrawings.current.forEach((data) => {
      drawSegment(ctx, data.x0, data.y0, data.x1, data.y1, data.color, data.size)
    })
    setIsEmpty(allDrawings.current.length === 0)
  }, [drawDotGrid, drawSegment])

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    canvas.width = canvas.offsetWidth
    canvas.height = canvas.offsetHeight
    const ctx = getCtx()
    if (ctx) {
      drawDotGrid(ctx, canvas.width, canvas.height)
    }

    const handleResize = () => {
      if (!canvas) return
      canvas.width = canvas.offsetWidth
      canvas.height = canvas.offsetHeight
      redrawCanvas()
    }
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [drawDotGrid, redrawCanvas])

  useEffect(() => {
    if (onClearTrigger > 0) {
      allDrawings.current = []
      myStrokeIds.current = []
      redrawCanvas()
      socket.emit('clear-canvas', { roomId })
    }
  }, [onClearTrigger, roomId, redrawCanvas])

  useEffect(() => {
    const handleDraw = (data: DrawEvent) => {
      allDrawings.current.push(data)
      setIsEmpty(false)
      const ctx = getCtx()
      if (ctx) {
        drawSegment(ctx, data.x0, data.y0, data.x1, data.y1, data.color, data.size)
      }
    }

    const handleCanvasState = (drawings: DrawEvent[]) => {
      allDrawings.current = drawings
      redrawCanvas()
    }

    const handleClearCanvas = () => {
      allDrawings.current = []
      redrawCanvas()
    }

    const handleUndo = (strokeId: string) => {
      allDrawings.current = allDrawings.current.filter(d => d.strokeId !== strokeId)
      redrawCanvas()
    }

    socket.on('draw', handleDraw)
    socket.on('canvas-state', handleCanvasState)
    socket.on('clear-canvas', handleClearCanvas)
    socket.on('undo', handleUndo)

    return () => {
      socket.off('draw', handleDraw)
      socket.off('canvas-state', handleCanvasState)
      socket.off('clear-canvas', handleClearCanvas)
      socket.off('undo', handleUndo)
    }
  }, [drawSegment, redrawCanvas])

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.ctrlKey && e.key === 'z') {
        const strokeToUndo = myStrokeIds.current.pop()
        if (strokeToUndo) {
          allDrawings.current = allDrawings.current.filter(d => d.strokeId !== strokeToUndo)
          redrawCanvas()
          socket.emit('undo', { roomId, strokeId: strokeToUndo })
        }
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [roomId, redrawCanvas])

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
    if (tool === 'cursor') return
    drawing.current = true
    lastPos.current = getPos(e)
    const newStrokeId = uuidv4()
    currentStrokeId.current = newStrokeId
    myStrokeIds.current.push(newStrokeId)
  }

  const draw = (e: React.MouseEvent | React.TouchEvent) => {
    if (!drawing.current || tool === 'cursor' || !currentStrokeId.current) return
    const ctx = getCtx()
    if (!ctx) return

    const pos = getPos(e)
    const drawColor = tool === 'eraser' ? '#f8f9fa' : color
    const drawSize = tool === 'eraser' ? size * 4 : size

    drawSegment(ctx, lastPos.current.x, lastPos.current.y, pos.x, pos.y, drawColor, drawSize)

    const drawEvent: DrawEvent = {
      x0: lastPos.current.x, y0: lastPos.current.y,
      x1: pos.x, y1: pos.y,
      color: drawColor, size: drawSize,
      roomId,
      strokeId: currentStrokeId.current
    }

    allDrawings.current.push(drawEvent)
    setIsEmpty(false)
    socket.emit('draw', drawEvent)

    lastPos.current = pos
  }

  const stopDraw = () => { 
    drawing.current = false 
    currentStrokeId.current = null
  }

  return (
    <div className="relative w-full h-full">
      {isEmpty && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none select-none text-[#c8c8c8] text-sm font-medium tracking-wide">
          Start drawing...
        </div>
      )}
      <canvas
        ref={canvasRef}
        className={`w-full h-full touch-none ${tool === 'cursor' ? 'cursor-default' : 'cursor-crosshair'}`}
        onMouseDown={startDraw}
        onMouseMove={draw}
        onMouseUp={stopDraw}
        onMouseLeave={stopDraw}
        onTouchStart={startDraw}
        onTouchMove={draw}
        onTouchEnd={stopDraw}
      />
    </div>
  )
}