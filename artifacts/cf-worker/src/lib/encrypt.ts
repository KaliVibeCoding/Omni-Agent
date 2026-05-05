/**
 * AES-256-GCM encryption using the Web Crypto API (Cloudflare Workers compatible).
 * Key must be a 64-character hex string (32 bytes).
 * Output format: <12-byte IV hex>:<ciphertext hex>
 */

function hexToBytes(hex: string): Uint8Array {
  const bytes = new Uint8Array(hex.length / 2);
  for (let i = 0; i < hex.length; i += 2) {
    bytes[i / 2] = parseInt(hex.slice(i, i + 2), 16);
  }
  return bytes;
}

function bytesToHex(bytes: Uint8Array): string {
  return Array.from(bytes).map(b => b.toString(16).padStart(2, "0")).join("");
}

async function importKey(keyHex: string): Promise<CryptoKey> {
  const keyBytes = hexToBytes(keyHex);
  return crypto.subtle.importKey("raw", keyBytes, { name: "AES-GCM" }, false, ["encrypt", "decrypt"]);
}

export async function encrypt(text: string, keyHex: string): Promise<string> {
  const key = await importKey(keyHex);
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const encoded = new TextEncoder().encode(text);
  const encrypted = await crypto.subtle.encrypt({ name: "AES-GCM", iv }, key, encoded);
  return `${bytesToHex(iv)}:${bytesToHex(new Uint8Array(encrypted))}`;
}

export async function decrypt(encryptedStr: string, keyHex: string): Promise<string> {
  const [ivHex, cipherHex] = encryptedStr.split(":");
  if (!ivHex || !cipherHex) throw new Error("Invalid encrypted format");
  const key = await importKey(keyHex);
  const iv = hexToBytes(ivHex);
  const cipher = hexToBytes(cipherHex);
  const decrypted = await crypto.subtle.decrypt({ name: "AES-GCM", iv }, key, cipher);
  return new TextDecoder().decode(decrypted);
}
