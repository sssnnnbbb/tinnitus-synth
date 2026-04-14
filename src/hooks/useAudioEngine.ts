import { useEffect, useRef } from 'react'
import { useSynthStore } from '../store/useSynthStore'
import { isNoise } from '../types'
import type { NoiseType } from '../types'

// ── ノイズバッファ生成 ─────────────────────────────────────────
const NOISE_BUFFER_SECONDS = 2

function createNoiseBuffer(ctx: AudioContext, type: NoiseType): AudioBuffer {
  const sampleRate = ctx.sampleRate
  const length = sampleRate * NOISE_BUFFER_SECONDS
  const buffer = ctx.createBuffer(1, length, sampleRate)
  const data = buffer.getChannelData(0)

  if (type === 'white') {
    for (let i = 0; i < length; i++) {
      data[i] = Math.random() * 2 - 1
    }
  } else if (type === 'pink') {
    // Voss-McCartney アルゴリズム（簡略版）
    let b0 = 0, b1 = 0, b2 = 0, b3 = 0, b4 = 0, b5 = 0, b6 = 0
    for (let i = 0; i < length; i++) {
      const white = Math.random() * 2 - 1
      b0 = 0.99886 * b0 + white * 0.0555179
      b1 = 0.99332 * b1 + white * 0.0750759
      b2 = 0.96900 * b2 + white * 0.1538520
      b3 = 0.86650 * b3 + white * 0.3104856
      b4 = 0.55000 * b4 + white * 0.5329522
      b5 = -0.7616 * b5 - white * 0.0168980
      data[i] = (b0 + b1 + b2 + b3 + b4 + b5 + b6 + white * 0.5362) * 0.11
      b6 = white * 0.115926
    }
  } else {
    // Brown noise: 積分フィルタ
    let last = 0
    for (let i = 0; i < length; i++) {
      const white = Math.random() * 2 - 1
      last = (last + 0.02 * white) / 1.02
      data[i] = last * 3.5
    }
  }

  return buffer
}

// ── ノードの型定義 ─────────────────────────────────────────────
type OscNodes = {
  kind: 'osc'
  oscillator: OscillatorNode
  gainNode: GainNode
  panner: StereoPannerNode
}

type NoiseNodes = {
  kind: 'noise'
  source: AudioBufferSourceNode
  filter: BiquadFilterNode
  gainNode: GainNode
  panner: StereoPannerNode
}

type ChannelNodes = OscNodes | NoiseNodes

const RAMP_TIME = 0.02

// ── ノイズチャンネル作成 ──────────────────────────────────────
function createNoiseChannel(
  ctx: AudioContext,
  dest: AudioNode,
  noiseType: NoiseType,
  frequency: number,
  gain: number,
  pan: number,
  enabled: boolean,
): NoiseNodes {
  const buffer = createNoiseBuffer(ctx, noiseType)
  const source = ctx.createBufferSource()
  source.buffer = buffer
  source.loop = true

  const filter = ctx.createBiquadFilter()
  filter.type = 'bandpass'
  filter.frequency.setValueAtTime(frequency, ctx.currentTime)
  filter.Q.setValueAtTime(1.0, ctx.currentTime)

  const gainNode = ctx.createGain()
  gainNode.gain.setValueAtTime(enabled ? gain : 0, ctx.currentTime)

  const panner = ctx.createStereoPanner()
  panner.pan.setValueAtTime(pan, ctx.currentTime)

  source.connect(filter)
  filter.connect(gainNode)
  gainNode.connect(panner)
  panner.connect(dest)
  source.start()

  return { kind: 'noise', source, filter, gainNode, panner }
}

// ── オシレーターチャンネル作成 ────────────────────────────────
function createOscChannel(
  ctx: AudioContext,
  dest: AudioNode,
  waveform: OscillatorType,
  frequency: number,
  gain: number,
  pan: number,
  enabled: boolean,
): OscNodes {
  const oscillator = ctx.createOscillator()
  const gainNode = ctx.createGain()
  const panner = ctx.createStereoPanner()

  oscillator.type = waveform
  oscillator.frequency.setValueAtTime(frequency, ctx.currentTime)
  gainNode.gain.setValueAtTime(enabled ? gain : 0, ctx.currentTime)
  panner.pan.setValueAtTime(pan, ctx.currentTime)

  oscillator.connect(gainNode)
  gainNode.connect(panner)
  panner.connect(dest)
  oscillator.start()

  return { kind: 'osc', oscillator, gainNode, panner }
}

// ── チャンネルの停止・切断 ────────────────────────────────────
function stopChannel(nodes: ChannelNodes, ctx: AudioContext) {
  nodes.gainNode.gain.linearRampToValueAtTime(0, ctx.currentTime + RAMP_TIME)
  setTimeout(() => {
    if (nodes.kind === 'osc') {
      nodes.oscillator.stop()
      nodes.oscillator.disconnect()
    } else {
      nodes.source.stop()
      nodes.source.disconnect()
      nodes.filter.disconnect()
    }
    nodes.gainNode.disconnect()
    nodes.panner.disconnect()
  }, RAMP_TIME * 1000 + 10)
}

