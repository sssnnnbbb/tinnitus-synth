import { useAudioEngine } from './hooks/useAudioEngine'
import { useSynthStore } from './store/useSynthStore'
import { MasterControl } from './components/MasterControl'
import { ChannelStrip } from './components/ChannelStrip'
import { FrequencyDisplay } from './components/FrequencyDisplay'

function App() {
  const { analyserRef } = useAudioEngine()

  const channels = useSynthStore((s) => s.channels)
  const addChannel = useSynthStore((s) => s.addChannel)

  return (
    <div className="min-h-screen bg-gray-900 text-white p-4 sm:p-8">
      <div className="max-w-2xl mx-auto flex flex-col gap-6">
        <h1 className="text-2xl font-bold tracking-tight text-white">
          Tinnitus Synth
        </h1>

        <MasterControl />

        <FrequencyDisplay analyserRef={analyserRef} />

        <div className="flex flex-col gap-4">
          {channels.map((ch) => (
            <ChannelStrip key={ch.id} channel={ch} />
          ))}
        </div>

        <button
          onClick={addChannel}
          className="w-full py-3 rounded-xl border-2 border-dashed border-gray-600 text-gray-400 hover:border-indigo-500 hover:text-indigo-400 transition-colors font-medium"
        >
          ＋ チャンネル追加
        </button>
      </div>
    </div>
  )
}

export default App
