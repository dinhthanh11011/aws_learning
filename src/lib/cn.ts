/** Tiny class joiner. Falsy values drop out, so conditionals read cleanly. */
export function cn(...parts: (string | false | null | undefined)[]): string {
  return parts.filter(Boolean).join(' ')
}
