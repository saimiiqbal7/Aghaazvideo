## Aghaaz Player — Architecture & Features

### Overview

Aghaaz Player is a **single-page Next.js (App Router) app** that delivers a full video learning experience around **one hardcoded HLS lesson**.  
There is **no routing, no params, no lesson IDs** — the entire product lives in `app/page.tsx` and a small set of components.

Tech stack:

- **Next.js (App Router)**
- **TypeScript**
- **Tailwind base** (but layout is all inline styles)
- **HLS.js** for streaming
- **Tiptap** for notes
- **Gemini 2.5 Flash** via a Next API route
- **canvas-confetti** for celebration effects

---

## Styling — `app/globals.css`

- Global reset and theming:
  - Dark, lime-accent **Aghaaz** palette:
    - `--bg-base`, `--bg-surface`, `--bg-elevated`
    - `--lime`, `--lime-dim`, `--lime-border`
    - `--text-primary`, `--text-secondary`, `--text-muted`
- Global layout:
  - `html, body` are full-viewport, hidden overflow, system font stack.
- Scrollbars:
  - Thin custom scrollbars with subtle white thumb.
  - `.scrollbar-hide` helper class to fully hide scrollbars where needed.
- **Tiptap editor styles**:
  - `.tiptap-editor` sets typography, spacing, headings, lists, `mark`, `strong`, `em`, and placeholder behavior.
- **Blitz animations**:
  - `pulse-dot` for online status dot.
  - `msg-in` for message entry animation.
  - `dot-bounce` for typing indicator.
  - `fade-in` utility.

---

## Root Layout — `app/layout.tsx`

- Minimal Next layout that:
  - Imports `globals.css`.
  - Sets `metadata`:
    - `title: 'Aghaaz — Learn'`
    - `description: 'Video lessons for Pakistani students'`
  - Wraps all content in a bare `<html><body>{children}</body></html>`.

---

## Lesson Data & Types

### `types/index.ts`

Shared types:

- **`Checkpoint`**:
  - `id: string`
  - `timestamp: number` (seconds)
  - `question: string`
  - `options: string[]`
  - `correctIndex: number`
- **`BlitzMessage`**:
  - `id: string`
  - `role: 'blitz' | 'user' | 'system'`
  - `content: string`

### `lib/lessonData.ts`

Hardcoded lesson configuration:

- **HLS URL**: `HLS_URL` points to the single lesson `.m3u8`.
- Metadata:
  - `LESSON_TITLE = 'Office Day at Aghaaz'`
  - `SUBJECT = 'Computer Science'`
  - `GRADE = '9th Grade'`
  - `CHAPTER = 'Chapter 1 · Introduction'`
- **CHECKPOINTS**:
  - Array of `Checkpoint` objects with timestamps and MCQs tied to the video narrative.

---

## Blitz API — `app/api/blitz/route.ts`

- **Environment**: reads `process.env.GEMINI_API_KEY` from `.env.local`.

`.env.local`:

```bash
GEMINI_API_KEY=PASTE_YOUR_KEY_HERE
```

- POST `/api/blitz`:
  - Body: `{ message: string }`.
  - Calls:
    - `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=...`
  - Payload:
    - `contents` with the user prompt.
    - `systemInstruction` describing **Blitz**:
      - Warm, encouraging Pakistani Matric/FSc tutor.
      - Mixes Urdu phrases like “samajh gaye?”, “theek hai”, “bilkul sahi”, “koi baat nahi”.
      - 2–3 sentence responses, conversational (not textbook).
  - Response:
    - Extracts `data.candidates[0].content.parts[0].text`.
    - Fallback: `"Koi baat nahi — try again in a moment!"`.
    - Returns `{ message: text }`.

---

## Main Page — `app/page.tsx`

### High-level layout

- Root `<div>`:

  - `display: 'flex'`
  - `flexDirection: 'column'`
  - `height: '100vh'`
  - `background: 'var(--bg-base)'`
  - `overflow: 'hidden'`

- Main content row (fills remaining height):

  - `display: 'flex'`
  - `position: 'relative'`
  - `flex: 1`
  - `minHeight: 0`
  - Children in order:
    1. `NotesPanel` (left, fixed width when open).
    2. `VideoPlayer` (center, `flex: 1`).
    3. `BlitzPanel` (right, fixed width when open).

When you open side panels, they **take horizontal space**; the video area shrinks instead of being overlaid.

### State

- **Video**:
  - `videoRef: Ref<HTMLVideoElement | null>`
  - `hlsRef: Ref<any>`
  - `currentTime`, `duration`
  - `isPlaying`
  - `volume`, `isMuted`
  - `speed`

- **Panels**:
  - `isNotesOpen`
  - `isBlitzOpen`

