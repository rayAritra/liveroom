import socket from './socket'

const ICE_SERVERS = {
  iceServers: [
    { urls: 'stun:stun.l.google.com:19302' },
    {
      urls: process.env.NEXT_PUBLIC_TURN_URL!,
      username: process.env.NEXT_PUBLIC_TURN_USER!,
      credential: process.env.NEXT_PUBLIC_TURN_CRED!,
    },
  ],
}

type OnStreamCb = (userId: string, stream: MediaStream) => void
type OnRemoveCb = (userId: string) => void

const peers: Record<string, RTCPeerConnection> = {}
let localStream: MediaStream | null = null
let onStreamCb: OnStreamCb = () => {}
let onRemoveCb: OnRemoveCb = () => {}

export function setCallbacks(onStream: OnStreamCb, onRemove: OnRemoveCb) {
  onStreamCb = onStream
  onRemoveCb = onRemove
}

export async function getLocalStream(): Promise<MediaStream> {
  if (localStream) return localStream
  localStream = await navigator.mediaDevices.getUserMedia({
    video: { width: 320, height: 240 },
    audio: true,
  })
  return localStream
}
function createPeer(userId: string): RTCPeerConnection {
  const peer = new RTCPeerConnection(ICE_SERVERS)

  peer.onicecandidate = (e) => {
    if (e.candidate) {
      socket.emit('ice-candidate', { to: userId, candidate: e.candidate })
    }
  }

  peer.ontrack = (e) => {
    onStreamCb(userId, e.streams[0])
  }
  peer.onconnectionstatechange = () => {
    if (
      peer.connectionState === 'disconnected' ||
      peer.connectionState === 'failed'
    ) {
      peer.close()
      delete peers[userId]
      onRemoveCb(userId)
    }
  }
  if (localStream) {
    localStream.getTracks().forEach((track) => {
      peer.addTrack(track, localStream!)
    })
  }

  peers[userId] = peer
  return peer
}
export async function callUser(userId: string) {
  const peer = createPeer(userId)
  const offer = await peer.createOffer()
  await peer.setLocalDescription(offer)
  socket.emit('offer', { to: userId, offer })
}

export async function handleOffer(
  userId: string,
  offer: RTCSessionDescriptionInit
) {
    const peer = createPeer(userId)
  await peer.setRemoteDescription(new RTCSessionDescription(offer))
  const answer = await peer.createAnswer()
  await peer.setLocalDescription(answer)
  socket.emit('answer', { to: userId, answer })
}
export async function handleAnswer(
  userId: string,
  answer: RTCSessionDescriptionInit
) {
  await peers[userId]?.setRemoteDescription(new RTCSessionDescription(answer))
}

export async function handleIceCandidate(
  userId: string,
  candidate: RTCIceCandidateInit
) {
  await peers[userId]?.addIceCandidate(new RTCIceCandidate(candidate))
}
export function stopAllConnections() {
  Object.values(peers).forEach((p) => p.close())
  Object.keys(peers).forEach((k) => delete peers[k])
  localStream?.getTracks().forEach((t) => t.stop())
  localStream = null
}