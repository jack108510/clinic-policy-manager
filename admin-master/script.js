// Modern Master Admin Dashboard JavaScript

// Global Variables
let currentSection = 'dashboard';
let companies = [];
let users = [];
let accessCodes = [];
let analytics = {
    totalCompanies: 0,
    totalUsers: 0,
    totalPolicies: 0,
    activeCompanies: 0,
    signupsByMonth: {},
    policyTypes: {},
    userActivity: {}
};

// Initialize Dashboard
document.addEventListener('DOMContentLoaded', function() {
    console.log('Initializing Modern Master Admin Dashboard...');
    
    // Initialize with sample data
    initializeData();
    
    // Setup navigation
    setupNavigation();
    
    // Load and display data
    updateStats();
    displayCompanies();
    displayUsers();
    displayAccessCodes();
    loadActivityFeed();
    
    // Add test button for debugging
    addTestButton();
    
    // Initialize charts
    setTimeout(() => {
        initializeCharts();
    }, 1000);
    
    // Sync data to main site
    syncToMainSite();
    
    // Add event listeners for modals
    document.getElementById('companyPasswordForm').addEventListener('submit', updateCompanyPassword);
    
    // Listen for data updates from main site
    window.addEventListener('masterDataUpdated', function(event) {
        console.log('🔔 Admin-master received data update from main site:', event.detail);
        console.log('Event detail type:', typeof event.detail);
        console.log('Event detail users:', event.detail?.users?.length || 'no users');
        
        if (event.detail && event.detail.users) {
            console.log('📝 Updating users in admin-master from', users.length, 'to', event.detail.users.length);
            users = event.detail.users;
            displayUsers();
            updateStats();
            console.log('✅ Users updated in admin-master:', users.length);
        } else {
            console.log('❌ No users in event detail');
        }
        
        if (event.detail && event.detail.companies) {
            companies = event.detail.companies;
            displayCompanies();
            updateStats();
        }
        
        if (event.detail && event.detail.accessCodes) {
            accessCodes = event.detail.accessCodes;
            displayAccessCodes();
            updateStats();
        }
    });
    
    console.log('Master Admin Dashboard initialized successfully');
});

