import { useState } from 'react'
import type { OscillatorChannel, Waveform } from '../types'
import { sliderToHz, hzToSlider, MIN_HZ, MAX_HZ } from '../types'
import { useSynthStore } from '../store/useSynthStore'

type Props = {
  channel: OscillatorChannel
}

const WAVEFORMS: Waveform[] = ['sine', 'triangle', 'sawtooth']

export function ChannelStrip({ channel }: Props) {
  const updateChannel = useSynthStore((s) => s.updateChannel)
  const removeChannel = useSynthStore((s) => s.removeChannel)
  const [editingLabel, setEditingLabel] = useState(false)
  const [labelInput, setLabelInput] = useState(channel.label)
  const [freqInput, setFreqInput] = useState(String(channel.frequency))
  const [volInput, setVolInput] = useState(String(Math.round(channel.gain * 100)))
  const [panInput, setPanInput] = useState(String(Math.round(channel.pan * 100)))

  const update = (patch: Partial<OscillatorChannel>) =>
    updateChannel(channel.id, patch)

  const commitLabel = () => {
    update({ label: labelInput.trim() || channel.label })
    setEditingLabel(false)
  }

  const commitFreq = () => {
    const hz = Math.round(Math.min(MAX_HZ, Math.max(MIN_HZ, Number(freqInput))))
    if (!isNaN(hz)) {
      update({ frequency: hz })
      setFreqInput(String(hz))
    } else {
      setFreqInput(String(channel.frequency))
    }
  }

  const nudgeFreq = (delta: number) => {
    const next = Math.round(Math.min(MAX_HZ, Math.max(MIN_HZ, channel.frequency + delta)))
    update({ frequency: next })
    setFreqInput(String(next))
  }

  const commitVol = () => {
    const v = Math.round(Math.min(100, Math.max(0, Number(volInput))))
    if (!isNaN(v)) {
      update({ gain: v / 100 })
      setVolInput(String(v))
    } else {
      setVolInput(String(Math.round(channel.gain * 100)))
    }
  }

  const nudgeVol = (delta: number) => {
    const next = Math.round(Math.min(100, Math.max(0, Math.round(channel.gain * 100) + delta)))
    update({ gain: next / 100 })
    setVolInput(String(next))
  }

  const commitPan = () => {
    const p = Math.round(Math.min(100, Math.max(-100, Number(panInput))))
    if (!isNaN(p)) {
      update({ pan: p / 100 })
      setPanInput(String(p))
    } else {
      setPanInput(String(Math.round(channel.pan * 100)))
    }
  }

  const nudgePan = (delta: number) => {
    const next = Math.round(Math.min(100, Math.max(-100, Math.round(channel.pan * 100) + delta)))
    update({ pan: next / 100 })
    setPanInput(String(next))
  }

  return (
    <div
      className={`bg-gray-800 rounded-xl p-4 flex flex-col gap-3 shadow ${
        !channel.enabled ? 'opacity-50' : ''
      }`}
    >
      {/* ヘッダー行 */}
      <div className="flex items-center justify-between gap-2">
        {editingLabel ? (
          <input
            autoFocus
            value={labelInput}
            onChange={(e) => setLabelInput(e.target.value)}
            onBlur={commitLabel}
            onKeyDown={(e) => e.key === 'Enter' && commitLabel()}
            className="bg-gray-700 text-white rounded px-2 py-0.5 text-sm flex-1"
          />
        ) : (
          <button
            onClick={() => setEditingLabel(true)}
            className="text-white font-semibold text-sm hover:text-gray-300 truncate"
          >
            {channel.label}
          </button>
        )}

        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={() => update({ enabled: !channel.enabled })}
            className={`px-3 py-1 rounded-full text-xs font-semibold transition-colors ${
              channel.enabled
                ? 'bg-blue-500 text-white hover:bg-blue-400'
                : 'bg-gray-600 text-gray-400 hover:bg-gray-500'
            }`}
          >
            {channel.enabled ? 'ON' : 'OFF'}
          </button>
          <button
            onClick={() => removeChannel(channel.id)}
            className="text-gray-500 hover:text-red-400 text-lg leading-none"
            title="削除"
          >
            ×
          </button>
        </div>
      </div>

      {/* 波形 */}
      <div className="flex gap-1">
        {WAVEFORMS.map((wf) => (
          <button
            key={wf}
            onClick={() => update({ waveform: wf })}
            className={`flex-1 py-1 rounded text-xs font-medium transition-colors ${
              channel.waveform === wf
                ? 'bg-indigo-500 text-white'
                : 'bg-gray-700 text-gray-400 hover:bg-gray-600'
            }`}
          >
            {wf}
          </button>
        ))}
      </div>

      {/* 周波数 */}
      <div className="flex flex-col gap-1">
        <div className="flex items-center justify-between">
          <span className="text-gray-400 text-xs">Frequency</span>
          <div className="flex items-center gap-1">
            <button
              onClick={() => nudgeFreq(-1)}
              className="bg-gray-700 hover:bg-gray-600 text-gray-300 w-6 h-6 rounded text-xs"
            >
              −
            </button>
            <input
              type="number"
              min={MIN_HZ}
              max={MAX_HZ}
              value={freqInput}
              onChange={(e) => setFreqInput(e.target.value)}
              onBlur={commitFreq}
              onKeyDown={(e) => e.key === 'Enter' && commitFreq()}
              className="bg-gray-700 text-white text-xs rounded px-1 w-16 text-center"
            />
            <span className="text-gray-400 text-xs">Hz</span>
            <button
              onClick={() => nudgeFreq(1)}
              className="bg-gray-700 hover:bg-gray-600 text-gray-300 w-6 h-6 rounded text-xs"
            >
              +
            </button>
          </div>
        </div>
        <input
          type="range"
          min={0}
          max={1}
          step={0.001}
          value={hzToSlider(channel.frequency)}
          onChange={(e) => {
            const hz = sliderToHz(Number(e.target.value))
            update({ frequency: hz })
            setFreqInput(String(hz))
          }}
          className="w-full accent-indigo-500"
        />
      </div>

      {/* 音量 */}
      <div className="flex flex-col gap-1">
        <div className="flex items-center justify-between">
          <span className="text-gray-400 text-xs">Volume</span>
          <div className="flex items-center gap-1">
            <button
              onClick={() => nudgeVol(-1)}
              className="bg-gray-700 hover:bg-gray-600 text-gray-300 w-6 h-6 rounded text-xs"
            >
              −
            </button>
            <input
              type="number"
              min={0}
              max={100}
              value={volInput}
              onChange={(e) => setVolInput(e.target.value)}
              onBlur={commitVol}
              onKeyDown={(e) => e.key === 'Enter' && commitVol()}
              className="bg-gray-700 text-white text-xs rounded px-1 w-12 text-center"
            />
            <button
              onClick={() => nudgeVol(1)}
              className="bg-gray-700 hover:bg-gray-600 text-gray-300 w-6 h-6 rounded text-xs"
            >
              +
            </button>
          </div>
        </div>
        <input
          type="range"
          min={0}
          max={100}
          value={Math.round(channel.gain * 100)}
          onChange={(e) => {
            const v = Number(e.target.value)
            update({ gain: v / 100 })
            setVolInput(String(v))
          }}
          className="w-full accent-indigo-500"
        />
      </div>

      {/* パン */}
      <div className="flex flex-col gap-1">
        <div className="flex items-center justify-between">
          <span className="text-gray-400 text-xs">Pan</span>
          <div className="flex items-center gap-1">
            <button
              onClick={() => nudgePan(-1)}
              className="bg-gray-700 hover:bg-gray-600 text-gray-300 w-6 h-6 rounded text-xs"
            >
              −
            </button>
            <input
              type="number"
              min={-100}
              max={100}
              value={panInput}
              onChange={(e) => setPanInput(e.target.value)}
              onBlur={commitPan}
              onKeyDown={(e) => e.key === 'Enter' && commitPan()}
              className="bg-gray-700 text-white text-xs rounded px-1 w-14 text-center"
            />
            <button
              onClick={() => nudgePan(1)}
              className="bg-gray-700 hover:bg-gray-600 text-gray-300 w-6 h-6 rounded text-xs"
            >
              +
            </button>
          </div>
        </div>
        <div className="flex items-center gap-1">
          <span className="text-gray-500 text-xs">L</span>
          <input
            type="range"
            min={-100}
            max={100}
            value={Math.round(channel.pan * 100)}
            onChange={(e) => {
              const p = Number(e.target.value)
              update({ pan: p / 100 })
              setPanInput(String(p))
            }}
            className="flex-1 accent-indigo-500"
          />
          <span className="text-gray-500 text-xs">R</span>
        </div>
      </div>
    </div>
  )
}
