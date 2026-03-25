export interface PasswordStrengthResult {
  score: number;
  strength: 'weak' | 'fair' | 'good' | 'strong';
  percentage: number;
  feedback: string[];
  metrics: {
    length: number;
    hasUppercase: boolean;
    hasLowercase: boolean;
    hasNumbers: boolean;
    hasSpecialChars: boolean;
    hasSequence: boolean;
    hasRepeat: boolean;
    entropy: number;
  };
}

export function analyzePassword(password: string): PasswordStrengthResult {
  const metrics = {
    length: password.length,
    hasUppercase: /[A-Z]/.test(password),
    hasLowercase: /[a-z]/.test(password),
    hasNumbers: /[0-9]/.test(password),
    hasSpecialChars: /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password),
    hasSequence: hasSequentialChars(password),
    hasRepeat: hasRepeatingChars(password),
    entropy: calculateEntropy(password),
  };

  let score = 0;
  const feedback: string[] = [];

  // Length scoring
  if (metrics.length >= 8) score += 10;
  if (metrics.length >= 12) score += 10;
  if (metrics.length >= 16) score += 10;
  if (metrics.length < 8) feedback.push('Use at least 8 characters');

  // Character variety scoring
  if (metrics.hasUppercase) score += 10;
  else feedback.push('Add uppercase letters');

  if (metrics.hasLowercase) score += 10;
  else feedback.push('Add lowercase letters');

  if (metrics.hasNumbers) score += 10;
  else feedback.push('Add numbers');

  if (metrics.hasSpecialChars) score += 15;
  else feedback.push('Add special characters (!@#$%^&*)');

  // Deductions
  if (metrics.hasSequence) {
    score -= 10;
    feedback.push('Avoid sequential characters (abc, 123)');
  }

  if (metrics.hasRepeat) {
    score -= 5;
    feedback.push('Avoid repeating characters');
  }

  // Entropy bonus
  if (metrics.entropy > 50) score += 10;
  if (metrics.entropy > 80) score += 5;

  // Normalize score to 0-100
  score = Math.max(0, Math.min(100, score));

  let strength: 'weak' | 'fair' | 'good' | 'strong';
  if (score < 30) strength = 'weak';
  else if (score < 60) strength = 'fair';
  else if (score < 80) strength = 'good';
  else strength = 'strong';

  return {
    score,
    strength,
    percentage: score,
    feedback,
    metrics,
  };
}

function hasSequentialChars(password: string): boolean {
  const sequences = [
    'abc', 'bcd', 'cde', 'def', 'efg', 'fgh', 'ghi', 'hij', 'ijk', 'jkl',
    'klm', 'lmn', 'mno', 'nop', 'opq', 'pqr', 'qrs', 'rst', 'stu', 'tuv',
    'uvw', 'vwx', 'wxy', 'xyz', '012', '123', '234', '345', '456', '567',
    '678', '789', '890'
  ];

  const lowerPassword = password.toLowerCase();
  return sequences.some(seq => lowerPassword.includes(seq));
}

function hasRepeatingChars(password: string): boolean {
  return /(.)\1{2,}/.test(password);
}

function calculateEntropy(password: string): number {
  let charsetSize = 0;
  if (/[a-z]/.test(password)) charsetSize += 26;
  if (/[A-Z]/.test(password)) charsetSize += 26;
  if (/[0-9]/.test(password)) charsetSize += 10;
  if (/[^a-zA-Z0-9]/.test(password)) charsetSize += 32;

  const entropy = password.length * Math.log2(charsetSize);
  return Math.round(entropy);
}
