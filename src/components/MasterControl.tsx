import { useSynthStore } from '../store/useSynthStore'

export function MasterControl() {
  const masterEnabled = useSynthStore((s) => s.masterEnabled)
  const masterGain = useSynthStore((s) => s.masterGain)
  const setMasterEnabled = useSynthStore((s) => s.setMasterEnabled)
  const setMasterGain = useSynthStore((s) => s.setMasterGain)

  return (
    <div className="flex items-center gap-6 bg-gray-800 rounded-xl px-6 py-4 shadow-lg">
      <span className="text-white font-bold text-lg tracking-wide">MASTER</span>

      <button
        onClick={() => setMasterEnabled(!masterEnabled)}
        className={`px-5 py-2 rounded-full font-semibold transition-colors ${
          masterEnabled
            ? 'bg-green-500 text-white hover:bg-green-400'
            : 'bg-gray-600 text-gray-300 hover:bg-gray-500'
        }`}
      >
        {masterEnabled ? 'ON' : 'OFF'}
      </button>

      <div className="flex items-center gap-3 flex-1">
        <span className="text-gray-400 text-sm w-12">Volume</span>
        <input
          type="range"
          min={0}
          max={100}
          value={Math.round(masterGain * 100)}
          onChange={(e) => setMasterGain(Number(e.target.value) / 100)}
          className="flex-1 accent-green-500"
        />
        <span className="text-gray-300 text-sm w-8 text-right">
          {Math.round(masterGain * 100)}
        </span>
      </div>
    </div>
  )
}
