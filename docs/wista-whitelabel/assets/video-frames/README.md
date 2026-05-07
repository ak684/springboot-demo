# Video Frame Index

These stills were extracted from
`Strategic Updates and Future Plans for Vista Collaboration.mp4`
with `ffmpeg`.

Extraction pattern:

- scene-based selection using threshold `gt(scene,0.30)`
- output naming pattern: `scene-####.jpg`
- total extracted JPGs: `40`
- approximate source duration: about `93` minutes

Reason for this version:

- the earlier time-based sweep produced many visually redundant frames
- this scene-based set is much smaller and more useful for review
- exact duplicate and strict adjacent perceptual-duplicate checks came back
  clean on this set
