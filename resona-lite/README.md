# Resona Lite

Resona's music engine in an Expo mobile app, without accounts or the chat/voice
agent. Everything needed for playback and chord inference is packaged on-device.

A short first-launch tour introduces moods, playback, Advanced and chords. Finish
or skip it once; use **Quick tour** in the header to replay it. This preference
is stored only on the device. Transitions respect the system Reduce Motion setting.

Home keeps the simple Sleep, Meditation, Focus and Awake transport. Advanced has:

- The original six-layer ambient synth and full effects chain: EQ, saturation,
  stereo chorus, compression, convolution reverb, filtered feedback delay, limiter.
- Restore, Melancholy and Deep meditation atmospheres; C/D/E♭/F/G/A tonal centres;
  manual root tuning; warmth, movement, space, texture, shimmer and output controls.
- Difference or individual-ear binaural tuning, band presets and support tone mix.
- Original offline chord model, seeds, progression length, creativity, top choices,
  predictable mode, play/pause/stop/replay, and continuous A/B/C set preparation.
- 2–120 seconds per chord and independent 0–4 second ambient/binaural transitions.
- White, pink, brown, rain, ocean and forest noise; per-track and master volume.

The original engine and model assets are vendored unchanged with provenance and
GPL license in `src/engine/vendor`. The old eight-second WAV loop approximations
have been removed. Controls update the active graph instead of replacing files.
The engine lives in one persistent, local WebView, shared between both screens.
Web preview uses the same document in an iframe. There are no server requests.
The offline chord model is retained intentionally; there is no conversational AI.

## Run

```sh
npm ci
npm start
```

The WebView native dependency requires a fresh app binary if you were previously
using a custom development build. Rebuild with `npm run ios` / `npm run android`,
or use an Expo Go version matching SDK 58. Audio is foreground-only; background
playback is not implemented. Headphones are recommended for binaural beats.

## Validate

```sh
npm test
npm run typecheck
npm run lint
npx expo export --platform web
```

`npm test` checks pinned upstream hashes, audio graph/transport behavior, exact
mode frequencies, harmonic retuning, transitions, individual ears, the local
model versus original model loading, and continuous-set rotation/cancellation.

An additional real browser DSP comparison is available with Playwright installed:

```sh
RESONA_SOURCE=/path/to/Resona/resona/static/js/audio.js node scripts/verify-render.cjs
```

It renders 12 scenarios through OfflineAudioContext with the same random seed and
compares both channels with a 1e-6 floating-point tolerance. Set `CHROME_PATH` if
Chrome is installed elsewhere. Independent live sessions remain generative:
random chords, textures and timing need not be identical between two runs.

Tutorial interaction checks can also run without a browser when `esbuild` and
`jsdom` are available (including via `NODE_PATH`):

```sh
node scripts/verify-tutorial.cjs
node scripts/verify-tutorial.cjs --motion
```

These cover first-launch display, all four steps, Back, Finish, Skip, persistence
across remounts, and restarting the tour, with and without reduced motion.
