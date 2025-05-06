document.addEventListener('DOMContentLoaded', function() {
    // Tab switching functionality
    const tabs = document.querySelectorAll('.auth-tab');
    const tabContents = document.querySelectorAll('.tab-content');
    
    tabs.forEach(tab => {
        tab.addEventListener('click', () => {
            const tabName = tab.getAttribute('data-tab');
            
            // Update active tab
            tabs.forEach(t => t.classList.remove('active'));
            tab.classList.add('active');
            
            // Show corresponding content
            tabContents.forEach(content => {
                content.style.display = 'none';
            });
            document.getElementById(`${tabName}-tab`).style.display = 'block';
            
            // Clear error messages
            document.getElementById('loginError').textContent = '';
            document.getElementById('registerError').textContent = '';
        });
    });
    
    // Login form submission
    const loginForm = document.getElementById('loginForm');
    loginForm.addEventListener('submit', function(e) {
        e.preventDefault();
        
        const email = document.getElementById('loginEmail').value;
        const password = document.getElementById('loginPassword').value;
        const errorElement = document.getElementById('loginError');
        
        // Validate inputs
        if (!email || !password) {
            errorElement.textContent = 'Please fill in all fields';
            return;
        }
        
        // Get users from localStorage
        const users = JSON.parse(localStorage.getItem('timeTrackerUsers') || '[]');
        
        // Find user with matching email
        const user = users.find(u => u.email === email);
        
        if (!user) {
            errorElement.textContent = 'User not found';
            return;
        }
        
        // Check password (in a real app, you'd use proper password hashing)
        if (user.password !== password) {
            errorElement.textContent = 'Invalid password';
            return;
        }
        
        // Set current user in localStorage
        localStorage.setItem('timeTrackerCurrentUser', JSON.stringify({
            id: user.id,
            name: user.name,
            email: user.email
        }));
        
        // Redirect to main app
        window.location.href = 'index.html';
    });
    
    // Register form submission
    const registerForm = document.getElementById('registerForm');
    registerForm.addEventListener('submit', function(e) {
        e.preventDefault();
        
        const name = document.getElementById('registerName').value;
        const email = document.getElementById('registerEmail').value;
        const password = document.getElementById('registerPassword').value;
        const confirmPassword = document.getElementById('confirmPassword').value;
        const errorElement = document.getElementById('registerError');
        
        // Validate inputs
        if (!name || !email || !password || !confirmPassword) {
            errorElement.textContent = 'Please fill in all fields';
            return;
        }
        
        if (password !== confirmPassword) {
            errorElement.textContent = 'Passwords do not match';
            return;
        }
        
        // Get existing users
        const users = JSON.parse(localStorage.getItem('timeTrackerUsers') || '[]');
        
        // Check if email already exists
        if (users.some(user => user.email === email)) {
            errorElement.textContent = 'Email already in use';
            return;
        }
        
        // Create new user
        const newUser = {
            id: generateUserId(),
            name,
            email,
            password, // In a real app, you'd hash this password
            createdAt: new Date().toISOString()
        };
        
        // Add to users array
        users.push(newUser);
        
        // Save to localStorage
        localStorage.setItem('timeTrackerUsers', JSON.stringify(users));
        
        // Set as current user
        localStorage.setItem('timeTrackerCurrentUser', JSON.stringify({
            id: newUser.id,
            name: newUser.name,
            email: newUser.email
        }));
        
        // Redirect to main app
        window.location.href = 'index.html';
    });
    
    // Helper function to generate a unique user ID
    function generateUserId() {
        return Date.now().toString(36) + Math.random().toString(36).substr(2, 5);
    }
    
    // Check if user is already logged in
    const currentUser = JSON.parse(localStorage.getItem('timeTrackerCurrentUser'));
    if (currentUser) {
        window.location.href = 'index.html';
    }
});
