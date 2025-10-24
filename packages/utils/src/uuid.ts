/**
 * Generate a version 4 UUID
 */
export function uuid(): string {
  return crypto.randomUUID();
}