// ── フック本体 ────────────────────────────────────────────────
export function useAudioEngine() {
  const channels = useSynthStore((s) => s.channels)
  const masterGain = useSynthStore((s) => s.masterGain)
  const masterEnabled = useSynthStore((s) => s.masterEnabled)

  const ctxRef = useRef<AudioContext | null>(null)
  const masterGainRef = useRef<GainNode | null>(null)
  const analyserRef = useRef<AnalyserNode | null>(null)
  const channelMapRef = useRef<Map<string, ChannelNodes>>(new Map())

  // AudioContext 初期化
  useEffect(() => {
    if (!masterEnabled) return
    if (ctxRef.current) return

    const ctx = new AudioContext()
    const masterGainNode = ctx.createGain()
    const analyser = ctx.createAnalyser()
    analyser.fftSize = 2048
    analyser.smoothingTimeConstant = 0.8

    masterGainNode.gain.setValueAtTime(masterGain, ctx.currentTime)
    masterGainNode.connect(analyser)
    analyser.connect(ctx.destination)

    ctxRef.current = ctx
    masterGainRef.current = masterGainNode
    analyserRef.current = analyser
  }, [masterEnabled])

  // マスター ON/OFF
  useEffect(() => {
    const ctx = ctxRef.current
    const masterGainNode = masterGainRef.current
    if (!ctx || !masterGainNode) return

    const target = masterEnabled ? masterGain : 0
    masterGainNode.gain.linearRampToValueAtTime(target, ctx.currentTime + RAMP_TIME)
  }, [masterEnabled, masterGain])

  // マスター音量
  useEffect(() => {
    const ctx = ctxRef.current
    const masterGainNode = masterGainRef.current
    if (!ctx || !masterGainNode || !masterEnabled) return

    masterGainNode.gain.linearRampToValueAtTime(masterGain, ctx.currentTime + RAMP_TIME)
  }, [masterGain, masterEnabled])

  // チャンネルの追加・削除・パラメータ同期
  useEffect(() => {
    const ctx = ctxRef.current
    const masterGainNode = masterGainRef.current
    if (!ctx || !masterGainNode) return

    const channelMap = channelMapRef.current
    const currentIds = new Set(channels.map((ch) => ch.id))

    // 削除されたチャンネルを停止
    for (const [id, nodes] of channelMap.entries()) {
      if (!currentIds.has(id)) {
        stopChannel(nodes, ctx)
        channelMap.delete(id)
      }
    }

    for (const ch of channels) {
      const existing = channelMap.get(ch.id)
      const nowNoise = isNoise(ch.waveform)

      // 波形種別（osc/noise）が変わった場合は作り直す
      if (existing && ((nowNoise && existing.kind === 'osc') || (!nowNoise && existing.kind === 'noise'))) {
        stopChannel(existing, ctx)
        channelMap.delete(ch.id)
      }

      if (!channelMap.has(ch.id)) {
        // 新規作成
        const nodes = nowNoise
          ? createNoiseChannel(ctx, masterGainNode, ch.waveform as NoiseType, ch.frequency, ch.gain, ch.pan, ch.enabled)
          : createOscChannel(ctx, masterGainNode, ch.waveform as OscillatorType, ch.frequency, ch.gain, ch.pan, ch.enabled)
        channelMap.set(ch.id, nodes)
      } else {
        // パラメータ更新
        const nodes = channelMap.get(ch.id)!
        const now = ctx.currentTime

        nodes.gainNode.gain.linearRampToValueAtTime(ch.enabled ? ch.gain : 0, now + RAMP_TIME)
        nodes.panner.pan.linearRampToValueAtTime(ch.pan, now + RAMP_TIME)

        if (nodes.kind === 'osc') {
          nodes.oscillator.frequency.linearRampToValueAtTime(ch.frequency, now + RAMP_TIME)
          nodes.oscillator.type = ch.waveform as OscillatorType
        } else {
          nodes.filter.frequency.linearRampToValueAtTime(ch.frequency, now + RAMP_TIME)
        }
      }
    }
  }, [channels, masterEnabled])

  // アンマウント時クリーンアップ
  useEffect(() => {
    return () => {
      const ctx = ctxRef.current
      if (!ctx) return
      for (const nodes of channelMapRef.current.values()) {
        if (nodes.kind === 'osc') {
          nodes.oscillator.stop()
          nodes.oscillator.disconnect()
        } else {
          nodes.source.stop()
          nodes.source.disconnect()
          nodes.filter.disconnect()
        }
        nodes.gainNode.disconnect()
        nodes.panner.disconnect()
      }
      channelMapRef.current.clear()
      ctx.close()
    }
  }, [])

  return { analyserRef }
}
