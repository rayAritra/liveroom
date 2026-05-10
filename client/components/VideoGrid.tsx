'use client'

import { useEffect, useRef, useState } from 'react'
import { Users, X, MicOff } from 'lucide-react'

type VideoTileProps = {
  stream: MediaStream
  muted?: boolean
  label: string
  isCamOff: boolean
  isMicOff: boolean
}

function VideoTile({ stream, muted = false, label, isCamOff, isMicOff }: VideoTileProps) {
  const videoRef = useRef<HTMLVideoElement>(null)

  useEffect(() => {
    const video = videoRef.current
    if (!video) return

    // Do NOT use new MediaStream() as it breaks WebRTC track bindings in some browsers.
    // Use the exact stream reference provided by the RTCPeerConnection.
    if (video.srcObject !== stream) {
      video.srcObject = stream
    }

    const handlePlay = () => {
      if (!video) return
      // Only try to play if it's paused to avoid interrupting an already playing video
      if (!video.paused) return
      
      video.play().catch(e => {
        console.warn("Play error (likely autoplay blocked):", e)
        
        // Autoplay was blocked. We need to play when the user interacts.
        const playOnInteract = () => {
          if (!video) return
          video.play().then(() => {
            document.removeEventListener('click', playOnInteract)
          }).catch(() => {})
        }
        document.addEventListener('click', playOnInteract)
      })
    }

    video.addEventListener('loadedmetadata', handlePlay)
    // Attempt immediate play in case it's already loaded
    handlePlay()

    return () => {
      video.removeEventListener('loadedmetadata', handlePlay)
      // Note: we might leave a dangling click listener, but it's harmless as it will remove itself on next click if successful.
    }
  }, [stream])

  return (
    <div className="relative rounded-xl overflow-hidden bg-[#e2e8f0] aspect-video">
      <video
        ref={videoRef}
        autoPlay
        playsInline
        muted={muted}
        className={`w-full h-full object-cover ${isCamOff ? 'opacity-0' : 'opacity-100'}`}
      />
      
      {isCamOff && (
        <div className="absolute inset-0 w-full h-full flex items-center justify-center bg-[#f1f3f5]">
          <div className="w-12 h-12 bg-[#dee2e6] rounded-full flex items-center justify-center text-[#868e96] font-bold text-lg">
            {label[0]?.toUpperCase()}
          </div>
        </div>
      )}
      
      <span className="absolute bottom-1.5 left-2 text-[11px] font-bold text-white bg-black/40 px-2 py-0.5 rounded-md backdrop-blur-sm z-10">
        {label}
      </span>

      {isMicOff && (
        <div className="absolute top-1.5 right-1.5 bg-[#fa5252] rounded-full p-1 shadow-sm z-10">
          <MicOff size={12} color="white" />
        </div>
      )}
    </div>
  )
}

type Props = {
  localStream: MediaStream | null
  remoteStreams: Record<string, MediaStream>
  localName: string
  micOn: boolean
  camOn: boolean
}

export default function VideoGrid({ localStream, remoteStreams, localName, micOn, camOn }: Props) {
  const [isOpen, setIsOpen] = useState(false)
  const remoteEntries = Object.entries(remoteStreams)
  const participantCount = remoteEntries.length + 1

  return (
    <>
      {/* Collapsed Toggle Button */}
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className="absolute right-4 top-16 bg-white w-12 h-12 rounded-full flex items-center justify-center z-20 hover:bg-[#f1f3f5] transition-colors"
          style={{ boxShadow: '0 4px 12px rgba(0,0,0,0.08), 0 0 0 1px rgba(0,0,0,0.04)' }}
          title="Show participants"
        >
          <Users size={20} color="#1e1e2e" />
          <div className="absolute -top-1 -right-1 bg-[#6965db] text-white text-[10px] font-bold w-5 h-5 flex items-center justify-center rounded-full border-2 border-white">
            {participantCount}
          </div>
        </button>
      )}

      {/* Expanded Sidebar */}
      <div 
        className={`absolute top-[44px] right-0 bottom-0 w-[200px] bg-white border-l border-[#e2e8f0] flex flex-col transition-transform duration-300 ease-in-out z-20 ${
          isOpen ? 'translate-x-0' : 'translate-x-full'
        }`}
      >
        <div className="flex items-center justify-between p-3 border-b border-[#e2e8f0]">
          <span className="text-[#868e96] text-[11px] uppercase tracking-wider font-bold">
            Participants ({participantCount})
          </span>
          <button 
            onClick={() => setIsOpen(false)}
            className="text-[#868e96] hover:text-[#1e1e2e] transition-colors bg-[#f1f3f5] hover:bg-[#e2e8f0] rounded-md p-1"
          >
            <X size={14} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-3 flex flex-col gap-3">
          {localStream && (
            <VideoTile
              stream={localStream}
              muted={true}
              label={`${localName} (You)`}
              isMicOff={!micOn}
              isCamOff={!camOn}
            />
          )}

          {remoteEntries.map(([userId, stream]) => {
            // Check stream tracks to determine remote mic/cam state
            const hasAudio = stream.getAudioTracks().some(t => t.enabled)
            const hasVideo = stream.getVideoTracks().some(t => t.enabled)

            return (
              <VideoTile
                key={userId}
                stream={stream}
                label={userId.slice(0, 6)}
                isMicOff={!hasAudio}
                isCamOff={!hasVideo}
              />
            )
          })}
        </div>
      </div>
    </>
  )
}