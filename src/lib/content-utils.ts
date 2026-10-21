/**
 * A small helper that can be shared by server-side content loaders. It is
 * deliberately dependency free so it also runs in tests.
 */
export function mergeById<T extends { id: string }>(base: T[], custom: T[]): T[] {
  const merged = new Map<string, T>();
  for (const item of base) merged.set(item.id, item);
  for (const item of custom) merged.set(item.id, item);
  return Array.from(merged.values());
}
