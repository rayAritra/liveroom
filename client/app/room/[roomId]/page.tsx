'use client'

import { useEffect, useState, useRef } from 'react'
import { useParams } from 'next/navigation'
import socket from '@/lib/socket'
import Canvas from '@/components/Canvas'
import Toolbar from '@/components/Toolbar'

type Tool = 'pen' | 'eraser'
export default function RoomPage() {
  const { roomId } = useParams<{ roomId: string }>()
  const [tool, setTool] = useState<Tool>('pen')
  const [color, setColor] = useState('#ffffff')
  const [size, setSize] = useState(4)
  const [clearTrigger, setClearTrigger] = useState(0)
  const [users, setUsers] = useState<string[]>([])
  const username = useRef('')

   useEffect(() => {
    username.current = localStorage.getItem('username') || 'Anonymous'

    socket.connect()
    socket.emit('join-room', roomId)

    socket.on('user-joined', (userId: string) => {
      setUsers((prev) => prev.includes(userId) ? prev : [...prev, userId])
    })

    socket.on('user-left', (userId: string) => {
      setUsers((prev) => prev.filter((u) => u !== userId))
    })

    return () => {
      socket.off('user-joined')
      socket.off('user-left')
      socket.disconnect()
    }
  }, [roomId])

 const handleClear = () => setClearTrigger((n) => n + 1)
return (
    <div className="h-screen flex flex-col bg-gray-950">

      <div className="flex items-center gap-3 px-4 py-2 bg-gray-900 border-b border-gray-800">
        <span className="text-white font-medium text-sm">LiveRoom</span>
        <div className="flex items-center gap-1.5 ml-2">
          {users.map((u) => (
            <div
              key={u}
              className="w-6 h-6 rounded-full bg-violet-600 flex items-center justify-center text-white text-xs font-medium"
              title={u}
            >
              {u.slice(0, 1).toUpperCase()}
            </div>
          ))}
        </div>
        <span className="text-gray-600 text-xs ml-auto">
          {users.length + 1} in room
        </span>
      </div>

      <Toolbar
        tool={tool}
        color={color}
        size={size}
        onToolChange={setTool}
        onColorChange={setColor}
        onSizeChange={setSize}
        onClear={handleClear}
        roomId={roomId}
      />

      <div className="flex-1 overflow-hidden">
        <Canvas
          roomId={roomId}
          tool={tool}
          color={color}
          size={size}
          onClearTrigger={clearTrigger}
        />
      </div>
    </div>
  )
}