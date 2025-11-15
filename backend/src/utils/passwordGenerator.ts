/**
 * Password Generator Utility
 * Generates strong but memorable passwords for new users
 */

/**
 * Generate a random password that is strong but memorable
 * Format: Word-Word-Number-Symbol
 * Example: Blue-Tiger-2024-!
 * 
 * @param includeSymbols - Whether to include special symbols
 * @returns A strong, memorable password
 */
export function generateMemorablePassword(includeSymbols: boolean = true): string {
  const words = [
    'Alpha', 'Bravo', 'Charlie', 'Delta', 'Echo', 'Foxtrot', 'Golf', 'Hotel',
    'India', 'Juliet', 'Kilo', 'Lima', 'Mike', 'November', 'Oscar', 'Papa',
    'Quebec', 'Romeo', 'Sierra', 'Tango', 'Uniform', 'Victor', 'Whiskey', 'Xray',
    'Yankee', 'Zulu', 'Ocean', 'Mountain', 'River', 'Forest', 'Desert', 'Valley',
    'Peak', 'Canyon', 'Lake', 'Storm', 'Thunder', 'Lightning', 'Sunshine', 'Rainbow',
    'Crystal', 'Diamond', 'Emerald', 'Ruby', 'Sapphire', 'Pearl', 'Gold', 'Silver',
    'Bronze', 'Copper', 'Steel', 'Iron', 'Titanium', 'Platinum', 'Mercury', 'Venus',
    'Mars', 'Jupiter', 'Saturn', 'Neptune', 'Pluto', 'Phoenix', 'Dragon', 'Eagle',
    'Falcon', 'Hawk', 'Raven', 'Wolf', 'Bear', 'Lion', 'Tiger', 'Leopard', 'Panther'
  ];

  const symbols = ['!', '@', '#', '$', '%', '&', '*', '+', '=', '?'];

  const word1 = words[Math.floor(Math.random() * words.length)];
  const word2 = words[Math.floor(Math.random() * words.length)];
  const number = Math.floor(1000 + Math.random() * 9000); // 4-digit number
  const symbol = includeSymbols ? symbols[Math.floor(Math.random() * symbols.length)] : '';

  return `${word1}-${word2}-${number}${symbol}`;
}

/**
 * Generate a completely random strong password
 * 
 * @param length - Length of the password (default: 16)
 * @returns A strong random password
 */
export function generateStrongPassword(length: number = 16): string {
  const uppercase = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  const lowercase = 'abcdefghijklmnopqrstuvwxyz';
  const numbers = '0123456789';
  const symbols = '!@#$%^&*()_+-=[]{}|;:,.<>?';
  const allChars = uppercase + lowercase + numbers + symbols;

  let password = '';
  
  // Ensure at least one of each type
  password += uppercase[Math.floor(Math.random() * uppercase.length)];
  password += lowercase[Math.floor(Math.random() * lowercase.length)];
  password += numbers[Math.floor(Math.random() * numbers.length)];
  password += symbols[Math.floor(Math.random() * symbols.length)];

  // Fill the rest randomly
  for (let i = password.length; i < length; i++) {
    password += allChars[Math.floor(Math.random() * allChars.length)];
  }

  // Shuffle the password
  return password.split('').sort(() => Math.random() - 0.5).join('');
}

/**
 * Validate password strength
 * 
 * @param password - Password to validate
 * @returns Object with validation result and feedback
 */
export function validatePasswordStrength(password: string): {
  isValid: boolean;
  score: number; // 0-100
  feedback: string[];
} {
  const feedback: string[] = [];
  let score = 0;

  // Length check
  if (password.length >= 8) {
    score += 20;
  } else {
    feedback.push('Password should be at least 8 characters long');
  }

  if (password.length >= 12) {
    score += 10;
  }

  // Uppercase check
  if (/[A-Z]/.test(password)) {
    score += 20;
  } else {
    feedback.push('Password should contain at least one uppercase letter');
  }

  // Lowercase check
  if (/[a-z]/.test(password)) {
    score += 20;
  } else {
    feedback.push('Password should contain at least one lowercase letter');
  }

  // Number check
  if (/\d/.test(password)) {
    score += 20;
  } else {
    feedback.push('Password should contain at least one number');
  }

  // Symbol check
  if (/[!@#$%^&*()_+\-=[\]{}|;:,.<>?]/.test(password)) {
    score += 10;
  } else {
    feedback.push('Consider adding a special character for extra strength');
  }

  // Complexity bonus
  const uniqueChars = new Set(password).size;
  if (uniqueChars > password.length * 0.6) {
    score += 10;
  }

  const isValid = score >= 70 && 
                  password.length >= 8 && 
                  /[A-Z]/.test(password) && 
                  /[a-z]/.test(password) && 
                  /\d/.test(password);

  return {
    isValid,
    score: Math.min(score, 100),
    feedback: feedback.length > 0 ? feedback : ['Password is strong']
  };
}

/**
 * Generate multiple password options for the user to choose from
 * 
 * @param count - Number of passwords to generate
 * @returns Array of password options
 */
export function generatePasswordOptions(count: number = 3): string[] {
  const passwords: string[] = [];
  
  for (let i = 0; i < count; i++) {
    // Alternate between memorable and random passwords
    if (i % 2 === 0) {
      passwords.push(generateMemorablePassword());
    } else {
      passwords.push(generateStrongPassword(14));
    }
  }
  
  return passwords;
}
