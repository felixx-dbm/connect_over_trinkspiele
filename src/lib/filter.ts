// Word-boundary regex patterns for slurs and hate speech.
// Covers EN + DE. Not exhaustive — a basic gate, not a moderation system.
const BLOCKED: RegExp[] = [
  // English racial slurs
  /\bn+i+g+[ae]r+s?\b/i,
  /\bn+i+g+[s]?\b/i,
  /\bchinks?\b/i,
  /\bgooks?\b/i,
  /\bspics?\b/i,
  /\bkikes?\b/i,
  /\bwetbacks?\b/i,
  /\bcoons?\b/i,
  /\bpakis?\b/i,
  /\bporch\s*monkey\b/i,
  // German racial slurs
  /\bneger\b/i,
  /\bkanak[ei]n?\b/i,
  /\bschlitzauge\b/i,
  // Homophobic / transphobic (EN)
  /\bfagg?o+ts?\b/i,
  /\btrann(y|ies)\b/i,
  // German homophobic
  /\bschwuchtel\b/i,
  /\btunte\b/i,
  // Ableist
  /\bretards?\b/i,
  // Nazi / hate symbols
  /\bheil\s+hitler\b/i,
  /\bsieg\s+heil\b/i,
];

export function containsSlur(text: string): boolean {
  return BLOCKED.some((re) => re.test(text));
}
