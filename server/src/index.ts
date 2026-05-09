import express from 'express'
import { createServer } from 'http'
import { Server } from 'socket.io'
import mongoose from 'mongoose'
import cors from 'cors'
import 'dotenv/config'

const app = express()
app.use(cors({ origin: '*' }))
app.use(express.json())

const httpServer = createServer(app)
const io = new Server(httpServer, {
  cors: { origin: '*', methods: ['GET', 'POST'] }
})

mongoose
  .connect(process.env.MONGODB_URI!)
  .then(() => console.log('MongoDB connected'))
  .catch((err) => console.error('MongoDB error:', err))

app.get('/health', (_req, res) => {
  res.json({ status: 'ok' })
})

io.on('connection', (socket) => {
  console.log('connected:', socket.id)

  socket.on('join-room', (roomId: string) => {
    socket.join(roomId)
    socket.to(roomId).emit('user-joined', socket.id)
    console.log(`${socket.id} joined room ${roomId}`)
  })

  socket.on('draw', (data) => {
    socket.to(data.roomId).emit('draw', data)
  })

  socket.on('cursor-move', (data) => {
    socket.to(data.roomId).emit('cursor-move', {
      userId: socket.id,
      x: data.x,
      y: data.y,
    })
  })
    socket.on('offer', (data) => {
    socket.to(data.to).emit('offer', {
      from: socket.id,
      offer: data.offer,
    })
  })

  socket.on('answer', (data) => {
    socket.to(data.to).emit('answer', {
      from: socket.id,
      answer: data.answer,
    })
  })

  socket.on('ice-candidate', (data) => {
    socket.to(data.to).emit('ice-candidate', {
      from: socket.id,
      candidate: data.candidate,
    })
  })

  socket.on('disconnect', () => {
    io.emit('user-left', socket.id)
    console.log('disconnected:', socket.id)
  })
})

const PORT = process.env.PORT || 4000
httpServer.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`)
})