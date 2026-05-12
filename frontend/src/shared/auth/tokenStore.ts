// Tiny encapsulation around storage so swapping (cookie/memory/secure store)
// is a one-line change. Treat this as an injectable seam.

const KEY = "hoovy:access_token";

export interface TokenStore {
  get(): string | null;
  set(token: string): void;
  clear(): void;
}

export const tokenStore: TokenStore = {
  get: () => localStorage.getItem(KEY),
  set: (t) => localStorage.setItem(KEY, t),
  clear: () => localStorage.removeItem(KEY),
};