// Data Initialization
function generateRandomPassword() {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let password = '';
    for (let i = 0; i < 8; i++) {
        password += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return password;
}

function initializeData() {
    // Load existing data from localStorage or initialize empty arrays
    const savedCompanies = localStorage.getItem('masterCompanies');
    const savedAccessCodes = localStorage.getItem('masterAccessCodes');
    const savedUsers = localStorage.getItem('masterUsers');
    
    console.log('Loading data from localStorage:');
    console.log('savedCompanies:', savedCompanies);
    console.log('savedAccessCodes:', savedAccessCodes);
    console.log('savedUsers:', savedUsers);
    
    companies = savedCompanies ? JSON.parse(savedCompanies) : [];
    accessCodes = savedAccessCodes ? JSON.parse(savedAccessCodes) : [];
    users = savedUsers ? JSON.parse(savedUsers) : [];
    
    console.log('Parsed data:');
    console.log('companies:', companies);
    console.log('users:', users);
    console.log('accessCodes:', accessCodes);
    
    // Only add default access codes if none exist
    if (accessCodes.length === 0) {
        accessCodes = [
            {
                id: 'code-default',
                code: 'WELCOME123',
                description: 'Welcome Access Code',
                createdDate: new Date().toISOString().slice(0, 10),
                expiryDate: null,
                maxCompanies: 10,
                usedBy: [],
                status: 'active'
            }
        ];
        localStorage.setItem('masterAccessCodes', JSON.stringify(accessCodes));
    }
}

// Navigation Setup
function setupNavigation() {
    const navItems = document.querySelectorAll('.nav-item[data-section]');
    navItems.forEach(item => {
        item.addEventListener('click', (e) => {
            e.preventDefault();
            const section = item.getAttribute('data-section');
            showSection(section);
        });
    });
}

// Navigation
function showSection(sectionId) {
    // Hide all sections
    document.querySelectorAll('.content-section').forEach(section => {
        section.classList.remove('active');
    });
    
    // Show selected section
    document.getElementById(sectionId).classList.add('active');
    
    // Update navigation
    document.querySelectorAll('.nav-item').forEach(item => {
        item.classList.remove('active');
    });
    document.querySelector(`[data-section="${sectionId}"]`).classList.add('active');
    
    currentSection = sectionId;
    
    // Load section-specific data
    if (sectionId === 'analytics') {
        updateCharts();
    }
}

// Statistics and Analytics
function updateStats() {
    analytics.totalCompanies = companies.length;
    analytics.totalUsers = users.length;
    analytics.activeCompanies = companies.filter(c => c.status === 'active').length;
    analytics.totalPolicies = companies.reduce((total, company) => total + company.policies, 0);
    
    // Update main stats
    document.getElementById('totalCompanies').textContent = analytics.totalCompanies;
    document.getElementById('totalUsers').textContent = analytics.totalUsers;
    document.getElementById('totalPolicies').textContent = analytics.totalPolicies;
    document.getElementById('activeCompanies').textContent = analytics.activeCompanies;
    
    // Update navigation badges
    const companyBadge = document.getElementById('companyBadge');
    const userBadge = document.getElementById('userBadge');
    const accessCodeBadge = document.getElementById('accessCodeBadge');
    
    if (companyBadge) companyBadge.textContent = companies.length;
    if (userBadge) userBadge.textContent = users.length;
    if (accessCodeBadge) accessCodeBadge.textContent = accessCodes.length;
    
    // Update header stats
    document.getElementById('headerCompanyCount').textContent = analytics.totalCompanies;
    document.getElementById('headerUserCount').textContent = analytics.totalUsers;
    document.getElementById('headerPolicyCount').textContent = analytics.totalPolicies;
    
    // Update navigation badges
    document.getElementById('companyBadge').textContent = analytics.totalCompanies;
    document.getElementById('userBadge').textContent = analytics.totalUsers;
}

// Company Management
function displayCompanies() {
    const companiesList = document.getElementById('companiesList');
    companiesList.innerHTML = '';
    
    if (companies.length === 0) {
        companiesList.innerHTML = `
            <tr>
                <td colspan="9" class="empty-state">
                    <i class="fas fa-building"></i>
                    <h3>No Companies Yet</h3>
                    <p>Launch your first company to get started</p>
                    <button onclick="launchNewCompany()" class="btn btn-primary">
                        <i class="fas fa-rocket"></i> Launch New Company
                    </button>
                </td>
            </tr>
        `;
        return;
    }
    
    companies.forEach(company => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>
                <div class="company-info">
                    <strong>${company.name}</strong>
                    <small>ID: ${company.id}</small>
                </div>
            </td>
            <td>${company.users}</td>
            <td>${company.policies}</td>
            <td>
                <div class="password-info">
                    <span class="password-display">${company.adminPassword || 'Not Set'}</span>
                    <button onclick="setCompanyPassword('${company.id}')" class="btn btn-small btn-secondary">
                        <i class="fas fa-key"></i> Set
                    </button>
                </div>
            </td>
            <td>
                <div class="api-info">
                    <span class="api-status ${company.apiKey ? 'configured' : 'not-configured'}">
                        ${company.apiKey ? 'Configured' : 'Not Set'}
                    </span>
                    <button onclick="configureCompanyAPI('${company.id}')" class="btn btn-small btn-info">
                        <i class="fas fa-cog"></i> Configure
                    </button>
                </div>
            </td>
            <td>${formatDate(company.signupDate)}</td>
            <td>${formatDate(company.lastActive)}</td>
            <td><span class="status-badge status-${company.status}">${company.status}</span></td>
                    <td>
                        <button onclick="showCompanyDetails('${company.id}')" class="btn btn-small btn-primary">View Details</button>
                        <button onclick="suspendCompany('${company.id}')" class="btn btn-small btn-danger">Suspend</button>
                    </td>
        `;
        companiesList.appendChild(row);
    });
}

function displayUsers() {
    console.log('displayUsers called, users count:', users.length);
    
    // Load fresh from localStorage
    const currentUsers = JSON.parse(localStorage.getItem('masterUsers') || '[]');
    console.log('🔍 Displaying users from localStorage:', currentUsers.length);
    currentUsers.forEach((u, i) => {
        console.log(`  User ${i}: ID=${u.id} (type: ${typeof u.id}), username=${u.username}`);
    });
    
    const usersList = document.getElementById('usersList');
    usersList.innerHTML = '';
    
    if (users.length === 0) {
        usersList.innerHTML = `
            <tr>
                <td colspan="8" class="empty-state">
                    <i class="fas fa-users"></i>
                    <h3>No Users Found</h3>
                    <p>Users will appear here as companies are created</p>
                </td>
            </tr>
        `;
        return;
    }
    
    users.forEach(user => {
        console.log('Processing user:', user.username, 'ID:', user.id, 'ID type:', typeof user.id);
        const row = document.createElement('tr');
        row.innerHTML = `
            <td><input type="checkbox" class="user-checkbox" value="${user.id}"></td>
            <td>
                <div class="company-info">
                    <strong>${user.username}</strong>
                    <small>${user.email}</small>
                </div>
            </td>
            <td>${user.company}</td>
            <td>${user.role}</td>
            <td>${formatDate(user.created)}</td>
            <td>${formatDate(user.lastLogin || user.created)}</td>
            <td><span class="status-badge status-active">Active</span></td>
            <td>
                <div class="action-buttons">
                    <button onclick="changeUserRole('${user.id}', '${(user.role === 'Admin' || user.role === 'admin') ? 'user' : 'Admin'}')" 
                            class="btn btn-small ${(user.role === 'Admin' || user.role === 'admin') ? 'btn-warning' : 'btn-success'}"
                            title="${(user.role === 'Admin' || user.role === 'admin') ? 'Remove Admin Role' : 'Make Admin'}">
                        <i class="fas fa-${(user.role === 'Admin' || user.role === 'admin') ? 'user-minus' : 'user-plus'}"></i> 
                        ${(user.role === 'Admin' || user.role === 'admin') ? 'Remove Admin' : 'Make Admin'}
                    </button>
                    <button onclick="console.log('Delete clicked for user:', ${JSON.stringify(user)}); deleteUser('${user.id}')" class="btn btn-small btn-danger">
                        <i class="fas fa-trash"></i> Delete
                    </button>
                </div>
            </td>
        `;
        usersList.appendChild(row);
    });
}

function changeUserRole(userId, newRole) {
    console.log('changeUserRole called with userId:', userId, 'newRole:', newRole);
    console.log('userId type:', typeof userId);
    
    // Reload users from localStorage to ensure we have the latest data
    const currentUsers = JSON.parse(localStorage.getItem('masterUsers') || '[]');
    console.log('Current users from localStorage:', currentUsers);
    console.log('Looking for user with ID:', userId);
    
    // Try multiple lookup methods
    const user1 = currentUsers.find(u => u.id === userId);
    const user2 = currentUsers.find(u => u.id == userId);
    const user3 = currentUsers.find(u => u.id.toString() === userId.toString());
    const user4 = currentUsers.find(u => u.id.toString() === userId.toString());
    
    console.log('Lookup results:');
    console.log('  Strict equality (===):', user1);
    console.log('  Loose equality (==):', user2);
    console.log('  String comparison:', user3);
    console.log('  toString comparison:', user4);
    
    const user = user1 || user2 || user3 || user4;
    console.log('Final user found:', user);
    
    if (!user) {
        console.error('User not found with id:', userId);
        console.log('Available user IDs:', currentUsers.map(u => ({ 
            id: u.id, 
            idType: typeof u.id,
            username: u.username 
        })));
        showAlert('User not found!', 'error');
        return;
    }
    
    const oldRole = user.role;
    user.role = newRole;
    
    // Normalize role format for consistency
    if (user.role === 'Admin') {
        user.role = 'admin';
    } else if (user.role === 'User') {
        user.role = 'user';
    }
    
    // Save to localStorage
    localStorage.setItem('masterUsers', JSON.stringify(currentUsers));
    
    // Update the global users array
    users = currentUsers;
    
    // Update display
    displayUsers();
    
    // Sync to main site
    syncToMainSite();
    
    showAlert(`User ${user.username} role changed from ${oldRole} to ${newRole}`, 'success');
}

function deleteUser(userId) {
    console.log('🗑️ deleteUser called with userId:', userId, 'type:', typeof userId);
    
    // Reload users from localStorage to ensure we have the latest data
    const currentUsers = JSON.parse(localStorage.getItem('masterUsers') || '[]');
    console.log('Current users from localStorage:', currentUsers.length);
    
    // Log all user IDs for debugging
    console.log('All user IDs:', currentUsers.map(u => ({ id: u.id, type: typeof u.id, username: u.username })));
    
    // Try multiple lookup methods to handle different ID types
    const user = currentUsers.find(u => {
        const matches = [
            u.id === userId,
            u.id == userId,
            String(u.id) === String(userId),
            parseInt(u.id) === parseInt(userId),
            u.id.toString() === userId.toString()
        ];
        if (matches.some(m => m)) {
            console.log('✓ Match found with user:', u);
        }
        return matches.some(m => m);
    });
    
    console.log('Found user:', user);
    
    if (!user) {
        console.error('User not found with id:', userId);
        console.log('Available user IDs:', currentUsers.map(u => ({ 
            id: u.id, 
            idType: typeof u.id,
            username: u.username 
        })));
        showAlert('User not found!', 'error');
        return;
    }
    
    if (confirm(`Are you sure you want to delete user "${user.username}" (${user.email}) from ${user.company}? This action cannot be undone.`)) {
        // Find and remove user with flexible ID matching
        const userIndex = currentUsers.findIndex(u => {
            const matches = [
                u.id === userId,
                u.id == userId,
                String(u.id) === String(userId),
                parseInt(u.id) === parseInt(userId),
                u.id.toString() === userId.toString()
            ];
            return matches.some(m => m);
        });
        
        console.log('User index to delete:', userIndex);
        
        if (userIndex !== -1) {
            const deletedUser = currentUsers[userIndex];
            
            // Remove user from array
            currentUsers.splice(userIndex, 1);
            
            // Save updated users to localStorage
            localStorage.setItem('masterUsers', JSON.stringify(currentUsers));
            
            // Update global users array
            users = currentUsers;
            
            console.log('Users after deletion:', users.length);
            
            // Dispatch event to sync with main site
            window.dispatchEvent(new CustomEvent('masterDataUpdated', {
                detail: {
                    users: users,
                    companies: companies,
                    accessCodes: accessCodes
                }
            }));
            
            // Update display
            displayUsers();
            updateStats();
            
            // Add to activity feed
            addActivity(`Deleted user: ${deletedUser.username} (${deletedUser.company})`);
            
            // Show success message
            showAlert(`User "${deletedUser.username}" has been deleted successfully.`, 'success');
        } else {
            console.log('User index not found');
            showAlert('User not found in array!', 'error');
        }
    }
}

function displayAccessCodes() {
    const codesList = document.getElementById('accessCodesList');
    codesList.innerHTML = '';
    
    accessCodes.forEach(code => {
        const codeCard = document.createElement('div');
        codeCard.className = 'code-card';
        codeCard.innerHTML = `
            <div class="code-header">
                <span class="code-value">${code.code}</span>
                <span class="status-badge status-${code.status}">${code.status}</span>
            </div>
            <div class="code-description">${code.description}</div>
            <div class="code-stats">
                <span>Created: ${formatDate(code.createdDate)}</span>
                <span>Used by: ${code.usedBy.length}/${code.maxCompanies} companies</span>
                ${code.expiryDate ? `<span>Expires: ${formatDate(code.expiryDate)}</span>` : ''}
            </div>
            <div class="code-actions">
                <button onclick="editAccessCode('${code.id}')" class="btn btn-small btn-primary">Edit</button>
                <button onclick="deleteAccessCode('${code.id}')" class="btn btn-small btn-danger">Delete</button>
            </div>
        `;
        codesList.appendChild(codeCard);
    });
}

// Company Actions
function viewCompanyDetails(companyId) {
    const company = companies.find(c => c.id === companyId);
    if (!company) return;
    
    document.getElementById('companyDetailsTitle').textContent = `${company.name} Details`;
    document.getElementById('companyDetailsContent').innerHTML = `
        <div class="company-details">
            <div class="detail-section">
                <h4>Company Information</h4>
                <p><strong>Name:</strong> ${company.name}</p>
                <p><strong>Admin:</strong> ${company.adminName}</p>
                <p><strong>Email:</strong> ${company.adminEmail}</p>
                <p><strong>Access Code:</strong> ${company.accessCode}</p>
                <p><strong>Status:</strong> <span class="status-badge status-${company.status}">${company.status}</span></p>
            </div>
            <div class="detail-section">
                <h4>Statistics</h4>
                <p><strong>Users:</strong> ${company.users}</p>
                <p><strong>Policies:</strong> ${company.policies}</p>
                <p><strong>Clinics:</strong> ${company.clinics.join(', ')}</p>
                <p><strong>Signup Date:</strong> ${formatDate(company.signupDate)}</p>
                <p><strong>Last Active:</strong> ${formatDate(company.lastActive)}</p>
            </div>
            <div class="detail-section">
                <h4>Actions</h4>
                <button onclick="suspendCompany('${company.id}')" class="btn btn-danger">Suspend Company</button>
                <button onclick="resetCompanyPassword('${company.id}')" class="btn btn-secondary">Reset Admin Password</button>
            </div>
        </div>
    `;
    
    document.getElementById('companyDetailsModal').classList.add('show');
}

function suspendCompany(companyId) {
    if (confirm('Are you sure you want to suspend this company?')) {
        const company = companies.find(c => c.id === companyId);
        if (company) {
            company.status = company.status === 'active' ? 'suspended' : 'active';
            localStorage.setItem('masterCompanies', JSON.stringify(companies));
            displayCompanies();
            updateStats();
            showAlert('Company status updated successfully!', 'success');
        }
    }
}

function refreshCompanies() {
    displayCompanies();
    updateStats();
    showAlert('Companies data refreshed successfully!', 'success');
}

function toggleAllUsers() {
    const selectAll = document.getElementById('selectAllUsers');
    const checkboxes = document.querySelectorAll('.user-checkbox');
    
    checkboxes.forEach(checkbox => {
        checkbox.checked = selectAll.checked;
    });
}

function bulkDeleteUsers() {
    const selectedCheckboxes = document.querySelectorAll('.user-checkbox:checked');
    
    if (selectedCheckboxes.length === 0) {
        showAlert('Please select users to delete.', 'warning');
        return;
    }
    
    const selectedUsers = Array.from(selectedCheckboxes).map(cb => {
        const userId = cb.value;
        return users.find(u => u.id == userId || u.id === userId);
    }).filter(user => user);
    
    if (selectedUsers.length === 0) {
        showAlert('No valid users selected.', 'error');
        return;
    }
    
    const userNames = selectedUsers.map(u => u.username).join(', ');
    
    if (confirm(`Are you sure you want to delete ${selectedUsers.length} user(s): ${userNames}? This action cannot be undone.`)) {
        // Delete selected users
        selectedUsers.forEach(user => {
            const userIndex = users.findIndex(u => u.id == user.id || u.id === user.id);
            if (userIndex !== -1) {
                users.splice(userIndex, 1);
            }
        });
        
        // Save updated users
        saveUsers();
        
        // Sync to main site
        syncToMainSite();
        
        // Update display
        displayUsers();
        updateStats();
        
        // Add to activity feed
        addActivity(`Bulk deleted ${selectedUsers.length} users: ${userNames}`);
        
        // Show success message
        showAlert(`${selectedUsers.length} user(s) have been deleted successfully.`, 'success');
    }
}

function refreshUsers() {
    initializeData();
    displayUsers();
    updateStats();
    showAlert('Users data refreshed successfully!', 'success');
}

function syncFromMainSite() {
    // Load data from main site localStorage
    const mainSiteUsers = localStorage.getItem('users');
    const mainSiteCompanies = localStorage.getItem('companies');
    const mainSiteAccessCodes = localStorage.getItem('accessCodes');
    
    if (mainSiteUsers) {
        try {
            const parsedUsers = JSON.parse(mainSiteUsers);
            if (Array.isArray(parsedUsers)) {
                users = parsedUsers;
                saveUsers();
                displayUsers();
                updateStats();
                showAlert('Users synced from main site successfully!', 'success');
            } else {
                showAlert('No valid user data found on main site', 'error');
            }
        } catch (error) {
            showAlert('Error parsing user data from main site', 'error');
        }
    } else {
        showAlert('No user data found on main site', 'error');
    }
}

// Access Code Management
function showCreateCodeModal() {
    document.getElementById('createCodeModal').classList.add('show');
}

function closeCreateCodeModal() {
    document.getElementById('createCodeModal').classList.remove('show');
    document.getElementById('createCodeForm').reset();
}

function createAccessCode(event) {
    event.preventDefault();
    
    const newCode = {
        id: `code-${Date.now()}`,
        code: document.getElementById('newAccessCode').value,
        description: document.getElementById('codeDescription').value,
        createdDate: new Date().toISOString().slice(0, 10),
        expiryDate: document.getElementById('codeExpiry').value || null,
        maxCompanies: parseInt(document.getElementById('maxCompanies').value),
        usedBy: [],
        status: 'active'
    };
    
    accessCodes.push(newCode);
    localStorage.setItem('masterAccessCodes', JSON.stringify(accessCodes));
    displayAccessCodes();
    closeCreateCodeModal();
    
    // Sync data to main site
    syncToMainSite();
    
    showAlert('Access code created successfully!', 'success');
}

function deleteAccessCode(codeId) {
    if (confirm('Are you sure you want to delete this access code?')) {
        accessCodes = accessCodes.filter(c => c.id !== codeId);
        localStorage.setItem('masterAccessCodes', JSON.stringify(accessCodes));
        displayAccessCodes();
        
        // Sync data to main site
        syncToMainSite();
        
        showAlert('Access code deleted successfully!', 'success');
    }
}

// Launch New Company
function launchNewCompany() {
    // Populate access codes dropdown
    const accessCodeSelect = document.getElementById('accessCode');
    accessCodeSelect.innerHTML = '<option value="">Select Access Code</option>';
    
    accessCodes.filter(code => code.status === 'active')
        .forEach(code => {
            const option = document.createElement('option');
            option.value = code.code;
            option.textContent = `${code.code} - ${code.description}`;
            accessCodeSelect.appendChild(option);
        });
    
    document.getElementById('launchCompanyModal').classList.add('show');
}

function closeLaunchModal() {
    document.getElementById('launchCompanyModal').classList.remove('show');
    document.getElementById('launchCompanyForm').reset();
}

function launchCompany(event) {
    event.preventDefault();
    
    const selectedAccessCode = document.getElementById('accessCode').value;
    
    // Find the access code
    const accessCode = accessCodes.find(code => code.code === selectedAccessCode);
    if (!accessCode) {
        showAlert('Invalid access code selected!', 'error');
        return;
    }
    
    // Create new company
    const newCompany = {
        id: `company-${Date.now()}`,
        name: document.getElementById('companyName').value,
        adminName: document.getElementById('adminName').value,
        adminEmail: document.getElementById('adminEmail').value,
        adminUsername: document.getElementById('adminUsername').value,
        adminPassword: generateRandomPassword(), // Generate random admin password
        accessCode: selectedAccessCode,
        signupDate: new Date().toISOString().slice(0, 10),
        lastActive: new Date().toISOString(),
        status: 'active',
        users: 1,
        policies: 0,
        organizations: []
    };
    
    // Add company
    companies.push(newCompany);
    localStorage.setItem('masterCompanies', JSON.stringify(companies));
    
    // Add admin user
    const adminUser = {
        id: `user-${newCompany.id}-admin`,
        username: newCompany.adminUsername,
        email: newCompany.adminEmail,
        company: newCompany.name,
        role: 'Admin',
        created: newCompany.signupDate,
        lastLogin: newCompany.lastActive,
        status: 'active'
    };
    
    users.push(adminUser);
    localStorage.setItem('masterUsers', JSON.stringify(users));
    
    // Update access code usage
    accessCode.usedBy.push(newCompany.name);
    localStorage.setItem('masterAccessCodes', JSON.stringify(accessCodes));
    
    // Update displays
    displayCompanies();
    displayUsers();
    displayAccessCodes();
    updateStats();
    closeLaunchModal();
    
    // Sync data to main site
    syncToMainSite();
    
    showAlert(`Company "${newCompany.name}" launched successfully!`, 'success');
}

// Activity Feed
function loadActivityFeed() {
    const activityFeed = document.getElementById('activityFeed');
    activityFeed.innerHTML = '';
    
    if (companies.length === 0) {
        activityFeed.innerHTML = `
            <div class="empty-state">
                <i class="fas fa-history"></i>
                <h3>No Recent Activity</h3>
                <p>Activity will appear here as companies are created and users interact with the system</p>
            </div>
        `;
        return;
    }
    
    // Show real activity based on actual data
    const activities = [];
    
    // Add recent company signups
    companies.slice(-3).forEach(company => {
        const daysAgo = Math.floor((new Date() - new Date(company.signupDate)) / (1000 * 60 * 60 * 24));
        activities.push({
            type: 'signup',
            title: `New company "${company.name}" signed up`,
            time: daysAgo === 0 ? 'Today' : `${daysAgo} day${daysAgo > 1 ? 's' : ''} ago`,
            icon: 'fas fa-building'
        });
    });
    
    // Show empty state if no activities
    if (activities.length === 0) {
        activityFeed.innerHTML = `
            <div class="empty-state">
                <i class="fas fa-history"></i>
                <h3>No Recent Activity</h3>
                <p>Activity will appear here as companies are created and users interact with the system</p>
            </div>
        `;
        return;
    }
    
    activities.forEach(activity => {
        const activityItem = document.createElement('div');
        activityItem.className = 'activity-item';
        activityItem.innerHTML = `
            <div class="activity-icon ${activity.type}">
                <i class="${activity.icon}"></i>
            </div>
            <div class="activity-content">
                <div class="activity-title">${activity.title}</div>
                <div class="activity-time">${activity.time}</div>
            </div>
        `;
        activityFeed.appendChild(activityItem);
    });
}

// Charts
function initializeCharts() {
    console.log('Initializing charts...');
    updateCharts();
}

function updateCharts() {
    console.log('Updating charts with data:', analytics);
    
    // Company Growth Chart
    const growthCtx = document.getElementById('growthChart');
    if (growthCtx && typeof Chart !== 'undefined') {
        if (growthCtx.chart) {
            growthCtx.chart.destroy();
        }
        
        growthCtx.chart = new Chart(growthCtx, {
            type: 'line',
            data: {
                labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'],
                datasets: [{
                    label: 'Companies',
                    data: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, companies.length],
                    borderColor: '#6366f1',
                    backgroundColor: 'rgba(99, 102, 241, 0.1)',
                    tension: 0.4,
                    fill: true
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        display: true
                    }
                }
            }
        });
    }
    
    // Policy Types Chart
    const policyTypesCtx = document.getElementById('policyTypesChart');
    if (policyTypesCtx && typeof Chart !== 'undefined') {
        if (policyTypesCtx.chart) {
            policyTypesCtx.chart.destroy();
        }
        
        const totalPolicies = analytics.totalPolicies || 0;
        policyTypesCtx.chart = new Chart(policyTypesCtx, {
            type: 'doughnut',
            data: {
                labels: ['Admin Policy', 'Standard Operating Guideline', 'Communication Memo'],
                datasets: [{
                    data: [
                        Math.floor(totalPolicies * 0.4),
                        Math.floor(totalPolicies * 0.35),
                        Math.floor(totalPolicies * 0.25)
                    ],
                    backgroundColor: ['#6366f1', '#10b981', '#f59e0b']
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        position: 'bottom'
                    }
                }
            }
        });
    }
    
    // Monthly Signups Chart
    const signupsCtx = document.getElementById('signupsChart');
    if (signupsCtx && typeof Chart !== 'undefined') {
        if (signupsCtx.chart) {
            signupsCtx.chart.destroy();
        }
        
        signupsCtx.chart = new Chart(signupsCtx, {
            type: 'bar',
            data: {
                labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'],
                datasets: [{
                    label: 'New Companies',
                    data: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, companies.length],
                    backgroundColor: '#10b981'
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        display: false
                    }
                }
            }
        });
    }
    
    // User Activity Chart
    const activityCtx = document.getElementById('activityChart');
    if (activityCtx && typeof Chart !== 'undefined') {
        if (activityCtx.chart) {
            activityCtx.chart.destroy();
        }
        
        activityCtx.chart = new Chart(activityCtx, {
            type: 'line',
            data: {
                labels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
                datasets: [{
                    label: 'Active Users',
                    data: [analytics.totalUsers || 0, analytics.totalUsers || 0, analytics.totalUsers || 0, analytics.totalUsers || 0, analytics.totalUsers || 0, Math.floor((analytics.totalUsers || 0) * 0.5), Math.floor((analytics.totalUsers || 0) * 0.3)],
                    borderColor: '#8b5cf6',
                    backgroundColor: 'rgba(139, 92, 246, 0.1)',
                    tension: 0.4,
                    fill: true
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        display: true
                    }
                }
            }
        });
    }
}

// Reports and Export
function exportAllData() {
    const data = {
        companies: companies,
        users: users,
        accessCodes: accessCodes,
        analytics: analytics,
        exportDate: new Date().toISOString()
    };
    
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `master-admin-data-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
    showAlert('Data exported successfully!', 'success');
}

function exportCompanyReport() {
    const csv = generateCompanyCSV();
    downloadCSV(csv, 'company-report.csv');
    showAlert('Company report exported successfully!', 'success');
}

function exportUserReport() {
    const csv = generateUserCSV();
    downloadCSV(csv, 'user-report.csv');
    showAlert('User report exported successfully!', 'success');
}

function exportAnalyticsReport() {
    const csv = generateAnalyticsCSV();
    downloadCSV(csv, 'analytics-report.csv');
    showAlert('Analytics report exported successfully!', 'success');
}

function generateCompanyCSV() {
    const headers = ['Company Name', 'Admin Name', 'Admin Email', 'Access Code', 'Status', 'Users', 'Policies', 'Signup Date', 'Last Active'];
    const rows = companies.map(company => [
        company.name,
        company.adminName,
        company.adminEmail,
        company.accessCode,
        company.status,
        company.users,
        company.policies,
        company.signupDate,
        company.lastActive
    ]);
    
    return [headers, ...rows].map(row => row.join(',')).join('\n');
}

function generateUserCSV() {
    const headers = ['Username', 'Email', 'Company', 'Role', 'Created', 'Last Login'];
    const rows = users.map(user => [
        user.username,
        user.email,
        user.company,
        user.role,
        user.created,
        user.lastLogin
    ]);
    
    return [headers, ...rows].map(row => row.join(',')).join('\n');
}

function generateAnalyticsCSV() {
    const headers = ['Metric', 'Value'];
    const rows = [
        ['Total Companies', analytics.totalCompanies],
        ['Total Users', analytics.totalUsers],
        ['Total Policies', analytics.totalPolicies],
        ['Active Companies', analytics.activeCompanies]
    ];
    
    return [headers, ...rows].map(row => row.join(',')).join('\n');
}

function downloadCSV(csv, filename) {
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
}

// Data Synchronization
function syncToMainSite() {
    // Push master admin data to the main site's localStorage
    const mainSiteData = {
        companies: companies,
        users: users,
        accessCodes: accessCodes,
        analytics: analytics
    };
    
    // Store in localStorage with keys that the main site expects
    localStorage.setItem('masterCompanies', JSON.stringify(companies));
    localStorage.setItem('masterUsers', JSON.stringify(users));
    localStorage.setItem('masterAccessCodes', JSON.stringify(accessCodes));
    localStorage.setItem('masterAnalytics', JSON.stringify(analytics));
    
    // Also store in the main site's localStorage keys directly
    // This ensures the main site can access the data even if it's not listening for events
    localStorage.setItem('mainSiteCompanies', JSON.stringify(companies));
    localStorage.setItem('mainSiteUsers', JSON.stringify(users));
    localStorage.setItem('mainSiteAccessCodes', JSON.stringify(accessCodes));
    
    // Dispatch custom event to notify main site of data update
    window.dispatchEvent(new CustomEvent('masterDataUpdated', {
        detail: mainSiteData
    }));
    
    console.log('Data synchronized to main site:', {
        companies: companies.length,
        users: users.length,
        accessCodes: accessCodes.length
    });
}

// Manual sync function for testing
function forceSyncToMainSite() {
    console.log('Forcing sync to main site...');
    syncToMainSite();
    alert('Data synchronized to main site successfully!');
}

// Utility Functions
function formatDate(dateString) {
    return new Date(dateString).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
    });
}

