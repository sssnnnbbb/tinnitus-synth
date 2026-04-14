export type Waveform = 'sine' | 'triangle' | 'sawtooth'

export type OscillatorChannel = {
  id: string
  label: string
  frequency: number  // Hz, 20〜8000
  gain: number       // 0.0〜1.0
  pan: number        // -1.0〜1.0
  waveform: Waveform
  enabled: boolean
}

export type SynthState = {
  channels: OscillatorChannel[]
  masterGain: number    // 0.0〜1.0
  masterEnabled: boolean
}

export const MIN_HZ = 20
export const MAX_HZ = 8000

export const sliderToHz = (value: number): number =>
  Math.round(MIN_HZ * Math.pow(MAX_HZ / MIN_HZ, value))

export const hzToSlider = (hz: number): number =>
  Math.log(hz / MIN_HZ) / Math.log(MAX_HZ / MIN_HZ)
