'use client'

type Tool = 'pen' | 'eraser'

type Props = {
  tool: Tool
  color: string
  size: number
  onToolChange: (t: Tool) => void
  onColorChange: (c: string) => void
  onSizeChange: (s: number) => void
  onClear: () => void
  roomId: string
}

const COLORS = [
  '#ffffff', '#f87171', '#fb923c',
  '#facc15', '#4ade80', '#60a5fa',
  '#c084fc', '#f472b6',
]

export default function Toolbar({
  tool, color, size,
  onToolChange, onColorChange, onSizeChange,
  onClear, roomId,
}: Props) {

  const copyRoomCode = () => {
    navigator.clipboard.writeText(roomId)
    alert('Room code copied! Share it with your team.')
  }

  return (
    <div className="flex items-center gap-3 px-4 py-2 bg-gray-900 border-b border-gray-800 flex-wrap">

      <button
        onClick={() => onToolChange('pen')}
        className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors
          ${tool === 'pen'
            ? 'bg-violet-600 text-white'
            : 'bg-gray-800 text-gray-400 hover:text-white'}`}
      >
        Pen
      </button>

       <button
        onClick={() => onToolChange('eraser')}
        className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors
          ${tool === 'eraser'
            ? 'bg-violet-600 text-white'
            : 'bg-gray-800 text-gray-400 hover:text-white'}`}
      >
        Eraser
      </button>

      <div className="w-px h-6 bg-gray-700" />

      <div className="flex gap-1.5">
        {COLORS.map((c) => (
          <button
            key={c}
            onClick={() => onColorChange(c)}
            style={{ backgroundColor: c }}
            className={`w-6 h-6 rounded-full border-2 transition-transform
              ${color === c ? 'border-violet-400 scale-110' : 'border-transparent'}`}
          />
        ))}
      </div>
 <div className="w-px h-6 bg-gray-700" />

      <div className="flex items-center gap-2">
        <span className="text-gray-500 text-xs">Size</span>
        <input
          type="range" min="2" max="24" step="1"
          value={size}
          onChange={(e) => onSizeChange(Number(e.target.value))}
          className="w-20 accent-violet-500"
        />
        <span className="text-gray-400 text-xs w-4">{size}</span>
      </div>

      <div className="w-px h-6 bg-gray-700" />

      <button
        onClick={onClear}
        className="px-3 py-1.5 rounded-lg text-sm bg-gray-800 text-red-400 hover:text-red-300 transition-colors"
      >
        Clear
      </button>

        <div className="ml-auto flex items-center gap-2">
        <span className="text-gray-600 text-xs font-mono">
          {roomId.slice(0, 8)}...
        </span>
        <button
          onClick={copyRoomCode}
          className="px-3 py-1.5 rounded-lg text-sm bg-gray-800 text-gray-400 hover:text-white transition-colors"
        >
          Copy invite
        </button>
      </div>
    </div>
  )
}