- **Notes**:
  - `noteMarkers: Array<{ id: string; time: number; text: string }>`
    - Each marker is saved from the notes editor at the current video time.

- **Checkpoints**:
  - `activeCheckpoint: Checkpoint | null`
  - `answeredIds: Set<string>`
  - `quizResult: 'correct' | 'wrong' | null`
  - `selectedIdx: number | null`
  - `isPlayingRef: Ref<boolean>` (for checkpoint triggers).

- **Blitz chat**:
  - `blitzMessages: BlitzMessage[]`
    - Starts with a welcome Blitz message explaining usage.
  - `isBlitzLoading: boolean`

### HLS setup

- `useEffect` on mount:
  - Grabs `videoRef.current`.
  - Dynamically imports `hls.js`.
  - If `Hls.isSupported()`:
    - Creates `new Hls({ enableWorker: true })`.
    - Loads `HLS_URL` and attaches to the `<video>`.
  - Fallbacks to native HLS for Safari via `video.canPlayType('application/vnd.apple.mpegurl')`.
- Event listeners:
  - `loadedmetadata` → sets `duration`.
  - `timeupdate` → sets `currentTime`.
  - `play`/`pause` → manages `isPlaying` + `isPlayingRef`.
  - `volumechange` → syncs `volume` & `isMuted`.
- Cleanup:
  - Removes all listeners.
  - Destroys `hlsRef.current`.

### Checkpoint trigger logic

- `useEffect` watching `currentTime`, `answeredIds`, `activeCheckpoint`:
  - If there’s no active checkpoint and the video is playing (`isPlayingRef.current`):
    - Finds the **first unanswered checkpoint** whose `timestamp <= currentTime`.
    - Pauses the video and sets `activeCheckpoint`.
    - Adds a Blitz system message: `📋 Checkpoint — <question snippet>...`.

### Answering a checkpoint

- `handleAnswer(idx)`:
  - Ignores if no active checkpoint or already answered.
  - Determines correctness: `idx === activeCheckpoint.correctIndex`.
  - Updates:
    - `selectedIdx`
    - `quizResult` (`'correct' | 'wrong'`)
    - `answeredIds` (adds checkpoint id).
  - **If correct**:
    - Fires `canvas-confetti` with lime-themed colors.
    - Calls `callBlitz` with a **celebration prompt** describing the question + chosen answer.
  - **If wrong**:
    - Opens Blitz panel (`setIsBlitzOpen(true)`).
    - Calls `callBlitz` with an **explanation prompt** (question, chosen option, correct option).

- `handleContinue()`:
  - Clears `activeCheckpoint`, `quizResult`, `selectedIdx`.
  - Resumes video playback.
  - Adds Blitz system message: `▶ Resumed`.

### Blitz helper & send

- `addSystemMsg` / `addBlitzMsg`: push messages into `blitzMessages`.
- `callBlitz(prompt)`:
  - Sets `isBlitzLoading`.
  - POSTs to `/api/blitz`.
  - On success, appends the AI’s message.
  - On error, appends the fallback Urdu message.
- `handleBlitzSend(message)`:
  - Appends a user message to chat.
  - Calls `callBlitz` with lesson context:
    - `"Student is watching a lesson called "Office Day at Aghaaz" and asks: "<message>"`.

### Video controls & keyboard shortcuts

Control callbacks all act directly on `videoRef`:

- `togglePlay`, `seekTo`, `seekRelative(delta)`.
- `setVolume(vol)`, `setSpeed(s)`, `toggleMute()`, `toggleFullscreen()`.

Keyboard shortcuts (`window` listener):

- Space: play/pause (while not focused in inputs/editors).
- ArrowLeft/ArrowRight: ±10 seconds.
- ArrowUp/Down: volume ±0.1.
- `m` / `M`: mute toggle.
- `f` / `F`: fullscreen toggle.

### Auto-pause on tab change

- `useEffect` on `visibilitychange`:
  - When `document.hidden` becomes `true`:
    - Pauses the video if it’s playing.
    - Adds a system message: `⏸ Paused because you switched tabs`.
  - This prevents “fake watching” in a background tab.

---

## Notes Panel — `components/NotesPanel.tsx`

### Props

```ts
type Props = {
  isOpen: boolean
  onToggle: () => void
  currentTime: number
  noteMarkers: Array<{ id: string; time: number; text: string }>
  onSaveNote: (text: string) => void
}
```

### Behavior

- Uses **Tiptap** (`StarterKit`, `Highlight`, `Typography`) with:
  - Placeholder: “Start typing — notes are saved automatically and timestamped to the video.”
- Local persistence:
  - Restores from `localStorage[LESSON_ID]` on mount.
  - Autosaves JSON every 2 seconds.
