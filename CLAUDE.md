# tinnitus-synth

## プロジェクト概要

右耳先天性難聴に伴う耳鳴り（複数周波数が重なった音）を Web Audio API で再現・探索するためのシンセサイザーアプリ。

ユーザーが複数の発振チャンネルを追加し、それぞれの周波数・音量・パンを独立して調整することで、自分の内部音体験に近い音を組み上げていく。

---

## 技術スタック

| 役割 | 採用技術 |
|------|----------|
| ビルド | Vite |
| UI フレームワーク | React + TypeScript |
| スタイリング | Tailwind CSS |
| 状態管理 | Zustand |
| 音声エンジン | Web Audio API（ネイティブ） |

外部音声ライブラリは使用しない。

---

## ディレクトリ構成

```
tinnitus-synth/
├── CLAUDE.md
├── index.html
├── package.json
├── vite.config.ts
├── tailwind.config.ts
└── src/
    ├── main.tsx
    ├── App.tsx
    ├── types/
    │   └── index.ts              # 型定義
    ├── store/
    │   └── useSynthStore.ts      # Zustand ストア
    ├── hooks/
    │   └── useAudioEngine.ts     # Web Audio API の管理
    └── components/
        ├── MasterControl.tsx     # マスター音量・全体 ON/OFF
        ├── ChannelStrip.tsx      # 1 チャンネル分の UI
        └── FrequencyDisplay.tsx  # 周波数表示（将来: AnalyserNode 可視化）
```

---

## データモデル

```typescript
// src/types/index.ts

export type Waveform = 'sine' | 'triangle' | 'sawtooth'

export type OscillatorChannel = {
  id: string
  label: string        // "Channel 1" など（ユーザー編集可）
  frequency: number    // Hz、範囲: 20〜8000
  gain: number         // 0.0〜1.0
  pan: number          // -1.0（左）〜 1.0（右）
  waveform: Waveform
  enabled: boolean
}

export type SynthState = {
  channels: OscillatorChannel[]
  masterGain: number   // 0.0〜1.0
  masterEnabled: boolean
}
```

---

## Audio ノード構成

```
AudioContext
  └── MasterGainNode  (masterGain)
        └── [チャンネルごと]
              OscillatorNode
                → GainNode       (channel.gain)
                → StereoPannerNode (channel.pan)
                → MasterGainNode
```

### 実装上の注意

- **AutoPlay 制限対策**  
  `AudioContext` の生成はユーザーの最初の操作（マスター ON ボタン押下）まで遅延させる。

- **クリックノイズ防止**  
  パラメータ変更には `AudioParam.linearRampToValueAtTime()` または `setTargetAtTime()` を使い、値の急変を避ける。  
  チャンネル ON/OFF 時は GainNode を 0 にフェードしてから OscillatorNode を停止する。

- **チャンネルの動的追加・削除**  
  `useAudioEngine` はチャンネル ID をキーに OscillatorNode のインスタンスを Map で管理する。  
  削除時は `oscillator.stop()` → ノードを disconnect → Map から削除。

---

## UI 仕様

### MasterControl
- マスター ON/OFF トグル
- マスター音量スライダー（0〜100）

### ChannelStrip（チャンネルごと）
- ラベル（インライン編集可）
- 波形セレクト（sine / triangle / sawtooth）
- **周波数スライダー**：対数スケール、範囲 20〜8000 Hz
  - スライダーと数値入力フィールドの双方向バインディング
  - 微調整ボタン（−1 Hz / +1 Hz）
- 音量スライダー（0〜100）
- パンスライダー（L ←→ R）
- チャンネル ON/OFF トグル
- 削除ボタン

### チャンネル追加
- 画面下部の「＋ チャンネル追加」ボタン
- デフォルト値：frequency=1100, gain=0.3, pan=0.0, waveform=sine, enabled=true

---

## 周波数スライダーのスケール変換

人間の聴覚は対数的なので、スライダーは線形値（0〜1）を対数変換して周波数に変換する。

```typescript
// slider value (0〜1) → Hz
const MIN_HZ = 20
const MAX_HZ = 8000

export const sliderToHz = (value: number): number =>
  Math.round(MIN_HZ * Math.pow(MAX_HZ / MIN_HZ, value))

export const hzToSlider = (hz: number): number =>
  Math.log(hz / MIN_HZ) / Math.log(MAX_HZ / MIN_HZ)
```

---

## 将来拡張（現バージョンでは未実装）

- [ ] プリセット保存・読み込み（localStorage）
- [ ] ノイズソース追加（ホワイトノイズ、ピンクノイズ）
- [ ] AnalyserNode による波形・スペクトル可視化
- [ ] WAV エクスポート（OfflineAudioContext）
- [ ] 周波数ごとの左右独立制御（現在は StereoPanner で両耳に出力）

---

## 開発コマンド

```bash
npm install
npm run dev      # 開発サーバー起動
npm run build    # 本番ビルド
npm run preview  # ビルド結果のプレビュー
```

---

## 備考

- このアプリは医療目的ではなく、個人の聴覚体験の探索・記録を目的とする
- 音量には注意すること。イヤホン使用時は特に小音量から始める
