# App icon padding

The app configuration now uses `assets/resona-icon-padded.png` for the iOS icon,
Android adaptive foreground and web favicon. The original `resona-icon.png` is
retained. The replacement is a square, opaque RGB PNG.

Created with the built-in image editing tool using the original icon as the edit
target. The result was visually inspected before adding it to the project.

Prompt:

> Use case: precise-object-edit. Edit target: the provided Resona Lite app icon. Make one geometric layout change only: uniformly shrink the complete original lime-green logo artwork to 76% of the square canvas width and height and center it, so there is an even 12% margin on every side. Extend the existing solid almost-black green background (#10160e, match the supplied background exactly) to fill all newly exposed space. Preserve the original circular/music-note/wave silhouette exactly, including all internal holes, solid flat lime colour, proportions and placement of every element relative to one another. Do not redesign, redraw, reinterpret, round off, stylize, add texture, gradients, text, shadows, borders or new elements. The original image is the only design source. Output a flat opaque square 1024 x 1024 app icon; no pre-rounded outer corners. Result should simply look like the same supplied icon with more breathing room.

The generated asset is 1254 × 1254; Expo produces the required platform icon sizes
during the native build. A new native build is needed to see the icon change.
