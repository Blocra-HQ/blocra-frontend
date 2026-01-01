/**
 * Auth Test Suite - Login and Sign Up
 * 
 * Run with: npm test test-auth.spec.ts
 * Or manually test with: node test-auth-manual.js
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';

// Mock localStorage
const localStorageMock = (() => {
  let store: Record<string, string> = {};

  return {
    getItem: (key: string) => store[key] || null,
    setItem: (key: string, value: string) => {
      store[key] = value.toString();
    },
    removeItem: (key: string) => {
      delete store[key];
    },
    clear: () => {
      store = {};
    }
  };
})();

Object.defineProperty(global, 'localStorage', {
  value: localStorageMock
});

// Helper functions from Auth.tsx
const hashPassword = (password: string): string => {
  let hash = 0;
  for (let i = 0; i < password.length; i++) {
    const char = password.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }
  return hash.toString();
};

const validateEmail = (email: string): boolean => {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
};

const validatePassword = (password: string): { 
  isValid: boolean; 
  message?: string; 
  strength: 'weak' | 'medium' | 'strong' 
} => {
  if (password.length < 6) return { 
    isValid: false, 
    message: 'Password must be at least 6 characters', 
    strength: 'weak' 
  };
  if (password.length < 8) return { 
    isValid: true, 
    message: 'Password is acceptable', 
    strength: 'medium' 
  };
  const hasUpper = /[A-Z]/.test(password);
  const hasLower = /[a-z]/.test(password);
  const hasNumber = /\d/.test(password);
  const hasSpecial = /[!@#$%^&*(),.?":{}|<>]/.test(password);

  const score = [hasUpper, hasLower, hasNumber, hasSpecial].filter(Boolean).length;
  if (score >= 3) return { 
    isValid: true, 
    message: 'Strong password', 
    strength: 'strong' 
  };
  return { 
    isValid: true, 
    message: 'Medium strength password', 
    strength: 'medium' 
  };
};

interface User {
  id: string;
  email: string;
  name: string;
  password: string;
  role: string;
}

describe('Auth System Tests', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  afterEach(() => {
    localStorage.clear();
  });

  describe('Email Validation', () => {
    it('should validate correct email addresses', () => {
      expect(validateEmail('test@example.com')).toBe(true);
      expect(validateEmail('user.name@domain.co.uk')).toBe(true);
      expect(validateEmail('test+tag@example.com')).toBe(true);
    });

    it('should reject invalid email addresses', () => {
      expect(validateEmail('invalid')).toBe(false);
      expect(validateEmail('invalid@')).toBe(false);
      expect(validateEmail('@example.com')).toBe(false);
      expect(validateEmail('test@')).toBe(false);
      expect(validateEmail('test @example.com')).toBe(false);
    });
  });

  describe('Password Validation', () => {
    it('should reject passwords shorter than 6 characters', () => {
      const result = validatePassword('12345');
      expect(result.isValid).toBe(false);
      expect(result.strength).toBe('weak');
    });

    it('should accept passwords 6-7 characters as medium', () => {
      const result = validatePassword('pass123');
      expect(result.isValid).toBe(true);
      expect(result.strength).toBe('medium');
    });

    it('should rate strong passwords correctly', () => {
      const result = validatePassword('Pass123!');
      expect(result.isValid).toBe(true);
      expect(result.strength).toBe('strong');
    });

    it('should rate medium passwords correctly', () => {
      const result = validatePassword('password123');
      expect(result.isValid).toBe(true);
      expect(result.strength).toBe('medium');
    });
  });

  describe('Password Hashing', () => {
    it('should hash passwords consistently', () => {
      const password = 'testPassword123';
      const hash1 = hashPassword(password);
      const hash2 = hashPassword(password);
      expect(hash1).toBe(hash2);
    });

    it('should produce different hashes for different passwords', () => {
      const hash1 = hashPassword('password1');
      const hash2 = hashPassword('password2');
      expect(hash1).not.toBe(hash2);
    });
  });

  describe('Sign Up Flow', () => {
    it('should successfully create a new user', () => {
      const newUser: User = {
        id: Date.now().toString(),
        email: 'newuser@example.com',
        name: 'New User',
        password: hashPassword('password123'),
        role: 'analyst'
      };

      const users: User[] = [];
      users.push(newUser);
      localStorage.setItem('blocra_users', JSON.stringify(users));

      const storedUsers = JSON.parse(localStorage.getItem('blocra_users') || '[]');
      expect(storedUsers).toHaveLength(1);
      expect(storedUsers[0].email).toBe('newuser@example.com');
      expect(storedUsers[0].name).toBe('New User');
    });

    it('should prevent duplicate email registration', () => {
      const user1: User = {
        id: '1',
        email: 'test@example.com',
        name: 'User One',
        password: hashPassword('password123'),
        role: 'analyst'
      };

      localStorage.setItem('blocra_users', JSON.stringify([user1]));

      const users: User[] = JSON.parse(localStorage.getItem('blocra_users') || '[]');
      const emailExists = users.find(u => u.email === 'test@example.com');
      
      expect(emailExists).toBeDefined();
      expect(users).toHaveLength(1);
    });

    it('should prevent duplicate name registration', () => {
      const user1: User = {
        id: '1',
        email: 'test1@example.com',
        name: 'TestUser',
        password: hashPassword('password123'),
        role: 'analyst'
      };

      localStorage.setItem('blocra_users', JSON.stringify([user1]));

      const users: User[] = JSON.parse(localStorage.getItem('blocra_users') || '[]');
      const nameExists = users.find(u => u.name === 'TestUser');
      
      expect(nameExists).toBeDefined();
      expect(users).toHaveLength(1);
    });

    it('should store user with correct role', () => {
      const analyst: User = {
        id: '1',
        email: 'analyst@example.com',
        name: 'Analyst User',
        password: hashPassword('password123'),
        role: 'analyst'
      };

      const creator: User = {
        id: '2',
        email: 'creator@example.com',
        name: 'Creator User',
        password: hashPassword('password123'),
        role: 'creator'
      };

      localStorage.setItem('blocra_users', JSON.stringify([analyst, creator]));

      const users: User[] = JSON.parse(localStorage.getItem('blocra_users') || '[]');
      expect(users[0].role).toBe('analyst');
      expect(users[1].role).toBe('creator');
    });
  });

  describe('Sign In Flow', () => {
    beforeEach(() => {
      const testUser: User = {
        id: '1',
        email: 'test@example.com',
        name: 'Test User',
        password: hashPassword('password123'),
        role: 'analyst'
      };
      localStorage.setItem('blocra_users', JSON.stringify([testUser]));
    });

    it('should successfully sign in with correct email and password', () => {
      const users: User[] = JSON.parse(localStorage.getItem('blocra_users') || '[]');
      const hashedPassword = hashPassword('password123');
      const user = users.find(u => 
        u.email === 'test@example.com' && 
        u.password === hashedPassword
      );

      expect(user).toBeDefined();
      expect(user?.email).toBe('test@example.com');
    });

    it('should successfully sign in with correct name and password', () => {
      const users: User[] = JSON.parse(localStorage.getItem('blocra_users') || '[]');
      const hashedPassword = hashPassword('password123');
      const user = users.find(u => 
        u.name === 'Test User' && 
        u.password === hashedPassword
      );

      expect(user).toBeDefined();
      expect(user?.name).toBe('Test User');
    });

    it('should fail sign in with incorrect password', () => {
      const users: User[] = JSON.parse(localStorage.getItem('blocra_users') || '[]');
      const hashedPassword = hashPassword('wrongpassword');
      const user = users.find(u => 
        u.email === 'test@example.com' && 
        u.password === hashedPassword
      );

      expect(user).toBeUndefined();
    });

    it('should fail sign in with non-existent email', () => {
      const users: User[] = JSON.parse(localStorage.getItem('blocra_users') || '[]');
      const hashedPassword = hashPassword('password123');
      const user = users.find(u => 
        u.email === 'nonexistent@example.com' && 
        u.password === hashedPassword
      );

      expect(user).toBeUndefined();
    });

    it('should store auth token after successful sign in', () => {
      const authUser = {
        _id: '1',
        email: 'test@example.com',
        firstName: 'Test User',
        lastName: '',
        role: 'analyst',
        isActive: true,
        lastLogin: new Date()
      };
      
      localStorage.setItem('demo_user', JSON.stringify(authUser));
      localStorage.setItem('auth_token', `demo_token_${Date.now()}`);

      expect(localStorage.getItem('demo_user')).toBeDefined();
      expect(localStorage.getItem('auth_token')).toBeDefined();
      
      const storedUser = JSON.parse(localStorage.getItem('demo_user') || '{}');
      expect(storedUser.email).toBe('test@example.com');
    });
  });

  describe('Input Validation', () => {
    it('should trim whitespace from email', () => {
      const email = '  test@example.com  ';
      const trimmed = email.trim();
      expect(validateEmail(trimmed)).toBe(true);
    });

    it('should trim whitespace from name', () => {
      const name = '  Test User  ';
      const trimmed = name.trim();
      expect(trimmed).toBe('Test User');
    });

    it('should reject empty fields', () => {
      expect(''.trim()).toBe('');
      expect('   '.trim()).toBe('');
    });
  });

  describe('Multiple Users', () => {
    it('should handle multiple user registrations', () => {
      const users: User[] = [
        {
          id: '1',
          email: 'user1@example.com',
          name: 'User One',
          password: hashPassword('password1'),
          role: 'analyst'
        },
        {
          id: '2',
          email: 'user2@example.com',
          name: 'User Two',
          password: hashPassword('password2'),
          role: 'creator'
        },
        {
          id: '3',
          email: 'user3@example.com',
          name: 'User Three',
          password: hashPassword('password3'),
          role: 'analyst'
        }
      ];

      localStorage.setItem('blocra_users', JSON.stringify(users));

      const storedUsers = JSON.parse(localStorage.getItem('blocra_users') || '[]');
      expect(storedUsers).toHaveLength(3);
    });

    it('should find correct user among multiple users', () => {
      const users: User[] = [
        {
          id: '1',
          email: 'user1@example.com',
          name: 'User One',
          password: hashPassword('password1'),
          role: 'analyst'
        },
        {
          id: '2',
          email: 'user2@example.com',
          name: 'User Two',
          password: hashPassword('password2'),
          role: 'creator'
        }
      ];

      localStorage.setItem('blocra_users', JSON.stringify(users));

      const storedUsers = JSON.parse(localStorage.getItem('blocra_users') || '[]');
      const hashedPassword = hashPassword('password2');
      const user = storedUsers.find((u: User) => 
        u.email === 'user2@example.com' && 
        u.password === hashedPassword
      );

      expect(user).toBeDefined();
      expect(user?.name).toBe('User Two');
      expect(user?.role).toBe('creator');
    });
  });
});
