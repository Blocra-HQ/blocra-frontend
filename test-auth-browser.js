// Auth helper functions (from Auth.tsx)
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
    if (password.length < 6) return { isValid: false, message: 'Too short', strength: 'weak' };
    if (password.length < 8) return { isValid: true, message: 'Acceptable', strength: 'medium' };
    const hasUpper = /[A-Z]/.test(password);
    const hasLower = /[a-z]/.test(password);
    const hasNumber = /\d/.test(password);
    const hasSpecial = /[!@#$%^&*(),.?":{}|<>]/.test(password);
    const score = [hasUpper, hasLower, hasNumber, hasSpecial].filter(Boolean).length;
    if (score >= 3) return { isValid: true, message: 'Strong', strength: 'strong' };
    return { isValid: true, message: 'Medium', strength: 'medium' };
};

// Test runner
let testResults = [];

function addTest(name, passed, message = '') {
    testResults.push({ name, passed, message });
}

function displayResults() {
    const resultsDiv = document.getElementById('results');
    const passed = testResults.filter(t => t.passed).length;
    const failed = testResults.length - passed;
    
    let html = '<div class="test-section">';
    
    testResults.forEach(test => {
        html += `
            <div class="test-case ${test.passed ? 'pass' : 'fail'}">
                <div class="test-name">
                    <span class="status ${test.passed ? 'pass' : 'fail'}">
                        ${test.passed ? '✅ PASS' : '❌ FAIL'}
                    </span>
                    ${test.name}
                </div>
                ${test.message ? `<div class="test-result">${test.message}</div>` : ''}
            </div>
        `;
    });
    
    html += '</div>';
    
    html += `
        <div class="summary ${failed > 0 ? 'fail' : ''}">
            <strong>Test Summary:</strong><br>
            ✅ Passed: ${passed}<br>
            ❌ Failed: ${failed}<br>
            📈 Total: ${testResults.length}<br>
            🎯 Success Rate: ${((passed / testResults.length) * 100).toFixed(1)}%
        </div>
    `;
    
    resultsDiv.innerHTML = html;
}

function runAllTests() {
    testResults = [];
    
    // Email validation tests
    addTest('Valid email: test@example.com', validateEmail('test@example.com'));
    addTest('Valid email with subdomain', validateEmail('user@mail.example.com'));
    addTest('Invalid email: invalid', !validateEmail('invalid'));
    addTest('Invalid email: @example.com', !validateEmail('@example.com'));
    
    // Password validation tests
    const shortPass = validatePassword('12345');
    addTest('Reject password < 6 chars', !shortPass.isValid);
    
    const mediumPass = validatePassword('pass123');
    addTest('Accept 6-7 char password', mediumPass.isValid && mediumPass.strength === 'medium');
    
    const strongPass = validatePassword('Pass123!');
    addTest('Strong password detection', strongPass.isValid && strongPass.strength === 'strong');
    
    // Password hashing tests
    const hash1 = hashPassword('test123');
    const hash2 = hashPassword('test123');
    addTest('Consistent password hashing', hash1 === hash2);
    
    const hash3 = hashPassword('different');
    addTest('Different passwords, different hashes', hash1 !== hash3);
    
    // Sign up tests
    localStorage.clear();
    const newUser = {
        id: Date.now().toString(),
        email: 'test@example.com',
        name: 'Test User',
        password: hashPassword('password123'),
        role: 'analyst'
    };
    localStorage.setItem('blocra_users', JSON.stringify([newUser]));
    
    const users = JSON.parse(localStorage.getItem('blocra_users') || '[]');
    addTest('Create new user', users.length === 1 && users[0].email === 'test@example.com');
    
    // Duplicate prevention
    const emailExists = users.find(u => u.email === 'test@example.com');
    addTest('Prevent duplicate email', emailExists !== undefined);
    
    // Sign in tests
    const hashedPassword = hashPassword('password123');
    const foundUser = users.find(u => 
        u.email === 'test@example.com' && 
        u.password === hashedPassword
    );
    addTest('Sign in with correct credentials', foundUser !== undefined);
    
    const wrongPassword = hashPassword('wrongpassword');
    const notFound = users.find(u => 
        u.email === 'test@example.com' && 
        u.password === wrongPassword
    );
    addTest('Reject incorrect password', notFound === undefined);
    
    // Auth token storage
    localStorage.setItem('auth_token', 'test_token');
    addTest('Store auth token', localStorage.getItem('auth_token') === 'test_token');
    
    displayResults();
}

