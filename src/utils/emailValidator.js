/**
 * Utility functions for email validation specific to Supabase requirements
 */

/**
 * Validates and sanitizes an email address for use with Supabase
 * @param {string} email - The email address to validate
 * @returns {{valid: boolean, sanitized: string, message: string}} Validation result
 */
export function validateAndSanitizeEmail(email) {
  if (!email) {
    return { valid: false, sanitized: '', message: 'Email is required' };
  }

  // First, sanitize the email by trimming and converting to lowercase
  const sanitized = email.trim().toLowerCase();
  
  // Check for empty string after sanitization
  if (sanitized === '') {
    return { valid: false, sanitized, message: 'Email cannot be empty' };
  }
  
  // Basic email format validation (RFC 5322 compliant)
  const emailPattern = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/;
  if (!emailPattern.test(sanitized)) {
    return { valid: false, sanitized, message: 'Email format is invalid' };
  }
  
  // Check for common issues that may cause Supabase validation failures
  
  // 1. Check for spaces
  if (sanitized.includes(' ')) {
    return { valid: false, sanitized: sanitized.replace(/\s+/g, ''), message: 'Email cannot contain spaces' };
  }
  
  // 2. Check minimum length
  if (sanitized.length < 5) {
    return { valid: false, sanitized, message: 'Email is too short' };
  }
  
  // 3. Check for @ symbol
  if (!sanitized.includes('@')) {
    return { valid: false, sanitized, message: 'Email must contain @ symbol' };
  }
  
  // 4. Check domain part
  const [localPart, domainPart] = sanitized.split('@');
  
  if (!domainPart || domainPart === '') {
    return { valid: false, sanitized, message: 'Email must have a domain' };
  }
  
  // 5. Check for domain TLD
  if (!domainPart.includes('.')) {
    return { valid: false, sanitized, message: 'Email domain must include a TLD (e.g. .com)' };
  }
  
  // 6. Check for blocked domains
  const blockedDomains = ['example.com', 'test.com', 'localhost'];
  for (const domain of blockedDomains) {
    if (domainPart === domain) {
      return { valid: false, sanitized, message: `Email domain '${domain}' is not allowed` };
    }
  }
  
  // 7. Check local part length
  if (localPart.length > 64) {
    return { valid: false, sanitized, message: 'Email username part is too long (max 64 characters)' };
  }
  
  // 8. Check domain part length
  if (domainPart.length > 255) {
    return { valid: false, sanitized, message: 'Email domain part is too long (max 255 characters)' };
  }
  
  // Additional Supabase-specific checks can be added here
  
  return { valid: true, sanitized, message: 'Email is valid' };
}

/**
 * Suggests alternative email formats if the original is invalid
 * @param {string} email - The original email that failed validation
 * @returns {Array<string>} Array of suggested alternatives
 */
export function suggestAlternativeEmails(email) {
  if (!email || !email.includes('@')) {
    return ['example@gmail.com', 'user@outlook.com', 'contact@yahoo.com'];
  }
  
  const [localPart, domainPart] = email.trim().toLowerCase().split('@');
  const suggestions = [];
  
  // Suggest gmail alternative
  suggestions.push(`${localPart.replace(/[^a-z0-9_.]/gi, '')}@gmail.com`);
  
  // Suggest outlook alternative
  suggestions.push(`${localPart.replace(/[^a-z0-9_.]/gi, '')}@outlook.com`);
  
  // If domain looks problematic, suggest alternatives
  if (!domainPart.includes('.') || domainPart === 'example.com' || domainPart === 'test.com') {
    suggestions.push(`${localPart}@gmail.com`);
    suggestions.push(`${localPart}@yahoo.com`);
  }
  
  return [...new Set(suggestions)]; // Remove duplicates
}

export default {
  validateAndSanitizeEmail,
  suggestAlternativeEmails
}; 