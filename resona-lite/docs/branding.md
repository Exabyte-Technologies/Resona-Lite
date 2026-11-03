# Gradient logo

The app icon, launch screen and header use `assets/resona-icon-gradient.png`.
The original padded icon is preserved in `assets/resona-icon-padded.png`.

Mode: edit with the built-in image generation tool, using the padded original as reference.

Exact prompt:

> Edit the supplied Resona Lite app icon, changing ONLY its colors. Preserve exactly the padded composition, placement, dimensions and all silhouettes: the circular musical-note/wave mark and its separate round dot. Replace the lime green logo fill with a refined smooth diagonal teal-to-mint gradient, from #176d70 in the lower left through #5fa9a7 to #83c9bd and #a0d9ce in the upper right, matching the Resona interface accent palette. Use an absolutely solid flat dark blue-green background #101a1c everywhere outside the logo. No texture, lighting, shadows, extra highlights, text, borders, additional shapes, or round exterior corners. Retain the existing generous margins. This is the same original brand mark, recolored only. Output a square opaque high-resolution app icon.

Android status icons must be monochrome. `assets/branding/notification-icon.svg`
is a code-native simplified version of the circular mark, rendered to the transparent
white `assets/notification-icon.png` with `rsvg-convert`.
