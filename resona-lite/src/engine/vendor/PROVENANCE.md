These files are copied without synthesis or inference changes from
Exabyte-Technologies/Resona, commit 8ca3d945621142b7cab4a1a1e3ffc157e7945935:

- `resona/static/js/audio.js`
- `resona/static/js/chord-model.js`
- `resona/default_assets/chord-model/model.json`
- `resona/default_assets/chord-model/weights.bin`

Source: https://github.com/Exabyte-Technologies/Resona
License: GPL-3.0 (full upstream license included here).

Keep these originals intact. Mobile transport, asset loading, and continuous-set
coordination live in `../bridge.js`. `scripts/bundle-engine.cjs` packages source
and model bytes locally; the WebView/iframe cannot access the network.

The application shell has no sign-in, account management, chat agent, microphone,
or remote AI API. The offline chord LSTM is retained at the user's explicit request.
