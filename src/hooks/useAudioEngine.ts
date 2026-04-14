import { useEffect, useRef } from 'react'
import { useSynthStore } from '../store/useSynthStore'

type ChannelNodes = {
  oscillator: OscillatorNode
  gainNode: GainNode
  panner: StereoPannerNode
}

const RAMP_TIME = 0.02 // 20ms でフェード（クリックノイズ防止）

export function useAudioEngine() {
  const channels = useSynthStore((s) => s.channels)
  const masterGain = useSynthStore((s) => s.masterGain)
  const masterEnabled = useSynthStore((s) => s.masterEnabled)

  const ctxRef = useRef<AudioContext | null>(null)
  const masterGainRef = useRef<GainNode | null>(null)
  const channelMapRef = useRef<Map<string, ChannelNodes>>(new Map())

  // AudioContext の初期化（masterEnabled が true になった瞬間に1回だけ）
  useEffect(() => {
    if (!masterEnabled) return
    if (ctxRef.current) return

    const ctx = new AudioContext()
    const masterGainNode = ctx.createGain()
    masterGainNode.gain.setValueAtTime(masterGain, ctx.currentTime)
    masterGainNode.connect(ctx.destination)

    ctxRef.current = ctx
    masterGainRef.current = masterGainNode
  }, [masterEnabled])

  // マスター ON/OFF
  useEffect(() => {
    const ctx = ctxRef.current
    const masterGainNode = masterGainRef.current
    if (!ctx || !masterGainNode) return

    const target = masterEnabled ? masterGain : 0
    masterGainNode.gain.linearRampToValueAtTime(
      target,
      ctx.currentTime + RAMP_TIME
    )
  }, [masterEnabled, masterGain])

  // マスター音量
  useEffect(() => {
    const ctx = ctxRef.current
    const masterGainNode = masterGainRef.current
    if (!ctx || !masterGainNode || !masterEnabled) return

    masterGainNode.gain.linearRampToValueAtTime(
      masterGain,
      ctx.currentTime + RAMP_TIME
    )
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
        nodes.gainNode.gain.linearRampToValueAtTime(0, ctx.currentTime + RAMP_TIME)
        setTimeout(() => {
          nodes.oscillator.stop()
          nodes.oscillator.disconnect()
          nodes.gainNode.disconnect()
          nodes.panner.disconnect()
        }, RAMP_TIME * 1000 + 10)
        channelMap.delete(id)
      }
    }

    // 追加・更新
    for (const ch of channels) {
      if (!channelMap.has(ch.id)) {
        // 新規チャンネル作成
        const osc = ctx.createOscillator()
        const gainNode = ctx.createGain()
        const panner = ctx.createStereoPanner()

        osc.type = ch.waveform as OscillatorType
        osc.frequency.setValueAtTime(ch.frequency, ctx.currentTime)
        gainNode.gain.setValueAtTime(ch.enabled ? ch.gain : 0, ctx.currentTime)
        panner.pan.setValueAtTime(ch.pan, ctx.currentTime)

        osc.connect(gainNode)
        gainNode.connect(panner)
        panner.connect(masterGainNode)
        osc.start()

        channelMap.set(ch.id, { oscillator: osc, gainNode, panner })
      } else {
        // 既存チャンネルのパラメータ更新
        const nodes = channelMap.get(ch.id)!
        const now = ctx.currentTime

        nodes.oscillator.frequency.linearRampToValueAtTime(ch.frequency, now + RAMP_TIME)
        nodes.oscillator.type = ch.waveform as OscillatorType
        nodes.gainNode.gain.linearRampToValueAtTime(
          ch.enabled ? ch.gain : 0,
          now + RAMP_TIME
        )
        nodes.panner.pan.linearRampToValueAtTime(ch.pan, now + RAMP_TIME)
      }
    }
  }, [channels, masterEnabled])

  // アンマウント時にクリーンアップ
  useEffect(() => {
    return () => {
      const channelMap = channelMapRef.current
      for (const nodes of channelMap.values()) {
        nodes.oscillator.stop()
        nodes.oscillator.disconnect()
        nodes.gainNode.disconnect()
        nodes.panner.disconnect()
      }
      channelMap.clear()
      ctxRef.current?.close()
    }
  }, [])
}
