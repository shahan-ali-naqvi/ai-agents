/**
 * Generate a random integer between min and max (inclusive)
 */
export function getRandomPort(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

/**
 * Generate a safe string for URLs from any input
 */
export function createSafeString(input: string): string {
  return input
    .replace(/[^a-zA-Z0-9]/g, '')
    .toLowerCase();
}

/**
 * Generate a unique ID with timestamp and random string
 */
export function generateUniqueId(): string {
  return `${Date.now()}-${Math.random().toString(36).substring(2, 10)}`;
} 