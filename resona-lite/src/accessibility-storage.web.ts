const storageKey = 'resona.accessibility.v1';

export async function readAccessibilityPreferences() {
  return window.localStorage.getItem(storageKey);
}

export function saveAccessibilityPreferences(json: string) {
  window.localStorage.setItem(storageKey, json);
}
