# Resona Lite

The mobile app is an Expo/React Native version of the original Resona player. It opens directly on Home and has only Home and Advanced tabs. The existing Resona player pages and styling are under `../Resona/`; this app keeps its implementation and copied app icon inside this folder.

The app has no sign-in, registration, account controls, AI, or microphone access. Its binaural, ambient, and noise tracks are synthesized locally on the device.

## Run

```sh
npm install
npm start
```

Build and launch with `npx expo run:ios` or `npx expo run:android` (requires the matching native toolchain). `npm run typecheck` checks the TypeScript sources.
