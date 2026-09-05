export function evaluatePasswordStrength(password) {
  if (!password) {
    return { score: 0, label: "Enter a password", color: "error", checks: {} };
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
    { min: 0, label: "Very Weak", color: "error" },
    { min: 2, label: "Weak", color: "warning" },
    { min: 3, label: "Medium", color: "info" },
    { min: 4, label: "Strong", color: "success" },
    { min: 5, label: "Very Strong", color: "success" },
  ];

  const level = [...levels].reverse().find((l) => score >= l.min) || levels[0];

  return { score, label: level.label, color: level.color, checks };
}

export function isPasswordStrong(password) {
  const { score } = evaluatePasswordStrength(password);
  return score >= 4;
}
