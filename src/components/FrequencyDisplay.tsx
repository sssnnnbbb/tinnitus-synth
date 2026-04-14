import { useSynthStore } from '../store/useSynthStore'

export function FrequencyDisplay() {
  const channels = useSynthStore((s) => s.channels)
  const masterEnabled = useSynthStore((s) => s.masterEnabled)

  const activeChannels = channels.filter((ch) => ch.enabled)

  return (
    <div className="bg-gray-800 rounded-xl px-6 py-4 shadow">
      <h2 className="text-gray-400 text-xs font-semibold uppercase tracking-widest mb-3">
        Active Frequencies
      </h2>
      {!masterEnabled ? (
        <p className="text-gray-600 text-sm">Master OFF</p>
      ) : activeChannels.length === 0 ? (
        <p className="text-gray-600 text-sm">No active channels</p>
      ) : (
        <div className="flex flex-wrap gap-2">
          {activeChannels.map((ch) => (
            <div
              key={ch.id}
              className="bg-gray-700 rounded-lg px-3 py-1.5 text-sm"
            >
              <span className="text-indigo-400 font-mono font-semibold">
                {ch.frequency} Hz
              </span>
              <span className="text-gray-500 text-xs ml-2">{ch.label}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
