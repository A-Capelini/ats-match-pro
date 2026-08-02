const STORAGE_KEY = "ats-match-pro:api-key";

export function getApiKey(): string {
  if (typeof window === "undefined") return "";
  try {
    return window.localStorage.getItem(STORAGE_KEY) ?? "";
  } catch {
    return "";
  }
}

export function saveApiKey(key: string) {
  try {
    window.localStorage.setItem(STORAGE_KEY, key);
  } catch {
    /* storage indisponível */
  }
}

export function clearApiKey() {
  try {
    window.localStorage.removeItem(STORAGE_KEY);
  } catch {
    /* storage indisponível */
  }
}
