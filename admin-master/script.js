// Master Admin Dashboard JavaScript

// Global Variables
let currentSection = 'overview';
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
    console.log('Initializing Master Admin Dashboard...');
    
    // Load data and initialize
    loadData();
    updateStats();
    displayCompanies();
    displayUsers();
    displayAccessCodes();
    loadActivityFeed();
    
    // Initialize charts after a short delay to ensure DOM is ready
    setTimeout(() => {
        initializeCharts();
    }, 1000);
    
    console.log('Master Admin Dashboard initialized successfully');
});

// Navigation
function showSection(sectionId) {
    // Hide all sections
    document.querySelectorAll('.content-section').forEach(section => {
        section.classList.remove('active');
    });
    
    // Show selected section
    document.getElementById(sectionId).classList.add('active');
    
    // Update navigation
    document.querySelectorAll('.nav-link').forEach(link => {
        link.classList.remove('active');
    });
    document.querySelector(`[onclick="showSection('${sectionId}')"]`).classList.add('active');
    
    currentSection = sectionId;
    
    // Load section-specific data
    if (sectionId === 'analytics') {
        updateCharts();
    }
}

// Data Management
function loadData() {
    // Load companies
    const savedCompanies = localStorage.getItem('masterCompanies');
    if (savedCompanies) {
        companies = JSON.parse(savedCompanies);
    } else {
        // Initialize with sample data
        companies = [
            {
                id: 'csi-001',
                name: 'CSI Veterinary Group',
                adminName: 'John Smith',
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
                adminName: 'Sarah Johnson',
                adminEmail: 'sarah@metroanimal.com',
                adminUsername: 'sarah_admin',
                accessCode: 'METRO456',
                signupDate: '2024-02-20',
                lastActive: '2024-12-15T10:30:00Z',
                status: 'active',
                users: 8,
                policies: 32,
                clinics: ['Downtown', 'Suburb']
            }
        ];
        saveCompanies();
        syncToMainSite();
    }
    
    // Load users
    const savedUsers = localStorage.getItem('masterUsers');
    if (savedUsers) {
        users = JSON.parse(savedUsers);
    } else {
        // Generate users from companies
        generateUsersFromCompanies();
    }
    
    // Load access codes
    const savedCodes = localStorage.getItem('masterAccessCodes');
    if (savedCodes) {
        accessCodes = JSON.parse(savedCodes);
    } else {
        // Initialize with sample access codes
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
                maxCompanies: 5,
                usedBy: [],
                status: 'active'
            }
        ];
        saveAccessCodes();
    }
    
    // Load analytics
    const savedAnalytics = localStorage.getItem('masterAnalytics');
    if (savedAnalytics) {
        analytics = JSON.parse(savedAnalytics);
    }
    
    updateAnalytics();
}

