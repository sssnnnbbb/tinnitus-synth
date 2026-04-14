# Tinnitus Synth

右耳先天性難聴に伴う耳鳴り（複数周波数が重なった音）を Web Audio API で再現・探索するためのシンセサイザーアプリ。

複数の発振チャンネルを追加し、周波数・音量・パンを独立して調整することで、自分の内部音体験に近い音を組み上げていく。

---

## ローカルでのテスト方法

### 必要なもの

- Node.js 18 以上
- npm 9 以上

### セットアップ

```bash
git clone https://github.com/sssnnnbbb/tinnitus-synth.git
cd tinnitus-synth
npm install
```

### 開発サーバー起動

```bash
npm run dev
```

ブラウザで `http://localhost:5173` を開く。

### 本番ビルド

```bash
npm run build
npm run preview   # ビルド結果を http://localhost:4173 で確認
```

---

## 使い方

1. **MASTER を OFF → ON** にする（ここで AudioContext が初期化される）
2. **チャンネル追加** ボタンで発振チャンネルを追加
3. 各チャンネルで以下を調整する:
   - **波形**: sine / triangle / sawtooth（トーン系）
   - **ノイズ**: white / pink / brown（帯域ノイズ系）
   - **Frequency / BPF Center**: 20〜16000 Hz（スライダー・数値入力・±ボタン）
   - **Volume**: 0〜100（スライダー・数値入力・±ボタン）
   - **Pan**: −100（左）〜 0（中央）〜 +100（右）

> 音量に注意。イヤホン使用時は特に小音量から始めること。

---

## 実装済み機能

| 機能 | 詳細 |
|------|------|
| マスターコントロール | ON/OFF トグル・音量スライダー |
| チャンネル管理 | 追加・削除・ラベル編集 |
| 波形ソース | sine / triangle / sawtooth |
| ノイズソース | white / pink (Voss-McCartney) / brown (積分フィルタ) |
| ノイズ帯域制御 | BandPass フィルタ、周波数スライダーで中心周波数を制御 |
| 周波数範囲 | 20〜16000 Hz（対数スケール） |
| 各パラメータ入力 | スライダー + 数値入力 + ±1 ボタンの3方式 |
| スペクトラムアナライザー | AnalyserNode + Canvas によるリアルタイム描画（対数スケール） |
| アクティブチャンネルマーカー | スペクトラム上に各チャンネルの周波数を緑線で表示 |
| クリックノイズ防止 | パラメータ変更に `linearRampToValueAtTime` を使用 |
| レイアウト | スペクトラム固定表示、チャンネル増加時にスクロール |

## 未実装（将来拡張）

- [ ] プリセット保存・読み込み（localStorage）
- [ ] WAV エクスポート（OfflineAudioContext）
- [ ] 周波数ごとの左右独立制御

---

## 技術スタック

| 役割 | 採用技術 |
|------|----------|
| ビルド | Vite |
| UI フレームワーク | React + TypeScript |
| スタイリング | Tailwind CSS v3 |
| 状態管理 | Zustand |
| 音声エンジン | Web Audio API（ネイティブ） |

---

## 注意事項

このアプリは医療目的ではなく、個人の聴覚体験の探索・記録を目的とする。