function testSignUp() {
    const name = document.getElementById('signup-name').value;
    const email = document.getElementById('signup-email').value;
    const password = document.getElementById('signup-password').value;
    const role = document.getElementById('signup-role').value;
    
    if (!name || !email || !password) {
        alert('Please fill in all fields');
        return;
    }
    
    if (!validateEmail(email)) {
        alert('Invalid email address');
        return;
    }
    
    const passwordValidation = validatePassword(password);
    if (!passwordValidation.isValid) {
        alert(passwordValidation.message);
        return;
    }
    
    const users = JSON.parse(localStorage.getItem('blocra_users') || '[]');
    
    if (users.find(u => u.email === email || u.name === name)) {
        alert('User with this email or name already exists');
        return;
    }
    
    const newUser = {
        id: Date.now().toString(),
        email,
        name,
        password: hashPassword(password),
        role
    };
    
    users.push(newUser);
    localStorage.setItem('blocra_users', JSON.stringify(users));
    
    alert(`✅ Account created successfully!\n\nName: ${name}\nEmail: ${email}\nRole: ${role}\nPassword Strength: ${passwordValidation.strength}`);
    
    // Clear form
    document.getElementById('signup-name').value = '';
    document.getElementById('signup-email').value = '';
    document.getElementById('signup-password').value = '';
}

function testSignIn() {
    const identifier = document.getElementById('signin-identifier').value;
    const password = document.getElementById('signin-password').value;
    
    if (!identifier || !password) {
        alert('Please fill in all fields');
        return;
    }
    
    const users = JSON.parse(localStorage.getItem('blocra_users') || '[]');
    const hashedPassword = hashPassword(password);
    
    const user = users.find(u => 
        (u.email === identifier || u.name === identifier) && 
        u.password === hashedPassword
    );
    
    if (user) {
        const authUser = {
            _id: user.id,
            email: user.email,
            firstName: user.name,
            lastName: '',
            role: user.role,
            isActive: true,
            lastLogin: new Date()
        };
        
        localStorage.setItem('demo_user', JSON.stringify(authUser));
        localStorage.setItem('auth_token', `demo_token_${Date.now()}`);
        
        alert(`✅ Signed in successfully!\n\nName: ${user.name}\nEmail: ${user.email}\nRole: ${user.role}`);
    } else {
        alert('❌ Invalid email/name or password');
    }
    
    // Clear form
    document.getElementById('signin-identifier').value = '';
    document.getElementById('signin-password').value = '';
}

function clearStorage() {
    if (confirm('Are you sure you want to clear all data?')) {
        localStorage.clear();
        alert('✅ LocalStorage cleared');
    }
}

function viewUsers() {
    const users = JSON.parse(localStorage.getItem('blocra_users') || '[]');
    
    if (users.length === 0) {
        alert('No registered users found');
        return;
    }
    
    let message = `📋 Registered Users (${users.length}):\n\n`;
    users.forEach((user, index) => {
        message += `${index + 1}. ${user.name}\n`;
        message += `   Email: ${user.email}\n`;
        message += `   Role: ${user.role}\n\n`;
    });
    
    alert(message);
}

// Run tests on page load
window.addEventListener('load', () => {
    console.log('🧪 Auth test page loaded. Click "Run All Tests" to start.');
});
