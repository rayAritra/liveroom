'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { v4 as uuidv4 } from 'uuid'
import { Pencil } from 'lucide-react'

export default function Home() {
  const router = useRouter()
  const [name, setName] = useState('')
  const [roomCode, setRoomCode] = useState('')

  const createRoom = () => {
    if (!name.trim()) return alert('Enter your name first')
    const roomId = uuidv4()
    localStorage.setItem('username', name)
    router.push(`/room/${roomId}`)
  }

  const joinRoom = () => {
    if (!name.trim()) return alert('Enter your name first')
    if (!roomCode.trim()) return alert('Enter a room code')
    localStorage.setItem('username', name)
    router.push(`/room/${roomCode}`)
  }

  return (
    <main 
      className="min-h-screen flex items-center justify-center p-4 bg-[#f8f9fa]"
      style={{
        backgroundImage: 'radial-gradient(circle, #c8c8c8 1px, transparent 1px)',
        backgroundSize: '20px 20px',
      }}
    >
      <div 
        className="bg-white rounded-2xl p-8 w-full max-w-md"
        style={{
          boxShadow: '0 4px 24px rgba(0,0,0,0.08)'
        }}
      >
        <div className="flex items-center gap-2 mb-2">
          <Pencil size={24} color="#6965db" className="fill-[#e0dfff]" />
          <h1 className="text-[28px] font-bold text-[#1e1e2e]">LiveRoom</h1>
        </div>
        <p className="text-[#868e96] text-[13px] font-medium mb-8">
          Collaborative whiteboard + video. No signup needed.
        </p>

        <label className="text-[11px] text-[#868e96] uppercase tracking-[0.05em] font-bold">Your name</label>
        <input
          className="w-full mt-1 mb-6 bg-transparent border-b border-[#e2e8f0] py-2 text-[#1e1e2e] text-[13px] font-medium placeholder-[#868e96] focus:outline-none focus:border-[#6965db] transition-colors"
          placeholder="e.g. Aritra"
          value={name}
          onChange={(e) => setName(e.target.value)}
        />

        <button
          onClick={createRoom}
          className="w-full bg-[#6965db] hover:bg-[#5b57c8] text-white rounded-[6px] py-2.5 text-[13px] font-bold mb-5 transition-all shadow-none"
        >
          Create new room
        </button>

        <div className="flex items-center gap-3 mb-5">
          <div className="flex-1 h-px bg-[#e2e8f0]" />
          <span className="text-[#868e96] text-[11px] uppercase tracking-wider">— or join existing —</span>
          <div className="flex-1 h-px bg-[#e2e8f0]" />
        </div>

        <div className="flex gap-2">
          <input
            className="flex-1 bg-transparent border-b border-[#e2e8f0] py-2 text-[#1e1e2e] text-[13px] font-medium placeholder-[#868e96] focus:outline-none focus:border-[#6965db] transition-colors"
            placeholder="Room code"
            value={roomCode}
            onChange={(e) => setRoomCode(e.target.value)}
          />
          <button
            onClick={joinRoom}
            className="bg-[#f1f3f5] hover:bg-[#e2e8f0] text-[#1e1e2e] rounded-[6px] px-5 text-[13px] font-bold transition-colors"
          >
            Join →
          </button>
        </div>
      </div>
    </main>
  )
}