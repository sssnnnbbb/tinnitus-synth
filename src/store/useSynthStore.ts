import { create } from 'zustand'
import type { OscillatorChannel, SynthState } from '../types'

type SynthActions = {
  addChannel: () => void
  removeChannel: (id: string) => void
  updateChannel: (id: string, patch: Partial<OscillatorChannel>) => void
  setMasterGain: (gain: number) => void
  setMasterEnabled: (enabled: boolean) => void
}

let channelCounter = 1

const createDefaultChannel = (): OscillatorChannel => ({
  id: crypto.randomUUID(),
  label: `Channel ${channelCounter++}`,
  frequency: 1100,
  gain: 0.3,
  pan: 0.0,
  waveform: 'sine',
  enabled: true,
})

export const useSynthStore = create<SynthState & SynthActions>((set) => ({
  channels: [createDefaultChannel()],
  masterGain: 0.5,
  masterEnabled: false,

  addChannel: () =>
    set((state) => ({
      channels: [...state.channels, createDefaultChannel()],
    })),

  removeChannel: (id) =>
    set((state) => ({
      channels: state.channels.filter((ch) => ch.id !== id),
    })),

  updateChannel: (id, patch) =>
    set((state) => ({
      channels: state.channels.map((ch) =>
        ch.id === id ? { ...ch, ...patch } : ch
      ),
    })),

  setMasterGain: (gain) => set({ masterGain: gain }),
  setMasterEnabled: (enabled) => set({ masterEnabled: enabled }),
}))