function generateUsersFromCompanies() {
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
        for (let i = 1; i <= Math.floor(Math.random() * 10) + 2; i++) {
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
    saveUsers();
}

function saveCompanies() {
    localStorage.setItem('masterCompanies', JSON.stringify(companies));
    syncToMainSite();
}

function saveUsers() {
    localStorage.setItem('masterUsers', JSON.stringify(users));
    syncToMainSite();
}

function saveAccessCodes() {
    localStorage.setItem('masterAccessCodes', JSON.stringify(accessCodes));
    syncToMainSite();
}

function saveAnalytics() {
    localStorage.setItem('masterAnalytics', JSON.stringify(analytics));
}

// Sync data to main site
function syncToMainSite() {
    // Update main site's localStorage with master admin data
    localStorage.setItem('masterCompanies', JSON.stringify(companies));
    localStorage.setItem('masterUsers', JSON.stringify(users));
    localStorage.setItem('masterAccessCodes', JSON.stringify(accessCodes));
    localStorage.setItem('masterAnalytics', JSON.stringify(analytics));
    
    // Trigger a custom event to notify main site of data changes
    window.dispatchEvent(new CustomEvent('masterDataUpdated', {
        detail: {
            companies: companies,
            users: users,
            accessCodes: accessCodes,
            analytics: analytics
        }
    }));
}

// Statistics and Analytics
function updateStats() {
    analytics.totalCompanies = companies.length;
    analytics.totalUsers = users.length;
    analytics.activeCompanies = companies.filter(c => c.status === 'active').length;
    
    // Calculate total policies
    analytics.totalPolicies = companies.reduce((total, company) => total + company.policies, 0);
    
    // Update main stats
    document.getElementById('totalCompanies').textContent = analytics.totalCompanies;
    document.getElementById('totalUsers').textContent = analytics.totalUsers;
    document.getElementById('totalPolicies').textContent = analytics.totalPolicies;
    document.getElementById('activeCompanies').textContent = analytics.activeCompanies;
    
    // Update header stats
    document.getElementById('headerCompanyCount').textContent = analytics.totalCompanies;
    document.getElementById('headerUserCount').textContent = analytics.totalUsers;
}

function updateAnalytics() {
    // Update signups by month
    const currentMonth = new Date().toISOString().slice(0, 7);
    analytics.signupsByMonth[currentMonth] = (analytics.signupsByMonth[currentMonth] || 0) + companies.filter(c => c.signupDate.startsWith(currentMonth)).length;
    
    // Update policy types (sample data)
    analytics.policyTypes = {
        'Admin Policy': Math.floor(analytics.totalPolicies * 0.4),
        'Standard Operating Guideline': Math.floor(analytics.totalPolicies * 0.35),
        'Communication Memo': Math.floor(analytics.totalPolicies * 0.25)
    };
    
    saveAnalytics();
}

// Company Management
function displayCompanies() {
    const companiesList = document.getElementById('companiesList');
    companiesList.innerHTML = '';
    
    if (companies.length === 0) {
        companiesList.innerHTML = `
            <tr>
                <td colspan="7" class="empty-state">
                    <i class="fas fa-building" style="font-size: 3rem; color: #d1d5db; margin-bottom: 1rem;"></i>
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

function refreshCompanies() {
    loadData();
    displayCompanies();
    updateStats();
    showAlert('Companies data refreshed successfully!', 'success');
}

function displayUsers() {
    const usersList = document.getElementById('usersList');
    usersList.innerHTML = '';
    
    users.forEach(user => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${user.username}</td>
            <td>${user.email}</td>
            <td>${user.company}</td>
            <td>${user.role}</td>
            <td>${formatDate(user.created)}</td>
            <td>${formatDate(user.lastLogin)}</td>
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
    
    document.getElementById('companyDetailsModal').style.display = 'block';
}

function suspendCompany(companyId) {
    if (confirm('Are you sure you want to suspend this company?')) {
        const company = companies.find(c => c.id === companyId);
        if (company) {
            company.status = company.status === 'active' ? 'suspended' : 'active';
            saveCompanies();
            displayCompanies();
            updateStats();
        }
    }
}

function resetCompanyPassword(companyId) {
    if (confirm('Reset the admin password for this company?')) {
        // In a real implementation, this would send a password reset email
        alert('Password reset email sent to company admin.');
    }
}

function deleteCompany(companyId) {
    if (confirm('Are you sure you want to delete this company? This action cannot be undone.')) {
        companies = companies.filter(c => c.id !== companyId);
        users = users.filter(u => !u.id.includes(companyId));
        saveCompanies();
        saveUsers();
        displayCompanies();
        displayUsers();
        updateStats();
        closeCompanyDetailsModal();
    }
}

// Access Code Management
function showCreateCodeModal() {
    document.getElementById('createCodeModal').style.display = 'block';
}

function closeCreateCodeModal() {
    document.getElementById('createCodeModal').style.display = 'none';
    document.getElementById('createCodeForm').reset();
}

function createAccessCode(event) {
    event.preventDefault();
    
    const formData = new FormData(event.target);
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
    saveAccessCodes();
    displayAccessCodes();
    closeCreateCodeModal();
    
    showAlert('Access code created successfully!', 'success');
}

function editAccessCode(codeId) {
    // Implementation for editing access codes
    alert('Edit access code functionality coming soon!');
}

function deleteAccessCode(codeId) {
    if (confirm('Are you sure you want to delete this access code?')) {
        accessCodes = accessCodes.filter(c => c.id !== codeId);
        saveAccessCodes();
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
    
    document.getElementById('launchCompanyModal').style.display = 'block';
}

function closeLaunchModal() {
    document.getElementById('launchCompanyModal').style.display = 'none';
    document.getElementById('launchCompanyForm').reset();
}

function launchCompany(event) {
    event.preventDefault();
    
    const formData = new FormData(event.target);
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
    saveCompanies();
    
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
    saveUsers();
    
    // Update access code usage
    accessCode.usedBy.push(newCompany.name);
    saveAccessCodes();
    
    // Update displays
    displayCompanies();
    displayUsers();
    displayAccessCodes();
    updateStats();
    closeLaunchModal();
    
    showAlert(`Company "${newCompany.name}" launched successfully!`, 'success');
}

// User Management
function deleteUser(userId) {
    if (confirm('Are you sure you want to delete this user?')) {
        users = users.filter(u => u.id !== userId);
        saveUsers();
        displayUsers();
        updateStats();
        showAlert('User deleted successfully!', 'success');
    }
}

// Activity Feed
function loadActivityFeed() {
    const activityFeed = document.getElementById('activityFeed');
    activityFeed.innerHTML = '';
    
    // Generate sample activities
    const activities = [
        {
            type: 'signup',
            title: 'New company "VetCare Plus" signed up',
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
        // Destroy existing chart if it exists
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
                    borderColor: '#3b82f6',
                    backgroundColor: 'rgba(59, 130, 246, 0.1)',
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
                    backgroundColor: ['#3b82f6', '#10b981', '#f59e0b']
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
}

function exportCompanyReport() {
    const csv = generateCompanyCSV();
    downloadCSV(csv, 'company-report.csv');
}

function exportUserReport() {
    const csv = generateUserCSV();
    downloadCSV(csv, 'user-report.csv');
}

function exportAnalyticsReport() {
    const csv = generateAnalyticsCSV();
    downloadCSV(csv, 'analytics-report.csv');
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
    
    document.body.appendChild(alertDiv);
    
    setTimeout(() => {
        alertDiv.remove();
    }, 5000);
}

function filterCompanies() {
    const searchTerm = document.getElementById('companySearch').value.toLowerCase();
    const statusFilter = document.getElementById('statusFilter').value;
    
    const filteredCompanies = companies.filter(company => {
        const matchesSearch = company.name.toLowerCase().includes(searchTerm);
        const matchesStatus = !statusFilter || company.status === statusFilter;
        return matchesSearch && matchesStatus;
    });
    
    // Update display with filtered companies
    const companiesList = document.getElementById('companiesList');
    companiesList.innerHTML = '';
    
    filteredCompanies.forEach(company => {
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

// Modal Functions
function closeCompanyDetailsModal() {
    document.getElementById('companyDetailsModal').style.display = 'none';
}

// Authentication
function logout() {
    if (confirm('Are you sure you want to logout?')) {
        // In a real implementation, this would clear session data
        window.location.href = '../index.html';
    }
}

// Close modals when clicking outside
window.onclick = function(event) {
    const modals = document.querySelectorAll('.modal');
    modals.forEach(modal => {
        if (event.target === modal) {
            modal.style.display = 'none';
        }
    });
};
