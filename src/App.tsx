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
    <div className="h-screen flex flex-col bg-gray-900 text-white overflow-hidden">
      {/* 固定ヘッダー */}
      <div className="shrink-0 px-4 pt-4 pb-2 sm:px-8 sm:pt-6 flex flex-col gap-3">
        {/* タイトル・マスターコントロール: 狭めに揃える */}
        <div className="max-w-2xl w-full mx-auto flex flex-col gap-3">
          <h1 className="text-2xl font-bold tracking-tight">Tinnitus Synth</h1>
          <MasterControl />
        </div>
        {/* スペクトラム: より広い幅で表示 */}
        <div className="max-w-4xl w-full mx-auto">
          <FrequencyDisplay analyserRef={analyserRef} />
        </div>
      </div>

      {/* スクロール可能なチャンネルリスト */}
      <div className="flex-1 overflow-y-auto px-4 pb-4 sm:px-8 sm:pb-8">
        <div className="max-w-2xl mx-auto flex flex-col gap-4 pt-2">
          {channels.map((ch) => (
            <ChannelStrip key={ch.id} channel={ch} />
          ))}

          <button
            onClick={addChannel}
            className="w-full py-3 rounded-xl border-2 border-dashed border-gray-600 text-gray-400 hover:border-indigo-500 hover:text-indigo-400 transition-colors font-medium"
          >
            ＋ チャンネル追加
          </button>
        </div>
      </div>
    </div>
  )
}

export default App
