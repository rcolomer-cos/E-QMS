/**
 * Password Generator Utility
 * Generates strong but memorable passwords
 */

// Word lists for memorable password generation
const adjectives = [
  'Happy', 'Bright', 'Swift', 'Brave', 'Clever', 'Quick', 'Smart', 'Bold',
  'Calm', 'Eager', 'Fair', 'Grand', 'Kind', 'Lively', 'Noble', 'Proud',
  'Wise', 'Warm', 'Gentle', 'Strong', 'Fierce', 'Mighty', 'Solid', 'Vital'
];

const nouns = [
  'Tiger', 'Eagle', 'Dolphin', 'Falcon', 'Panda', 'Phoenix', 'Dragon', 'Lion',
  'Shark', 'Wolf', 'Bear', 'Hawk', 'Raven', 'Panther', 'Cobra', 'Lynx',
  'Orca', 'Jaguar', 'Cheetah', 'Leopard', 'Viper', 'Scorpion', 'Rhino', 'Bison'
];

const specialChars = ['!', '@', '#', '$', '%', '&', '*'];

/**
 * Generate a random number between min and max (inclusive)
 */
function randomInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

/**
 * Get a random element from an array
 */
function randomElement<T>(array: T[]): T {
  return array[Math.floor(Math.random() * array.length)];
}

/**
 * Generate a strong but memorable password
 * Format: Adjective + Noun + Number + SpecialChar
 * Example: BrightTiger42!
 * 
 * @param minLength Minimum password length (default: 12)
 * @returns Generated password string
 */
export function generateMemorablePassword(minLength: number = 12): string {
  const adjective = randomElement(adjectives);
  const noun = randomElement(nouns);
  const number = randomInt(10, 99);
  const specialChar = randomElement(specialChars);
  
  let password = `${adjective}${noun}${number}${specialChar}`;
  
  // If password is shorter than minLength, add more numbers
  while (password.length < minLength) {
    password = password.slice(0, -1) + randomInt(0, 9) + password.slice(-1);
  }
  
  return password;
}

/**
 * Generate a completely random strong password
 * 
 * @param length Password length (default: 16)
 * @returns Generated password string
 */
export function generateRandomPassword(length: number = 16): string {
  const uppercase = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  const lowercase = 'abcdefghijklmnopqrstuvwxyz';
  const numbers = '0123456789';
  const special = '!@#$%&*';
  const allChars = uppercase + lowercase + numbers + special;
  
  // Ensure at least one of each type
  let password = '';
  password += randomElement([...uppercase]);
  password += randomElement([...lowercase]);
  password += randomElement([...numbers]);
  password += randomElement([...special]);
  
  // Fill the rest randomly
  for (let i = password.length; i < length; i++) {
    password += randomElement([...allChars]);
  }
  
  // Shuffle the password
  return password.split('').sort(() => Math.random() - 0.5).join('');
}

/**
 * Validate password strength
 * 
 * @param password Password to validate
 * @returns Object with validation result and error messages
 */
export function validatePasswordStrength(password: string): {
  isValid: boolean;
  errors: string[];
} {
  const errors: string[] = [];
  
  if (password.length < 8) {
    errors.push('Password must be at least 8 characters long');
  }
  
  if (!/[A-Z]/.test(password)) {
    errors.push('Password must contain at least one uppercase letter');
  }
  
  if (!/[a-z]/.test(password)) {
    errors.push('Password must contain at least one lowercase letter');
  }
  
  if (!/[0-9]/.test(password)) {
    errors.push('Password must contain at least one number');
  }
  
  if (!/[!@#$%&*]/.test(password)) {
    errors.push('Password must contain at least one special character (!@#$%&*)');
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
}

/**
 * Calculate password entropy (bits)
 * Higher entropy = stronger password
 * 
 * @param password Password to analyze
 * @returns Entropy in bits
 */
export function calculatePasswordEntropy(password: string): number {
  let charSetSize = 0;
  
  if (/[a-z]/.test(password)) charSetSize += 26;
  if (/[A-Z]/.test(password)) charSetSize += 26;
  if (/[0-9]/.test(password)) charSetSize += 10;
  if (/[!@#$%&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) charSetSize += 32;
  
  return Math.log2(Math.pow(charSetSize, password.length));
}
