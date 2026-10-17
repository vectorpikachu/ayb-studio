import { randomBytes, scrypt, timingSafeEqual } from "node:crypto";

const KEY_LENGTH = 64;

function derive(password: string, salt: string): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    scrypt(password, salt, KEY_LENGTH, (error, key) => {
      if (error) reject(error);
      else resolve(key);
    });
  });
}

export async function hashPassword(password: string): Promise<string> {
  const salt = randomBytes(16).toString("hex");
  const key = await derive(password, salt);
  return `scrypt$${salt}$${key.toString("hex")}`;
}

export async function verifyPassword(password: string, stored: string): Promise<boolean> {
  const [algorithm, salt, hash] = stored.split("$");
  if (algorithm !== "scrypt" || !salt || !hash) return false;

  try {
    const key = await derive(password, salt);
    const expected = Buffer.from(hash, "hex");
    if (expected.length !== key.length) return false;
    return timingSafeEqual(key, expected);
  } catch {
    return false;
  }
}
