const TAG_PATTERN = /<[^>]*>/g
const ANGLE_PATTERN = /[<>]/g
const WHITESPACE_PATTERN = /\s+/g
function removeControlCharacters(input: string) {
  return Array.from(input)
    .filter((char) => {
      const code = char.charCodeAt(0)
      return (code >= 32 && code !== 127) || code > 127
    })
    .join("")
}

function safeDecode(value: string) {
  try {
    return decodeURIComponent(value)
  } catch {
    return value
  }
}

export function sanitizeText(raw: string | null, maxLength: number) {
  if (!raw) return ""
  const decoded = removeControlCharacters(safeDecode(raw))
  const cleaned = decoded
    .replace(TAG_PATTERN, "")
    .replace(ANGLE_PATTERN, "")
    .replace(WHITESPACE_PATTERN, " ")
    .trim()
  return Array.from(cleaned).slice(0, maxLength).join("").trim()
}

export function sanitizeAge(raw: string | null) {
  if (!raw) return null
  const age = Number.parseInt(raw, 10)
  if (!Number.isFinite(age) || age < 1 || age > 120) return null
  return age
}
