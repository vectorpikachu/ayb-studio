# Audio

Machine-generated Eastern Armenian reference audio.

- Engine: eSpeak NG hy (GPL), encoded to 32 kbps MP3 with LAME.
- Source text: Ayb content (dictionary, reading, grammar) and the open lexicon subset.
- Files are named by a stable FNV-1a key of the text; see src/lib/audio-key.ts.
- Missing files simply fall back to the browser speechSynthesis.

Regenerate: npx tsx scripts/generate-audio.ts (set FORCE=1 to overwrite).
