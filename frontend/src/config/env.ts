// Centralized, typed access to env vars. Validate at module load so missing
// configuration fails fast on boot instead of randomly at first request.

const required = (key: string, value: string | undefined): string => {
  if (!value) throw new Error(`missing env: ${key}`);
  return value;
};

export const env = {
  apiBaseUrl: required("VITE_API_BASE_URL", import.meta.env.VITE_API_BASE_URL),
} as const;
