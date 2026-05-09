'use client'

import { MousePointer2, Pencil, Eraser, StickyNote, Trash2 } from 'lucide-react'

type Tool = 'pen' | 'eraser' | 'cursor'

type Props = {
  tool: Tool
  color: string
  size: number
  onToolChange: (t: Tool) => void
  onColorChange: (c: string) => void
  onSizeChange: (s: number) => void
  onClear: () => void
}

const COLORS = [
  '#1e1e2e', '#e03131', '#2f9e44', '#1971c2', 
  '#f08c00', '#6965db', '#c2255c', '#ffffff',
]

const SIZES = [2, 6, 12]

export default function Toolbar({
  tool, color, size,
  onToolChange, onColorChange, onSizeChange,
  onClear,
}: Props) {
  return (
    <div 
      className="absolute left-4 top-1/2 -translate-y-1/2 bg-white rounded-2xl p-2 flex flex-col items-center gap-2 z-10"
      style={{ boxShadow: '0 4px 12px rgba(0,0,0,0.08), 0 0 0 1px rgba(0,0,0,0.04)' }}
    >
      {/* Tools */}
      <div className="flex flex-col gap-1">
        <button
          onClick={() => onToolChange('cursor')}
          className={`w-10 h-10 flex items-center justify-center transition-colors ${
            tool === 'cursor' ? 'bg-[#e0dfff] text-[#6965db] border-[1.5px] border-[#6965db] rounded-[6px]' : 'bg-transparent text-[#1e1e2e] hover:bg-[#f1f3f5] rounded-[6px] border-[1.5px] border-transparent'
          }`}
          title="Select (V)"
        >
          <MousePointer2 size={18} />
        </button>

        <button
          onClick={() => onToolChange('pen')}
          className={`w-10 h-10 flex items-center justify-center transition-colors ${
            tool === 'pen' ? 'bg-[#e0dfff] text-[#6965db] border-[1.5px] border-[#6965db] rounded-[6px]' : 'bg-transparent text-[#1e1e2e] hover:bg-[#f1f3f5] rounded-[6px] border-[1.5px] border-transparent'
          }`}
          title="Pen (P)"
        >
          <Pencil size={18} />
        </button>

        <button
          onClick={() => onToolChange('eraser')}
          className={`w-10 h-10 flex items-center justify-center transition-colors ${
            tool === 'eraser' ? 'bg-[#e0dfff] text-[#6965db] border-[1.5px] border-[#6965db] rounded-[6px]' : 'bg-transparent text-[#1e1e2e] hover:bg-[#f1f3f5] rounded-[6px] border-[1.5px] border-transparent'
          }`}
          title="Eraser (E)"
        >
          <Eraser size={18} />
        </button>

        <div className="w-8 h-px bg-[#e2e8f0] my-1 mx-auto" />

        <button
          className="w-10 h-10 flex items-center justify-center bg-transparent text-[#868e96] hover:bg-[#f1f3f5] hover:text-[#1e1e2e] rounded-[6px] border-[1.5px] border-transparent transition-colors"
          title="Sticky note (Coming soon)"
        >
          <StickyNote size={18} />
        </button>
      </div>

      <div className="w-8 h-px bg-[#e2e8f0] my-1" />

      {/* Colors */}
      <div className="grid grid-cols-2 gap-1.5 p-1">
        {COLORS.map((c) => (
          <button
            key={c}
            onClick={() => onColorChange(c)}
            className="w-[18px] h-[18px] rounded-full relative"
            title={`Color ${c}`}
          >
            <div 
              className="absolute inset-0 rounded-full"
              style={{ backgroundColor: c, border: c === '#ffffff' ? '1px solid #e2e8f0' : 'none' }}
            />
            {color === c && (
              <div 
                className="absolute inset-[-4px] rounded-full border-2 border-[#6965db]" 
                style={{ pointerEvents: 'none' }}
              />
            )}
          </button>
        ))}
      </div>

      <div className="w-8 h-px bg-[#e2e8f0] my-2" />

      {/* Sizes */}
      <div className="flex flex-col gap-3 py-1">
        {SIZES.map((s) => (
          <button
            key={s}
            onClick={() => onSizeChange(s)}
            className={`w-8 h-6 flex items-center justify-center rounded-[4px] hover:bg-[#f1f3f5] transition-colors ${
              size === s ? 'bg-[#f1f3f5]' : 'bg-transparent'
            }`}
            title={`Stroke size ${s}`}
          >
            <div 
              className="bg-[#1e1e2e] rounded-full" 
              style={{ width: s + 2, height: s + 2 }}
            />
          </button>
        ))}
      </div>

      <div className="w-8 h-px bg-[#e2e8f0] my-2" />

      {/* Clear Action */}
      <button
        onClick={onClear}
        className="w-10 h-10 flex items-center justify-center bg-transparent text-[#fa5252] hover:bg-[#fff5f5] rounded-[6px] border-[1.5px] border-transparent transition-colors"
        title="Clear canvas"
      >
        <Trash2 size={18} />
      </button>

    </div>
  )
}