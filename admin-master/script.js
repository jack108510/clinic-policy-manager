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
    
    // Initialize charts
    setTimeout(() => {
        initializeCharts();
    }, 1000);
    
    console.log('Master Admin Dashboard initialized successfully');
});

// Data Initialization
function initializeData() {
    // Initialize companies
    companies = [
        {
            id: 'csi-001',
            name: 'CSI Veterinary Group',
            adminName: 'Dr. Sarah Johnson',
            adminEmail: 'admin@csiveterinary.com',
            adminUsername: 'admin',
            accessCode: 'CSI123',
            signupDate: '2024-01-15',
            lastActive: new Date().toISOString(),
            status: 'active',
            users: 12,
            policies: 45,
            clinics: ['Tudor Glen', 'River Valley', 'Rosslyn', 'UPC']
        },
        {
            id: 'vet-002',
            name: 'Metro Animal Hospital',
            adminName: 'Dr. Michael Chen',
            adminEmail: 'admin@metroanimal.com',
            adminUsername: 'mchen_admin',
            accessCode: 'METRO456',
            signupDate: '2024-02-20',
            lastActive: '2024-12-15T10:30:00Z',
            status: 'active',
            users: 8,
            policies: 32,
            clinics: ['Downtown', 'Suburb']
        },
        {
            id: 'vet-003',
            name: 'Coastal Veterinary Care',
            adminName: 'Dr. Emily Rodriguez',
            adminEmail: 'admin@coastalvet.com',
            adminUsername: 'erodriguez_admin',
            accessCode: 'COASTAL789',
            signupDate: '2024-03-10',
            lastActive: '2024-12-10T14:20:00Z',
            status: 'active',
            users: 6,
            policies: 28,
            clinics: ['Beachside', 'Harbor']
        }
    ];
    
    // Initialize users
    users = [];
    companies.forEach(company => {
        // Add admin user
        users.push({
            id: `user-${company.id}-admin`,
            username: company.adminUsername,
            email: company.adminEmail,
            company: company.name,
            role: 'Admin',
            created: company.signupDate,
            lastLogin: company.lastActive,
            status: 'active'
        });
        
        // Generate sample staff users
        for (let i = 1; i <= Math.floor(Math.random() * 8) + 2; i++) {
            users.push({
                id: `user-${company.id}-${i}`,
                username: `staff${i}`,
                email: `staff${i}@${company.name.toLowerCase().replace(/\s+/g, '')}.com`,
                company: company.name,
                role: 'Staff',
                created: company.signupDate,
                lastLogin: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000).toISOString(),
                status: 'active'
            });
        }
    });
    
    // Initialize access codes
    accessCodes = [
        {
            id: 'code-001',
            code: 'CSI123',
            description: 'CSI Veterinary Group Access',
            createdDate: '2024-01-10',
            expiryDate: null,
            maxCompanies: 1,
            usedBy: ['CSI Veterinary Group'],
            status: 'active'
        },
        {
            id: 'code-002',
            code: 'METRO456',
            description: 'Metro Animal Hospital Access',
            createdDate: '2024-02-15',
            expiryDate: null,
            maxCompanies: 1,
            usedBy: ['Metro Animal Hospital'],
            status: 'active'
        },
        {
            id: 'code-003',
            code: 'VET789',
            description: 'General Veterinary Access',
            createdDate: '2024-03-01',
            expiryDate: '2025-03-01',
            maxCompanies: 10,
            usedBy: ['Coastal Veterinary Care'],
            status: 'active'
        },
        {
            id: 'code-004',
            code: 'PREMIUM001',
            description: 'Premium Veterinary Access',
            createdDate: '2024-04-01',
            expiryDate: '2025-04-01',
            maxCompanies: 5,
            usedBy: [],
            status: 'active'
        }
    ];
    
    // Save to localStorage
    localStorage.setItem('masterCompanies', JSON.stringify(companies));
    localStorage.setItem('masterUsers', JSON.stringify(users));
    localStorage.setItem('masterAccessCodes', JSON.stringify(accessCodes));
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
                <td colspan="7" class="empty-state">
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
            <td>${formatDate(company.signupDate)}</td>
            <td>${formatDate(company.lastActive)}</td>
            <td><span class="status-badge status-${company.status}">${company.status}</span></td>
            <td>
                <button onclick="viewCompanyDetails('${company.id}')" class="btn btn-small btn-primary">View</button>
                <button onclick="suspendCompany('${company.id}')" class="btn btn-small btn-danger">Suspend</button>
            </td>
        `;
        companiesList.appendChild(row);
    });
}

function displayUsers() {
    const usersList = document.getElementById('usersList');
    usersList.innerHTML = '';
    
    if (users.length === 0) {
        usersList.innerHTML = `
            <tr>
                <td colspan="7" class="empty-state">
                    <i class="fas fa-users"></i>
                    <h3>No Users Found</h3>
                    <p>Users will appear here as companies are created</p>
                </td>
            </tr>
        `;
        return;
    }
    
    users.forEach(user => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>
                <div class="company-info">
                    <strong>${user.username}</strong>
                    <small>${user.email}</small>
                </div>
            </td>
            <td>${user.company}</td>
            <td>${user.role}</td>
            <td>${formatDate(user.created)}</td>
            <td>${formatDate(user.lastLogin)}</td>
            <td><span class="status-badge status-${user.status}">${user.status}</span></td>
            <td>
                <button onclick="deleteUser('${user.id}')" class="btn btn-small btn-danger">Delete</button>
            </td>
        `;
        usersList.appendChild(row);
    });
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
    
    showAlert('Access code created successfully!', 'success');
}

function deleteAccessCode(codeId) {
    if (confirm('Are you sure you want to delete this access code?')) {
        accessCodes = accessCodes.filter(c => c.id !== codeId);
        localStorage.setItem('masterAccessCodes', JSON.stringify(accessCodes));
        displayAccessCodes();
        showAlert('Access code deleted successfully!', 'success');
    }
}

// Launch New Company
function launchNewCompany() {
    // Populate access codes dropdown
    const accessCodeSelect = document.getElementById('accessCode');
    accessCodeSelect.innerHTML = '<option value="">Select Access Code</option>';
    
    accessCodes.filter(code => code.status === 'active' && code.usedBy.length < code.maxCompanies)
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
        accessCode: selectedAccessCode,
        signupDate: new Date().toISOString().slice(0, 10),
        lastActive: new Date().toISOString(),
        status: 'active',
        users: 1,
        policies: 0,
        clinics: []
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
    
    showAlert(`Company "${newCompany.name}" launched successfully!`, 'success');
}

// Activity Feed
function loadActivityFeed() {
    const activityFeed = document.getElementById('activityFeed');
    activityFeed.innerHTML = '';
    
    const activities = [
        {
            type: 'signup',
            title: 'New company "Coastal Veterinary Care" signed up',
            time: '2 hours ago',
            icon: 'fas fa-building'
        },
        {
            type: 'login',
            title: 'Admin from CSI Veterinary Group logged in',
            time: '4 hours ago',
            icon: 'fas fa-sign-in-alt'
        },
        {
            type: 'policy',
            title: 'Metro Animal Hospital created new policy',
            time: '6 hours ago',
            icon: 'fas fa-file-alt'
        },
        {
            type: 'user',
            title: 'New user added to CSI Veterinary Group',
            time: '1 day ago',
            icon: 'fas fa-user-plus'
        }
    ];
    
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

// Authentication
function logout() {
    if (confirm('Are you sure you want to logout?')) {
        window.location.href = '../index.html';
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