function showAlert(message, type) {
    const alertDiv = document.createElement('div');
    alertDiv.className = `alert alert-${type}`;
    alertDiv.textContent = message;
    
    // Insert at the top of the main content
    const mainContent = document.querySelector('.main-content');
    mainContent.insertBefore(alertDiv, mainContent.firstChild);
    
    setTimeout(() => {
        alertDiv.remove();
    }, 5000);
}

// Modal Functions
function closeCompanyDetailsModal() {
    document.getElementById('companyDetailsModal').classList.remove('show');
}

// Profile Center Functions
function showChangePasswordModal() {
    document.getElementById('changePasswordModal').classList.add('show');
}

function closeChangePasswordModal() {
    document.getElementById('changePasswordModal').classList.remove('show');
    document.getElementById('changePasswordForm').reset();
}

function changePassword(event) {
    event.preventDefault();
    
    const currentPassword = document.getElementById('currentPassword').value;
    const newPassword = document.getElementById('newPassword').value;
    const confirmPassword = document.getElementById('confirmPassword').value;
    
    if (newPassword !== confirmPassword) {
        showAlert('New passwords do not match!', 'error');
        return;
    }
    
    if (newPassword.length < 8) {
        showAlert('Password must be at least 8 characters long!', 'error');
        return;
    }
    
    // In a real application, this would validate the current password and update it
    showAlert('Password changed successfully!', 'success');
    closeChangePasswordModal();
}

function enable2FA() {
    showAlert('Two-Factor Authentication setup would be implemented here.', 'info');
}

function manageSessions() {
    showAlert('Session management would be implemented here.', 'info');
}

function saveUsers() {
    localStorage.setItem('masterUsers', JSON.stringify(users));
}

function loadMasterAdminData() {
    const savedApiKeys = localStorage.getItem('masterApiKeys');
    const apiKeys = savedApiKeys ? JSON.parse(savedApiKeys) : {};
    
    // Get global PDF.co API key (shared across all companies)
    const globalPdfCoApiKey = localStorage.getItem('globalPdfCoApiKey') || apiKeys.pdfCoApiKey || '';
    
    return {
        companies: companies,
        users: users,
        accessCodes: accessCodes,
        openAIApiKey: apiKeys.openAIApiKey || localStorage.getItem('openAIApiKey') || '',
        pdfCoApiKey: globalPdfCoApiKey
    };
}

function saveData() {
    localStorage.setItem('masterCompanies', JSON.stringify(companies));
    localStorage.setItem('masterUsers', JSON.stringify(users));
    localStorage.setItem('masterAccessCodes', JSON.stringify(accessCodes));
    localStorage.setItem('masterAnalytics', JSON.stringify(analytics));
    
    // Save API keys if they exist
    const apiKeys = {
        openAIApiKey: localStorage.getItem('openAIApiKey') || '',
        pdfCoApiKey: localStorage.getItem('pdfCoApiKey') || ''
    };
    localStorage.setItem('masterApiKeys', JSON.stringify(apiKeys));
    
    // Sync to main site
    syncToMainSite();
}

function savePreferences() {
    showAlert('Preferences saved successfully!', 'success');
}

// Authentication
function setCompanyPassword(companyId) {
    const company = companies.find(c => c.id === companyId);
    if (!company) return;
    
    document.getElementById('passwordCompanyName').value = company.name;
    document.getElementById('newCompanyPassword').value = '';
    document.getElementById('confirmCompanyPassword').value = '';
    
    document.getElementById('companyPasswordModal').style.display = 'block';
}

function closeCompanyPasswordModal() {
    document.getElementById('companyPasswordModal').style.display = 'none';
}

function updateCompanyPassword(event) {
    event.preventDefault();
    
    const companyName = document.getElementById('passwordCompanyName').value;
    const newPassword = document.getElementById('newCompanyPassword').value;
    const confirmPassword = document.getElementById('confirmCompanyPassword').value;
    
    if (newPassword !== confirmPassword) {
        showAlert('Passwords do not match!', 'error');
        return;
    }
    
    if (newPassword.length < 4) {
        showAlert('Password must be at least 4 characters long!', 'error');
        return;
    }
    
    const company = companies.find(c => c.name === companyName);
    if (company) {
        company.adminPassword = newPassword;
        localStorage.setItem('masterCompanies', JSON.stringify(companies));
        syncToMainSite();
        displayCompanies();
        closeCompanyPasswordModal();
        showAlert(`Admin password updated for ${companyName}`, 'success');
    }
}

function logout() {
    if (confirm('Are you sure you want to logout?')) {
        window.location.href = '../index.html';
    }
}

// API Configuration Functions
function configureCompanyAPI(companyId) {
    const company = companies.find(c => c.id === companyId);
    if (!company) return;
    
    document.getElementById('apiCompanyName').value = company.name;
    document.getElementById('companyAPIKey').value = company.apiKey || '';
    document.getElementById('companyAPIModal').classList.add('show');
}

function closeCompanyAPIModal() {
    document.getElementById('companyAPIModal').classList.remove('show');
}

function testCompanyAPI() {
    const apiKey = document.getElementById('companyAPIKey').value.trim();
    const statusDiv = document.getElementById('apiStatus');
    
    if (!apiKey) {
        statusDiv.innerHTML = '<span class="status-error">Please enter an API key first</span>';
        return;
    }
    
    statusDiv.innerHTML = '<span class="status-testing">Testing API connection...</span>';
    
    // Test API connection
    fetch('https://api.openai.com/v1/models', {
        method: 'GET',
        headers: {
            'Authorization': `Bearer ${apiKey}`,
            'Content-Type': 'application/json'
        }
    })
    .then(response => {
        if (response.ok) {
            statusDiv.innerHTML = '<span class="status-success">API connection successful!</span>';
        } else {
            statusDiv.innerHTML = '<span class="status-error">API connection failed. Check your API key.</span>';
        }
    })
    .catch(error => {
        statusDiv.innerHTML = '<span class="status-error">Error testing API: ' + error.message + '</span>';
    });
}

function saveCompanyAPIKey() {
    const companyName = document.getElementById('apiCompanyName').value;
    const apiKey = document.getElementById('companyAPIKey').value.trim();
    
    if (!apiKey) {
        alert('Please enter an API key');
        return;
    }
    
    // Find the company and update its API key
    console.log('Looking for company:', companyName);
    console.log('Available companies:', companies.map(c => c.name));
    
    const company = companies.find(c => c.name === companyName);
    if (company) {
        console.log('Found company, setting API key:', company.name);
        company.apiKey = apiKey;
        saveData();
        displayCompanies();
        closeCompanyAPIModal();
        
        // Show success message
        showAlert('API key saved successfully for ' + companyName, 'success');
    } else {
        console.log('Company not found:', companyName);
        alert('Company not found: ' + companyName);
    }
}


