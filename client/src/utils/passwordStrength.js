export function evaluatePasswordStrength(password) {
  if (!password) {
    return { score: 0, label: "הזיני סיסמה", color: "error", checks: {} };
  }

  const checks = {
    length: password.length >= 8,
    uppercase: /[A-Z]/.test(password),
    lowercase: /[a-z]/.test(password),
    number: /\d/.test(password),
    special: /[^A-Za-z0-9]/.test(password),
  };

  const score = Object.values(checks).filter(Boolean).length;

  const levels = [
    { min: 0, label: "חלשה מאוד", color: "error" },
    { min: 2, label: "חלשה", color: "warning" },
    { min: 3, label: "בינונית", color: "info" },
    { min: 4, label: "חזקה", color: "success" },
    { min: 5, label: "חזקה מאוד", color: "success" },
  ];

  const level = [...levels].reverse().find((l) => score >= l.min) || levels[0];

  return { score, label: level.label, color: level.color, checks };
}

export function isPasswordStrong(password) {
  const { score } = evaluatePasswordStrength(password);
  return score >= 4;
}
