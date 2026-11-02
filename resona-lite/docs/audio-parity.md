# Audio parity diagnosis

Reference: `Exabyte-Technologies/Resona` at
`8ca3d945621142b7cab4a1a1e3ffc157e7945935` (the provided local Resona checkout).
The same `audio.js` default configuration was also checked through GitHub.

## Why Lite sounded different

The previous `src/audio.ts` was a replacement synthesizer, not a mobile port:

- It rendered three 22,050 Hz WAV files, eight seconds long, with repeated fades.
- Pads used a fixed major triad with frequency multipliers 1, 1.25, 1.5. Resona
  uses evolving equal-tempered voicings, detuned stereo sawtooth pairs, analog
  drift, atmosphere-specific harmony, and a lower drone foundation.
- The binaural oscillator coefficients and support tones were different. Lite's
  default carrier was 200 Hz; Resona defaults to F3, about 174.614 Hz.
- The chorus, EQ, saturation, convolution reverb, compressor, feedback delay and
  limiter were missing. Lite's spatial slider only changed channel amplitudes.
- Noise spectra, filters, envelopes and modulation differed.
- Every setting change regenerated all WAV files and replaced the players,
  including changes to volume. Long-term harmonic evolution was absent.
- Chord generation, progression transport/queueing, tonal source/centre,
  atmosphere controls, sculpt parameters and individual ear tuning were absent.

## Repair

Lite now executes the original synthesis and inference source files unchanged.
A local WebView provides the actual browser Web Audio implementation on iOS and
Android; a local iframe runs the same document for web preview. The engine
persists across navigation. Controls call the original setters and render the
engine's acknowledged configuration, rather than maintaining a separate sound
model. Assets are bundled and a CSP disallows network connections.

The four Home modes use the website's exact beat, atmosphere and MIDI roots.
The original chord manifest, vocabulary, weights, sampling, harmonization and
continuous-set A/B/C algorithm are preserved. The model's authenticated HTTP
loader is replaced only by a bundled-byte loader. The offline chord model was
retained at the user's request; accounts and the conversational agent are absent.

## Verification

- Nine automated tests pass: source/asset hashes, graph/transport, all Home
  presets, ambient/binaural harmonic following and transition limits, manual
  glides, individual ears, pause/stop/replay/manual switching, sculpt/noise
  controls, original-versus-offline inference, and continuous queue rotation.
- Twelve real Chromium OfflineAudioContext comparisons render both channels at
  48 kHz for five seconds with matching random input: four modes, progression,
  sculpting, and six noise colours. Noise matched exactly. Maximum difference
  for the synth was 2.98e-8 (tolerance 1e-6), attributable to floating-point DSP.
- Phone-sized browser interaction tests passed for playback, atmosphere/root
  selection, ear modes, local generation, continuous sets, chord pause/replay,
  tonal source switching and navigation. No page errors or external requests;
  no horizontal overflow at 390 px or 320 px. Screenshots were inspected.
- TypeScript and ESLint pass. Expo exports succeed for web, iOS and Android.
- A native Debug build succeeds and installs on the iPhone 17e / iOS 27.2
  simulator. Physical-device listening has not been verified. Playback remains
  foreground-only, as configured by the existing application.

These comparisons verify matched inputs through the shared browser DSP. Separate
live sessions still make random choices; this does not mean that two independently
started sessions will have identical chords, textures or note timing. Physical
phone audio routing and speakers also differ from desktop listening hardware.
