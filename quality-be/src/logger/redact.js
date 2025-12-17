const SENSITIVE_KEYS = new Set([
  "password",
  "pw",
  "passwd",
  "token",
  "accesstoken",
  "refreshtoken",
  "authorization",
  "cookie",
  "set-cookie",
  "secret",
  "apikey",
]);

function maskValue(v) {
  if (v == null) return v;
  const s = String(v);
  if (s.length <= 6) return "***";
  return s.slice(0, 3) + "***" + s.slice(-3);
}

function redact(obj) {
  if (obj == null) return obj;
  if (typeof obj !== "object") return obj;

  if (Array.isArray(obj)) return obj.map(redact);

  const out = {};
  for (const k of Object.keys(obj)) {
    const v = obj[k];
    if (SENSITIVE_KEYS.has(String(k).toLowerCase())) {
      out[k] = maskValue(v);
    } else {
      out[k] = redact(v);
    }
  }
  return out;
}

module.exports = { redact };