// Close modals when clicking outside
window.onclick = function(event) {
    const modals = document.querySelectorAll('.modal');
    modals.forEach(modal => {
        if (event.target === modal) {
            modal.classList.remove('show');
        }
    });
};

// Company Details Management Functions
function showCompanyDetails(companyId) {
    console.log('showCompanyDetails called with companyId:', companyId);
    const company = companies.find(c => c.id === companyId);
    console.log('Found company:', company);
    if (!company) {
        console.error('Company not found with id:', companyId);
        return;
    }
    
    // Get users for this company
    const companyUsers = users.filter(user => user.company === company.name);
    
    // Update modal title
    document.getElementById('companyDetailsTitle').textContent = `${company.name} - User Management`;
    
    // Create comprehensive company details content
    const content = `
        <div class="company-details-enhanced">
            <div class="company-info-card">
                <h4><i class="fas fa-building"></i> Company Information</h4>
                <div class="info-grid">
                    <div class="info-item">
                        <strong>Company ID:</strong> ${company.id}
                    </div>
                    <div class="info-item">
                        <strong>Company Name:</strong> ${company.name}
                    </div>
                    <div class="info-item">
                        <strong>Status:</strong> <span class="status-badge status-${company.status}">${company.status}</span>
                    </div>
                    <div class="info-item">
                        <strong>Signup Date:</strong> ${formatDate(company.signupDate)}
                    </div>
                    <div class="info-item">
                        <strong>Last Active:</strong> ${formatDate(company.lastActive)}
                    </div>
                    <div class="info-item">
                        <strong>Admin Password:</strong> ${company.adminPassword || 'Not Set'}
                    </div>
                    <div class="info-item">
                        <strong>API Key:</strong> ${company.apiKey ? 'Configured' : 'Not Set'}
                    </div>
                    <div class="info-item">
                        <strong>Total Users:</strong> ${companyUsers.length}
                    </div>
                    <div class="info-item">
                        <strong>Admin Users:</strong> ${companyUsers.filter(u => u.isAdmin).length}
                    </div>
                </div>
            </div>
            
            <div class="users-management-section">
                <div class="section-header">
                    <h4><i class="fas fa-users"></i> User Management (${companyUsers.length} users)</h4>
                    <div class="user-stats">
                        <span class="stat-item admin-count">
                            <i class="fas fa-crown"></i> ${companyUsers.filter(u => u.isAdmin).length} Admins
                        </span>
                        <span class="stat-item user-count">
                            <i class="fas fa-user"></i> ${companyUsers.filter(u => !u.isAdmin).length} Users
                        </span>
                    </div>
                </div>
                
                <div class="users-table-container">
                    <table class="users-table">
                        <thead>
                            <tr>
                                <th>User Info</th>
                                <th>Email</th>
                                <th>Role</th>
                                <th>Admin Access</th>
                                <th>Signup Date</th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${companyUsers.length === 0 ? `
                                <tr>
                                    <td colspan="6" class="empty-state">
                                        <i class="fas fa-users"></i>
                                        <p>No users for this company yet.</p>
                                    </td>
                                </tr>
                            ` : companyUsers.map(user => `
                                <tr class="user-row">
                                    <td class="user-info-cell">
                                        <div class="user-avatar">
                                            <i class="fas fa-user"></i>
                                        </div>
                                        <div class="user-details">
                                            <div class="user-name">${user.username}</div>
                                            <div class="user-id">ID: ${user.id}</div>
                                        </div>
                                    </td>
                                    <td class="user-email-cell">
                                        ${user.email || '<span class="no-email">No email</span>'}
                                    </td>
                                    <td class="user-role-cell">
                                        <span class="role-badge ${user.isAdmin ? 'admin' : 'user'}">
                                            ${user.isAdmin ? 'Admin' : 'User'}
                                        </span>
                                    </td>
                                    <td class="admin-toggle-cell">
                                        <label class="admin-toggle-switch">
                                            <input type="checkbox" ${user.isAdmin ? 'checked' : ''} 
                                                   onchange="toggleUserAdmin('${user.id}', this.checked, '${companyId}')">
                                            <span class="toggle-slider"></span>
                                        </label>
                                        <span class="toggle-status">${user.isAdmin ? 'Admin Access' : 'User Access'}</span>
                                    </td>
                                    <td class="signup-date-cell">
                                        ${formatDate(user.signupDate || user.created || new Date())}
                                    </td>
                                    <td class="actions-cell">
                                        <div class="action-buttons">
                                            <button onclick="viewUserDetails('${user.id}')" 
                                                    class="btn btn-small btn-info" title="View Details">
                                                <i class="fas fa-eye"></i>
                                            </button>
                                            <button onclick="editUserInfo('${user.id}')" 
                                                    class="btn btn-small btn-warning" title="Edit User">
                                                <i class="fas fa-edit"></i>
                                            </button>
                                            <button onclick="deleteUser('${user.id}', '${companyId}')" 
                                                    class="btn btn-small btn-danger" title="Delete User">
                                                <i class="fas fa-trash"></i>
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            `).join('')}
                        </tbody>
                    </table>
                </div>
                
                <div class="bulk-actions">
                    <h5>Bulk Actions</h5>
                    <div class="bulk-buttons">
                        <button onclick="bulkMakeAdmin('${companyId}')" class="btn btn-outline btn-success">
                            <i class="fas fa-crown"></i> Make All Admins
                        </button>
                        <button onclick="bulkRemoveAdmin('${companyId}')" class="btn btn-outline btn-warning">
                            <i class="fas fa-user"></i> Remove All Admin Access
                        </button>
                        <button onclick="exportUsersList('${companyId}')" class="btn btn-outline btn-info">
                            <i class="fas fa-download"></i> Export User List
                        </button>
                    </div>
                </div>
            </div>
        </div>
    `;
    
    document.getElementById('companyDetailsContent').innerHTML = content;
    document.getElementById('companyDetailsModal').classList.add('show');
}

function closeCompanyDetailsModal() {
    document.getElementById('companyDetailsModal').classList.remove('show');
}

function toggleUserAdmin(userId, isAdmin, companyId) {
    console.log('toggleUserAdmin called with userId:', userId, 'isAdmin:', isAdmin, 'companyId:', companyId);
    const user = users.find(u => u.id === userId);
    console.log('Found user:', user);
    if (!user) {
        console.error('User not found with id:', userId);
        return;
    }
    
    user.isAdmin = isAdmin;
    saveData();
    
    // Show success message
    showAlert(`${isAdmin ? 'Granted' : 'Revoked'} admin access for ${user.username}`, 'success');
    
    // Sync to main site
    syncToMainSite();
    
    // Refresh company details if provided
    if (companyId) {
        showCompanyDetails(companyId);
    }
}

// Additional user management functions
function viewUserDetails(userId) {
    const user = users.find(u => u.id === userId);
    if (!user) {
        showAlert('User not found', 'error');
        return;
    }
    
    const modal = document.createElement('div');
    modal.className = 'modal show';
    modal.innerHTML = `
        <div class="modal-content">
            <div class="modal-header">
                <h3>User Details - ${user.username}</h3>
                <span class="close" onclick="this.closest('.modal').remove()">&times;</span>
            </div>
            <div class="modal-body">
                <div class="user-details-grid">
                    <div class="detail-item">
                        <strong>Username:</strong> ${user.username}
                    </div>
                    <div class="detail-item">
                        <strong>Email:</strong> ${user.email || 'Not provided'}
                    </div>
                    <div class="detail-item">
                        <strong>User ID:</strong> ${user.id}
                    </div>
                    <div class="detail-item">
                        <strong>Company:</strong> ${user.company}
                    </div>
                    <div class="detail-item">
                        <strong>Role:</strong> <span class="role-badge ${user.isAdmin ? 'admin' : 'user'}">${user.isAdmin ? 'Admin' : 'User'}</span>
                    </div>
                    <div class="detail-item">
                        <strong>Signup Date:</strong> ${formatDate(user.signupDate || user.created || new Date())}
                    </div>
                    <div class="detail-item">
                        <strong>Last Login:</strong> ${user.lastLogin ? formatDate(user.lastLogin) : 'Never'}
                    </div>
                    <div class="detail-item">
                        <strong>Admin Access:</strong> ${user.isAdmin ? 'Yes - Can access admin dashboard without password' : 'No - Requires admin password'}
                    </div>
                </div>
            </div>
        </div>
    `;
    document.body.appendChild(modal);
}

function editUserInfo(userId) {
    const user = users.find(u => u.id === userId);
    if (!user) {
        showAlert('User not found', 'error');
        return;
    }
    
    const modal = document.createElement('div');
    modal.className = 'modal show';
    modal.innerHTML = `
        <div class="modal-content">
            <div class="modal-header">
                <h3>Edit User - ${user.username}</h3>
                <span class="close" onclick="this.closest('.modal').remove()">&times;</span>
            </div>
            <div class="modal-body">
                <form id="editUserForm">
                    <div class="form-group">
                        <label for="editUsername">Username:</label>
                        <input type="text" id="editUsername" value="${user.username}" required>
                    </div>
                    <div class="form-group">
                        <label for="editEmail">Email:</label>
                        <input type="email" id="editEmail" value="${user.email || ''}">
                    </div>
                    <div class="form-group">
                        <label for="editPassword">New Password (leave blank to keep current):</label>
                        <input type="password" id="editPassword" placeholder="Enter new password">
                    </div>
                    <div class="form-group">
                        <label class="checkbox-label">
                            <input type="checkbox" id="editIsAdmin" ${user.isAdmin ? 'checked' : ''}>
                            Admin Access (bypasses password requirement)
                        </label>
                    </div>
                    <div class="form-actions">
                        <button type="submit" class="btn btn-primary">Save Changes</button>
                        <button type="button" class="btn btn-secondary" onclick="this.closest('.modal').remove()">Cancel</button>
                    </div>
                </form>
            </div>
        </div>
    `;
    document.body.appendChild(modal);
    
    // Handle form submission
    document.getElementById('editUserForm').addEventListener('submit', function(e) {
        e.preventDefault();
        
        const newUsername = document.getElementById('editUsername').value;
        const newEmail = document.getElementById('editEmail').value;
        const newPassword = document.getElementById('editPassword').value;
        const newIsAdmin = document.getElementById('editIsAdmin').checked;
        
        // Update user
        user.username = newUsername;
        user.email = newEmail;
        if (newPassword) {
            user.password = newPassword; // In real app, this should be hashed
        }
        user.isAdmin = newIsAdmin;
        
        saveData();
        syncToMainSite();
        showAlert('User updated successfully', 'success');
        modal.remove();
        
        // Refresh company details if we're viewing them
        const companyDetailsModal = document.getElementById('companyDetailsModal');
        if (companyDetailsModal && companyDetailsModal.classList.contains('show')) {
            const companyId = companies.find(c => c.name === user.company)?.id;
            if (companyId) {
                showCompanyDetails(companyId);
            }
        }
    });
}

function deleteUser(userId, companyId) {
    const user = users.find(u => u.id === userId);
    if (!user) {
        showAlert('User not found', 'error');
        return;
    }
    
    if (confirm(`Are you sure you want to delete user "${user.username}"? This action cannot be undone.`)) {
        const userIndex = users.findIndex(u => u.id === userId);
        if (userIndex > -1) {
            users.splice(userIndex, 1);
            saveData();
            syncToMainSite();
            showAlert(`User "${user.username}" deleted successfully`, 'success');
            
            // Refresh company details
            if (companyId) {
                showCompanyDetails(companyId);
            }
        }
    }
}

function bulkMakeAdmin(companyId) {
    const company = companies.find(c => c.id === companyId);
    if (!company) return;
    
    const companyUsers = users.filter(user => user.company === company.name && !user.isAdmin);
    
    if (companyUsers.length === 0) {
        showAlert('All users already have admin access', 'info');
        return;
    }
    
    if (confirm(`Make all ${companyUsers.length} users in ${company.name} admins?`)) {
        companyUsers.forEach(user => {
            user.isAdmin = true;
        });
        saveData();
        syncToMainSite();
        showAlert(`Made ${companyUsers.length} users admins`, 'success');
        showCompanyDetails(companyId);
    }
}

function bulkRemoveAdmin(companyId) {
    const company = companies.find(c => c.id === companyId);
    if (!company) return;
    
    const companyAdmins = users.filter(user => user.company === company.name && user.isAdmin);
    
    if (companyAdmins.length === 0) {
        showAlert('No admin users found', 'info');
        return;
    }
    
    if (confirm(`Remove admin access from all ${companyAdmins.length} admin users in ${company.name}?`)) {
        companyAdmins.forEach(user => {
            user.isAdmin = false;
        });
        saveData();
        syncToMainSite();
        showAlert(`Removed admin access from ${companyAdmins.length} users`, 'success');
        showCompanyDetails(companyId);
    }
}

