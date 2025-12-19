export function visualLen(str: unknown) {
  return String(str ?? "")
    .split(/\r?\n/)
    .map((line) =>
      [...line].reduce((acc, ch) => acc + (ch.charCodeAt(0) > 0xff ? 2 : 1), 0)
    )
    .reduce((a, b) => Math.max(a, b), 0);
}
