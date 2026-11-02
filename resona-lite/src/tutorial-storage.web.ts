const key = 'resona.tutorial.v1';

export async function hasSeenTutorial(): Promise<boolean> {
  return window.localStorage.getItem(key) === 'completed';
}

export async function markTutorialSeen(): Promise<void> {
  window.localStorage.setItem(key, 'completed');
}
