import { useEffect, useRef } from 'react'
import { useSynthStore } from '../store/useSynthStore'

type Props = {
  analyserRef: React.RefObject<AnalyserNode | null>
}

const MIN_HZ = 20
const MAX_HZ = 16000
const DB_MIN = -100
const DB_MAX = -10

// Hz → Canvas X座標（対数スケール）
function hzToX(hz: number, width: number): number {
  return (Math.log(hz / MIN_HZ) / Math.log(MAX_HZ / MIN_HZ)) * width
}

export function FrequencyDisplay({ analyserRef }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const rafRef = useRef<number>(0)
  const masterEnabled = useSynthStore((s) => s.masterEnabled)
  const channels = useSynthStore((s) => s.channels)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const draw = () => {
      rafRef.current = requestAnimationFrame(draw)
      const analyser = analyserRef.current
      const W = canvas.width
      const H = canvas.height

      ctx.clearRect(0, 0, W, H)

      // 背景
      ctx.fillStyle = '#111827'
      ctx.fillRect(0, 0, W, H)

      // グリッドライン（Hz）
      const gridFreqs = [100, 500, 1000, 2000, 4000, 8000, 16000]
      ctx.strokeStyle = '#374151'
      ctx.lineWidth = 1
      ctx.fillStyle = '#6B7280'
      ctx.font = '10px monospace'
      for (const f of gridFreqs) {
        const x = Math.round(hzToX(f, W))
        ctx.beginPath()
        ctx.moveTo(x, 0)
        ctx.lineTo(x, H)
        ctx.stroke()
        const label = f >= 1000 ? `${f / 1000}k` : `${f}`
        ctx.fillText(label, x + 2, H - 4)
      }

      if (!analyser || !masterEnabled) {
        // Master OFF 時はフラットライン
        ctx.strokeStyle = '#374151'
        ctx.lineWidth = 2
        ctx.beginPath()
        ctx.moveTo(0, H * 0.8)
        ctx.lineTo(W, H * 0.8)
        ctx.stroke()
        return
      }

      // スペクトルデータ取得
      const bufLen = analyser.frequencyBinCount
      const data = new Float32Array(bufLen)
      analyser.getFloatFrequencyData(data)
      const sampleRate = analyserRef.current
        ? (analyserRef.current.context.sampleRate)
        : 44100

      // スペクトル描画（グラデーション塗りつぶし）
      const gradient = ctx.createLinearGradient(0, 0, 0, H)
      gradient.addColorStop(0, 'rgba(99, 102, 241, 0.9)')   // indigo
      gradient.addColorStop(1, 'rgba(99, 102, 241, 0.1)')

      ctx.beginPath()
      ctx.moveTo(0, H)

      for (let i = 0; i < bufLen; i++) {
        const freq = (i / bufLen) * (sampleRate / 2)
        if (freq < MIN_HZ || freq > MAX_HZ) continue

        const x = hzToX(freq, W)
        const db = data[i]
        const normalized = Math.max(0, Math.min(1, (db - DB_MIN) / (DB_MAX - DB_MIN)))
        const y = H - normalized * H

        if (i === 0) ctx.moveTo(x, y)
        else ctx.lineTo(x, y)
      }

      ctx.lineTo(W, H)
      ctx.closePath()
      ctx.fillStyle = gradient
      ctx.fill()

      // ライン
      ctx.beginPath()
      for (let i = 0; i < bufLen; i++) {
        const freq = (i / bufLen) * (sampleRate / 2)
        if (freq < MIN_HZ || freq > MAX_HZ) continue
        const x = hzToX(freq, W)
        const db = data[i]
        const normalized = Math.max(0, Math.min(1, (db - DB_MIN) / (DB_MAX - DB_MIN)))
        const y = H - normalized * H
        if (i === 0) ctx.moveTo(x, y)
        else ctx.lineTo(x, y)
      }
      ctx.strokeStyle = '#818CF8'
      ctx.lineWidth = 1.5
      ctx.stroke()

      // アクティブチャンネルの周波数マーカー
      for (const ch of channels) {
        if (!ch.enabled) continue
        const x = hzToX(ch.frequency, W)
        ctx.strokeStyle = '#34D399'
        ctx.lineWidth = 1
        ctx.setLineDash([3, 3])
        ctx.beginPath()
        ctx.moveTo(x, 0)
        ctx.lineTo(x, H)
        ctx.stroke()
        ctx.setLineDash([])

        ctx.fillStyle = '#34D399'
        ctx.font = '10px monospace'
        ctx.fillText(`${ch.frequency}Hz`, x + 3, 14)
      }
    }

    draw()
    return () => cancelAnimationFrame(rafRef.current)
  }, [analyserRef, masterEnabled, channels])

  return (
    <div className="bg-gray-900 rounded-xl overflow-hidden shadow">
      <div className="px-4 pt-3 pb-1 flex items-center justify-between">
        <span className="text-gray-400 text-xs font-semibold uppercase tracking-widest">
          Spectrum
        </span>
        <span className="text-gray-600 text-xs">
          {MIN_HZ} Hz – {MAX_HZ / 1000}k Hz
        </span>
      </div>
      <canvas
        ref={canvasRef}
        width={640}
        height={160}
        className="w-full"
      />
    </div>
  )
}
