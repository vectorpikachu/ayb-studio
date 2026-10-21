/**
 * Stable 32-bit FNV-1a key for a spoken text. The generator and the browser
 * must produce the same name, so keep this helper free of platform APIs.
 */
export function audioKey(text: string): string {
  const normalized = text.replace(/\s+/g, " ").trim();
  let hash = 0x811c9dc5;
  for (let i = 0; i < normalized.length; i += 1) {
    hash ^= normalized.charCodeAt(i);
    hash = Math.imul(hash, 0x01000193) >>> 0;
  }
  return hash.toString(36);
}

let audioIndex: Promise<Set<string>> | null = null;
let audioKeys: Set<string> | null = null;

/** Whether the static audio bundle contains a clip for this text. */
export function loadAudioIndex(): Promise<Set<string>> {
  if (!audioIndex) {
    audioIndex = fetch("/audio/manifest.json")
      .then((response) => (response.ok ? response.json() : { keys: [] }))
      .then((data: { keys?: string[] }) => {
        audioKeys = new Set(data.keys ?? []);
        return audioKeys;
      })
      .catch(() => {
        audioKeys = new Set<string>();
        return audioKeys;
      });
  }
  return audioIndex;
}

/** The loaded index, if the manifest has already arrived (synchronous check). */
export function peekAudioIndex(): Set<string> | null {
  return audioKeys;
}
