export type Waveform = 'sine' | 'triangle' | 'sawtooth'
export type NoiseType = 'white' | 'pink' | 'brown'
export type SourceType = Waveform | NoiseType

export const NOISE_TYPES: NoiseType[] = ['white', 'pink', 'brown']
export const OSC_WAVEFORMS: Waveform[] = ['sine', 'triangle', 'sawtooth']

export const isNoise = (s: SourceType): s is NoiseType =>
  NOISE_TYPES.includes(s as NoiseType)

export type OscillatorChannel = {
  id: string
  label: string
  frequency: number  // Hz, 20〜16000（ノイズ時はBPFの中心周波数）
  gain: number       // 0.0〜1.0
  pan: number        // -1.0〜1.0
  waveform: SourceType
  enabled: boolean
}

export type SynthState = {
  channels: OscillatorChannel[]
  masterGain: number    // 0.0〜1.0
  masterEnabled: boolean
}

export const MIN_HZ = 20
export const MAX_HZ = 16000

export const sliderToHz = (value: number): number =>
  Math.round(MIN_HZ * Math.pow(MAX_HZ / MIN_HZ, value))

export const hzToSlider = (hz: number): number =>
  Math.log(hz / MIN_HZ) / Math.log(MAX_HZ / MIN_HZ)