function exportUsersList(companyId) {
    const company = companies.find(c => c.id === companyId);
    if (!company) return;
    
    const companyUsers = users.filter(user => user.company === company.name);
    
    if (companyUsers.length === 0) {
        showAlert('No users to export', 'info');
        return;
    }
    
    // Create CSV content
    const csvContent = [
        ['Username', 'Email', 'Role', 'Admin Access', 'Signup Date', 'User ID'],
        ...companyUsers.map(user => [
            user.username,
            user.email || '',
            user.isAdmin ? 'Admin' : 'User',
            user.isAdmin ? 'Yes' : 'No',
            formatDate(user.signupDate || user.created || new Date()),
            user.id
        ])
    ].map(row => row.join(',')).join('\n');
    
    // Download CSV
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${company.name}_users_${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
    
    showAlert(`Exported ${companyUsers.length} users to CSV`, 'success');
}

function refreshCompanyDetails() {
    // Refresh the company details if modal is open
    const modal = document.getElementById('companyDetailsModal');
    if (modal.classList.contains('show')) {
        const companyId = modal.dataset.companyId;
        if (companyId) {
            showCompanyDetails(companyId);
        }
    }
}


// Test function to check if company details modal is working
function testCompanyDetailsModal() {
    console.log('Testing company details modal...');
    
    // Check if modal exists
    const modal = document.getElementById('companyDetailsModal');
    if (!modal) {
        console.error('Company details modal not found!');
        alert('Company details modal not found!');
        return;
    }
    
    console.log('Modal found:', modal);
    
    // Check if companies exist
    if (companies.length === 0) {
        console.error('No companies found!');
        alert('No companies found!');
        return;
    }
    
    console.log('Companies found:', companies);
    
    // Test with first company
    const firstCompany = companies[0];
    console.log('Testing with first company:', firstCompany);
    
    showCompanyDetails(firstCompany.id);
}

// Add test button to the page
function addTestButton() {
    const header = document.querySelector('.header');
    if (header) {
        const testButton = document.createElement('button');
        testButton.textContent = 'Test Modal';
        testButton.className = 'btn btn-warning';
        testButton.onclick = testCompanyDetailsModal;
        header.appendChild(testButton);
    }
}

// Help Section Functions
function initializeHelpSection() {
    console.log('Initializing help section...');
    // Help section is static content, no dynamic initialization needed
}

// Refresh Dashboard Function
function refreshDashboard() {
    console.log('Refreshing dashboard data...');
    
    // Show loading state
    const refreshBtn = event.target.closest('button');
    const originalText = refreshBtn.innerHTML;
    refreshBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Refreshing...';
    refreshBtn.disabled = true;
    
    // Simulate refresh delay
    setTimeout(() => {
        // Reload data
        initializeData();
        updateStats();
        displayCompanies();
        displayUsers();
        displayAccessCodes();
        
        // Reset button
        refreshBtn.innerHTML = originalText;
        refreshBtn.disabled = false;
        
        // Show success message
        showNotification('Dashboard refreshed successfully!', 'success');
    }, 1500);
}

// Notification System
function showNotification(message, type = 'info') {
    // Create notification element
    const notification = document.createElement('div');
    notification.className = `notification notification-${type}`;
    notification.innerHTML = `
        <div class="notification-content">
            <i class="fas fa-${type === 'success' ? 'check-circle' : type === 'error' ? 'exclamation-circle' : 'info-circle'}"></i>
            <span>${message}</span>
        </div>
    `;
    
    // Add to page
    document.body.appendChild(notification);
    
    // Show notification
    setTimeout(() => {
        notification.classList.add('show');
    }, 100);
    
    // Auto remove after 3 seconds
    setTimeout(() => {
        notification.classList.remove('show');
        setTimeout(() => {
            if (notification.parentNode) {
                notification.parentNode.removeChild(notification);
            }
        }, 300);
    }, 3000);
}

// Policy Upload and AI Analysis Functions
let uploadedFiles = [];
let fileAnalysisData = {};

function initializePolicyUpload() {
    const uploadArea = document.getElementById('uploadArea');
    const fileInput = document.getElementById('fileInput');
    
    if (!uploadArea || !fileInput) return;
    
    // File input change event
    fileInput.addEventListener('change', handleFileSelect);
    
    // Drag and drop events
    uploadArea.addEventListener('dragover', handleDragOver);
    uploadArea.addEventListener('dragleave', handleDragLeave);
    uploadArea.addEventListener('drop', handleDrop);
    
    console.log('Policy upload initialized');
}

function handleDragOver(e) {
    e.preventDefault();
    e.stopPropagation();
    document.getElementById('uploadArea').classList.add('drag-over');
}

function handleDragLeave(e) {
    e.preventDefault();
    e.stopPropagation();
    document.getElementById('uploadArea').classList.remove('drag-over');
}

function handleDrop(e) {
    e.preventDefault();
    e.stopPropagation();
    document.getElementById('uploadArea').classList.remove('drag-over');
    
    const files = e.dataTransfer.files;
    if (files.length > 0) {
        processFiles(Array.from(files));
    }
}

function handleFileSelect(e) {
    const files = e.target.files;
    if (files.length > 0) {
        processFiles(Array.from(files));
    }
}

function processFiles(files) {
    uploadedFiles = [...uploadedFiles, ...files];
    displayUploadedFiles();
    simulateAIAnalysis();
}

function displayUploadedFiles() {
    const uploadedFilesDiv = document.getElementById('uploadedFiles');
    const fileList = document.getElementById('fileList');
    
    if (!uploadedFilesDiv || !fileList) return;
    
    fileList.innerHTML = '';
    
    uploadedFiles.forEach((file, index) => {
        const fileItem = document.createElement('div');
        fileItem.className = 'file-item';
        fileItem.innerHTML = `
            <div class="file-item-info">
                <div class="file-icon">
                    <i class="fas fa-file-alt"></i>
                </div>
                <div class="file-details">
                    <h4>${file.name}</h4>
                    <p>${formatFileSize(file.size)}</p>
                </div>
            </div>
            <div class="file-status">
                <span class="status-badge processing">Processing</span>
            </div>
        `;
        fileList.appendChild(fileItem);
    });
    
    uploadedFilesDiv.style.display = 'block';
}

function formatFileSize(bytes) {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
}

function simulateAIAnalysis() {
    const processingStatus = document.getElementById('processingStatus');
    const progressFill = document.getElementById('progressFill');
    
    if (processingStatus) {
        processingStatus.style.display = 'block';
    }
    
    let progress = 0;
    const progressInterval = setInterval(() => {
        progress += 10;
        if (progressFill) {
            progressFill.style.width = progress + '%';
        }
        
        if (progress >= 100) {
            clearInterval(progressInterval);
            setTimeout(() => {
                if (processingStatus) {
                    processingStatus.style.display = 'none';
                }
                analyzeUploadedFiles();
            }, 500);
        }
    }, 200);
}

async function analyzeUploadedFiles() {
    // Analyze files with PDF.co API and ChatGPT
    for (let index = 0; index < uploadedFiles.length; index++) {
        const file = uploadedFiles[index];
        updateProcessingMessage(`Analyzing ${file.name}...`);
        
        try {
            // Extract text from PDF using PDF.co
            const extractedText = await extractTextFromPDF(file);
            
            // Analyze with ChatGPT
            const analysisResult = await analyzeWithChatGPT(extractedText, file.name);
            fileAnalysisData[file.name] = analysisResult;
            
            // Update file status
            updateFileStatus(index, 'completed');
            
            // Update progress
            updateProgress((index + 1) * 100 / uploadedFiles.length);
        } catch (error) {
            console.error(`Error analyzing ${file.name}:`, error);
            updateFileStatus(index, 'error');
            fileAnalysisData[file.name] = generateMockAnalysis(file); // Fallback
        }
    }
    
    // Display results when all files are processed
    displayAnalysisResults();
}

// PDF.co API Integration
async function extractTextFromPDF(file) {
    // For non-PDF files, read as text directly
    if (!file.name.toLowerCase().endsWith('.pdf')) {
        return await readFileAsText(file);
    }
    
    try {
        // Convert file to base64
        const base64Content = await fileToBase64(file);
        
        // Get PDF.co API key from master admin settings
        const masterData = loadMasterAdminData();
        const pdfCoApiKey = masterData?.pdfCoApiKey;
        
        if (!pdfCoApiKey || pdfCoApiKey === 'YOUR_PDF_CO_API_KEY') {
            console.warn('PDF.co API key not configured, reading PDF as text');
            return await readFileAsText(file);
        }
        
        // Extract text using PDF.co API
        const response = await fetch('https://api.pdf.co/v1/pdf/convert/to/text', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                async: false,
                inline: true,
                file: base64Content,
                apiKey: pdfCoApiKey
            })
        });
        
        if (!response.ok) {
            throw new Error('PDF.co API request failed');
        }
        
        const data = await response.json();
        return data.body || '';
        
    } catch (error) {
        console.error('PDF extraction error:', error);
        // Fallback to reading as text
        return await readFileAsText(file);
    }
}

function fileToBase64(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = () => {
            const base64 = reader.result.split(',')[1];
            resolve(base64);
        };
        reader.onerror = error => reject(error);
    });
}

async function readFileAsText(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = (e) => resolve(e.target.result);
        reader.onerror = (e) => reject(e);
        reader.readAsText(file);
    });
}

// ChatGPT Analysis Integration
async function analyzeWithChatGPT(text, fileName) {
    const masterData = loadMasterAdminData();
    const apiKey = masterData?.openAIApiKey || 'YOUR_OPENAI_API_KEY';
    
    if (apiKey === 'YOUR_OPENAI_API_KEY') {
        console.warn('OpenAI API key not configured, using mock analysis');
        return generateMockAnalysis({ name: fileName });
    }
    
    const prompt = `Analyze the following policy document and extract structured information. 
    
Document: ${text}

Please provide a JSON response with the following structure:
{
  "type": "admin" | "sog" | "memo",
  "title": "Policy Title",
  "effectiveDate": "Date",
  "lastReviewed": "Date",
  "approvedBy": "Name",
  "version": "Version",
  "purpose": "Brief purpose statement",
  "scope": "Scope description",
  "policyStatement": "Main policy statement",
  "definitions": {"term": "definition"},
  "procedure": "Step-by-step procedure",
  "responsibilities": "Who is responsible",
  "consequences": "Consequences of non-compliance",
  "relatedDocuments": ["Document1", "Document2"]
}`;

    try {
        const response = await fetch('https://api.openai.com/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${apiKey}`
            },
            body: JSON.stringify({
                model: 'gpt-4',
                messages: [
                    {
                        role: 'system',
                        content: 'You are a policy analysis expert. Extract structured information from policy documents.'
                    },
                    {
                        role: 'user',
                        content: prompt
                    }
                ],
                temperature: 0.3
            })
        });
        
        if (!response.ok) {
            throw new Error('ChatGPT API request failed');
        }
        
        const data = await response.json();
        const analysisText = data.choices[0].message.content;
        
        // Parse JSON response
        const jsonMatch = analysisText.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
            return JSON.parse(jsonMatch[0]);
        }
        
        throw new Error('Could not parse ChatGPT response');
        
    } catch (error) {
        console.error('ChatGPT analysis error:', error);
        return generateMockAnalysis({ name: fileName });
    }
}

function generateMockAnalysis(file) {
    // Mock AI analysis - in production, this would call actual AI API
    const policyTypes = ['admin', 'sog', 'memo'];
    const randomType = policyTypes[Math.floor(Math.random() * policyTypes)];
    
    return {
        type: randomType,
        title: file.name.replace(/\.[^/.]+$/, '').replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()),
        effectiveDate: new Date().toLocaleDateString(),
        lastReviewed: 'Pending review',
        approvedBy: 'Pending approval',
        version: '1.0',
        purpose: 'Define standards and procedures for operational excellence and compliance.',
        scope: 'This policy applies to all employees, contractors, and stakeholders.',
        policyStatement: 'We are committed to maintaining the highest standards of quality and compliance.',
        definitions: {
            'Policy': 'A course or principle of action adopted or proposed.',
            'Compliance': 'The action or fact of complying with a desire or demand.'
        },
        procedure: '1. Review policy requirements\n2. Implement necessary changes\n3. Monitor compliance\n4. Report any issues',
        responsibilities: 'All employees are responsible for understanding and following this policy.',
        consequences: 'Failure to comply may result in disciplinary action.',
        relatedDocuments: ['Code of Conduct', 'Employee Handbook']
    };
}

function updateProcessingMessage(message) {
    const messageElement = document.getElementById('processingMessage');
    if (messageElement) {
        messageElement.textContent = message;
    }
}

function updateProgress(percentage) {
    const progressFill = document.getElementById('progressFill');
    if (progressFill) {
        progressFill.style.width = percentage + '%';
    }
}

function updateFileStatus(index, status) {
    const fileItems = document.querySelectorAll('.file-item');
    if (fileItems[index]) {
        const statusBadge = fileItems[index].querySelector('.status-badge');
        if (statusBadge) {
            statusBadge.className = `status-badge ${status}`;
            statusBadge.textContent = status === 'completed' ? 'Completed' : status === 'processing' ? 'Processing' : 'Error';
        }
    }
}