- `insertTimestamp()`:
  - Inserts `<mark>[mm:ss]</mark>` at current cursor based on `currentTime`.

### Amber “paper” theme

- Chevron tab on the left:
  - Stays **absolutely positioned** over the left edge.
  - Icon and vertical text are amber: `#f59e0b`.
- Panel itself (now **in layout**):
  - `width: isOpen ? 340 : 0`, `flexShrink: 0`.
  - Amber “My Notes” header and timestamp chip.
  - Toolbar active state uses amber background/border/text.

### Save note button

- Full-width button above the editor:

  - Reads the full editor text via `editor.getText()`.
  - If non-empty:
    - Calls `onSaveNote(text)` → main page adds a `noteMarker` with current timestamp.
    - Sets `saved = true` for 1.5s to flash confirmation.
  - Button label:
    - Default: `📌 Save note at mm:ss`.
    - After save: `📌 Note saved at mm:ss`.

---

## Video Player — `components/VideoPlayer.tsx`

### Props

```ts
type Props = {
  videoRef: React.RefObject<HTMLVideoElement | null>
  currentTime: number
  duration: number
  isPlaying: boolean
  volume: number
  isMuted: boolean
  speed: number
  noteMarkers: Array<{ id: string; time: number; text: string }>
  checkpoints: Checkpoint[]
  answeredIds: Set<string>
  activeCheckpoint: Checkpoint | null
  quizResult: 'correct' | 'wrong' | null
  selectedIdx: number | null
  onAnswer: (idx: number) => void
  onContinue: () => void
  onSeek: (fraction: number) => void
  onTogglePlay: () => void
  onSeekRelative: (delta: number) => void
  onVolumeChange: (vol: number) => void
  onSpeedChange: (speed: number) => void
  onToggleMute: () => void
  onFullscreen: () => void
}
```

### Layout & controls

- `<video>` fills available space (`objectFit: 'contain'`).
- Overlay controls fade out on inactivity while playing (using a timer).
- Timeline:
  - Lime progress bar + playhead.
  - **Checkpoint diamonds**:
    - Small rotated squares at checkpoint positions.
    - Filled when answered.
    - Tooltip with the question on hover.
  - **Note markers**:
    - Rendered as `📝` with amber drop shadow at `note.time / duration`.
    - Tooltip shows clipped note text.

- Left controls:
  - Skip back/forward 10s.
  - Play/pause.
  - Time display (`mm:ss / mm:ss`).

- Right controls:
  - Volume button + hover slider.
  - Speed selector cycling through `0.75x, 1x, 1.25x, 1.5x, 2x`.
  - Fullscreen toggle.

### Checkpoint overlay

- Full-screen darkened card when `activeCheckpoint` is set.
- Shows:
  - “⚡ Checkpoint” label.
  - Question text.
  - Options as buttons; styling changes based on correctness:
    - Correct answer highlighted in green.
    - Wrong choice highlighted red.
    - Others dimmed.

- Continue button (for both outcomes):

  - Visible whenever `quizResult !== null`.
  - For correct:
    - Lime background, dark text, label: `▶ Continue Lesson`.
  - For wrong:
    - Neutral background and border, label: `Continue Lesson →`.
  - Calls `onContinue` to clear state and resume video.

---

## Blitz Panel — `components/BlitzPanel.tsx`

### Props

```ts
type Props = {
  isOpen: boolean
  onToggle: () => void
  messages: BlitzMessage[]
  isLoading: boolean
  onSend: (message: string) => void
  lessonTitle: string
}
```

### Behavior & UI

- Chevron tab on the right:
  - Absolutely positioned.
  - Lime arrow + “Blitz AI” label.
- Panel (participates in flex layout):
  - `width: isOpen ? 300 : 0`, `flexShrink: 0`.
  - Lime avatar box with ⚡.
  - Header subtitle: `AI Tutor · <truncated lessonTitle>`.
  - Online status dot with `blitz-pulse` animation.
- Chat area:
  - System messages (centered, small, muted).
  - Blitz messages on the left with lime border.
  - User messages on the right with neutral bubbles.
  - Typing indicator with three bouncing dots using `dot-bounce`.
- Input:
  - Textarea with Enter-to-send (Shift+Enter for newline).
  - Send button with paper-plane icon, disabled when empty or loading.

---

## Behavior in Production / Vercel

- The route is **static** but uses client-side features:
  - HLS.js, Tiptap, Blitz API, confetti, keyboard shortcuts.
- **Next Dev Tools** (“N” button) you see in dev are not part of the app and don’t show in production.
- TypeScript adjustments (like `RefObject<HTMLVideoElement | null>`) ensure the app compiles cleanly on Vercel.

This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
