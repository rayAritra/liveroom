'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import socket from '@/lib/socket'
import Canvas from '@/components/Canvas'
import Toolbar from '@/components/Toolbar'
import VideoGrid from '@/components/VideoGrid'
import {
  getLocalStream,
  callUser,
  handleOffer,
  handleAnswer,
  handleIceCandidate,
  setCallbacks,
  stopAllConnections,
} from '@/lib/webrtc'
import { Pencil, Mic, MicOff, Video, VideoOff } from 'lucide-react'

type Tool = 'pen' | 'eraser' | 'cursor'

export default function RoomPage() {
  const { roomId } = useParams<{ roomId: string }>()
  const [tool, setTool] = useState<Tool>('pen')
  const [color, setColor] = useState('#1e1e2e')
  const [size, setSize] = useState(4)
  const [clearTrigger, setClearTrigger] = useState(0)
  const [localStream, setLocalStream] = useState<MediaStream | null>(null)
  const [remoteStreams, setRemoteStreams] = useState<Record<string, MediaStream>>({})
  const [micOn, setMicOn] = useState(true)
  const [camOn, setCamOn] = useState(true)
  const [toast, setToast] = useState(false)
  const [username, setUsername] = useState('Anonymous')

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setUsername(localStorage.getItem('username') || 'Anonymous')

    setCallbacks(
      (userId, stream) => {
        setRemoteStreams((prev) => ({ ...prev, [userId]: stream }))
      },
      (userId) => {
        setRemoteStreams((prev) => {
          const next = { ...prev }
          delete next[userId]
          return next
        })
      }
    )

    async function init() {
      try {
        const stream = await getLocalStream()
        setLocalStream(stream)
      } catch (err) {
        console.error('Camera/mic permission denied', err)
      }

      socket.connect()
      socket.emit('join-room', roomId)

      socket.on('user-joined', async (userId: string) => {
        await callUser(userId)
      })

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      socket.on('offer', async ({ from, offer }: any) => {
        await handleOffer(from, offer)
      })

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      socket.on('answer', async ({ from, answer }: any) => {
        await handleAnswer(from, answer)
      })

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      socket.on('ice-candidate', async ({ from, candidate }: any) => {
        await handleIceCandidate(from, candidate)
      })

      socket.on('user-left', (userId: string) => {
        setRemoteStreams((prev) => {
          const next = { ...prev }
          delete next[userId]
          return next
        })
      })
    }

    init()

    return () => {
      socket.off('user-joined')
      socket.off('offer')
      socket.off('answer')
      socket.off('ice-candidate')
      socket.off('user-left')
      socket.disconnect()
      stopAllConnections()
    }
  }, [roomId])

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return
      
      switch (e.key.toLowerCase()) {
        case 'p':
          setTool('pen')
          break
        case 'e':
          setTool('eraser')
          break
        case 'v':
          setTool('cursor')
          break
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [])

  const toggleMic = () => {
    localStream?.getAudioTracks().forEach((t) => {
      t.enabled = !t.enabled
    })
    setMicOn((v) => !v)
  }

  const toggleCam = () => {
    localStream?.getVideoTracks().forEach((t) => {
      t.enabled = !t.enabled
    })
    setCamOn((v) => !v)
  }

  const copyRoomCode = () => {
    navigator.clipboard.writeText(roomId)
    setToast(true)
    setTimeout(() => setToast(false), 2000)
  }

  const participantCount = Object.keys(remoteStreams).length + 1

  return (
    <div className="h-screen flex flex-col bg-[#f8f9fa] overflow-hidden relative font-sans">
      {/* Top Bar */}
      <div 
        className="absolute top-0 left-0 right-0 h-[44px] bg-white flex items-center px-4 z-20"
        style={{ borderBottom: '1px solid #e2e8f0', boxShadow: '0 1px 3px rgba(0,0,0,0.06)' }}
      >
        {/* Left */}
        <div className="flex items-center gap-2 flex-1">
          <Pencil size={18} color="#6965db" className="fill-[#e0dfff]" />
          <span className="text-[#1e1e2e] font-bold text-[14px]">LiveRoom</span>
        </div>

        {/* Center */}
        <div className="flex-1 flex justify-center">
          <button 
            onClick={copyRoomCode}
            className="bg-[#f1f3f5] hover:bg-[#e2e8f0] text-[#1e1e2e] text-[13px] font-bold rounded-full px-3 py-1 transition-colors"
            title="Click to copy"
          >
            {roomId.slice(0, 8)}...
          </button>
        </div>

        {/* Right */}
        <div className="flex items-center justify-end gap-3 flex-1">
          <div className="flex items-center gap-2">
            <button
              onClick={toggleMic}
              className={`w-8 h-8 rounded-full flex items-center justify-center transition-colors ${
                micOn ? 'bg-transparent hover:bg-[#f1f3f5] text-[#1e1e2e]' : 'bg-[#fff5f5] text-[#fa5252]'
              }`}
            >
              {micOn ? <Mic size={16} /> : <MicOff size={16} />}
            </button>
            <button
              onClick={toggleCam}
              className={`w-8 h-8 rounded-full flex items-center justify-center transition-colors ${
                camOn ? 'bg-transparent hover:bg-[#f1f3f5] text-[#1e1e2e]' : 'bg-[#fff5f5] text-[#fa5252]'
              }`}
            >
              {camOn ? <Video size={16} /> : <VideoOff size={16} />}
            </button>
          </div>
          <div className="w-px h-5 bg-[#e2e8f0]" />
          <div className="bg-[#e0dfff] text-[#6965db] text-[11px] font-bold px-2 py-0.5 rounded-full">
            {participantCount} online
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="absolute top-[44px] left-0 right-0 bottom-0 overflow-hidden z-0">
        <Canvas
          roomId={roomId} tool={tool}
          color={color} size={size}
          onClearTrigger={clearTrigger}
        />
      </div>

      {/* Left Toolbar */}
      <Toolbar
        tool={tool} color={color} size={size}
        onToolChange={setTool}
        onColorChange={setColor}
        onSizeChange={setSize}
        onClear={() => setClearTrigger((n) => n + 1)}
      />

      {/* Right Video Grid */}
      <VideoGrid
        localStream={localStream}
        remoteStreams={remoteStreams}
        localName={username}
        micOn={micOn}
        camOn={camOn}
      />

      {/* Toast Notification */}
      <div 
        className={`absolute bottom-6 left-1/2 -translate-x-1/2 bg-[#1e1e2e] text-white px-4 py-2 rounded-lg text-[13px] font-bold transition-opacity duration-150 shadow-lg z-50 pointer-events-none ${
          toast ? 'opacity-100' : 'opacity-0'
        }`}
      >
        Room link copied!
      </div>
    </div>
  )
}
