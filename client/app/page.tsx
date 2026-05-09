'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { v4 as uuidv4 } from 'uuid'

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
    <main className="min-h-screen bg-gray-950 flex items-center justify-center p-4">
      <div className="bg-gray-900 border border-gray-800 rounded-2xl p-8 w-full max-w-md">
        <h1 className="text-2xl font-semibold text-white mb-1">LiveRoom</h1>
        <p className="text-gray-400 text-sm mb-8">
          Collaborative whiteboard + video, in your browser
        </p>

        <label className="text-xs text-gray-500 uppercase tracking-wider">Your name</label>
        <input
          className="w-full mt-1 mb-6 bg-gray-800 border border-gray-700 rounded-lg px-4 py-2.5 text-white text-sm placeholder-gray-500 focus:outline-none focus:border-violet-500"
          placeholder="Aritra"
          value={name}
          onChange={(e) => setName(e.target.value)}
        />

        <button
          onClick={createRoom}
          className="w-full bg-violet-600 hover:bg-violet-500 text-white rounded-lg py-2.5 text-sm font-medium mb-3 transition-colors"
        >
          Create new room
        </button>
         <div className="flex items-center gap-3 mb-3">
          <div className="flex-1 h-px bg-gray-800" />
          <span className="text-gray-600 text-xs">or join existing</span>
          <div className="flex-1 h-px bg-gray-800" />
        </div>

        <div className="flex gap-2">
          <input
            className="flex-1 bg-gray-800 border border-gray-700 rounded-lg px-4 py-2.5 text-white text-sm placeholder-gray-500 focus:outline-none focus:border-violet-500"
            placeholder="Paste room code"
            value={roomCode}
            onChange={(e) => setRoomCode(e.target.value)}
          />
          <button
            onClick={joinRoom}
            className="bg-gray-800 hover:bg-gray-700 border border-gray-700 text-white rounded-lg px-4 text-sm transition-colors"
          >
            Join
          </button>
        </div>
      </div>
    </main>
  )
}