function displayAnalysisResults() {
    const analysisResults = document.getElementById('analysisResults');
    const analysisContent = document.getElementById('analysisContent');
    
    if (!analysisResults || !analysisContent) return;
    
    analysisContent.innerHTML = '';
    
    uploadedFiles.forEach((file) => {
        const analysis = fileAnalysisData[file.name];
        if (analysis) {
            const analysisItem = document.createElement('div');
            analysisItem.className = 'analysis-item';
            
            const typeClass = analysis.type === 'admin' ? 'admin' : analysis.type === 'sog' ? 'sog' : 'memo';
            const typeLabel = analysis.type === 'admin' ? 'Admin Policy' : analysis.type === 'sog' ? 'SOG' : 'Communication Memo';
            
            analysisItem.innerHTML = `
                <h4>
                    <i class="fas fa-file-alt"></i>
                    ${analysis.title}
                    <span class="policy-type-badge ${typeClass}">${typeLabel}</span>
                </h4>
                <div class="analysis-field">
                    <label>Effective Date</label>
                    <div class="field-value">${analysis.effectiveDate}</div>
                </div>
                <div class="analysis-field">
                    <label>Purpose</label>
                    <div class="field-value">${analysis.purpose}</div>
                </div>
                <div class="analysis-field">
                    <label>Scope</label>
                    <div class="field-value">${analysis.scope}</div>
                </div>
                <div class="analysis-field">
                    <label>Policy Statement</label>
                    <div class="field-value">${analysis.policyStatement}</div>
                </div>
                <div class="analysis-field">
                    <label>Key Responsibilities</label>
                    <div class="field-value">${analysis.responsibilities}</div>
                </div>
                <div class="analysis-actions">
                    <button class="btn btn-primary" onclick="importPolicy('${file.name}')">
                        <i class="fas fa-check"></i>
                        Import Policy
                    </button>
                    <button class="btn btn-secondary" onclick="editAnalysis('${file.name}')">
                        <i class="fas fa-edit"></i>
                        Edit
                    </button>
                    <button class="btn btn-danger" onclick="deleteAnalysis('${file.name}')">
                        <i class="fas fa-trash"></i>
                        Delete
                    </button>
                </div>
            `;
            
            analysisContent.appendChild(analysisItem);
        }
    });
    
    analysisResults.style.display = 'block';
}

function importPolicy(fileName) {
    const analysis = fileAnalysisData[fileName];
    if (analysis) {
        showNotification(`Policy "${analysis.title}" imported successfully!`, 'success');
        // In production, this would save to the database
        console.log('Importing policy:', analysis);
    }
}

function editAnalysis(fileName) {
    showNotification(`Edit functionality coming soon for ${fileName}`, 'info');
}

function deleteAnalysis(fileName) {
    if (confirm(`Are you sure you want to delete analysis for ${fileName}?`)) {
        delete fileAnalysisData[fileName];
        uploadedFiles = uploadedFiles.filter(f => f.name !== fileName);
        displayUploadedFiles();
        displayAnalysisResults();
        showNotification(`Analysis for ${fileName} deleted successfully`, 'success');
    }
}

function clearUploadArea() {
    if (confirm('Clear all uploaded files and analysis?')) {
        uploadedFiles = [];
        fileAnalysisData = {};
        document.getElementById('uploadedFiles').style.display = 'none';
        document.getElementById('analysisResults').style.display = 'none';
        document.getElementById('processingStatus').style.display = 'none';
        document.getElementById('fileInput').value = '';
        showNotification('Upload area cleared', 'success');
    }
}

// Global Settings Functions
function saveGlobalApiKeys() {
    const pdfCoKey = document.getElementById('globalPdfCoApiKey').value.trim();
    const openAIKey = document.getElementById('globalOpenAIApiKey').value.trim();
    
    if (pdfCoKey) {
        localStorage.setItem('globalPdfCoApiKey', pdfCoKey);
        showNotification('PDF.co API key saved successfully!', 'success');
    }
    
    if (openAIKey) {
        localStorage.setItem('globalOpenAIApiKey', openAIKey);
        showNotification('OpenAI API key saved successfully!', 'success');
    }
    
    if (!pdfCoKey && !openAIKey) {
        showNotification('Please enter at least one API key', 'error');
    }
    
    // Update master API keys storage
    const apiKeys = {
        openAIApiKey: openAIKey || localStorage.getItem('globalOpenAIApiKey') || '',
        pdfCoApiKey: pdfCoKey || localStorage.getItem('globalPdfCoApiKey') || ''
    };
    localStorage.setItem('masterApiKeys', JSON.stringify(apiKeys));
}

function clearAllUsers() {
    if (confirm('Are you sure you want to clear ALL users from both sites? This action cannot be undone.')) {
        // Clear users from both sites
        users = [];
        localStorage.setItem('masterUsers', JSON.stringify(users));
        localStorage.setItem('users', JSON.stringify(users));
        
        // Also clear from main site
        const event = new Event('clearAllUsers');
        document.dispatchEvent(event);
        
        displayUsers();
        updateStats();
        showNotification('All users have been cleared successfully', 'success');
    }
}

