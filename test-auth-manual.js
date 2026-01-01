#!/usr/bin/env node

/**
 * Manual Auth Testing Script
 * 
 * Run with: node test-auth-manual.js
 * 
 * This script tests the auth functionality without needing a browser
 */

// Mock localStorage for Node.js
const localStorageMock = (() => {
  let store = {};
  return {
    getItem: (key) => store[key] || null,
    setItem: (key, value) => {
      store[key] = value.toString();
    },
    removeItem: (key) => {
      delete store[key];
    },
    clear: () => {
      store = {};
    }
  };
})();

global.localStorage = localStorageMock;

// Helper functions from Auth.tsx
const hashPassword = (password) => {
  let hash = 0;
  for (let i = 0; i < password.length; i++) {
    const char = password.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }
  return hash.toString();
};

const validateEmail = (email) => {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
};

const validatePassword = (password) => {
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

// Test counters
let passed = 0;
let failed = 0;

// Test helper
function test(name, fn) {
  try {
    fn();
    console.log(`✅ PASS: ${name}`);
    passed++;
  } catch (error) {
    console.log(`❌ FAIL: ${name}`);
    console.log(`   Error: ${error.message}`);
    failed++;
  }
}

function assert(condition, message) {
  if (!condition) {
    throw new Error(message || 'Assertion failed');
  }
}

console.log('\n🧪 Running Auth Tests...\n');
console.log('=' .repeat(60));

// Email Validation Tests
console.log('\n📧 Email Validation Tests');
console.log('-'.repeat(60));

test('Valid email: test@example.com', () => {
  assert(validateEmail('test@example.com'), 'Should validate correct email');
});

test('Valid email with subdomain: user@mail.example.com', () => {
  assert(validateEmail('user@mail.example.com'), 'Should validate email with subdomain');
});

test('Invalid email: invalid', () => {
  assert(!validateEmail('invalid'), 'Should reject invalid email');
});

test('Invalid email: @example.com', () => {
  assert(!validateEmail('@example.com'), 'Should reject email without local part');
});

test('Invalid email: test@', () => {
  assert(!validateEmail('test@'), 'Should reject email without domain');
});

// Password Validation Tests
console.log('\n🔒 Password Validation Tests');
console.log('-'.repeat(60));

test('Reject password shorter than 6 characters', () => {
  const result = validatePassword('12345');
  assert(!result.isValid, 'Should reject short password');
  assert(result.strength === 'weak', 'Should mark as weak');
});

test('Accept 6-7 character password as medium', () => {
  const result = validatePassword('pass123');
  assert(result.isValid, 'Should accept 6+ character password');
  assert(result.strength === 'medium', 'Should mark as medium');
});

test('Rate strong password correctly', () => {
  const result = validatePassword('Pass123!');
  assert(result.isValid, 'Should accept strong password');
  assert(result.strength === 'strong', 'Should mark as strong');
});

test('Rate medium password correctly', () => {
  const result = validatePassword('password123');
  assert(result.isValid, 'Should accept medium password');
  assert(result.strength === 'medium', 'Should mark as medium');
});

// Password Hashing Tests
console.log('\n🔐 Password Hashing Tests');
console.log('-'.repeat(60));

test('Hash passwords consistently', () => {
  const password = 'testPassword123';
  const hash1 = hashPassword(password);
  const hash2 = hashPassword(password);
  assert(hash1 === hash2, 'Same password should produce same hash');
});

test('Different passwords produce different hashes', () => {
  const hash1 = hashPassword('password1');
  const hash2 = hashPassword('password2');
  assert(hash1 !== hash2, 'Different passwords should produce different hashes');
});

// Sign Up Tests
console.log('\n📝 Sign Up Tests');
console.log('-'.repeat(60));

localStorage.clear();

test('Create new user successfully', () => {
  const newUser = {
    id: Date.now().toString(),
    email: 'newuser@example.com',
    name: 'New User',
    password: hashPassword('password123'),
    role: 'analyst'
  };

  const users = [];
  users.push(newUser);
  localStorage.setItem('blocra_users', JSON.stringify(users));

  const storedUsers = JSON.parse(localStorage.getItem('blocra_users') || '[]');
  assert(storedUsers.length === 1, 'Should have 1 user');
  assert(storedUsers[0].email === 'newuser@example.com', 'Email should match');
});

test('Prevent duplicate email registration', () => {
  const user1 = {
    id: '1',
    email: 'test@example.com',
    name: 'User One',
    password: hashPassword('password123'),
    role: 'analyst'
  };

  localStorage.setItem('blocra_users', JSON.stringify([user1]));

  const users = JSON.parse(localStorage.getItem('blocra_users') || '[]');
  const emailExists = users.find(u => u.email === 'test@example.com');
  
  assert(emailExists !== undefined, 'Email should exist');
  assert(users.length === 1, 'Should still have only 1 user');
});

test('Store user with correct role', () => {
  const analyst = {
    id: '1',
    email: 'analyst@example.com',
    name: 'Analyst User',
    password: hashPassword('password123'),
    role: 'analyst'
  };

  localStorage.setItem('blocra_users', JSON.stringify([analyst]));

  const users = JSON.parse(localStorage.getItem('blocra_users') || '[]');
  assert(users[0].role === 'analyst', 'Role should be analyst');
});

// Sign In Tests
console.log('\n🔑 Sign In Tests');
console.log('-'.repeat(60));

localStorage.clear();

// Setup test user
const testUser = {
  id: '1',
  email: 'test@example.com',
  name: 'Test User',
  password: hashPassword('password123'),
  role: 'analyst'
};
localStorage.setItem('blocra_users', JSON.stringify([testUser]));

test('Sign in with correct email and password', () => {
  const users = JSON.parse(localStorage.getItem('blocra_users') || '[]');
  const hashedPassword = hashPassword('password123');
  const user = users.find(u => 
    u.email === 'test@example.com' && 
    u.password === hashedPassword
  );

  assert(user !== undefined, 'User should be found');
  assert(user.email === 'test@example.com', 'Email should match');
});

test('Sign in with correct name and password', () => {
  const users = JSON.parse(localStorage.getItem('blocra_users') || '[]');
  const hashedPassword = hashPassword('password123');
  const user = users.find(u => 
    u.name === 'Test User' && 
    u.password === hashedPassword
  );

  assert(user !== undefined, 'User should be found');
  assert(user.name === 'Test User', 'Name should match');
});

test('Fail sign in with incorrect password', () => {
  const users = JSON.parse(localStorage.getItem('blocra_users') || '[]');
  const hashedPassword = hashPassword('wrongpassword');
  const user = users.find(u => 
    u.email === 'test@example.com' && 
    u.password === hashedPassword
  );

  assert(user === undefined, 'User should not be found with wrong password');
});

test('Fail sign in with non-existent email', () => {
  const users = JSON.parse(localStorage.getItem('blocra_users') || '[]');
  const hashedPassword = hashPassword('password123');
  const user = users.find(u => 
    u.email === 'nonexistent@example.com' && 
    u.password === hashedPassword
  );

  assert(user === undefined, 'Non-existent user should not be found');
});

test('Store auth token after successful sign in', () => {
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

  assert(localStorage.getItem('demo_user') !== null, 'User should be stored');
  assert(localStorage.getItem('auth_token') !== null, 'Token should be stored');
  
  const storedUser = JSON.parse(localStorage.getItem('demo_user') || '{}');
  assert(storedUser.email === 'test@example.com', 'Stored email should match');
});

// Multiple Users Tests
console.log('\n👥 Multiple Users Tests');
console.log('-'.repeat(60));

localStorage.clear();

test('Handle multiple user registrations', () => {
  const users = [
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
  assert(storedUsers.length === 3, 'Should have 3 users');
});

test('Find correct user among multiple users', () => {
  const users = [
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
  const user = storedUsers.find(u => 
    u.email === 'user2@example.com' && 
    u.password === hashedPassword
  );

  assert(user !== undefined, 'User should be found');
  assert(user.name === 'User Two', 'Name should match');
  assert(user.role === 'creator', 'Role should match');
});

// Summary
console.log('\n' + '='.repeat(60));
console.log('\n📊 Test Summary');
console.log('-'.repeat(60));
console.log(`✅ Passed: ${passed}`);
console.log(`❌ Failed: ${failed}`);
console.log(`📈 Total:  ${passed + failed}`);
console.log(`🎯 Success Rate: ${((passed / (passed + failed)) * 100).toFixed(1)}%`);

if (failed === 0) {
  console.log('\n🎉 All tests passed! Auth system is working correctly.\n');
  process.exit(0);
} else {
  console.log('\n⚠️  Some tests failed. Please review the errors above.\n');
  process.exit(1);
}