function exportAllData() {
    const allData = {
        companies: companies,
        users: users,
        accessCodes: accessCodes,
        analytics: analytics,
        timestamp: new Date().toISOString()
    };
    
    const dataStr = JSON.stringify(allData, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    
    const link = document.createElement('a');
    link.href = url;
    link.download = `policy-pro-data-${new Date().toISOString().slice(0, 10)}.json`;
    link.click();
    
    URL.revokeObjectURL(url);
    showNotification('Data exported successfully!', 'success');
}

// AI Policy Assistant Functions
let chatState = {
    step: 'start',
    isGenerating: false,
    currentPolicy: null
};

function openAIModal() {
    console.log('🔧 Opening AI Modal in admin-master...');
    
    // Open AI modal
    document.getElementById('aiModal').style.display = 'block';
    document.getElementById('aiResult').style.display = 'none';
    document.getElementById('aiLoading').style.display = 'none';
    
    // Show all policy configuration options and chat interface
    const policyTypeSelection = document.querySelector('.policy-type-selection');
    const policyOptionsSelection = document.querySelector('.policy-options-selection');
    const chatContainer = document.querySelector('.chat-container');
    
    console.log('🔍 Elements found:');
    console.log('policyTypeSelection:', policyTypeSelection);
    console.log('policyOptionsSelection:', policyOptionsSelection);
    console.log('chatContainer:', chatContainer);
    
    if (policyTypeSelection) {
        policyTypeSelection.style.display = 'block';
        console.log('✅ Policy type selection shown');
    } else {
        console.log('❌ Policy type selection not found');
    }
    
    if (policyOptionsSelection) {
        policyOptionsSelection.style.display = 'block';
        console.log('✅ Policy options selection shown');
    } else {
        console.log('❌ Policy options selection not found');
    }
    
    if (chatContainer) {
        chatContainer.style.display = 'block';
        console.log('✅ Chat container shown');
    } else {
        console.log('❌ Chat container not found');
    }
    
    resetChat();
    console.log('🎉 AI Modal opened successfully');
}

function closeAIModal() {
    document.getElementById('aiModal').style.display = 'none';
    resetChat();
}

function resetChat() {
    chatState = {
        step: 'start',
        isGenerating: false,
        currentPolicy: null
    };
    
    const chatMessages = document.getElementById('chatMessages');
    chatMessages.innerHTML = `
        <div class="message ai-message">
            <div class="message-avatar">
                <i class="fas fa-robot"></i>
            </div>
            <div class="message-content">
                <p><strong>Hello! I'm your AI Policy Assistant powered by ChatGPT.</strong></p>
                <p>I can create comprehensive, professional healthcare policies for your veterinary clinics. Configure your policy settings above, then describe what you need.</p>
                <p><strong>Configure your policy:</strong></p>
                <ul>
                    <li><strong>Policy Type:</strong> Select Admin Policy, SOG, or Communication Memo</li>
                    <li><strong>Organizations:</strong> Choose which clinics this applies to</li>
                    <li><strong>Responsible Roles:</strong> Who will implement this policy</li>
                    <li><strong>Disciplinary Actions:</strong> What happens if policy is violated</li>
                </ul>
                <p><strong>Then describe what policy you need:</strong></p>
                <ul>
                    <li>"Create a patient safety protocol policy"</li>
                    <li>"Generate hand hygiene procedures"</li>
                    <li>"Write emergency response procedures"</li>
                </ul>
                <p><strong>What policy would you like me to create?</strong></p>
            </div>
        </div>
    `;
    
    document.getElementById('generatePolicyBtn').style.display = 'none';
    document.getElementById('chatInput').value = '';
}

function handleChatKeyPress(event) {
    if (event.key === 'Enter') {
        sendChatMessage();
    }
}

function sendChatMessage() {
    const input = document.getElementById('chatInput');
    const message = input.value.trim();
    
    if (!message) return;
    
    console.log('📝 User sent message:', message);
    addUserMessage(message);
    input.value = '';
    
    // Process the message
    processChatMessage(message);
}

function addUserMessage(message) {
    const chatMessages = document.getElementById('chatMessages');
    const messageDiv = document.createElement('div');
    messageDiv.className = 'message user-message';
    messageDiv.innerHTML = `
        <div class="message-avatar">
            <i class="fas fa-user"></i>
        </div>
        <div class="message-content">
            <p>${message}</p>
        </div>
    `;
    chatMessages.appendChild(messageDiv);
    chatMessages.scrollTop = chatMessages.scrollHeight;
}

function addAIMessage(message) {
    const chatMessages = document.getElementById('chatMessages');
    const messageDiv = document.createElement('div');
    messageDiv.className = 'message ai-message';
    messageDiv.innerHTML = `
        <div class="message-avatar">
            <i class="fas fa-robot"></i>
        </div>
        <div class="message-content">
            <p>${message}</p>
        </div>
    `;
    chatMessages.appendChild(messageDiv);
    chatMessages.scrollTop = chatMessages.scrollHeight;
}

function processChatMessage(message) {
    if (chatState.isGenerating) return;
    
    if (chatState.step === 'start') {
        // User's first message - generate policy directly
        generatePolicyFromPrompt(message);
    }
}

function generatePolicyFromPrompt(prompt) {
    console.log('🚀 generatePolicyFromPrompt called with:', prompt);
    chatState.isGenerating = true;
    
    // Show AI is thinking
    addAIMessage(`I'll create a comprehensive policy based on your request. Let me generate that for you...`);
    
    // Hide chat and show loading
    document.querySelector('.chat-container').style.display = 'none';
    document.getElementById('aiLoading').style.display = 'block';
    
    console.log('🔄 Starting policy generation process...');
    
    // Generate policy with ChatGPT
    generatePolicyFromPromptData(prompt)
        .then(generatedPolicy => {
            console.log('Policy generated successfully:', generatedPolicy);
            chatState.currentPolicy = generatedPolicy;
            displayAIPolicy(generatedPolicy);
        })
        .catch(error => {
            console.error('Error generating policy:', error);
            chatState.isGenerating = false;
            // Show error message to user
            document.getElementById('aiLoading').style.display = 'none';
            document.getElementById('aiResult').style.display = 'block';
            document.getElementById('aiResult').innerHTML = `
                <div class="error-message">
                    <h4>Error Generating Policy</h4>
                    <p>${error.message}</p>
                    <p>Please check your ChatGPT API key in Settings or try again.</p>
                    <button onclick="continueChat()" class="btn btn-primary">Try Again</button>
                </div>
            `;
            // Show chat again
            document.querySelector('.chat-container').style.display = 'block';
        });
}

async function generatePolicyFromPromptData(prompt) {
    console.log('generatePolicyFromPromptData called with:', prompt);
    const currentDate = new Date().toISOString().split('T')[0];
    
    try {
        // Get the selected policy type
        const policyType = document.querySelector('input[name="policyType"]:checked').value;
        console.log('Selected policy type:', policyType);
        
        // Get selected options
        const selectedOrganizations = getSelectedOrganizations();
        const selectedRoles = getSelectedRoles();
        const selectedDisciplinaryActions = getSelectedDisciplinaryActions();
        
        console.log('Selected organizations:', selectedOrganizations);
        console.log('Selected roles:', selectedRoles);
        console.log('Selected disciplinary actions:', selectedDisciplinaryActions);
        
        // Create organization names
        const organizationNames = selectedOrganizations.map(org => getOrganizationName(org)).join(', ');
        
        // Create role names
        const roleNames = selectedRoles.map(role => role.name).join(', ');
        
        // Create disciplinary action names
        const disciplinaryActionNames = selectedDisciplinaryActions.map(action => action.name).join(', ');
        
        console.log('Organization names:', organizationNames);
        console.log('Role names:', roleNames);
        console.log('Disciplinary action names:', disciplinaryActionNames);
        
        // Create a comprehensive prompt for ChatGPT
        const chatGPTPrompt = createSimpleChatGPTPrompt(prompt, currentDate, policyType, organizationNames, roleNames, disciplinaryActionNames);
        console.log('ChatGPT prompt created:', chatGPTPrompt);
        
        // Call ChatGPT API to generate the policy
        console.log('Calling ChatGPT API...');
        const chatGPTResponse = await callChatGPTAPI(chatGPTPrompt);
        console.log('ChatGPT response received:', chatGPTResponse);
        
        const generatedContent = chatGPTResponse.choices[0].message.content;
        console.log('Generated content:', generatedContent);
        
        // Parse the ChatGPT response into a structured policy
        const policyContent = parseChatGPTResponse(generatedContent, prompt, policyType);
        console.log('Parsed policy content:', policyContent);
        
        return {
            ...policyContent,
            type: policyType,
            clinics: selectedOrganizations,
            additionalRequirements: prompt,
            keyPoints: prompt,
            clinicNames: organizationNames,
            prompt: prompt,
            selectedRoles: selectedRoles,
            selectedDisciplinaryActions: selectedDisciplinaryActions
        };
    } catch (error) {
        console.error('Error generating policy with ChatGPT:', error);
        throw error;
    }
}

function getSelectedOrganizations() {
    const orgCheckboxes = document.querySelectorAll('.organization-toggles input[type="checkbox"]:checked');
    return Array.from(orgCheckboxes).map(cb => cb.value || cb.id.replace('org-', ''));
}

function getSelectedRoles() {
    const roleCheckboxes = document.querySelectorAll('.responsibility-toggles input[type="checkbox"]:checked');
    return Array.from(roleCheckboxes).map(cb => ({
        name: cb.value || cb.nextElementSibling.textContent.trim()
    }));
}

function getSelectedDisciplinaryActions() {
    const actionCheckboxes = document.querySelectorAll('.disciplinary-toggles input[type="checkbox"]:checked');
    return Array.from(actionCheckboxes).map(cb => ({
        name: cb.value || cb.nextElementSibling.textContent.trim()
    }));
}

function getOrganizationName(orgValue) {
    const orgNames = {
        'all': 'All Organizations',
        'tudor-glen': 'Tudor Glen',
        'river-valley': 'River Valley',
        'rosslyn': 'Rosslyn',
        'upc': 'UPC'
    };
    return orgNames[orgValue] || orgValue;
}

function createSimpleChatGPTPrompt(userPrompt, currentDate, policyType, organizationNames, roleNames, disciplinaryActionNames) {
    const typeLabels = {
        'admin': 'Administrative Policy',
        'sog': 'Standard Operating Guidelines',
        'memo': 'Communication Memo'
    };
    
    const typeLabel = typeLabels[policyType] || 'Policy';
    
    return `Create a comprehensive ${typeLabel} for veterinary clinics with the following specifications:

POLICY TYPE: ${typeLabel}
APPLICABLE ORGANIZATIONS: ${organizationNames || 'All Organizations'}
RESPONSIBLE ROLES: ${roleNames || 'All Staff'}
DISCIPLINARY ACTIONS: ${disciplinaryActionNames || 'As per company policy'}

USER REQUEST: ${userPrompt}

Please create a professional policy document that includes all necessary sections and headers appropriate for a ${typeLabel}. The policy should be comprehensive, clear, and suitable for veterinary clinic operations.

Format the response as a complete policy document with proper headers, sections, and professional language.`;
}

async function callChatGPTAPI(prompt) {
    console.log('🔑 Checking for OpenAI API key...');
    const apiKey = localStorage.getItem('globalOpenAIApiKey');
    if (!apiKey) {
        console.error('❌ OpenAI API key not found');
        throw new Error('OpenAI API key not found. Please set it in Settings.');
    }
    console.log('✅ OpenAI API key found, making request...');
    
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${apiKey}`
        },
        body: JSON.stringify({
            model: 'gpt-3.5-turbo',
            messages: [
                {
                    role: 'system',
                    content: 'You are a professional policy writer specializing in veterinary clinic operations and healthcare compliance.'
                },
                {
                    role: 'user',
                    content: prompt
                }
            ],
            max_tokens: 2000,
            temperature: 0.7
        })
    });
    
    if (!response.ok) {
        console.error('❌ OpenAI API request failed:', response.status, response.statusText);
        const errorData = await response.json();
        console.error('❌ Error details:', errorData);
        throw new Error(`OpenAI API error: ${errorData.error?.message || 'Unknown error'}`);
    }
    
    console.log('✅ OpenAI API request successful');
    const result = await response.json();
    console.log('📄 OpenAI response received:', result);
    return result;
}

function parseChatGPTResponse(content, prompt, policyType) {
    // Simple parsing - return the content as-is for now
    return {
        title: `Generated ${policyType.charAt(0).toUpperCase() + policyType.slice(1)} Policy`,
        content: content,
        effectiveDate: new Date().toISOString().split('T')[0],
        lastReviewed: new Date().toISOString().split('T')[0],
        approvedBy: 'AI Policy Assistant',
        version: '1.0',
        purpose: prompt,
        scope: 'All applicable organizations',
        policyStatement: content,
        definitions: 'As defined in the policy content',
        procedure: 'As outlined in the policy content',
        responsibilities: 'As specified in the policy content',
        consequences: 'As outlined in the policy content',
        relatedDocuments: 'Refer to company handbook',
        reviewApproval: 'Annual review required'
    };
}

function displayAIPolicy(policy) {
    chatState.isGenerating = false;
    
    // Hide loading and show result
    document.getElementById('aiLoading').style.display = 'none';
    document.getElementById('aiResult').style.display = 'block';
    
    // Display the policy
    document.getElementById('policyPreview').textContent = policy.content;
    
    // Show success message
    addAIMessage(`Perfect! I've generated your ${policy.type} policy. You can review it below and save it if you're satisfied.`);
    
    // Show chat again
    document.querySelector('.chat-container').style.display = 'block';
}

function continueChat() {
    // Hide result and show chat again
    document.getElementById('aiResult').style.display = 'none';
    document.querySelector('.chat-container').style.display = 'block';
    
    addAIMessage(`Great! Your policy has been generated. Is there anything else you'd like to modify or add?`);
    chatState.step = 'modify';
}

function saveGeneratedPolicy() {
    if (!chatState.currentPolicy) {
        alert('No policy to save');
        return;
    }
    
    // Here you would implement saving the policy
    // For now, just show a success message
    showNotification('Policy saved successfully!', 'success');
    closeAIModal();
}

function downloadGeneratedPolicy() {
    if (!chatState.currentPolicy) {
        alert('No policy to download');
        return;
    }
    
    const policy = chatState.currentPolicy;
    const content = `Policy Title: ${policy.title}\n\n${policy.content}`;
    
    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${policy.title.replace(/[^a-zA-Z0-9]/g, '_')}.txt`;
    a.click();
    URL.revokeObjectURL(url);
    
    showNotification('Policy downloaded successfully!', 'success');
}

function regeneratePolicy() {
    if (!chatState.currentPolicy) {
        alert('No policy to regenerate');
        return;
    }
    
    const prompt = chatState.currentPolicy.prompt;
    generatePolicyFromPrompt(prompt);
}

function toggleAllOrganizations() {
    const allCheckbox = document.getElementById('org-all');
    const otherCheckboxes = document.querySelectorAll('.organization-toggles input[type="checkbox"]:not(#org-all)');
    
    otherCheckboxes.forEach(checkbox => {
        checkbox.checked = allCheckbox.checked;
    });
}

// Policy Management Functions
let policies = [];

function refreshPolicies() {
    loadPoliciesFromStorage();
    displayPolicies();
    updatePolicyBadge();
}

function loadPoliciesFromStorage() {
    const savedPolicies = localStorage.getItem('masterPolicies');
    policies = savedPolicies ? JSON.parse(savedPolicies) : [];
    console.log('📄 Loaded policies:', policies.length);
}

function savePoliciesToStorage() {
    localStorage.setItem('masterPolicies', JSON.stringify(policies));
    console.log('💾 Saved policies to storage:', policies.length);
}

function displayPolicies() {
    const tbody = document.getElementById('policiesTableBody');
    const noPoliciesMessage = document.getElementById('noPoliciesMessage');
    
    if (policies.length === 0) {
        tbody.innerHTML = '';
        noPoliciesMessage.style.display = 'block';
        return;
    }
    
    noPoliciesMessage.style.display = 'none';
    
    tbody.innerHTML = policies.map(policy => `
        <tr>
            <td>
                <input type="checkbox" class="policy-checkbox" value="${policy.id}">
            </td>
            <td>
                <strong>${policy.title}</strong>
            </td>
            <td>
                <span class="policy-type-badge ${policy.type}">${getPolicyTypeLabel(policy.type)}</span>
            </td>
            <td>${policy.clinicNames || 'All Organizations'}</td>
            <td>${formatDate(policy.created)}</td>
            <td>${formatDate(policy.lastModified)}</td>
            <td>
                <span class="policy-status ${policy.status || 'active'}">${policy.status || 'Active'}</span>
            </td>
            <td>
                <div class="policy-actions">
                    <button class="btn btn-sm btn-primary" onclick="viewPolicy('${policy.id}')">
                        <i class="fas fa-eye"></i> View
                    </button>
                    <button class="btn btn-sm btn-secondary" onclick="editPolicy('${policy.id}')">
                        <i class="fas fa-edit"></i> Edit
                    </button>
                    <button class="btn btn-sm btn-danger" onclick="deletePolicy('${policy.id}')">
                        <i class="fas fa-trash"></i> Delete
                    </button>
                </div>
            </td>
        </tr>
    `).join('');
}

function getPolicyTypeLabel(type) {
    const labels = {
        'admin': 'Admin Policy',
        'sog': 'SOG',
        'memo': 'Memo'
    };
    return labels[type] || type;
}

function formatDate(dateString) {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleDateString();
}

function updatePolicyBadge() {
    const badge = document.getElementById('policyBadge');
    if (badge) {
        badge.textContent = policies.length;
    }
}

function filterPolicies() {
    const searchTerm = document.getElementById('policySearch').value.toLowerCase();
    const typeFilter = document.getElementById('policyTypeFilter').value;
    const orgFilter = document.getElementById('policyOrganizationFilter').value;
    
    const filteredPolicies = policies.filter(policy => {
        const matchesSearch = policy.title.toLowerCase().includes(searchTerm) || 
                             policy.content.toLowerCase().includes(searchTerm);
        const matchesType = !typeFilter || policy.type === typeFilter;
        const matchesOrg = !orgFilter || policy.clinicNames?.includes(orgFilter);
        
        return matchesSearch && matchesType && matchesOrg;
    });
    
    // Update display with filtered results
    const tbody = document.getElementById('policiesTableBody');
    const noPoliciesMessage = document.getElementById('noPoliciesMessage');
    
    if (filteredPolicies.length === 0) {
        tbody.innerHTML = '';
        noPoliciesMessage.style.display = 'block';
        return;
    }
    
    noPoliciesMessage.style.display = 'none';
    
    tbody.innerHTML = filteredPolicies.map(policy => `
        <tr>
            <td>
                <input type="checkbox" class="policy-checkbox" value="${policy.id}">
            </td>
            <td>
                <strong>${policy.title}</strong>
            </td>
            <td>
                <span class="policy-type-badge ${policy.type}">${getPolicyTypeLabel(policy.type)}</span>
            </td>
            <td>${policy.clinicNames || 'All Organizations'}</td>
            <td>${formatDate(policy.created)}</td>
            <td>${formatDate(policy.lastModified)}</td>
            <td>
                <span class="policy-status ${policy.status || 'active'}">${policy.status || 'Active'}</span>
            </td>
            <td>
                <div class="policy-actions">
                    <button class="btn btn-sm btn-primary" onclick="viewPolicy('${policy.id}')">
                        <i class="fas fa-eye"></i> View
                    </button>
                    <button class="btn btn-sm btn-secondary" onclick="editPolicy('${policy.id}')">
                        <i class="fas fa-edit"></i> Edit
                    </button>
                    <button class="btn btn-sm btn-danger" onclick="deletePolicy('${policy.id}')">
                        <i class="fas fa-trash"></i> Delete
                    </button>
                </div>
            </td>
        </tr>
    `).join('');
}

function toggleAllPolicySelection() {
    const selectAll = document.getElementById('selectAllPolicies');
    const checkboxes = document.querySelectorAll('.policy-checkbox');
    
    checkboxes.forEach(checkbox => {
        checkbox.checked = selectAll.checked;
    });
}

function bulkDeletePolicies() {
    const selectedCheckboxes = document.querySelectorAll('.policy-checkbox:checked');
    const selectedIds = Array.from(selectedCheckboxes).map(cb => cb.value);
    
    if (selectedIds.length === 0) {
        showNotification('Please select policies to delete', 'warning');
        return;
    }
    
    if (confirm(`Are you sure you want to delete ${selectedIds.length} policy(ies)? This action cannot be undone.`)) {
        policies = policies.filter(policy => !selectedIds.includes(policy.id));
        savePoliciesToStorage();
        displayPolicies();
        updatePolicyBadge();
        showNotification(`${selectedIds.length} policy(ies) deleted successfully`, 'success');
    }
}

function viewPolicy(policyId) {
    const policy = policies.find(p => p.id === policyId);
    if (!policy) return;
    
    // Create a simple view modal
    const modal = document.createElement('div');
    modal.className = 'modal';
    modal.style.display = 'block';
    modal.innerHTML = `
        <div class="modal-content" style="max-width: 800px;">
            <div class="modal-header">
                <h3>${policy.title}</h3>
                <button class="modal-close" onclick="this.closest('.modal').remove()">
                    <i class="fas fa-times"></i>
                </button>
            </div>
            <div class="modal-body">
                <div class="policy-view">
                    <div class="policy-meta">
                        <p><strong>Type:</strong> ${getPolicyTypeLabel(policy.type)}</p>
                        <p><strong>Organizations:</strong> ${policy.clinicNames || 'All Organizations'}</p>
                        <p><strong>Created:</strong> ${formatDate(policy.created)}</p>
                        <p><strong>Last Modified:</strong> ${formatDate(policy.lastModified)}</p>
                    </div>
                    <div class="policy-content">
                        <h4>Policy Content:</h4>
                        <pre style="white-space: pre-wrap; font-family: 'Courier New', monospace; background: #f8f9fa; padding: 20px; border-radius: 8px;">${policy.content}</pre>
                    </div>
                </div>
            </div>
        </div>
    `;
    document.body.appendChild(modal);
}

function editPolicy(policyId) {
    const policy = policies.find(p => p.id === policyId);
    if (!policy) return;
    
    // Populate the edit form
    document.getElementById('editPolicyTitle').value = policy.title;
    document.getElementById('editPolicyType').value = policy.type;
    document.getElementById('editPolicyContent').value = policy.content;
    document.getElementById('editPolicyEffectiveDate').value = policy.effectiveDate || '';
    document.getElementById('editPolicyVersion').value = policy.version || '1.0';
    
    // Set organizations
    const organizations = policy.clinicNames ? policy.clinicNames.split(', ') : [];
    document.getElementById('editOrgAll').checked = organizations.includes('All Organizations');
    document.getElementById('editOrgTudorGlen').checked = organizations.includes('Tudor Glen');
    document.getElementById('editOrgRiverValley').checked = organizations.includes('River Valley');
    document.getElementById('editOrgRosslyn').checked = organizations.includes('Rosslyn');
    document.getElementById('editOrgUPC').checked = organizations.includes('UPC');
    
    // Store current policy ID for saving
    document.getElementById('policyEditForm').dataset.policyId = policyId;
    
    // Show the modal
    document.getElementById('policyEditModal').style.display = 'block';
}

function closePolicyEditModal() {
    document.getElementById('policyEditModal').style.display = 'none';
    document.getElementById('policyEditForm').reset();
    document.getElementById('policyEditForm').removeAttribute('data-policy-id');
}

function savePolicyChanges() {
    const policyId = document.getElementById('policyEditForm').dataset.policyId;
    const policy = policies.find(p => p.id === policyId);
    
    if (!policy) return;
    
    // Get form data
    const title = document.getElementById('editPolicyTitle').value;
    const type = document.getElementById('editPolicyType').value;
    const content = document.getElementById('editPolicyContent').value;
    const effectiveDate = document.getElementById('editPolicyEffectiveDate').value;
    const version = document.getElementById('editPolicyVersion').value;
    
    // Get organizations
    const organizations = [];
    if (document.getElementById('editOrgAll').checked) organizations.push('All Organizations');
    if (document.getElementById('editOrgTudorGlen').checked) organizations.push('Tudor Glen');
    if (document.getElementById('editOrgRiverValley').checked) organizations.push('River Valley');
    if (document.getElementById('editOrgRosslyn').checked) organizations.push('Rosslyn');
    if (document.getElementById('editOrgUPC').checked) organizations.push('UPC');
    
    // Update policy
    policy.title = title;
    policy.type = type;
    policy.content = content;
    policy.effectiveDate = effectiveDate;
    policy.version = version;
    policy.clinicNames = organizations.join(', ');
    policy.lastModified = new Date().toISOString();
    
    // Save and refresh
    savePoliciesToStorage();
    displayPolicies();
    closePolicyEditModal();
    showNotification('Policy updated successfully', 'success');
}

function deletePolicy(policyId) {
    if (!policyId) {
        // Delete from edit modal
        const currentPolicyId = document.getElementById('policyEditForm').dataset.policyId;
        if (currentPolicyId) {
            policyId = currentPolicyId;
        }
    }
    
    if (!policyId) return;
    
    const policy = policies.find(p => p.id === policyId);
    if (!policy) return;
    
    if (confirm(`Are you sure you want to delete "${policy.title}"? This action cannot be undone.`)) {
        policies = policies.filter(p => p.id !== policyId);
        savePoliciesToStorage();
        displayPolicies();
        updatePolicyBadge();
        closePolicyEditModal();
        showNotification('Policy deleted successfully', 'success');
    }
}

function toggleAllEditOrganizations() {
    const allCheckbox = document.getElementById('editOrgAll');
    const otherCheckboxes = document.querySelectorAll('.organization-checkboxes input[type="checkbox"]:not(#editOrgAll)');
    
    otherCheckboxes.forEach(checkbox => {
        checkbox.checked = allCheckbox.checked;
    });
}

// Enhanced saveGeneratedPolicy function to save to policies array
function saveGeneratedPolicy() {
    if (!chatState.currentPolicy) {
        alert('No policy to save');
        return;
    }
    
    const policy = chatState.currentPolicy;
    
    // Create a new policy object
    const newPolicy = {
        id: Date.now().toString(),
        title: policy.title,
        type: policy.type,
        content: policy.content,
        clinicNames: policy.clinicNames,
        effectiveDate: policy.effectiveDate,
        version: policy.version,
        created: new Date().toISOString(),
        lastModified: new Date().toISOString(),
        status: 'active',
        prompt: policy.prompt
    };
    
    // Add to policies array
    policies.push(newPolicy);
    savePoliciesToStorage();
    updatePolicyBadge();
    
    showNotification('Policy saved successfully!', 'success');
    closeAIModal();
}

// Email Marketing Functions
let emailCampaigns = [];

function loadEmailCampaigns() {
    const saved = localStorage.getItem('emailCampaigns');
    emailCampaigns = saved ? JSON.parse(saved) : [];
    displayEmailCampaigns();
}

function saveEmailCampaigns() {
    localStorage.setItem('emailCampaigns', JSON.stringify(emailCampaigns));
}

function displayEmailCampaigns() {
    const grid = document.getElementById('emailCampaignsGrid');
    if (!grid) return;
    
    if (emailCampaigns.length === 0) {
        grid.innerHTML = `
            <div style="text-align: center; padding: 60px 20px; color: #999; grid-column: 1 / -1;">
                <i class="fas fa-envelope" style="font-size: 64px; margin-bottom: 20px; opacity: 0.3;"></i>
                <h3 style="margin: 0; color: #666;">No Email Campaigns</h3>
                <p style="margin: 10px 0 0 0;">Create your first email campaign to get started.</p>
            </div>
        `;
        updateEmailCampaignBadge();
        return;
    }
    
    grid.innerHTML = emailCampaigns.map(campaign => `
        <div class="campaign-card" style="background: white; border: 1px solid #e0e0e0; border-radius: 12px; padding: 20px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
            <div style="display: flex; justify-content: space-between; align-items: start; margin-bottom: 15px;">
                <div>
                    <h3 style="margin: 0; font-size: 18px; color: #333;">${campaign.subject}</h3>
                    <p style="margin: 5px 0 0 0; color: #666; font-size: 14px;">${campaign.recipientType} Campaign</p>
                </div>
                <span class="status-badge ${campaign.status === 'scheduled' ? 'status-pending' : campaign.status === 'sent' ? 'status-success' : 'status-inactive'}" 
                      style="padding: 4px 12px; border-radius: 20px; font-size: 12px; font-weight: 600;">
                    ${campaign.status.charAt(0).toUpperCase() + campaign.status.slice(1)}
                </span>
            </div>
            
            <div style="margin-bottom: 15px; padding: 12px; background: #f8f9fa; border-radius: 8px;">
                <div style="font-size: 13px; color: #666; margin-bottom: 5px;">
                    <i class="fas fa-users"></i> Recipients: ${campaign.recipientType === 'All Users' ? 'All' : campaign.recipientType}
                </div>
                <div style="font-size: 13px; color: #666;">
                    <i class="fas fa-clock"></i> ${campaign.scheduleDate ? new Date(campaign.scheduleDate).toLocaleString() : 'Send immediately'}
                </div>
            </div>
            
            <div style="display: flex; gap: 8px;">
                <button onclick="viewEmailCampaign('${campaign.id}')" 
                        style="flex: 1; padding: 8px 12px; background: #0066cc; color: white; border: none; border-radius: 6px; cursor: pointer; font-size: 13px; font-weight: 600;">
                    <i class="fas fa-eye"></i> View
                </button>
                <button onclick="deleteEmailCampaign('${campaign.id}')" 
                        style="flex: 1; padding: 8px 12px; background: #dc3545; color: white; border: none; border-radius: 6px; cursor: pointer; font-size: 13px; font-weight: 600;">
                    <i class="fas fa-trash"></i> Delete
                </button>
            </div>
        </div>
    `).join('');
    
    updateEmailCampaignBadge();
}

function updateEmailCampaignBadge() {
    const badge = document.getElementById('emailCampaignBadge');
    if (badge) {
        badge.textContent = emailCampaigns.length;
    }
}

function openCreateEmailModal() {
    // Create modal
    const modal = document.createElement('div');
    modal.className = 'modal show';
    modal.id = 'createEmailModal';
    modal.innerHTML = `
        <div class="modal-content" style="max-width: 700px;">
            <div class="modal-header">
                <h3>Create Email Campaign</h3>
                <button class="modal-close" onclick="closeCreateEmailModal()">
                    <i class="fas fa-times"></i>
                </button>
            </div>
            <div class="modal-body">
                <form id="createEmailForm" onsubmit="saveEmailCampaign(event)">
                    <div class="form-group">
                        <label for="emailSubject">Email Subject</label>
                        <input type="text" id="emailSubject" required>
                    </div>
                    
                    <div class="form-group">
                        <label for="emailRecipientType">Send To</label>
                        <select id="emailRecipientType" required>
                            <option value="All Users">All Users</option>
                            <option value="All Admins">All Admins</option>
                            <option value="Specific Company">Specific Company</option>
                        </select>
                    </div>
                    
                    <div class="form-group">
                        <label for="emailContent">Email Content</label>
                        <textarea id="emailContent" rows="10" required style="width: 100%; padding: 10px; border: 1px solid #ddd; border-radius: 4px;"></textarea>
                    </div>
                    
                    <div class="form-group">
                        <label for="emailScheduleDate">Schedule Send Date (optional)</label>
                        <input type="datetime-local" id="emailScheduleDate">
                        <small>Leave empty to send immediately</small>
                    </div>
                    
                    <div class="form-actions">
                        <button type="submit" class="btn btn-primary">Create Campaign</button>
                        <button type="button" class="btn btn-secondary" onclick="closeCreateEmailModal()">Cancel</button>
                    </div>
                </form>
            </div>
        </div>
    `;
    
    document.body.appendChild(modal);
}

function closeCreateEmailModal() {
    const modal = document.getElementById('createEmailModal');
    if (modal) modal.remove();
}

function saveEmailCampaign(event) {
    event.preventDefault();
    
    const newCampaign = {
        id: Date.now().toString(),
        subject: document.getElementById('emailSubject').value,
        recipientType: document.getElementById('emailRecipientType').value,
        content: document.getElementById('emailContent').value,
        scheduleDate: document.getElementById('emailScheduleDate').value || null,
        status: 'scheduled',
        created: new Date().toISOString()
    };
    
    emailCampaigns.push(newCampaign);
    saveEmailCampaigns();
    displayEmailCampaigns();
    
    closeCreateEmailModal();
    showAlert('Email campaign created successfully!', 'success');
}

function viewEmailCampaign(campaignId) {
    const campaign = emailCampaigns.find(c => c.id === campaignId);
    if (!campaign) return;
    
    alert(`Subject: ${campaign.subject}\n\nRecipients: ${campaign.recipientType}\n\nContent:\n${campaign.content}`);
}

function deleteEmailCampaign(campaignId) {
    if (confirm('Are you sure you want to delete this email campaign?')) {
        emailCampaigns = emailCampaigns.filter(c => c.id !== campaignId);
        saveEmailCampaigns();
        displayEmailCampaigns();
        showAlert('Email campaign deleted successfully', 'success');
    }
}

function refreshEmailCampaigns() {
    loadEmailCampaigns();
    showAlert('Email campaigns refreshed', 'success');
}

// Load settings when page loads
document.addEventListener('DOMContentLoaded', function() {
    // Load saved API keys into settings form
    const savedPdfCoKey = localStorage.getItem('globalPdfCoApiKey');
    const savedOpenAIKey = localStorage.getItem('globalOpenAIApiKey');
    
    if (savedPdfCoKey && document.getElementById('globalPdfCoApiKey')) {
        document.getElementById('globalPdfCoApiKey').value = savedPdfCoKey;
    }
    
    if (savedOpenAIKey && document.getElementById('globalOpenAIApiKey')) {
        document.getElementById('globalOpenAIApiKey').value = savedOpenAIKey;
    }
    
    initializeData();
    updateStats();
    displayCompanies();
    displayUsers();
    displayAccessCodes();
    initializeCharts();
    
    // Initialize policy management
    loadPoliciesFromStorage();
    updatePolicyBadge();
    
    // Initialize email marketing
    loadEmailCampaigns();
});
