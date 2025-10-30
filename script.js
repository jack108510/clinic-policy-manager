// Initialize current policies as empty array
let currentPolicies = loadFromLocalStorage('currentPolicies', []);
let draftPolicies = loadFromLocalStorage('draftPolicies', []);
let notifications = loadFromLocalStorage('notifications', []);

// Settings Data - Load from localStorage or use empty defaults
let roles = loadFromLocalStorage('roles', []);
let disciplinaryActions = loadFromLocalStorage('disciplinaryActions', []);

// Company-specific organizations
let organizations = loadFromLocalStorage('organizations', {
    'CSI Company': ['Tudor Glen', 'River Valley', 'Rosslyn', 'UPC'],
    'Default Company': ['Tudor Glen', 'River Valley', 'Rosslyn', 'UPC']
});

// User Management Data - Load from master admin data
function loadMasterAdminData() {
    const masterCompanies = localStorage.getItem('masterCompanies');
    const masterUsers = localStorage.getItem('masterUsers');
    const masterAccessCodes = localStorage.getItem('masterAccessCodes');
    
    if (masterCompanies && masterUsers && masterAccessCodes) {
        return {
            companies: JSON.parse(masterCompanies),
            users: JSON.parse(masterUsers),
            accessCodes: JSON.parse(masterAccessCodes)
        };
    }
    return null;
}

// Initialize with master admin data if available
const masterData = loadMasterAdminData();
let users = [];
let policies = [];
let conversationHistory = []; // Store full conversation history for AI context
let currentUser = loadFromLocalStorage('currentUser', null);
let currentCompany = loadFromLocalStorage('currentCompany', null);

if (masterData) {
    users = masterData.users;
    // Filter users for current company if logged in
    if (currentCompany) {
        users = users.filter(user => user.company === currentCompany);
    }
} else {
    // Fallback to default data
    users = loadFromLocalStorage('users', [
        { id: 1, username: 'admin', email: 'admin@csi.com', company: 'CSI', role: 'admin', accessCode: '123', created: new Date().toISOString().split('T')[0] }
    ]);
}

// Listen for master data updates from admin dashboard
window.addEventListener('masterDataUpdated', function(event) {
    const updatedData = event.detail;
    console.log('📡 Master data updated event received:', updatedData);
    
    // Update local data with new master data
    if (updatedData.users && Array.isArray(updatedData.users)) {
        console.log('🔄 Updating users:', updatedData.users.length);
    users = updatedData.users;
        
        // Filter to current company if logged in
    if (currentCompany) {
            const companyUsers = users.filter(user => user.company === currentCompany);
            console.log('👥 Company users:', companyUsers.length);
    }
    
        // Save updated data to both user lists
    saveToLocalStorage('users', users);
        localStorage.setItem('masterUsers', JSON.stringify(updatedData.users));
    }
    
    // Update companies
    if (updatedData.companies && Array.isArray(updatedData.companies)) {
        console.log('🏢 Updating companies:', updatedData.companies.length);
        const companies = updatedData.companies;
        localStorage.setItem('masterCompanies', JSON.stringify(companies));
    }
    
    // Update access codes
    if (updatedData.accessCodes && Array.isArray(updatedData.accessCodes)) {
        console.log('🔑 Updating access codes:', updatedData.accessCodes.length);
        localStorage.setItem('masterAccessCodes', JSON.stringify(updatedData.accessCodes));
    }
    
    // Update organizations
    if (updatedData.organizations) {
        console.log('🏛️ Updating organizations');
        localStorage.setItem('organizations', JSON.stringify(updatedData.organizations));
        // Reload organizations if in settings
        if (typeof displayOrganizations === 'function') {
            displayOrganizations();
        }
    }
    
    // Update categories
    if (updatedData.categories) {
        console.log('📁 Updating categories:', updatedData.categories.length);
        localStorage.setItem('categories', JSON.stringify(updatedData.categories));
        // Reload categories if in settings
        if (typeof loadCategories === 'function') {
            loadCategories();
        }
    }
    
    // Update roles
    if (updatedData.roles) {
        console.log('👤 Updating roles:', updatedData.roles.length);
        localStorage.setItem('roles', JSON.stringify(updatedData.roles));
    }
    
    // Update disciplinary actions
    if (updatedData.disciplinaryActions) {
        console.log('⚖️ Updating disciplinary actions:', updatedData.disciplinaryActions.length);
        localStorage.setItem('disciplinaryActions', JSON.stringify(updatedData.disciplinaryActions));
    }
    
    // Refresh UI if needed
    if (typeof updateUserInterface === 'function') {
        updateUserInterface();
    }
    
    console.log('✅ Master data sync complete');
});

// ChatGPT API Key Management
function getChatGPTAPIKey() {
    // Get API key from company configuration in master admin data
    const masterData = loadMasterAdminData();
    if (masterData && masterData.companies) {
        const company = masterData.companies.find(c => c.name === currentCompany);
        if (company && company.apiKey) {
            return company.apiKey;
        }
    }
    
    // Fallback to localStorage for backward compatibility
    let apiKey = localStorage.getItem('chatgpt_api_key');
    
    // If not found, try to get from environment variable (for development)
    if (!apiKey && typeof process !== 'undefined' && process.env) {
        apiKey = process.env.OPENAI_API_KEY;
    }
    
    return apiKey;
}

function setChatGPTAPIKey(apiKey) {
    localStorage.setItem('chatgpt_api_key', apiKey);
}

function clearChatGPTAPIKey() {
    localStorage.removeItem('chatgpt_api_key');
}

// Local Storage Functions
function saveToLocalStorage(key, data) {
    try {
        localStorage.setItem(key, JSON.stringify(data));
    } catch (error) {
        console.error('Error saving to localStorage:', error);
    }
}

function loadFromLocalStorage(key, defaultValue = []) {
    try {
        const data = localStorage.getItem(key);
        return data ? JSON.parse(data) : defaultValue;
    } catch (error) {
        console.error('Error loading from localStorage:', error);
        return defaultValue;
    }
}

// DOM Elements
const policiesGrid = document.getElementById('policiesGrid');
const policySearch = document.getElementById('policySearch');
const filterButtons = document.querySelectorAll('.filter-btn');
const totalPoliciesElement = document.getElementById('totalPolicies');
const recentUpdatesElement = document.getElementById('recentUpdates');
const createModal = document.getElementById('createModal');
const policyForm = document.getElementById('policyForm');
const aiModal = document.getElementById('aiModal');
const aiForm = document.getElementById('aiForm');
const aiLoading = document.getElementById('aiLoading');
const aiResult = document.getElementById('aiResult');
const aiGeneratedContent = document.getElementById('aiGeneratedContent');
const draftList = document.getElementById('draftList');
const draftCountElement = document.getElementById('draftCount');

// Initialize the application
document.addEventListener('DOMContentLoaded', function() {
    console.log('Initializing application...');
    
    // Check if user is already logged in
    if (currentUser) {
        document.body.classList.add('user-logged-in');
    }
    
    // Initialize data displays
    displayPolicies(currentPolicies);
    updateStats();
    displayDrafts();
    displayRoles();
    displayDisciplinaryActions();
    displayUsers();
    setupEventListeners();
    addLoginChecksToAllElements();
    updateUserInterface();
    
    // Mobile menu toggle
    const navToggle = document.querySelector('.nav-toggle');
    const navMenu = document.querySelector('.nav-menu');
    
    if (navToggle && navMenu) {
        navToggle.addEventListener('click', function() {
            navMenu.classList.toggle('active');
        });
    }
    
    // Listen for master data updates
    window.addEventListener('masterDataUpdated', function(event) {
        console.log('Master data updated event received:', event.detail);
        // Update local users data if needed
        if (event.detail && event.detail.users) {
            users = event.detail.users;
            saveToLocalStorage('users', users);
        }
    });
    
    // Listen for company policies updates (from other admins)
    window.addEventListener('companyPoliciesUpdated', function(event) {
        console.log('Company policies updated event received:', event.detail);
        if (event.detail && event.detail.company === currentCompany && event.detail.policies) {
            console.log('Reloading policies from other admin:', event.detail.policies.length);
            loadPoliciesFromStorage();
            showNotification('Policies updated by another admin', 'info');
        }
    });
    
    // Poll for policy updates from other admins (every 2 seconds)
    let lastPolicyUpdate = currentCompany ? localStorage.getItem(`policies_${currentCompany}_updated`) : null;
    setInterval(function() {
        if (currentUser && currentCompany) {
            const currentUpdate = localStorage.getItem(`policies_${currentCompany}_updated`);
            if (currentUpdate && currentUpdate !== lastPolicyUpdate) {
                console.log('Detected policy update, reloading...');
                lastPolicyUpdate = currentUpdate;
                loadPoliciesFromStorage();
                showNotification('Policies have been updated', 'info');
            }
        }
    }, 2000);
    
    // Reload policies when window regains focus (in case another tab made changes)
    window.addEventListener('focus', function() {
        if (currentUser && currentCompany) {
            loadPoliciesFromStorage();
        }
    });
    
    // Load policies from storage if user is logged in
    if (currentUser && currentCompany) {
        console.log('Loading policies from storage for company:', currentCompany);
        loadPoliciesFromStorage();
    }
    
    // Check user status
    if (currentUser) {
            console.log('User already logged in:', currentUser.username);
            // Load policies from storage when user is already logged in
            if (currentCompany) {
                loadPoliciesFromStorage();
            }
        }
        
    // Watch for create modal opening and populate organizations
    const createModal = document.getElementById('createModal');
    if (createModal) {
        const observer = new MutationObserver(function(mutations) {
            mutations.forEach(function(mutation) {
                if (mutation.type === 'attributes' && mutation.attributeName === 'style') {
                    const display = window.getComputedStyle(createModal).display;
                    if (display === 'block') {
                        console.log('🔍 Create modal opened, populating organizations...');
                        populateOrganizationsDropdown();
                    }
                }
            });
        });
        
        observer.observe(createModal, {
            attributes: true,
            attributeFilter: ['style']
        });
        }
});

// Check if user is logged in before allowing access to features
function requireLogin() {
    console.log('requireLogin called, currentUser:', currentUser);
    if (!currentUser) {
        console.log('User not logged in, showing signup modal');
        showSignupModal();
        return false;
    }
    console.log('User is logged in, allowing access');
    return true;
}

// Event Listeners
function setupEventListeners() {
    // Search functionality
    if (policySearch) {
        policySearch.addEventListener('input', function() {
            if (!requireLogin()) return;
            const searchTerm = this.value.toLowerCase();
            const filteredPolicies = currentPolicies.filter(policy => {
                const title = (policy.title || '').toLowerCase();
                const description = (policy.description || '').toLowerCase();
                const content = (policy.content || '').toLowerCase();
                const type = (policy.type || '').toLowerCase();
                const policyCode = (policy.policyCode || '').toLowerCase();
                
                return title.includes(searchTerm) || 
                       description.includes(searchTerm) || 
                       content.includes(searchTerm) ||
                       type.includes(searchTerm) ||
                       policyCode.includes(searchTerm);
            });
            displayPolicies(filteredPolicies);
        });
    }

    // Filter buttons
    filterButtons.forEach(button => {
        button.addEventListener('click', function() {
            if (!requireLogin()) return;
            
            // Remove active class from all buttons
            filterButtons.forEach(btn => btn.classList.remove('active'));
            // Add active class to clicked button
            this.classList.add('active');
            
            const filter = this.getAttribute('data-filter');
            filterPolicies(filter);
        });
    });

    // Form submission
    const policyForm = document.getElementById('policyForm');
    if (policyForm) {
    policyForm.addEventListener('submit', function(e) {
        e.preventDefault();
        createNewPolicy();
    });
    }
    
    // Listen for policy type changes to update policy code
    const policyTypeSelect = document.getElementById('policyType');
    if (policyTypeSelect) {
        policyTypeSelect.addEventListener('change', function() {
            console.log('🔄 Policy type changed, updating code...');
            updateManualPolicyCode();
        });
    }
    
    // Listen for category changes to update policy code
    const categorySelect = document.getElementById('manualPolicyCategory');
    if (categorySelect) {
        categorySelect.addEventListener('change', function() {
            console.log('🔄 Category changed, updating code...');
            updateManualPolicyCode();
        });
    }

    // AI Form submission
    aiForm.addEventListener('submit', function(e) {
        e.preventDefault();
        generateAIPolicy();
    });

    // Signup Form submission
    const signupForm = document.getElementById('signupForm');
    console.log('Signup form element:', signupForm);
    if (signupForm) {
        signupForm.addEventListener('submit', function(e) {
            console.log('Signup form submit event triggered');
            e.preventDefault();
            signupUser(e);
        });
    } else {
        console.error('Signup form element not found');
    }

    // Also add direct button click event as backup - check all signup forms
    const signupForms = ['companySignupForm', 'individualSignupForm', 'companyCodeSignupForm'];
    signupForms.forEach(formId => {
        const signupButton = document.querySelector(`#${formId} button[type="submit"]`);
    if (signupButton) {
            console.log(`Signup button found for form: ${formId}`);
        signupButton.addEventListener('click', function(e) {
                console.log(`Signup button clicked for form: ${formId}`);
            e.preventDefault();
                if (formId === 'companySignupForm') {
            signupUser(e);
                } else if (formId === 'individualSignupForm') {
                    signupUser(e);
                } else if (formId === 'companyCodeSignupForm') {
                    signupUser(e);
                }
        });
    }
    });

    // Password form submission
    const passwordForm = document.getElementById('passwordForm');
    console.log('Password form found:', passwordForm);
    if (passwordForm) {
        passwordForm.addEventListener('submit', function(e) {
            console.log('Password form submit event triggered!');
            e.preventDefault();
            checkAdminPassword(e);
        });
        
        // Check if admin button exists and log its onclick handler
        const adminButton = passwordForm.querySelector('button[type="button"]');
        if (adminButton) {
            console.log('Admin button found:', adminButton);
            console.log('Admin button onclick handler:', adminButton.onclick);
        }
    } else {
        console.error('Password form not found!');
    }
    
    // Event delegation for policy view buttons (dynamically added)
    document.addEventListener('click', function(e) {
        if (e.target.closest('.policy-view-btn')) {
            const button = e.target.closest('.policy-view-btn');
            const policyId = button.getAttribute('data-policy-id');
            console.log('Policy view button clicked with ID:', policyId);
            e.preventDefault();
            viewPolicy(policyId);
        }
    });

    // Smooth scrolling for navigation links
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            e.preventDefault();
            const href = this.getAttribute('href');
            if (!href || href === '#' || href === '#home') {
                return; // Skip invalid or home links
            }
            const target = document.querySelector(href);
            if (target) {
                target.scrollIntoView({
                    behavior: 'smooth',
                    block: 'start'
                });
            }
        });
    });
}

// Add login requirement to all interactive elements
function addLoginChecksToAllElements() {
    // Add click listeners to all buttons that should require login
    const allButtons = document.querySelectorAll('button, .btn, a[href^="#"]');
    
    allButtons.forEach(element => {
        // Skip elements that are login/signup related or already have requireLogin
        const onclick = element.getAttribute('onclick') || '';
        const href = element.getAttribute('href') || '';
        
        if (onclick.includes('showLoginModal') || 
            onclick.includes('showSignupModal') || 
            onclick.includes('closeLoginModal') || 
            onclick.includes('closeSignupModal') ||
            onclick.includes('requireLogin') ||
            href.includes('admin-master') ||
            element.type === 'submit') {
            return;
        }
        
        // Add click listener for login check
        element.addEventListener('click', function(event) {
            if (!requireLogin()) {
                event.preventDefault();
                event.stopPropagation();
                return false;
            }
        });
    });
    
    console.log('Login checks added to all interactive elements');
}

// Display Policies
function displayPolicies(policiesToDisplay = policies) {
    if (!policiesGrid) {
        console.error('Policies grid element not found');
        return;
    }
    
    if (!policiesToDisplay || policiesToDisplay.length === 0) {
        policiesGrid.innerHTML = '<div class="no-policies">No policies found matching your criteria.</div>';
        return;
    }

    policiesGrid.innerHTML = policiesToDisplay.map(policy => {
        // Get policy type label
        const typeLabel = getTypeLabel(policy.type);
        const typeClass = policy.type || 'admin';
        
        // Get organizations
        const organizations = policy.clinicNames || policy.organizations || policy.clinics || 'All Organizations';
        
        // Get dates
        const createdDate = policy.created ? formatDate(policy.created) : 'N/A';
        const updatedDate = policy.updated ? formatDate(policy.updated) : (policy.lastModified ? formatDate(policy.lastModified) : 'N/A');
        
        // Get policy code
        const policyCode = policy.policyCode || '';
        
        // Create simple thumbnail initials
        const titleText = (policy.title || 'Untitled Policy').trim();
        const initials = titleText
            .split(/\s+/)
            .slice(0, 2)
            .map(w => w.charAt(0))
            .join('')
            .toUpperCase();
        
        return `
            <div class="policy-item" data-type="${policy.type}" data-policy-code="${policyCode.toLowerCase()}" onclick="viewPolicy('${policy.id}')">
                <div class="policy-card-header">
                    <div class="policy-thumb ${typeClass}">${initials}</div>
                    <div class="policy-card-title">
                        <h3 class="policy-title">${policy.title || 'Untitled Policy'}</h3>
                        <div class="policy-meta-row">
                            <span class="policy-type-badge ${typeClass}">${typeLabel}</span>
                            ${policyCode ? `<span class="policy-code-badge">${policyCode}</span>` : ''}
                        </div>
                </div>
            </div>
            <div class="policy-organizations">
                    <i class="fas fa-building"></i> ${organizations}
            </div>
                <div class="policy-dates">
                    <div class="policy-date-item"><i class="fas fa-calendar-plus"></i> Created: ${createdDate}</div>
                    ${updatedDate !== 'N/A' ? `<div class="policy-date-item"><i class=\"fas fa-calendar-check\"></i> Updated: ${updatedDate}</div>` : ''}
            </div>
            </div>
        `;
    }).join('');
}

// Filter Policies
function filterPolicies(filter) {
    let filteredPolicies;
    
    if (filter === 'all') {
        filteredPolicies = currentPolicies;
    } else {
        filteredPolicies = currentPolicies.filter(policy => policy.type === filter);
    }
    
    displayPolicies(filteredPolicies);
}

// Create New Policy
async function createNewPolicy() {
    // Get selected organizations from the dropdown
    const clinicSelect = document.getElementById('clinicApplicability');
    let selectedClinics = [];
    let clinicNames = 'All Organizations';
    
    if (clinicSelect) {
        const selectedOptions = Array.from(clinicSelect.selectedOptions);
        selectedClinics = selectedOptions.map(option => option.value);
        clinicNames = selectedOptions.map(option => option.textContent).join(', ');
        
        // If no organizations selected, default to all
        if (selectedClinics.length === 0 || selectedClinics.includes('')) {
            selectedClinics = ['all-organizations'];
            clinicNames = 'All Organizations';
        }
    } else {
        // Fallback: Get organizations from settings for the current company
        const companyOrgs = organizations[currentCompany] || [];
        if (companyOrgs.length > 0) {
            selectedClinics = companyOrgs;
            clinicNames = companyOrgs.join(', ');
        }
    }
    
    // Get form values with defaults if empty
    const titleInput = document.getElementById('policyTitle');
    const typeInput = document.getElementById('policyType');
    
    const title = (titleInput?.value || '').trim() || 'Untitled Policy';
    const type = (typeInput?.value || '').trim() || 'admin';
    
    // Dynamically collect all fields from the dynamic form fields container
    const dynamicFieldsContainer = document.getElementById('dynamicManualFormFields');
    let allFormData = {};
    
    if (dynamicFieldsContainer) {
        // Get all inputs, textareas, and selects from dynamic fields
        const allInputs = dynamicFieldsContainer.querySelectorAll('input, textarea, select');
        allInputs.forEach(field => {
            const fieldId = field.id;
            const fieldName = fieldId || field.name || '';
            if (fieldName) {
                if (field.type === 'date') {
                    allFormData[fieldName] = field.value || '';
                } else if (field.tagName === 'TEXTAREA') {
                    allFormData[fieldName] = field.value || '';
                } else if (field.tagName === 'SELECT') {
                    allFormData[fieldName] = field.value || '';
                } else {
                    allFormData[fieldName] = field.value || '';
                }
            }
        });
    }
    
    // Build description from dynamic fields (prefer purpose or first content field)
    const description = allFormData.purpose || allFormData.objective || allFormData.subject || 
                       allFormData.message || Object.values(allFormData).find(v => v && v.trim()) || '';
    
    // Get selected category
    const categoryId = document.getElementById('manualPolicyCategory')?.value || null;
    const tempId = 'policy_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
    
    // Generate policy code if category is selected
    const policyCode = categoryId ? generatePolicyCode(categoryId, tempId, type) : null;

    // Create policy object with all collected data
    const newPolicy = {
        id: tempId,
        title: title,
        type: type || 'admin',
        clinics: selectedClinics,
        clinicNames: clinicNames,
        description: description,
        content: JSON.stringify(allFormData), // Store all form data as JSON for later use
        company: currentCompany || 'Default Company', // Assign to current company
        created: new Date().toISOString().split('T')[0],
        updated: new Date().toISOString().split('T')[0],
        categoryId: categoryId,
        policyCode: policyCode
    };

    // Save to localStorage instead of just in-memory array
    const companyPolicies = loadCompanyPolicies();
    companyPolicies.push(newPolicy);
    localStorage.setItem(`policies_${currentCompany}`, JSON.stringify(companyPolicies));
    
    // Update in-memory array
    currentPolicies.unshift(newPolicy);
    displayPolicies(currentPolicies);
    updateStats();
    closeCreateModal();
    
    // Reset form
    policyForm.reset();
    
    // Send webhook notification
    try {
        await sendPolicyPublishWebhook(newPolicy);
        console.log('✅ Policy publish webhook sent successfully');
    } catch (error) {
        console.error('⚠️ Failed to send policy publish webhook:', error);
        // Don't block policy creation if webhook fails
    }
    
    // Show success message
    showNotification('Policy created successfully!', 'success');
    
    // Add notification to notification center
    addNotification(`New policy "${formData.title}" has been created`, 'success');
}

// Modal Functions
// Duplicate openCreateModal function removed - using the more complete version defined later

// Duplicate closeCreateModal function removed - using the more complete version defined later

// Close modal when clicking outside
window.addEventListener('click', function(e) {
    if (e.target === createModal) {
        closeCreateModal();
    }
    if (e.target === aiModal) {
        closeAIModal();
    }
});

// Update Statistics
function updateStats() {
    // Update main stats if elements exist
    if (totalPoliciesElement) {
        totalPoliciesElement.textContent = currentPolicies.length;
    }
    
    // Count recent updates (last 7 days)
    const recentDate = new Date();
    recentDate.setDate(recentDate.getDate() - 7);
    const recentUpdates = currentPolicies.filter(policy => 
        new Date(policy.updated) >= recentDate
    ).length;
    
    if (recentUpdatesElement) {
        recentUpdatesElement.textContent = recentUpdates;
    }
    
    if (draftCountElement) {
        draftCountElement.textContent = draftPolicies.length;
    }
    
    // Update admin stats
    const adminTotalPolicies = document.getElementById('adminTotalPolicies');
    const adminDraftCount = document.getElementById('adminDraftCount');
    const adminUserCount = document.getElementById('adminUserCount');
    const adminCompanyCount = document.getElementById('adminCompanyCount');
    
    if (adminTotalPolicies) adminTotalPolicies.textContent = currentPolicies.length;
    if (adminDraftCount) adminDraftCount.textContent = draftPolicies.length;
    if (adminUserCount) adminUserCount.textContent = users.length;
    if (adminCompanyCount) {
        const uniqueCompanies = [...new Set(users.map(user => user.company))];
        adminCompanyCount.textContent = uniqueCompanies.length;
    }
}

// Helper Functions
function getTypeLabel(type) {
    const labels = {
        'admin': 'Admin Policy',
        'sog': 'Standard Operating Guidelines',
        'protocol': 'Protocol',
        'memo': 'Communication Memo',
        'memos': 'Communication Memos'
    };
    return labels[type] || type;
}

function getOrganizationNames(organizationCodes) {
    const organizationNames = {
        'tudor-glen': 'Tudor Glen',
        'river-valley': 'River Valley',
        'rosslyn': 'Rosslyn',
        'upc': 'UPC'
    };
    return organizationCodes.map(code => organizationNames[code] || code);
}

function getCompanyOrganizations(company) {
    return organizations[company] || organizations['Default Company'] || ['Tudor Glen', 'River Valley', 'Rosslyn', 'UPC'];
}

function addOrganizationToCompany(company, organizationName) {
    if (!organizations[company]) {
        organizations[company] = [];
    }
    if (!organizations[company].includes(organizationName)) {
        organizations[company].push(organizationName);
        saveToLocalStorage('organizations', organizations);
    }
}

function addOrganization() {
    // Try modal inputs first, fallback to old inputs
    const orgNameInput = document.getElementById('modalOrgName');
    const orgAddressInput = document.getElementById('modalOrgAddress');
    const orgPhoneInput = document.getElementById('modalOrgPhone');
    const orgEmailInput = document.getElementById('modalOrgEmail');
    
    const orgName = orgNameInput ? orgNameInput.value.trim() : (document.getElementById('newOrganizationName')?.value.trim() || '');
    const orgAddress = orgAddressInput ? orgAddressInput.value.trim() : (document.getElementById('newOrganizationAddress')?.value.trim() || '');
    const orgPhone = orgPhoneInput ? orgPhoneInput.value.trim() : (document.getElementById('newOrganizationPhone')?.value.trim() || '');
    const orgEmail = orgEmailInput ? orgEmailInput.value.trim() : (document.getElementById('newOrganizationEmail')?.value.trim() || '');
    
    if (!orgName) {
        showNotification('Please enter an organization name', 'error');
        return;
    }
    
    // Add to current company
    addOrganizationToCompany(currentCompany, orgName);
    
    // Close modal
    closeAddOrganizationModal();
    
    // Show success message
    showNotification(`Organization "${orgName}" added successfully!`, 'success');
    
    // Refresh organizations display
    displayOrganizations();
}
function displayOrganizations() {
    const organizationsList = document.getElementById('organizationsList');
    if (!organizationsList) {
        console.log('organizationsList not found');
        return;
    }
    
    // Reload organizations from localStorage to get latest
    const orgData = localStorage.getItem('organizations');
    if (orgData) {
        const loadedOrgs = JSON.parse(orgData);
        organizations = loadedOrgs;
    }
    
    // Get organizations for current company
    const companyOrgs = organizations[currentCompany] || [];
    
    console.log('Displaying organizations for company:', currentCompany);
    console.log('Organizations found:', companyOrgs);
    
    if (companyOrgs.length === 0) {
        organizationsList.innerHTML = '<p class="no-items">No organizations added yet. Add organizations above.</p>';
        return;
    }
    
    // Display organizations
    organizationsList.innerHTML = companyOrgs.map((org, index) => `
        <div class="item-card">
            <div class="item-info">
                <h4>${org}</h4>
            </div>
            <div class="item-actions">
                <button onclick="deleteOrganization(${index}, '${org}')" class="btn btn-sm btn-danger">
                    <i class="fas fa-trash"></i> Delete
                </button>
            </div>
        </div>
    `).join('');
}

function deleteOrganization(index, orgName) {
    if (!confirm(`Are you sure you want to delete "${orgName}"?`)) {
        return;
    }
    
    const companyOrgs = organizations[currentCompany];
    if (companyOrgs && companyOrgs.length > index) {
        companyOrgs.splice(index, 1);
        saveToLocalStorage('organizations', organizations);
        displayOrganizations();
        showNotification(`Organization "${orgName}" deleted successfully`, 'success');
    }
}

function openUploadModal() {
    document.getElementById('uploadModal').style.display = 'block';
    
    // Setup file input handler
    const fileInput = document.getElementById('fileInput');
    if (fileInput) {
        fileInput.onchange = handleFileUpload;
    }
    
    // Setup drag and drop
    const uploadArea = document.getElementById('uploadArea');
    if (uploadArea) {
        uploadArea.ondragover = (e) => e.preventDefault();
        uploadArea.ondrop = handleFileDrop;
    }
}

function closeUploadModal() {
    document.getElementById('uploadModal').style.display = 'none';
    clearUploadArea();
    
    // Keep admin dashboard open if it was open
    const adminModal = document.getElementById('adminModal');
    if (adminModal && adminModal.style.display !== 'none') {
        console.log('Admin dashboard is open, keeping it visible');
        // Already open, do nothing
        return;
    }
}

function handleFileUpload(event) {
    console.log('handleFileUpload called', event);
    const files = event.target.files;
    console.log('Files selected:', files);
    if (files && files.length > 0) {
        console.log('Processing files:', files.length, 'files');
        processFiles(files);
    } else {
        console.log('No files selected');
    }
}

function handleFileDrop(event) {
    event.preventDefault();
    const files = event.dataTransfer.files;
    
    // Update file input for consistency
    const fileInput = document.getElementById('fileInput');
    if (fileInput) {
        fileInput.files = files;
    }
    
    processFiles(files);
}

async function processFiles(files) {
    console.log('processFiles called with:', files);
    if (!files || files.length === 0) {
        console.log('No files provided to processFiles');
        return;
    }
    
    console.log('Processing', files.length, 'files');
    
    // Show loading overlay
    showN8nLoadingOverlay(files.length);
    
    // Show uploaded files
    const uploadedFiles = document.getElementById('uploadedFiles');
    const fileList = document.getElementById('fileList');
    
    console.log('Upload elements found:', { uploadedFiles, fileList });
    
    if (uploadedFiles && fileList) {
        uploadedFiles.style.display = 'block';
        fileList.innerHTML = '';
        
        const fileCards = [];
        Array.from(files).forEach((file, index) => {
            const fileCard = document.createElement('div');
            fileCard.className = 'file-card';
            fileCard.innerHTML = `
                <div class="file-info">
                    <i class="fas fa-file-pdf"></i>
                    <div>
                        <strong>${file.name}</strong>
                        <p>${formatFileSize(file.size)}</p>
                    </div>
                </div>
                <div class="file-status">
                    <span class="status-badge pending" id="status-${index}">Uploading...</span>
                </div>
            `;
            fileList.appendChild(fileCard);
            fileCards.push({ element: fileCard, index, statusElement: document.getElementById(`status-${index}`) });
        });
        
        // Send each file to webhook
        let completedCount = 0;
        let hasError = false;
        const uploadResults = []; // Store results from n8n
        
        try {
            for (const fileCard of fileCards) {
                const file = files[fileCard.index];
                updateN8nLoadingProgress(completedCount, files.length, file.name);
                const result = await sendFileToWebhook(file, fileCard.statusElement);
                console.log('Received result from webhook:', result);
                // Always add result, even if empty (we'll handle empty responses in display)
                uploadResults.push({
                    file: file,
                    data: result
                });
                console.log('Added to uploadResults. Total results:', uploadResults.length);
                completedCount++;
                updateN8nLoadingProgress(completedCount, files.length, file.name);
            }
        } catch (error) {
            console.error('Error during file upload process:', error);
            hasError = true;
        } finally {
            // Hide loading overlay after all files are uploaded (success or error)
            hideN8nLoadingOverlay();
        }
        
        // Show results after all files are uploaded (always show, even if response was empty)
        console.log('Upload complete. hasError:', hasError, 'uploadResults.length:', uploadResults.length);
        if (!hasError && uploadResults.length > 0) {
            console.log('Displaying upload results:', uploadResults);
            displayUploadResults(uploadResults);
        } else if (!hasError) {
            console.log('No upload results, showing processing status');
            showProcessingStatus();
        } else {
            console.log('Upload had errors');
        }
    }
}

async function sendFileToWebhook(file, statusElement) {
    console.log('sendFileToWebhook called with file:', file.name, 'statusElement:', statusElement);
    const webhookUrl = 'http://localhost:5678/webhook/b501e849-7a23-49d6-9502-66fb14b5a77e';
    
    try {
        // Create FormData for binary file upload (multipart/form-data)
        const formData = new FormData();
        formData.append('file', file); // Binary file data
        formData.append('filename', file.name);
        formData.append('size', file.size.toString());
        formData.append('type', file.type);
        formData.append('company', currentCompany || 'Unknown');
        formData.append('username', currentUser?.username || 'Unknown');
        formData.append('timestamp', new Date().toISOString());
        
        console.log('Sending file to webhook as FormData:', file.name, 'Size:', file.size, 'Type:', file.type, 'URL:', webhookUrl);
        
        // POST request with FormData (multipart/form-data)
        // Browser automatically sets Content-Type with boundary - don't set it manually!
        const response = await fetch(webhookUrl, {
            method: 'POST',
            body: formData
        });
        
        console.log('Waiting for webhook response...');
        console.log('Response status:', response.status, 'OK:', response.ok);
        
        if (response.ok) {
            const responseText = await response.text();
            console.log('File uploaded successfully:', responseText);
            
            let responseData = null;
            
            // Check if response is empty or whitespace
            if (responseText && responseText.trim()) {
                try {
                    // Try to parse as JSON (n8n should return structured data)
                    responseData = JSON.parse(responseText);
                } catch (e) {
                    // If not JSON, treat as plain text
                    responseData = responseText;
                }
            } else {
                // Empty response - create a basic structure so we can still show results
                console.log('Empty response from webhook, creating default structure');
                const cleanFileName = file.name.replace(/\.[^/.]+$/, '').replace(/[()]/g, '').trim();
                responseData = {
                    markdown: `## Purpose\n\nThis document (${file.name}) has been uploaded and processed.\n\n## Content\n\nThe file has been successfully received and is ready for review. Please add the policy content below.\n\n## Scope\n\nAll applicable organizations.\n\n## Policy Statement\n\nTo be completed.\n\n## Procedure\n\nTo be completed.`,
                    policy_title: cleanFileName || 'Untitled Policy',
                    policy_type: 'admin',
                    company: currentCompany || 'Unknown',
                    effective_date: new Date().toISOString().split('T')[0],
                    applies_to: 'All Organizations',
                    author: currentUser?.fullName || currentUser?.username || 'Unknown',
                    version: '1.0'
                };
                console.log('Created default responseData:', responseData);
            }
            
            if (statusElement) {
                statusElement.textContent = 'Uploaded ✓';
                statusElement.className = 'status-badge success';
            }
            
            // Return the response data so it can be processed
            console.log('Returning responseData:', responseData);
            return responseData;
        } else {
            const errorText = await response.text();
            console.error('Upload failed with status:', response.status, 'Response:', errorText);
            throw new Error(`Upload failed with status: ${response.status}`);
        }
    } catch (error) {
        console.error('Webhook upload error:', error);
        console.error('Error details:', error.message, error.stack);
        
        if (statusElement) {
            statusElement.textContent = 'Failed ✗';
            statusElement.className = 'status-badge error';
        }
        
        // Handle CORS error specifically
        let errorMessage = error.message;
        if (error.message.includes('Failed to fetch') || error.message.includes('CORS')) {
            errorMessage = 'Unable to reach webhook server. Please ensure the webhook server is running at http://localhost:5678 and CORS is configured.';
        }
        
        showNotification(`Failed to upload ${file.name}: ${errorMessage}`, 'error');
    }
}

function fileToBase64(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = () => {
            // Remove data URL prefix (e.g., "data:application/pdf;base64,")
            const base64 = reader.result.split(',')[1];
            resolve(base64);
        };
        reader.onerror = error => reject(error);
    });
}

// n8n Loading Overlay Functions
function showN8nLoadingOverlay(totalFiles) {
    const overlay = document.getElementById('n8nLoadingOverlay');
    const loadingTitle = document.getElementById('loadingTitle');
    const loadingMessage = document.getElementById('loadingMessage');
    const loadingProgressBar = document.getElementById('loadingProgressBar');
    const loadingFileName = document.getElementById('loadingFileName');
    
    if (overlay) {
        overlay.style.display = 'flex';
        
        if (loadingTitle) {
            loadingTitle.textContent = totalFiles === 1 ? 'Processing Document...' : `Processing ${totalFiles} Files...`;
        }
        
        if (loadingMessage) {
            loadingMessage.textContent = 'Uploading files and extracting data. Please wait...';
        }
        
        if (loadingProgressBar) {
            loadingProgressBar.style.width = '0%';
        }
        
        if (loadingFileName) {
            loadingFileName.textContent = '';
        }
    }
}

function updateN8nLoadingProgress(completed, total, fileName) {
    const loadingProgressBar = document.getElementById('loadingProgressBar');
    const loadingFileName = document.getElementById('loadingFileName');
    const loadingMessage = document.getElementById('loadingMessage');
    
    if (loadingProgressBar) {
        const percentage = total > 0 ? (completed / total) * 100 : 0;
        loadingProgressBar.style.width = percentage + '%';
    }
    
    if (loadingFileName && fileName) {
        loadingFileName.textContent = `Processing: ${fileName}`;
    }
    
    if (loadingMessage) {
        if (completed < total) {
            loadingMessage.textContent = `Uploading file ${completed + 1} of ${total}...`;
        } else {
            loadingMessage.textContent = 'Finalizing upload...';
        }
    }
}

function hideN8nLoadingOverlay() {
    const overlay = document.getElementById('n8nLoadingOverlay');
    if (overlay) {
        overlay.style.display = 'none';
    }
}

function displayUploadResults(uploadResults) {
    console.log('displayUploadResults called with:', uploadResults);
    
    // Ensure upload modal stays open
    const uploadModal = document.getElementById('uploadModal');
    if (uploadModal) {
        uploadModal.style.display = 'block';
        console.log('Ensuring upload modal is visible');
    }
    
    const uploadedFiles = document.getElementById('uploadedFiles');
    const analysisResults = document.getElementById('analysisResults');
    const analysisContent = document.getElementById('analysisContent');
    
    console.log('Elements found:', {
        uploadModal: !!uploadModal,
        uploadedFiles: !!uploadedFiles,
        analysisResults: !!analysisResults,
        analysisContent: !!analysisContent
    });
    
    if (!analysisResults || !analysisContent) {
        console.error('Missing required elements for displayUploadResults');
        return;
    }
    
    // Hide uploaded files list and show analysis results
    if (uploadedFiles) {
        uploadedFiles.style.display = 'none';
    }
    analysisResults.style.display = 'block';
    
    // Clear previous results but preserve structure
    analysisContent.innerHTML = '';
    
    console.log('Analysis results section made visible');
    console.log(`Processing ${uploadResults.length} upload results, each will get its own card`);
    
    // Process each upload result separately - each gets its own card
    uploadResults.forEach((result, index) => {
        console.log(`Processing result ${index}:`, result);
        const file = result.file;
        const data = result.data;
        
        console.log('File:', file.name);
        console.log('Data type:', typeof data);
        console.log('Data content:', data);
        
        // Parse the response - check if it's the same format as AI generator
        let policyData = null;
        let markdown = null;
        
        console.log('Parsing data. Type:', typeof data, 'IsArray:', Array.isArray(data));
        
        // Handle different response formats from n8n
        if (Array.isArray(data) && data.length > 0) {
            // Check for AI generator format (data[0].markdown)
            if (data[0].markdown) {
                policyData = data[0];
                markdown = policyData.markdown;
                console.log('Found markdown in data[0].markdown');
            }
            // Check for n8n message format (data[0].message.content)
            else if (data[0].message && data[0].message.content) {
                markdown = data[0].message.content;
                policyData = {
                    policy_title: data[0].message.title || file.name.replace(/\.[^/.]+$/, '').replace(/[()]/g, '').trim(),
                    policy_type: data[0].message.type || 'admin',
                    company: data[0].message.company || currentCompany || 'Unknown',
                    effective_date: data[0].message.effective_date || data[0].message.effectiveDate || new Date().toISOString().split('T')[0],
                    applies_to: data[0].message.applies_to || data[0].message.appliesTo || data[0].message.organizations || 'All Organizations',
                    author: data[0].message.author || currentUser?.fullName || currentUser?.username || 'Unknown',
                    version: data[0].message.version || '1.0'
                };
                console.log('Found content in data[0].message.content');
            }
            // Array but no recognized structure - try first element
            else {
                console.log('Array format not recognized, trying first element');
                const firstItem = data[0];
                markdown = firstItem.markdown || firstItem.content || firstItem.text || JSON.stringify(firstItem, null, 2);
                policyData = {
                    policy_title: firstItem.title || firstItem.policy_title || file.name.replace(/\.[^/.]+$/, '').replace(/[()]/g, '').trim(),
                    policy_type: firstItem.type || firstItem.policy_type || 'admin',
                    company: firstItem.company || currentCompany || 'Unknown',
                    effective_date: firstItem.effective_date || firstItem.effectiveDate || new Date().toISOString().split('T')[0],
                    applies_to: firstItem.applies_to || firstItem.appliesTo || firstItem.organizations || 'All Organizations',
                    author: firstItem.author || currentUser?.fullName || currentUser?.username || 'Unknown',
                    version: firstItem.version || '1.0'
                };
            }
        } else if (data.markdown) {
            // Single object with markdown
            policyData = data;
            markdown = data.markdown;
            console.log('Found markdown in data.markdown');
        } else if (typeof data === 'string') {
            // Plain markdown string
            markdown = data;
            policyData = {
                policy_title: file.name.replace(/\.[^/.]+$/, '').replace(/[()]/g, '').trim(),
                policy_type: 'admin',
                company: currentCompany || 'Unknown',
                effective_date: new Date().toISOString().split('T')[0],
                applies_to: 'All Organizations',
                author: currentUser?.fullName || currentUser?.username || 'Unknown',
                version: '1.0'
            };
            console.log('Data is string, treating as markdown');
        } else if (typeof data === 'object') {
            // Try to extract markdown from various possible structures
            markdown = data.markdown || data.content || data.text || data.message?.content || JSON.stringify(data, null, 2);
            policyData = {
                policy_title: data.title || data.policy_title || file.name.replace(/\.[^/.]+$/, '').replace(/[()]/g, '').trim(),
                policy_type: data.type || data.policy_type || 'admin',
                company: data.company || currentCompany || 'Unknown',
                effective_date: data.effective_date || data.effectiveDate || new Date().toISOString().split('T')[0],
                applies_to: data.applies_to || data.appliesTo || data.organizations || 'All Organizations',
                author: data.author || currentUser?.fullName || currentUser?.username || 'Unknown',
                version: data.version || '1.0'
            };
            console.log('Extracted from object structure');
        }
        
        if (!markdown) {
            console.error('No markdown found in data:', data);
            // Fallback: show raw data
            analysisContent.innerHTML += `
                <div class="analysis-item" style="margin-bottom: 30px; padding: 20px; background: white; border-radius: 12px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
                    <h4 style="margin: 0 0 15px 0; color: #333;">
                        <i class="fas fa-file-alt"></i> ${file.name}
                    </h4>
                    <pre style="background: #f5f5f5; padding: 15px; border-radius: 6px; overflow-x: auto;">${JSON.stringify(data, null, 2)}</pre>
                </div>
            `;
            console.log('Showing raw data fallback');
            return;
        }
        
        console.log('Markdown found, length:', markdown.length);
        console.log('Markdown preview:', markdown.substring(0, 200) + '...');
        console.log('Policy data:', policyData);
        
        // Parse markdown into sections
        console.log('Parsing markdown into sections...');
        const sections = parseWebhookPolicyMarkdown(markdown);
        console.log('Parsed sections:', Object.keys(sections));
        console.log('Sections object:', sections);
        
        // Create structured display similar to AI generator
        const policyType = policyData.policy_type || 'admin';
        const typeClass = policyType === 'admin' ? 'admin' : policyType === 'sog' ? 'sog' : 'memo';
        const typeLabel = policyType === 'admin' ? 'Admin Policy' : policyType === 'sog' ? 'SOG' : 'Communication Memo';
        
        console.log('Generating editable sections HTML...');
        const editableSectionsHtml = generateEditablePolicySections(sections);
        console.log('Editable sections HTML length:', editableSectionsHtml.length);
        console.log('Editable sections HTML preview:', editableSectionsHtml.substring(0, 200) + '...');
        
        const resultCard = document.createElement('div');
        resultCard.className = 'upload-policy-result';
        resultCard.id = `uploadPolicyCard-${index}`;
        resultCard.style.cssText = 'margin-bottom: 40px; padding: 25px; background: white; border-radius: 12px; box-shadow: 0 4px 6px rgba(0,0,0,0.1); border: 2px solid #e5e7eb; position: relative;';
        
        // Add a visual separator/header for each uploaded file
        const fileNumber = index + 1;
        const totalFiles = uploadResults.length;
        
        resultCard.innerHTML = `
            <div style="position: absolute; top: -12px; left: 20px; background: #667eea; color: white; padding: 4px 12px; border-radius: 20px; font-size: 0.75rem; font-weight: 700; z-index: 10;">
                Document ${fileNumber} of ${totalFiles}
            </div>
            <div style="margin-top: 10px; margin-bottom: 15px; padding: 10px; background: #f0f0f0; border-radius: 6px; font-size: 0.85rem; color: #666;">
                <i class="fas fa-file-alt"></i> <strong>Source File:</strong> ${file.name}
            </div>
            <div class="policy-preview professional" style="max-width: 100%;">
                <div class="policy-header" style="margin-bottom: 20px; padding-bottom: 15px; border-bottom: 2px solid #e5e7eb;">
                    <div class="form-group" style="margin-bottom: 15px;">
                        <label for="uploadPolicyTitle-${index}" style="display: block; margin-bottom: 5px; font-weight: 600; color: #333;">
                            <i class="fas fa-heading"></i> Policy Title <span style="color: red;">*</span>
                        </label>
                        <input type="text" id="uploadPolicyTitle-${index}" value="${policyData.policy_title || file.name.replace(/\.[^/.]+$/, '')}" required
                               style="width: 100%; padding: 12px; border: 2px solid #ddd; border-radius: 6px; font-size: 1.1rem; font-weight: 600;"
                               placeholder="Enter policy title..." />
                        <small style="color: #666; display: block; margin-top: 5px;">This title is required to save the policy</small>
                    </div>
                    <span class="policy-type-badge ${typeClass}" style="display: inline-block; padding: 6px 12px; background: ${typeClass === 'admin' ? '#e3f2fd' : typeClass === 'sog' ? '#fff3e0' : '#f3e5f5'}; color: ${typeClass === 'admin' ? '#1976d2' : typeClass === 'sog' ? '#f57c00' : '#7b1fa2'}; border-radius: 20px; font-size: 12px; font-weight: 600;">
                        ${typeLabel}
                    </span>
                </div>
                
                <div class="policy-meta" style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 15px; margin-bottom: 20px; padding: 15px; background: #f8f9fa; border-radius: 8px;">
                    <div class="meta-item" style="font-size: 14px;"><strong>Company:</strong> ${policyData.company || currentCompany || 'Unknown'}</div>
                    <div class="meta-item" style="font-size: 14px;"><strong>Effective Date:</strong> ${policyData.effective_date || new Date().toISOString().split('T')[0]}</div>
                    <div class="meta-item" style="font-size: 14px;"><strong>Applies To:</strong> ${policyData.applies_to || 'All Organizations'}</div>
                    <div class="meta-item" style="font-size: 14px;"><strong>Author:</strong> ${policyData.author || currentUser?.fullName || 'Unknown'}</div>
                    <div class="meta-item" style="font-size: 14px;"><strong>Version:</strong> ${policyData.version || '1.0'}</div>
                </div>
                
                <div class="policy-content-display" style="max-height: 600px; overflow-y: auto; margin-bottom: 20px;">
                    ${editableSectionsHtml}
                </div>
                
                <div class="form-group" style="margin-top: 20px; margin-bottom: 20px;">
                    <label for="uploadPolicyCategory-${index}" style="display: block; margin-bottom: 5px; font-weight: 600; color: #333;">
                        <i class="fas fa-tags"></i> Select Category (for policy code generation)
                    </label>
                    <select id="uploadPolicyCategory-${index}" onchange="updateUploadPolicyCode(${index})" style="width: 100%; padding: 12px; border: 2px solid #ddd; border-radius: 6px; font-size: 1rem;">
                        <option value="">No Category (optional)</option>
                    </select>
                    <small style="color: #666; display: block; margin-top: 5px;">Policy code will be generated in format: Type.Category#.Policy#.Year (e.g., ADMIN.1.2.2025)</small>
                    <div id="uploadPolicyCodeDisplay-${index}" style="display: none; margin-top: 10px; padding: 10px; background: #f0f8ff; border-radius: 6px;">
                        <strong>Policy Code:</strong> <span id="uploadPolicyCodeText-${index}"></span>
                    </div>
                </div>
                
                <div class="upload-result-actions" style="margin-top: 20px; padding-top: 20px; border-top: 2px solid #e5e7eb; display: flex; gap: 10px; justify-content: flex-end;">
                    <button class="btn btn-success" onclick="saveUploadedPolicy(${index}, '${policyType}')">
                        <i class="fas fa-save"></i> Save Policy
                    </button>
                    <button class="btn btn-secondary" onclick="closeUploadModal()">
                        <i class="fas fa-times"></i> Close
                    </button>
                </div>
            </div>
            
            <!-- AI Edit Section - appears after policy is fully processed -->
            <div class="ai-edit-section" id="aiEditSection-${index}" style="margin-top: 30px; padding: 20px; background: linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%); border-radius: 8px; border: 2px solid #667eea; box-shadow: 0 2px 8px rgba(102, 126, 234, 0.1);">
                <label style="display: block; margin-bottom: 12px; font-weight: 700; color: #333; font-size: 1.1rem;">
                    <i class="fas fa-robot" style="color: #667eea;"></i> Ask AI to Edit This Policy
                </label>
                <p style="margin: 0 0 12px 0; color: #666; font-size: 0.9rem;">
                    Request changes to the policy content, structure, or language. The AI will update the policy sections accordingly.
                </p>
                <div style="display: flex; gap: 10px; align-items: center;">
                    <input type="text" id="aiEditInput-${index}" placeholder="E.g., Make it more detailed, add compliance section, simplify language, expand the procedures section..." 
                           style="flex: 1; padding: 12px 15px; border: 2px solid #ddd; border-radius: 6px; font-size: 0.95rem; transition: border-color 0.3s;"
                           onkeypress="if(event.key === 'Enter') sendAIEditRequest(${index})"
                           onfocus="this.style.borderColor='#667eea'"
                           onblur="this.style.borderColor='#ddd'">
                    <button class="btn btn-primary" onclick="sendAIEditRequest(${index})" 
                            style="white-space: nowrap; padding: 12px 20px; background: #667eea; border: none; border-radius: 6px; color: white; font-weight: 600; cursor: pointer; transition: background 0.3s;"
                            onmouseover="this.style.background='#5568d3'"
                            onmouseout="this.style.background='#667eea'">
                        <i class="fas fa-paper-plane"></i> Send to AI
                    </button>
                </div>
                <div id="aiEditStatus-${index}" style="margin-top: 12px; display: none; padding: 10px; border-radius: 6px;"></div>
            </div>
        `;
        
        try {
            analysisContent.appendChild(resultCard);
            console.log(`Result card ${index} appended to analysisContent`);
            console.log(`analysisContent now has ${analysisContent.children.length} children`);
            console.log(`analysisContent.innerHTML length: ${analysisContent.innerHTML.length}`);
            
            // Verify AI edit section was included
            const aiEditSection = document.getElementById(`aiEditSection-${index}`);
            if (aiEditSection) {
                console.log(`✅ AI edit section found for index ${index}`);
            } else {
                console.warn(`⚠️ AI edit section NOT found for index ${index}`);
            }
        } catch (error) {
            console.error(`Error appending result card ${index}:`, error);
        }
        
        // Populate category dropdown after HTML is rendered
        setTimeout(() => {
            populateUploadCategoryDropdown(index);
            console.log(`Category dropdown ${index} populated`);
            
            // Double-check AI edit section is visible after rendering
            const aiEditSection = document.getElementById(`aiEditSection-${index}`);
            if (aiEditSection) {
                console.log(`✅ AI edit section verified visible for index ${index}`);
                aiEditSection.style.display = 'block'; // Force display
            }
        }, 100);
    });
    
    // Store the upload results for saving
    window.currentUploadResults = uploadResults;
    
    // Show and populate the global AI edit section
    const globalAIEditSection = document.getElementById('globalAIEditSection');
    const globalAIPolicyIndex = document.getElementById('globalAIPolicyIndex');
    
    if (globalAIEditSection && globalAIPolicyIndex && uploadResults.length > 0) {
        globalAIEditSection.style.display = 'block';
        
        // Clear existing options (except the first one)
        globalAIPolicyIndex.innerHTML = '<option value="">Select Policy...</option>';
        
        // Populate with all uploaded policies
        uploadResults.forEach((result, idx) => {
            const fileName = result.file?.name || `Policy ${idx + 1}`;
            const cleanFileName = fileName.replace(/\.[^/.]+$/, '');
            const option = document.createElement('option');
            option.value = idx;
            option.textContent = `${idx + 1}. ${cleanFileName}`;
            globalAIPolicyIndex.appendChild(option);
        });
        
        console.log(`✅ Global AI edit section populated with ${uploadResults.length} policies`);
    } else if (uploadResults.length === 1) {
        // Hide global section if only one file - use individual card's AI section instead
        if (globalAIEditSection) {
            globalAIEditSection.style.display = 'none';
        }
    }
    
    console.log('displayUploadResults completed. Total cards:', uploadResults.length);
    console.log('analysisContent final state:', {
        display: analysisResults.style.display,
        innerHTMLLength: analysisContent.innerHTML.length,
        childrenCount: analysisContent.children.length
    });
    
    // Force a scroll to the results if modal is visible
    if (uploadModal && uploadModal.style.display !== 'none') {
        setTimeout(() => {
            analysisResults.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
        }, 300);
    }
}

function populateUploadCategoryDropdown(index) {
    loadCategories();
    const select = document.getElementById(`uploadPolicyCategory-${index}`);
    if (!select) return;
    
    select.innerHTML = '<option value="">No Category (optional)</option>';
    categories.forEach(category => {
        const option = document.createElement('option');
        option.value = category.id;
        option.textContent = `${category.number} - ${category.name}`;
        select.appendChild(option);
    });
}

function updateUploadPolicyCode(index) {
    const categoryId = document.getElementById(`uploadPolicyCategory-${index}`)?.value;
    const codeDisplay = document.getElementById(`uploadPolicyCodeDisplay-${index}`);
    const codeText = document.getElementById(`uploadPolicyCodeText-${index}`);
    
    // Get policy type from the stored upload result
    const uploadResults = window.currentUploadResults;
    if (!uploadResults || !uploadResults[index]) return;
    
    const result = uploadResults[index];
    const policyType = result.data?.policy_type || result.data?.type || 'admin';
    
    if (categoryId && codeDisplay && codeText) {
        loadCategories();
        const category = categories.find(cat => cat.id === parseInt(categoryId) || cat.id === categoryId);
        if (category) {
            const policies = loadCompanyPolicies();
            const categoryPolicies = policies.filter(p => (p.categoryId === parseInt(categoryId) || p.categoryId === categoryId) && p.policyCode && p.type === policyType);
            const policyNumber = categoryPolicies.length + 1;
            const currentYear = new Date().getFullYear();
            
            const typeCodes = {
                'admin': 'ADMIN',
                'sog': 'SOG',
                'memo': 'MEMO',
                'protocol': 'PROTO',
                'proto': 'PROTO'
            };
            const typeCode = typeCodes[policyType?.toLowerCase()] || 'ADMIN';
            
            const code = `${typeCode}.${category.number}.${policyNumber}.${currentYear}`;
            
            codeText.textContent = code;
            codeDisplay.style.display = 'block';
        }
    } else if (codeDisplay) {
        codeDisplay.style.display = 'none';
    }
}
function saveUploadedPolicy(index, policyType) {
    const uploadResults = window.currentUploadResults;
    
    if (!uploadResults || !uploadResults[index]) {
        showNotification('No policy data to save', 'error');
        return;
    }
    
    // Get the policy title from the input field
    const titleInput = document.getElementById(`uploadPolicyTitle-${index}`);
    if (!titleInput) {
        showNotification('Title input field not found', 'error');
        return;
    }
    
    const policyTitle = titleInput.value.trim();
    if (!policyTitle) {
        showNotification('Please enter a policy title before saving', 'error');
        titleInput.focus();
        titleInput.style.borderColor = '#ef4444';
        return;
    }
    
    // Get selected category
    const categoryId = document.getElementById(`uploadPolicyCategory-${index}`)?.value || null;
    
    // Get the result data
    const result = uploadResults[index];
    const data = result.data;
    
    // Parse the policy data
    let policyData = null;
    let markdown = null;
    
    if (Array.isArray(data) && data.length > 0 && data[0].markdown) {
        policyData = data[0];
        markdown = policyData.markdown;
    } else if (data.markdown) {
        policyData = data;
        markdown = data.markdown;
    } else if (typeof data === 'string') {
        markdown = data;
        policyData = {
            policy_type: policyType,
            company: currentCompany || 'Unknown',
            effective_date: new Date().toISOString().split('T')[0],
            applies_to: 'All Organizations',
            author: currentUser?.fullName || currentUser?.username || 'Unknown',
            version: '1.0'
        };
    } else if (typeof data === 'object') {
        markdown = data.markdown || data.content || data.text || '';
        policyData = {
            policy_title: data.title || data.policy_title || policyTitle,
            policy_type: data.type || data.policy_type || policyType,
            company: data.company || currentCompany || 'Unknown',
            effective_date: data.effective_date || data.effectiveDate || new Date().toISOString().split('T')[0],
            applies_to: data.applies_to || data.appliesTo || data.organizations || 'All Organizations',
            author: data.author || currentUser?.fullName || currentUser?.username || 'Unknown',
            version: data.version || '1.0'
        };
    }
    
    // Create policy object
    const tempId = 'policy_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
    
    // Generate policy code if category is selected
    const policyCode = categoryId ? generatePolicyCode(categoryId, tempId, policyType) : null;
    
    const newPolicy = {
        id: tempId,
        title: policyTitle,
        type: policyType,
        clinics: policyData.applies_to || 'All Organizations',
        clinicNames: policyData.applies_to || 'All Organizations',
        content: markdown || '',
        description: policyTitle,
        effectiveDate: policyData.effective_date || new Date().toISOString().split('T')[0],
        version: policyData.version || '1.0',
        approvedBy: policyData.approved_by || policyData.author || 'Administrator',
        company: currentCompany,
        created: new Date().toISOString().split('T')[0],
        lastModified: new Date().toISOString().split('T')[0],
        generatedBy: 'File Upload',
        categoryId: categoryId,
        policyCode: policyCode
    };
    
    // Save the policy
    if (!currentCompany) {
        showNotification('Please log in first', 'error');
        return;
    }
    
    const companyPolicies = loadCompanyPolicies();
    companyPolicies.push(newPolicy);
    localStorage.setItem(`policies_${currentCompany}`, JSON.stringify(companyPolicies));
    
    showNotification('Policy saved successfully!', 'success');
    
    // Add notification to notification center
    const uploadedPolicyTitle = policyTitle || policyData.policy_title || 'Uploaded Policy';
    addNotification(`New policy "${uploadedPolicyTitle}" has been uploaded and saved`, 'success');
    
    // Refresh policies display if available
    if (typeof loadPoliciesFromStorage === 'function') {
        loadPoliciesFromStorage();
        displayPolicies(companyPolicies);
    }
    
    // Close upload modal
    closeUploadModal();
}

function showProcessingStatus() {
    const processingStatus = document.getElementById('processingStatus');
    const uploadedFiles = document.getElementById('uploadedFiles');
    const analysisResults = document.getElementById('analysisResults');
    
    if (processingStatus) {
        processingStatus.style.display = 'block';
    }
    if (uploadedFiles) {
        uploadedFiles.style.display = 'none';
    }
    if (analysisResults) {
        analysisResults.style.display = 'none';
    }
    
    // Simulate processing
    setTimeout(() => {
        if (processingStatus) processingStatus.style.display = 'none';
        if (uploadedFiles) uploadedFiles.style.display = 'block';
        if (analysisResults) analysisResults.style.display = 'block';
        
        const analysisContent = document.getElementById('analysisContent');
        if (analysisContent) {
            analysisContent.innerHTML = `
                <div class="analysis-item success">
                    <i class="fas fa-check-circle"></i>
                    <div>
                        <strong>Documents processed successfully</strong>
                        <p>AI analysis complete. You can now view and manage these policies in the policy management section.</p>
                    </div>
                </div>
            `;
        }
        
        showNotification('Documents uploaded and processed successfully', 'success');
    }, 2000);
}

async function sendAIEditRequest(index) {
    // Check if using global input (from bottom section) or individual input
    const globalInput = document.getElementById('globalAIEditInput');
    const globalIndexSelect = document.getElementById('globalAIPolicyIndex');
    const individualInput = document.getElementById(`aiEditInput-${index}`);
    
    let editInput, editPrompt, statusDiv;
    
    // If using global section, use that index and input
    if (globalIndexSelect && globalIndexSelect.value !== '' && parseInt(globalIndexSelect.value) === index) {
        editInput = globalInput;
        editPrompt = globalInput?.value.trim();
        statusDiv = document.getElementById('globalAIEditStatus');
    } else if (individualInput && individualInput.value.trim()) {
        // Use individual input from the policy card
        editInput = individualInput;
        editPrompt = individualInput.value.trim();
        statusDiv = document.getElementById(`aiEditStatus-${index}`);
    } else if (globalInput && globalInput.value.trim() && globalIndexSelect && globalIndexSelect.value !== '') {
        // Use global input but override index with selected one
        const selectedIndex = parseInt(globalIndexSelect.value);
        if (selectedIndex !== index) {
            // Call with the correct index
            return sendAIEditRequest(selectedIndex);
        }
        editInput = globalInput;
        editPrompt = globalInput.value.trim();
        statusDiv = document.getElementById('globalAIEditStatus');
    } else {
        showNotification('Please enter an edit request', 'error');
        return;
    }
    
    if (!editPrompt) {
        showNotification('Please enter an edit request', 'error');
        return;
    }
    
    if (!statusDiv) {
        // Fallback to global status if individual not found
        statusDiv = document.getElementById('globalAIEditStatus') || document.getElementById(`aiEditStatus-${index}`);
        if (!statusDiv) {
            console.error(`Status div not found for index ${index}`);
            return;
        }
    }
    
    // Get the uploaded policy data
    const uploadResults = window.currentUploadResults;
    if (!uploadResults || !uploadResults[index]) {
        showNotification('Policy data not found', 'error');
        return;
    }
    
    const result = uploadResults[index];
    const data = result.data;
    
    // Extract current policy content from the card
    const resultCard = document.getElementById(`uploadPolicyCard-${index}`);
    let currentPolicyText = '';
    
    // First try to get the full markdown from stored data
    if (data.markdown) {
        currentPolicyText = data.markdown;
    } else if (resultCard) {
        // Fallback: Extract text from all policy sections in the card
        const sections = resultCard.querySelectorAll('.policy-section');
        if (sections.length > 0) {
            currentPolicyText = Array.from(sections).map(section => {
                const title = section.querySelector('h5')?.textContent || '';
                const content = section.querySelector('.policy-content')?.textContent || section.querySelector('.editable-content')?.textContent || '';
                return `${title}\n${content}`;
            }).join('\n\n');
        }
        
        // Also try to get title and metadata
        const titleInput = document.getElementById(`uploadPolicyTitle-${index}`);
        if (titleInput && titleInput.value) {
            currentPolicyText = `Title: ${titleInput.value}\n\n${currentPolicyText}`;
        }
    }
    
    // Limit to reasonable size for webhook (but try to preserve more content)
    if (currentPolicyText.length > 3000) {
        currentPolicyText = currentPolicyText.substring(0, 3000) + '...';
    }
    
    // Show loading state
    statusDiv.style.display = 'block';
    statusDiv.innerHTML = '<div style="color: #667eea;"><i class="fas fa-spinner fa-spin"></i> AI is processing your edit request...</div>';
    if (editInput) editInput.disabled = true;
    
    try {
        // Get webhook URL (same as AI generator)
        const webhookUrl = localStorage.getItem('webhookUrlAI') || 'http://localhost:5678/webhook/05da961e-9df0-490e-815f-92d8bc9f9c1e';
        
        // Prepare the edit request data - send more content for better context
        const editData = {
            conversationHistory: JSON.stringify([{ role: 'user', content: editPrompt }]),
            currentPolicyText: currentPolicyText.substring(0, 2000), // Increased from 500 to 2000 for better context
            newPrompt: editPrompt,
            company: currentCompany || 'Unknown',
            username: currentUser?.username || 'Unknown',
            tool: 'upload-edit'
        };
        
        // Use GET method with URL parameters (same as follow-up prompt)
        const params = new URLSearchParams(editData);
        const response = await fetch(`${webhookUrl}?${params.toString()}`);
        
        if (response.ok) {
            const webhookResponse = await response.text();
            console.log('AI edit webhook response:', webhookResponse);
            
            // Parse the response
            let responseData = null;
            try {
                responseData = JSON.parse(webhookResponse);
            } catch (e) {
                responseData = webhookResponse;
            }
            
            // If we got a policy response, update the card
            if (responseData && Array.isArray(responseData) && responseData.length > 0 && responseData[0].markdown) {
                const updatedPolicy = responseData[0];
                
                // Update the stored result data
                uploadResults[index].data = updatedPolicy;
                
                // Parse and regenerate the card with updated content
                const sections = parseWebhookPolicyMarkdown(updatedPolicy.markdown);
                const editableSectionsHtml = generateEditablePolicySections(sections);
                
                // Update the policy content in the card
                const policyContentDisplay = resultCard?.querySelector('.policy-content-display');
                if (policyContentDisplay) {
                    policyContentDisplay.innerHTML = editableSectionsHtml;
                }
                
                // Also update the title if it changed
                const titleInput = document.getElementById(`uploadPolicyTitle-${index}`);
                if (titleInput && updatedPolicy.policy_title) {
                    titleInput.value = updatedPolicy.policy_title;
                }
                
                // Use different status messages for global vs individual
                const isGlobal = statusDiv.id === 'globalAIEditStatus';
                if (isGlobal) {
                    statusDiv.innerHTML = '<div style="color: #10b981; padding: 12px; background: #d1fae5; border-radius: 6px;"><i class="fas fa-check-circle"></i> <strong>Policy updated successfully!</strong> Scroll up to see the changes.</div>';
                    statusDiv.style.display = 'block';
                } else {
                    statusDiv.innerHTML = '<div style="color: #10b981; padding: 12px; background: #d1fae5; border-radius: 6px;"><i class="fas fa-check-circle"></i> <strong>Policy updated successfully!</strong> The policy sections have been refreshed with your requested changes.</div>';
                    statusDiv.style.display = 'block';
                }
                showNotification('Policy updated successfully!', 'success');
                
                // Scroll to the updated content
                setTimeout(() => {
                    if (policyContentDisplay) {
                        policyContentDisplay.scrollIntoView({ behavior: 'smooth', block: 'start' });
                    }
                }, 300);
                
                // Clear the input
                if (editInput) {
                    editInput.value = '';
                    editInput.disabled = false;
                }
            } else {
                statusDiv.innerHTML = '<div style="color: #ef4444;"><i class="fas fa-exclamation-circle"></i> Unexpected response format from AI</div>';
                if (editInput) editInput.disabled = false;
            }
        } else {
            throw new Error(`Webhook failed with status: ${response.status}`);
        }
    } catch (error) {
        console.error('AI edit request error:', error);
        statusDiv.innerHTML = `<div style="color: #ef4444;"><i class="fas fa-exclamation-circle"></i> Error: ${error.message}</div>`;
        if (editInput) editInput.disabled = false;
        showNotification('Failed to process edit request', 'error');
    }
}

function clearUploadArea() {
    const fileInput = document.getElementById('fileInput');
    if (fileInput) {
        fileInput.value = '';
    }
    
    const fileList = document.getElementById('fileList');
    if (fileList) {
        fileList.innerHTML = '';
    }
    
    const uploadedFiles = document.getElementById('uploadedFiles');
    if (uploadedFiles) {
        uploadedFiles.style.display = 'none';
    }
    
    const processingStatus = document.getElementById('processingStatus');
    if (processingStatus) {
        processingStatus.style.display = 'none';
    }
    
    const analysisResults = document.getElementById('analysisResults');
    if (analysisResults) {
        analysisResults.style.display = 'none';
    }
    
    // Hide and clear the global AI edit section
    const globalAIEditSection = document.getElementById('globalAIEditSection');
    if (globalAIEditSection) {
        globalAIEditSection.style.display = 'none';
    }
    
    const globalAIPolicyIndex = document.getElementById('globalAIPolicyIndex');
    if (globalAIPolicyIndex) {
        globalAIPolicyIndex.innerHTML = '<option value="">Select Policy...</option>';
    }
    
    const globalAIEditInput = document.getElementById('globalAIEditInput');
    if (globalAIEditInput) {
        globalAIEditInput.value = '';
    }
    
    const globalAIEditStatus = document.getElementById('globalAIEditStatus');
    if (globalAIEditStatus) {
        globalAIEditStatus.style.display = 'none';
        globalAIEditStatus.innerHTML = '';
    }
}

function formatFileSize(bytes) {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round(bytes / Math.pow(k, i)) + ' ' + sizes[i];
}

function formatDate(dateString) {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
    });
}

function showNotification(message, type = 'info') {
    // Create notification element
    const notification = document.createElement('div');
    notification.className = `notification notification-${type}`;
    notification.textContent = message;
    
    // Style the notification
    notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background: ${type === 'success' ? '#10b981' : '#3b82f6'};
        color: white;
        padding: 15px 20px;
        border-radius: 8px;
        box-shadow: 0 4px 6px rgba(0,0,0,0.1);
        z-index: 3000;
        animation: slideIn 0.3s ease-out;
    `;
    
    // Add to page
    document.body.appendChild(notification);
    
    // Remove after 3 seconds
    setTimeout(() => {
        notification.style.animation = 'slideOut 0.3s ease-in';
        setTimeout(() => {
            if (notification.parentNode) {
                notification.parentNode.removeChild(notification);
            }
        }, 300);
    }, 3000);
}

// Add CSS animations for notifications
const style = document.createElement('style');
style.textContent = `
    @keyframes slideIn {
        from {
            transform: translateX(100%);
            opacity: 0;
        }
        to {
            transform: translateX(0);
            opacity: 1;
        }
    }
    
    @keyframes slideOut {
        from {
            transform: translateX(0);
            opacity: 1;
        }
        to {
            transform: translateX(100%);
            opacity: 0;
        }
    }
    
    .no-policies {
        text-align: center;
        padding: 40px;
        color: #6b7280;
        font-size: 1.1rem;
        grid-column: 1 / -1;
    }
`;
document.head.appendChild(style);

// AI Policy Generation Functions
// Duplicate openAIModal function removed - using the more complete version defined later

// Duplicate closeAIModal function removed - using the more complete version defined later

function generateAIPolicy() {
    const topic = document.getElementById('aiPolicyTopic').value;
    const type = document.getElementById('aiPolicyType').value;
    const clinics = Array.from(document.getElementById('aiClinicApplicability').selectedOptions).map(option => option.value);
    const keyPoints = document.getElementById('aiKeyPoints').value;
    const previousDocuments = document.getElementById('aiPreviousDocuments').value;
    const requirements = document.getElementById('aiAdditionalRequirements').value;

    // Show loading with research simulation
    aiForm.style.display = 'none';
    aiLoading.style.display = 'block';
    aiResult.style.display = 'none';
    
    // Update loading message to show research progress
    const loadingMessages = [
        "AI is researching industry best practices...",
        "Analyzing veterinary care standards...",
        "Reviewing AAHA and AVMA guidelines...",
        "Incorporating key points and descriptions...",
        "Reviewing previous documents and references...",
        "Incorporating CSI-specific requirements...",
        "Generating comprehensive policy content..."
    ];
    
    let messageIndex = 0;
    const messageInterval = setInterval(() => {
        const loadingText = document.querySelector('.ai-loading p');
        if (loadingText && messageIndex < loadingMessages.length) {
            loadingText.textContent = loadingMessages[messageIndex];
            messageIndex++;
        }
    }, 400);

    // Simulate AI research and generation (in a real app, this would call an AI API)
    setTimeout(() => {
        clearInterval(messageInterval);
        const generatedPolicy = generatePolicyContent(topic, type, clinics, requirements, keyPoints, previousDocuments);
        displayAIPolicy(generatedPolicy);
    }, 2800);
}

function generatePolicyContent(topic, type, clinics, requirements, keyPoints = '', previousDocuments = '') {
    const clinicNames = getClinicNames(clinics).join(', ');
    const typeLabel = getTypeLabel(type);
    const currentDate = new Date().toISOString().split('T')[0];
    
    // Generate comprehensive, topic-specific policy content with proper CSI headers
    const policyContent = generateCSIPolicyWithHeaders(topic, type, requirements, currentDate, keyPoints, previousDocuments);
    
    return {
        ...policyContent,
        type: type,
        clinics: clinics,
        additionalRequirements: requirements,
        keyPoints: keyPoints,
        previousDocuments: previousDocuments,
        clinicNames: clinicNames,
        typeLabel: typeLabel
    };
}

// NEW: Generate policies with proper CSI headers and filled content
function generateCSIPolicyWithHeaders(topic, type, requirements, currentDate, keyPoints = '', previousDocuments = '') {
    if (type === 'admin') {
        return {
            title: `${topic} Admin Policy`,
            // LEVEL 1 - ADMIN POLICY HEADERS
            effectiveDate: currentDate,
            lastReviewed: currentDate,
            approvedBy: "CSI Clinical Director",
            version: "1.0",
            purpose: generatePurpose(topic, type, keyPoints, previousDocuments),
            scope: generateScope(topic, type, requirements),
            policyStatement: generatePolicyStatement(topic, type),
            definitions: generateDefinitions(topic, type),
            procedure: generateProcedure(topic, type),
            roles: generateRoles(topic, type),
            compliance: generateCompliance(topic, type),
            relatedDocuments: generateRelatedDocuments(topic, type, previousDocuments),
            reviewApproval: generateReviewApproval(topic, type, currentDate)
        };
    } else if (type === 'sog') {
        return {
            title: `${topic} Standard Operating Guidelines`,
            // LEVEL 2 - STANDARD OPERATING GUIDELINE HEADERS
            effectiveDate: currentDate,
            author: "CSI Clinical Staff",
            approvedBy: "CSI Medical Director",
            version: "1.0",
            objective: generateObjective(topic, type),
            principles: generatePrinciples(topic, type),
            procedure: generateProcedure(topic, type),
            definitions: generateDefinitions(topic, type),
            examples: generateExamples(topic, type),
            roles: generateRoles(topic, type),
            escalation: generateEscalation(topic, type),
            review: generateReview(topic, type, currentDate)
        };
    } else {
        return {
            title: `${topic} Communication Memo`,
            // LEVEL 3 - COMMUNICATION MEMO HEADERS
            date: currentDate,
            from: "CSI Management",
            to: "All Staff",
            subject: topic,
            message: generateMessage(topic, type),
            effectivePeriod: generateEffectivePeriod(topic, type, currentDate),
            nextSteps: generateNextSteps(topic, type),
            contact: generateContact(topic, type)
        };
    }
}

// Content generation functions for each CSI header field
function generatePurpose(topic, type, keyPoints = '', previousDocuments = '') {
    const purposes = {
        'fire evacuation': 'This policy establishes comprehensive fire evacuation procedures to ensure the safety of all staff, patients, and clients in the event of a fire emergency. This policy incorporates NFPA (National Fire Protection Association) guidelines and local fire safety regulations.',
        'hand hygiene': 'This policy establishes standardized hand hygiene protocols to prevent the transmission of infectious diseases and maintain a safe, sterile environment for patient care.',
        'patient safety': 'This policy establishes comprehensive patient safety protocols to ensure the highest quality of care and prevent adverse events in our veterinary facilities.',
        'data security': 'This policy establishes data security and privacy protection measures to ensure compliance with HIPAA regulations and protect sensitive patient and client information.',
        'emergency response': 'This policy establishes comprehensive emergency response procedures to ensure rapid, effective response to medical emergencies, natural disasters, and other critical situations.',
        'medication management': 'This policy establishes standardized medication management procedures to ensure safe, accurate, and compliant handling of all pharmaceuticals in our veterinary facilities.',
        'infection control': 'This policy establishes comprehensive infection control protocols to prevent the spread of infectious diseases and maintain a safe environment for patients, staff, and clients.',
        'appointment management': 'This policy establishes standardized appointment scheduling and management procedures to ensure efficient, organized, and client-friendly service delivery.',
        'documentation': 'This policy establishes comprehensive documentation standards to ensure accurate, complete, and compliant medical records and administrative documentation.'
    };
    
    let basePurpose = '';
    const topicLower = topic.toLowerCase();
    for (const key in purposes) {
        if (topicLower.includes(key)) {
            basePurpose = purposes[key];
            break;
        }
    }
    
    if (!basePurpose) {
        basePurpose = `This policy establishes comprehensive guidelines for ${topic.toLowerCase()} to ensure consistent, safe, and effective operations across all clinic locations.`;
    }
    
    // Incorporate key points if provided
    if (keyPoints && keyPoints.trim()) {
        basePurpose += ` Key considerations include: ${keyPoints}.`;
    }
    
    return basePurpose;
}

function generateScope(topic, type, requirements) {
    const scopeText = `This policy applies to all CSI clinic locations (Tudor Glen, River Valley, Rosslyn, UPC) and covers all staff members, contractors, clients, and patients.`;
    
    if (requirements && requirements.trim()) {
        return `${scopeText} ${requirements}`;
    }
    
    return scopeText;
}

function generatePolicyStatement(topic, type) {
    return `CSI clinics will maintain the highest standards of ${topic.toLowerCase()} procedures. All staff must be trained and prepared to execute these protocols in accordance with industry best practices and regulatory requirements.`;
}

function generateDefinitions(topic, type) {
    const definitions = {
        'fire evacuation': 'FIRE ALARM: Audible and visual warning system that activates upon detection of smoke or fire. EVACUATION ROUTE: Designated pathway for safe exit from the building during emergency. ASSEMBLY POINT: Designated safe location outside the building where staff and occupants gather after evacuation. FIRE WARDEN: Designated staff member responsible for coordinating evacuation procedures.',
        'hand hygiene': 'HAND HYGIENE: The process of cleaning hands to remove dirt, debris, and microorganisms. ANTISEPTIC: Chemical agent that kills or inhibits the growth of microorganisms. CONTAMINATION: The presence of harmful microorganisms on surfaces or objects.',
        'patient safety': 'ADVERSE EVENT: An unintended injury or complication resulting from medical care. NEAR MISS: An event that could have resulted in patient harm but was prevented. QUALITY ASSURANCE: Systematic activities to ensure that patient care meets established standards.',
        'data security': 'PHI (Protected Health Information): Individually identifiable health information that is protected under HIPAA. ENCRYPTION: Process of converting data into a secure format. BREACH: Unauthorized access, use, or disclosure of protected health information.',
        'emergency response': 'EMERGENCY: A serious, unexpected situation requiring immediate action. CRISIS: A time of intense difficulty or danger. EMERGENCY COORDINATOR: Designated staff member responsible for coordinating emergency response efforts.',
        'medication management': 'CONTROLLED SUBSTANCE: Medication regulated by the DEA due to potential for abuse. PRESCRIPTION: Written authorization for medication dispensing. DRUG INTERACTION: When one medication affects the action of another medication.',
        'infection control': 'PATHOGEN: Microorganism that can cause disease. DISINFECTION: Process of killing most microorganisms on surfaces. STERILIZATION: Process of killing all microorganisms including spores.',
        'appointment management': 'SCHEDULING: Process of arranging appointments and managing clinic calendar. NO-SHOW: Patient who fails to arrive for scheduled appointment. DOUBLE-BOOKING: Scheduling two appointments at the same time slot.',
        'documentation': 'MEDICAL RECORD: Comprehensive documentation of patient care. CHARTING: Process of recording patient information and care provided. AUDIT TRAIL: Record of all access and modifications to patient records.'
    };
    
    const topicLower = topic.toLowerCase();
    for (const key in definitions) {
        if (topicLower.includes(key)) {
            return definitions[key];
        }
    }
    
    return `${topic.toUpperCase()}: Key terms and definitions related to this policy will be established by the clinical team and updated as needed.`;
}

function generateProcedure(topic, type) {
    const procedures = {
        'fire evacuation': `FIRE EVACUATION PROCEDURES:

1. IMMEDIATE RESPONSE (0-30 seconds):
   - Upon hearing fire alarm or seeing fire/smoke, immediately activate manual fire alarm if not already activated
   - Call 911 from a safe location and provide exact address and nature of emergency
   - Announce "FIRE EMERGENCY - EVACUATE NOW" throughout the facility
   - Begin immediate evacuation of all personnel and patients

2. EVACUATION PROTOCOL (30 seconds - 5 minutes):
   - Fire Wardens take control of evacuation procedures
   - Direct all occupants to nearest safe exit route
   - Check all rooms and areas to ensure complete evacuation
   - Assist mobility-impaired individuals and patients
   - Close all doors behind you to slow fire spread
   - Do not use elevators - use stairs only

3. PATIENT EVACUATION PRIORITIES:
   - Critical patients: Evacuate first with medical equipment if possible
   - Non-critical patients: Evacuate using carriers or leashes
   - If patient evacuation is impossible, secure animals in carriers and evacuate
   - Document any patients left behind and their location

4. ASSEMBLY AND ACCOUNTABILITY:
   - Proceed to designated assembly point (parking lot area)
   - Fire Wardens conduct headcount of all staff and occupants
   - Account for all patients and document any missing
   - Do not re-enter building until cleared by fire department
   - Maintain distance from building (minimum 100 feet)

5. POST-EVACUATION PROTOCOL:
   - Notify emergency contacts and management
   - Provide information to fire department upon arrival
   - Document incident details and any injuries
   - Coordinate with emergency services for patient care needs
   - Follow fire department instructions for re-entry`,
        'hand hygiene': `HAND HYGIENE PROCEDURES:

1. HANDWASHING PROTOCOL:
   - Wet hands with clean, running water
   - Apply soap and lather for at least 20 seconds
   - Scrub all surfaces including backs of hands, between fingers, and under nails
   - Rinse thoroughly with clean water
   - Dry with clean towel or air dryer

2. HAND SANITIZER USE:
   - Apply alcohol-based hand sanitizer to palm of one hand
   - Rub hands together covering all surfaces
   - Continue rubbing until hands are dry (approximately 20 seconds)
   - Use only when hands are not visibly soiled

3. TIMING REQUIREMENTS:
   - Before and after patient contact
   - Before and after handling medical equipment
   - After contact with contaminated surfaces
   - Before eating or drinking
   - After using restroom facilities

4. SPECIAL CONSIDERATIONS:
   - Use antimicrobial soap for surgical procedures
   - Remove jewelry before handwashing
   - Keep fingernails short and clean
   - Report any skin irritation or cuts immediately`,
        'patient safety': `PATIENT SAFETY PROCEDURES:

1. PATIENT IDENTIFICATION:
   - Verify patient identity using at least two identifiers
   - Check patient name and date of birth
   - Confirm owner/client information
   - Use identification bands when available

2. MEDICATION SAFETY:
   - Verify medication name, dose, and route
   - Check for allergies and drug interactions
   - Use proper medication administration techniques
   - Document all medications administered

3. PROCEDURE SAFETY:
   - Follow standard operating procedures
   - Use appropriate personal protective equipment
   - Maintain sterile technique when required
   - Monitor patient throughout procedure

4. COMMUNICATION:
   - Use clear, concise communication
   - Repeat back critical information
   - Document all care provided
   - Report any concerns immediately`,
        'data security': `DATA SECURITY PROCEDURES:

1. ACCESS CONTROL:
   - Use unique usernames and strong passwords
   - Log out of systems when not in use
   - Do not share login credentials
   - Report any unauthorized access attempts

2. DATA PROTECTION:
   - Encrypt sensitive data in transit and at rest
   - Use secure networks for data transmission
   - Implement regular data backups
   - Maintain audit trails of data access

3. PHYSICAL SECURITY:
   - Secure workstations when unattended
   - Lock filing cabinets containing patient records
   - Dispose of sensitive documents properly
   - Restrict access to server rooms and data centers

4. INCIDENT RESPONSE:
   - Report security incidents immediately
   - Document all security events
   - Follow breach notification procedures
   - Coordinate with IT security team`,
        'emergency response': `EMERGENCY RESPONSE PROCEDURES:

1. MEDICAL EMERGENCIES:
   - Immediate assessment of patient condition
   - Call 911 for life-threatening emergencies
   - Begin appropriate emergency medical care
   - Notify attending veterinarian immediately
   - Document all emergency interventions
   - Contact client/owner as soon as possible

2. FIRE EMERGENCIES:
   - Activate fire alarm system
   - Evacuate all personnel and patients
   - Call 911 from safe location
   - Account for all staff and patients
   - Follow established evacuation routes
   - Do not re-enter building until cleared by fire department
3. SEVERE WEATHER:
   - Monitor weather alerts and warnings
   - Secure outdoor equipment and supplies
   - Move patients to safe interior locations
   - Close clinic if severe weather warning issued
   - Maintain emergency supplies and equipment

4. POWER OUTAGES:
   - Switch to emergency power if available
   - Prioritize critical patient care equipment
   - Use battery-powered lighting and equipment
   - Contact utility company for updates
   - Implement manual record-keeping procedures

5. SECURITY INCIDENTS:
   - Secure all staff and patients
   - Contact law enforcement if necessary
   - Document incident details
   - Follow lockdown procedures if required
   - Provide support to affected staff and clients`
    };
    
    const topicLower = topic.toLowerCase();
    for (const key in procedures) {
        if (topicLower.includes(key)) {
            return procedures[key];
        }
    }
    
    return `${topic.toUpperCase()} PROCEDURES:

1. INITIAL ASSESSMENT:
   - Evaluate current practices and identify areas for improvement
   - Assess staff knowledge and training needs
   - Review existing protocols and procedures
   - Identify potential risks and safety concerns
   - Establish baseline metrics for performance

2. IMPLEMENTATION PROTOCOLS:
   - Develop standardized procedures for ${topic.toLowerCase()}
   - Provide comprehensive staff training
   - Establish monitoring and quality assurance measures
   - Create documentation and reporting systems
   - Implement continuous improvement processes

3. STAFF RESPONSIBILITIES:
   - Follow established protocols and procedures
   - Participate in training and competency assessments
   - Report any issues or concerns immediately
   - Maintain accurate documentation
   - Support continuous improvement efforts

4. QUALITY ASSURANCE:
   - Regular monitoring of compliance and outcomes
   - Performance metrics tracking and analysis
   - Client and staff feedback collection
   - Regular policy review and updates
   - Benchmarking against industry standards

5. CONTINUOUS IMPROVEMENT:
   - Regular evaluation of policy effectiveness
   - Identification of improvement opportunities
   - Implementation of best practices
   - Staff education and training updates
   - Integration with overall quality management systems`;
}

function generateRoles(topic, type) {
    const roles = {
        'fire evacuation': `FIRE EVACUATION RESPONSIBILITIES:

FIRE WARDENS (Designated staff):
- Coordinate evacuation procedures
- Ensure complete evacuation of assigned areas
- Conduct headcount at assembly point
- Communicate with emergency services
- Maintain evacuation records

ALL STAFF:
- Follow evacuation procedures immediately
- Assist with patient evacuation
- Close doors behind them during evacuation
- Report to assembly point for accountability
- Assist mobility-impaired individuals

CLINIC MANAGER:
- Ensure fire safety equipment is maintained
- Coordinate with fire department
- Provide post-incident support
- Review and update evacuation procedures
- Conduct regular fire drills

EMERGENCY COORDINATOR:
- Activate emergency response procedures
- Communicate with emergency services
- Coordinate staff assignments
- Maintain emergency contact information`,
        'hand hygiene': `HAND HYGIENE RESPONSIBILITIES:

ALL STAFF:
- Follow hand hygiene protocols at all times
- Use appropriate hand hygiene products
- Report any hand hygiene violations
- Participate in hand hygiene training
- Maintain clean, dry hands

SUPERVISORS:
- Monitor hand hygiene compliance
- Provide training and education
- Ensure adequate supplies are available
- Address non-compliance issues
- Support quality improvement initiatives

CLINIC MANAGER:
- Ensure adequate hand hygiene supplies
- Support staff training and development
- Monitor overall compliance rates
- Address systemic barriers to compliance
- Integrate hand hygiene with overall quality management`,
        'patient safety': `PATIENT SAFETY RESPONSIBILITIES:

ALL STAFF:
- Follow patient safety protocols
- Report any safety concerns immediately
- Participate in safety training
- Maintain accurate documentation
- Support continuous improvement efforts

VETERINARY STAFF:
- Ensure safe medication administration
- Follow proper procedure protocols
- Communicate effectively with team
- Monitor patient condition closely
- Document all care provided

CLINIC MANAGER:
- Ensure adequate resources for patient safety
- Support staff training and development
- Monitor overall safety outcomes
- Address systemic safety issues
- Integrate safety with overall clinic operations`,
        'data security': `DATA SECURITY RESPONSIBILITIES:

ALL STAFF:
- Follow data security protocols
- Use secure login credentials
- Report security incidents immediately
- Protect patient and client information
- Participate in security training

IT STAFF:
- Maintain secure systems and networks
- Monitor for security threats
- Provide security training and support
- Implement security updates and patches
- Coordinate incident response

CLINIC MANAGER:
- Ensure adequate security resources
- Support security training and awareness
- Monitor overall security posture
- Address systemic security issues
- Integrate security with overall operations`
    };
    
    const topicLower = topic.toLowerCase();
    for (const key in roles) {
        if (topicLower.includes(key)) {
            return roles[key];
        }
    }
    
    return `${topic.toUpperCase()} RESPONSIBILITIES:

ALL STAFF:
- Follow established protocols and procedures
- Participate in training and competency assessments
- Report any issues or concerns promptly
- Maintain accurate documentation
- Support continuous improvement efforts

SUPERVISORS:
- Ensure staff compliance with protocols
- Provide training and support to staff
- Monitor performance and outcomes
- Address compliance issues promptly
- Support quality improvement initiatives

CLINIC MANAGER:
- Ensure adequate resources for policy implementation
- Support staff training and development
- Monitor overall policy effectiveness
- Address systemic issues and barriers
- Integrate policy with overall clinic operations`;
}

function generateCompliance(topic, type) {
    const compliance = {
        'fire evacuation': `FIRE SAFETY COMPLIANCE:

TRAINING REQUIREMENTS:
- Annual fire safety training for all staff (4 hours)
- Quarterly fire drill exercises
- Fire Warden certification training
- Documentation of all training completion

EQUIPMENT MAINTENANCE:
- Monthly fire alarm system testing
- Quarterly fire extinguisher inspections
- Annual sprinkler system maintenance
- Regular evacuation route inspections

MONITORING AND AUDITS:
- Monthly fire safety equipment checks
- Quarterly evacuation drill evaluations
- Annual fire safety compliance audits
- Continuous improvement based on drill outcomes`,
        'hand hygiene': `HAND HYGIENE COMPLIANCE:

TRAINING REQUIREMENTS:
- Annual hand hygiene training for all staff
- Competency assessments and updates
- Role-specific training for different positions
- Documentation of all training completion

MONITORING:
- Regular compliance audits and observations
- Performance metrics tracking and reporting
- Client and staff satisfaction monitoring
- Incident reporting and investigation

ENFORCEMENT:
- Progressive discipline for non-compliance
- Recognition programs for excellent performance
- Regular policy reviews and updates
- Integration with performance evaluations`,
        'patient safety': `PATIENT SAFETY COMPLIANCE:

TRAINING REQUIREMENTS:
- Annual patient safety training for all staff
- Competency assessments and updates
- Role-specific training for different positions
- Documentation of all training completion

MONITORING:
- Regular safety audits and observations
- Performance metrics tracking and reporting
- Client and staff satisfaction monitoring
- Incident reporting and investigation

ENFORCEMENT:
- Progressive discipline for non-compliance
- Recognition programs for excellent performance
- Regular policy reviews and updates
- Integration with performance evaluations`,
        'data security': `DATA SECURITY COMPLIANCE:

TRAINING REQUIREMENTS:
- Annual data security training for all staff
- Competency assessments and updates
- Role-specific training for different positions
- Documentation of all training completion

MONITORING:
- Regular security audits and assessments
- Performance metrics tracking and reporting
- Incident reporting and investigation
- Compliance monitoring and reporting

ENFORCEMENT:
- Progressive discipline for non-compliance
- Recognition programs for excellent performance
- Regular policy reviews and updates
- Integration with performance evaluations`
    };
    
    const topicLower = topic.toLowerCase();
    for (const key in compliance) {
        if (topicLower.includes(key)) {
            return compliance[key];
        }
    }
    
    return `${topic.toUpperCase()} COMPLIANCE:

TRAINING:
- Initial training for all staff on policy requirements
- Annual competency assessments and updates
- Role-specific training for different staff positions
- Documentation of all training completion
- Ongoing education and skill development

MONITORING:
- Regular audits of policy compliance
- Performance metrics tracking and reporting
- Client and staff satisfaction monitoring
- Incident reporting and investigation
- Quality assurance activities

ENFORCEMENT:
- Progressive discipline for non-compliance
- Recognition programs for excellent performance
- Regular policy reviews and updates
- Integration with performance evaluations
- Continuous improvement planning`;
}

function generateRelatedDocuments(topic, type, previousDocuments = '') {
    const documents = {
        'fire evacuation': 'NFPA 101: Life Safety Code, Local Fire Department Regulations, CSI Emergency Response Plan, CSI Patient Safety Protocols, OSHA Fire Safety Standards',
        'hand hygiene': 'CDC Hand Hygiene Guidelines, OSHA Bloodborne Pathogens Standard, CSI Infection Control Policy, CSI Patient Safety Protocols, AVMA Infection Control Guidelines',
        'patient safety': 'AVMA Patient Safety Guidelines, OSHA Workplace Safety Standards, CSI Quality Assurance Program, CSI Incident Reporting Procedures, Veterinary Practice Standards',
        'data security': 'HIPAA Privacy and Security Rules, AVMA Data Security Guidelines, CSI Privacy Policy, CSI Incident Response Plan, Cybersecurity Best Practices',
        'emergency response': 'CSI Emergency Response Plan, Local Emergency Services Contacts, CSI Patient Safety Protocols, OSHA Emergency Response Standards, Veterinary Emergency Guidelines',
        'medication management': 'DEA Controlled Substances Regulations, AVMA Medication Guidelines, CSI Pharmacy Policy, CSI Patient Safety Protocols, Veterinary Drug Administration Standards',
        'infection control': 'CDC Infection Control Guidelines, OSHA Bloodborne Pathogens Standard, AVMA Infection Control Guidelines, CSI Patient Safety Protocols, Veterinary Practice Standards',
        'appointment management': 'CSI Scheduling Policy, CSI Client Communication Guidelines, CSI Quality Assurance Program, CSI Patient Safety Protocols, Veterinary Practice Standards',
        'documentation': 'AVMA Medical Record Guidelines, HIPAA Documentation Requirements, CSI Quality Assurance Program, CSI Patient Safety Protocols, Veterinary Practice Standards'
    };
    
    let baseDocuments = '';
    const topicLower = topic.toLowerCase();
    for (const key in documents) {
        if (topicLower.includes(key)) {
            baseDocuments = documents[key];
            break;
        }
    }
    
    if (!baseDocuments) {
        baseDocuments = `CSI Quality Assurance Program, CSI Patient Safety Protocols, Veterinary Practice Standards, Industry Best Practices, Regulatory Compliance Guidelines`;
    }
    
    // Incorporate previous documents if provided
    if (previousDocuments && previousDocuments.trim()) {
        baseDocuments += `, ${previousDocuments}`;
    }
    
    return baseDocuments;
}

function generateReviewApproval(topic, type, currentDate) {
    const nextReviewDate = new Date(Date.now() + 365*24*60*60*1000).toISOString().split('T')[0];
    return `Policy reviewed annually by Safety Committee. Updated based on regulatory changes and best practices. Approved by Fire Safety Officer and Clinic Manager. Next review date: ${nextReviewDate}`;
}

function generateObjective(topic, type) {
    return `To establish standardized procedures for ${topic.toLowerCase()} that ensure consistent, safe, and effective operations across all clinic locations.`;
}

function generatePrinciples(topic, type) {
    return `GUIDING PRINCIPLES:
- Safety of all personnel and patients is the top priority
- Compliance with industry standards and regulations is mandatory
- Clear communication and coordination are essential
- Regular training and competency assessments ensure preparedness
- Continuous improvement based on outcomes and feedback`;
}

function generateExamples(topic, type) {
    return `SCENARIOS:

TYPICAL SITUATION:
- Standard procedure implementation
- Routine monitoring and assessment
- Documentation and reporting
- Quality assurance activities
- Continuous improvement planning

EMERGENCY SITUATION:
- Immediate response protocols
- Emergency communication procedures
- Documentation of emergency events
- Post-emergency evaluation
- Policy updates based on lessons learned

SPECIAL CIRCUMSTANCES:
- Non-routine situations requiring adaptation
- Special considerations for specific cases
- Escalation procedures for complex issues
- Documentation of special circumstances
- Policy updates for recurring special cases`;
}

function generateEscalation(topic, type) {
    return `ESCALATION AND SUPPORT:

IMMEDIATE ESCALATION:
- Report critical issues to supervisor immediately
- Contact emergency services if required
- Document all escalation events
- Follow established communication protocols
- Coordinate with appropriate authorities

SUPPORT RESOURCES:
- Clinical supervisor for technical issues
- Management for policy and procedure questions
- IT support for system-related problems
- Emergency services for critical situations
- External consultants for specialized expertise

DOCUMENTATION:
- Document all escalation events
- Maintain records of support provided
- Track resolution times and outcomes
- Identify trends and improvement opportunities
- Update procedures based on escalation experiences`;
}

function generateReview(topic, type, currentDate) {
    const nextReviewDate = new Date(Date.now() + 30*24*60*60*1000).toISOString().split('T')[0];
    return `REVIEW AND REVISION:

MONTHLY REVIEWS:
- Evaluate procedure effectiveness
- Assess staff compliance and performance
- Identify areas for improvement
- Update procedures as needed
- Document all changes and rationale

ANNUAL REVIEW:
- Comprehensive review of all procedures
- Benchmark against industry standards
- Update based on regulatory changes
- Train staff on any modifications
- Integrate with overall quality management

NEXT REVIEW DATE: ${nextReviewDate}`;
}

function generateMessage(topic, type) {
    return `URGENT: ${topic} Policy Update

All CSI clinic staff are required to review and implement updated ${topic.toLowerCase()} procedures effective immediately.

KEY UPDATES:
- New procedures and protocols
- Updated training requirements
- Enhanced monitoring and compliance measures
- New staff assignments and responsibilities

WHAT THIS MEANS FOR STAFF:
- All staff must complete updated training by end of month
- New procedures must be followed exactly
- Regular compliance monitoring will be implemented
- Support and resources are available for implementation

WHAT THIS MEANS FOR CLIENTS:
- Enhanced safety and quality of care
- Improved service delivery and outcomes
- Clear communication about any changes
- Continued commitment to excellence

ACTION REQUIRED:
- Review new procedures in staff handbook
- Complete updated training by month end
- Follow new protocols exactly
- Report any concerns or questions immediately

This memo is effective immediately and supersedes all previous ${topic.toLowerCase()} procedures.`;
}

function generateEffectivePeriod(topic, type, currentDate) {
    const reviewDate = new Date(Date.now() + 30*24*60*60*1000).toISOString().split('T')[0];
    return `Effective Date: ${currentDate}\nReview Date: ${reviewDate}`;
}

function generateNextSteps(topic, type) {
    return `NEXT STEPS:
1. Complete updated training by month end
2. Review new procedures and protocols
3. Implement new monitoring measures
4. Know your responsibilities and assignments
5. Report any concerns or questions immediately`;
}

function generateContact(topic, type) {
    return `CONTACT FOR QUESTIONS:
- Clinical Supervisor: [Contact Information]
- Clinic Manager: [Contact Information]
- Policy Coordinator: [Contact Information]`;
}

function generateComprehensivePolicy(topic, type, requirements) {
    const topicLower = topic.toLowerCase();
    
    // Handle specific topics with detailed, realistic content
    if (topicLower.includes('drop off') || topicLower.includes('dropoff') || topicLower.includes('unattended')) {
        return generateDropOffPolicy(topic, type, requirements);
    } else if (topicLower.includes('hand hygiene') || topicLower.includes('handwashing')) {
        return generateHandHygienePolicy(topic, type, requirements);
    } else if (topicLower.includes('patient safety')) {
        return generatePatientSafetyPolicy(topic, type, requirements);
    } else if (topicLower.includes('data security') || topicLower.includes('hipaa') || topicLower.includes('privacy')) {
        return generateDataSecurityPolicy(topic, type, requirements);
    } else if (topicLower.includes('fire evacuation') || topicLower.includes('fire emergency') || topicLower.includes('fire safety')) {
        return generateFireEvacuationPolicy(topic, type, requirements);
    } else if (topicLower.includes('emergency') || topicLower.includes('crisis')) {
        return generateEmergencyPolicy(topic, type, requirements);
    } else if (topicLower.includes('medication') || topicLower.includes('drug')) {
        return generateMedicationPolicy(topic, type, requirements);
    } else if (topicLower.includes('infection control') || topicLower.includes('infection prevention')) {
        return generateInfectionControlPolicy(topic, type, requirements);
    } else if (topicLower.includes('appointment') || topicLower.includes('scheduling')) {
        return generateAppointmentPolicy(topic, type, requirements);
    } else if (topicLower.includes('documentation') || topicLower.includes('charting') || topicLower.includes('records')) {
        return generateDocumentationPolicy(topic, type, requirements);
    } else {
        return generateGenericPolicy(topic, type, requirements);
    }
}

function generateDropOffPolicy(topic, type, requirements) {
    // Research-based policy incorporating industry best practices
    const currentDate = new Date().toISOString().split('T')[0];
    
    if (type === 'admin') {
        return {
            title: topic,
            purpose: `This administrative policy establishes comprehensive procedures for managing drop-off patients (unattended appointments) to ensure optimal care delivery, patient safety, and efficient clinic operations. This policy addresses the unique challenges and requirements associated with unattended veterinary appointments, incorporating industry best practices from leading veterinary clinics and healthcare facilities.`,
            scope: `This policy applies to all drop-off appointments across all CSI clinic locations (Tudor Glen, River Valley, Rosslyn, UPC) and covers all staff members involved in patient care, client communication, and administrative functions.`,
            policyStatement: `CSI clinics will provide comprehensive care for drop-off patients while maintaining the highest standards of patient safety, client communication, and medical documentation. All drop-off appointments will follow standardized protocols that exceed industry standards for unattended veterinary care.`,
            definitions: `DROP-OFF PATIENT: A patient whose owner/client is not present during the appointment or procedure. UNATTENDED APPOINTMENT: Any veterinary service provided without the client's physical presence. EMERGENCY CONTACT: Primary client contact method for urgent communications during drop-off appointments.`,
            procedure: `IMPLEMENTATION PROCEDURES:

1. PRE-APPOINTMENT PROTOCOL (Based on AAHA Guidelines):
   - Verify patient identity using two identifiers (name and microchip/ID number)
   - Obtain comprehensive written consent for drop-off procedures
   - Collect emergency contact information and preferred communication method
   - Document special instructions, dietary restrictions, and behavioral concerns
   - Provide detailed estimated pick-up time and update procedures
   - Complete pre-anesthesia screening if applicable

2. MEDICAL ASSESSMENT PROTOCOL:
   - Perform comprehensive physical examination within 2 hours of arrival
   - Document all findings using standardized assessment forms
   - Conduct necessary diagnostic tests following clinic protocols
   - Assess patient stress levels using standardized behavioral indicators
   - Monitor vital signs every 4 hours for extended stays
   - Document any signs of distress or complications immediately

3. TREATMENT EXECUTION:
   - Follow established treatment protocols with enhanced documentation
   - Ensure patient comfort using stress reduction techniques (Feliway, calming music)
   - Monitor patient response to treatments every 2 hours
   - Prepare comprehensive discharge instructions with visual aids
   - Document all treatments, medications, and procedures in real-time

4. CLIENT COMMUNICATION PROTOCOL:
   - Contact client within 1 hour of completion for routine procedures
   - Immediate contact for any urgent findings or complications
   - Provide written summary of all procedures performed
   - Schedule follow-up appointments with clear instructions
   - Document all client communications in patient records

5. DISCHARGE PROCESS:
   - Prepare comprehensive discharge summary with photos if applicable
   - Provide written instructions with medication schedules and dosages
   - Schedule follow-up appointments with specific timeframes
   - Ensure client is contacted 30 minutes before pick-up
   - Document discharge time and client pick-up confirmation`,
            roles: `RESPONSIBILITIES:

RECEPTION STAFF:
- Verify drop-off authorization and collect all required information
- Maintain detailed communication log with clients
- Coordinate pick-up scheduling and notifications
- Ensure proper consent documentation

VETERINARY STAFF:
- Perform comprehensive medical assessments and treatments
- Maintain detailed documentation of all procedures
- Monitor patient comfort and stress levels using standardized protocols
- Communicate findings and recommendations to clients
- Ensure compliance with medical standards

TECHNICIANS:
- Assist with patient handling using low-stress techniques
- Support medical procedures and treatments
- Monitor patient vital signs and behavior every 2 hours
- Maintain clean and safe environment
- Document patient care activities

CLINIC MANAGER:
- Ensure compliance with drop-off procedures
- Handle escalated client concerns or complaints
- Monitor staff training and competency
- Review and update procedures based on industry best practices
- Conduct regular audits of drop-off procedures`,
            compliance: `CONSEQUENCES AND ACCOUNTABILITY:

TRAINING REQUIREMENTS:
- All staff must complete drop-off patient management training (8 hours)
- Annual competency assessments required
- Ongoing education on stress reduction techniques
- Documentation of training completion

MONITORING AND AUDITS:
- Monthly review of drop-off patient satisfaction scores
- Quarterly assessment of procedure compliance
- Annual evaluation of policy effectiveness
- Continuous improvement based on client and staff feedback
- Regular review of medical outcomes for drop-off patients

ACCOUNTABILITY MEASURES:
- Progressive discipline for non-compliance
- Recognition programs for excellent performance
- Regular policy updates based on industry standards
- Integration with performance evaluations
- Documentation of any incidents or complications

RELATED DOCUMENTS:
- AAHA Guidelines for Veterinary Practice Management
- AVMA Guidelines for Patient Care
- CSI Patient Safety Protocols
- CSI Client Communication Standards
- CSI Emergency Response Procedures

REVIEW AND APPROVAL:
- Policy reviewed annually by Clinical Director
- Updated based on industry best practices and regulatory changes
- Approved by Medical Director and Clinic Manager
- Next review date: ${new Date(Date.now() + 365*24*60*60*1000).toISOString().split('T')[0]}`
        };
    } else if (type === 'sog') {
        return {
            title: topic,
            objective: `To establish standardized operating guidelines for managing drop-off patients that ensure consistent, high-quality care while maximizing client satisfaction and patient safety.`,
            principles: `GUIDING PRINCIPLES:
- Patient safety and comfort are the highest priorities
- Clear communication with clients is essential
- Documentation must be comprehensive and accurate
- Stress reduction techniques should be employed throughout the visit
- Industry best practices guide all procedures`,
            procedure: `RECOMMENDED APPROACH:

1. RECEPTION PROTOCOL:
   - Use standardized consent forms (available in clinic forms)
   - Collect emergency contact information using designated forms
   - Provide client with written pick-up procedures and contact information
   - Document special instructions in patient record

2. PATIENT CARE PROTOCOL:
   - Place patient in designated drop-off area with comfortable bedding
   - Use stress reduction techniques (Feliway diffusers, calming music)
   - Monitor patient every 2 hours and document behavior
   - Provide appropriate toys or comfort items as needed

3. MEDICAL PROCEDURES:
   - Follow standard treatment protocols with enhanced monitoring
   - Document all findings using standardized forms
   - Take photos of procedures when appropriate for client communication
   - Ensure patient comfort throughout all procedures

4. CLIENT COMMUNICATION:
   - Call client within 1 hour of procedure completion
   - Provide detailed summary of findings and treatments
   - Schedule follow-up appointments as needed
   - Document all communications in patient record`,
            definitions: `DROP-OFF AREA: Designated space for unattended patients with comfortable bedding and stress reduction items. STRESS INDICATORS: Behavioral signs including excessive vocalization, hiding, aggression, or loss of appetite. EMERGENCY PROTOCOL: Immediate client contact for any urgent findings or complications.`,
            examples: `SCENARIOS:

ROUTINE SPAY PROCEDURE:
- Patient dropped off at 8:00 AM
- Procedure completed by 10:00 AM
- Client contacted at 11:00 AM with update
- Patient ready for pick-up at 2:00 PM
- Discharge instructions provided in writing

DIAGNOSTIC WORKUP:
- Patient dropped off for blood work and X-rays
- All tests completed by 12:00 PM
- Client contacted with results and recommendations
- Follow-up appointment scheduled
- Written report provided to client`,
            roles: `RESPONSIBILITIES:

VETERINARY TECHNICIAN:
- Monitor patient comfort and behavior
- Assist with procedures as needed
- Document patient care activities
- Communicate with veterinary staff

RECEPTION STAFF:
- Maintain client communication log
- Coordinate pick-up scheduling
- Ensure proper documentation
- Handle client inquiries

VETERINARIAN:
- Perform medical procedures
- Communicate findings to client
- Ensure proper documentation
- Make treatment recommendations`,
            escalation: `ESCALATION AND SUPPORT:

URGENT FINDINGS:
- Contact client immediately
- Document all communications
- Follow emergency protocols if needed
- Notify clinic manager of situation

CLIENT CONCERNS:
- Address concerns promptly and professionally
- Document all interactions
- Escalate to clinic manager if needed
- Follow up to ensure resolution

STAFF SUPPORT:
- Provide training and resources as needed
- Address questions and concerns promptly
- Regular team meetings to review procedures
- Continuous improvement based on feedback`,
            review: `REVIEW AND REVISION:

MONTHLY REVIEWS:
- Review drop-off procedures and outcomes
- Assess client satisfaction scores
- Identify areas for improvement
- Update procedures as needed

ANNUAL REVIEW:
- Comprehensive review of all procedures
- Benchmark against industry standards
- Update based on new best practices
- Train staff on any changes

NEXT REVIEW DATE: ${new Date(Date.now() + 30*24*60*60*1000).toISOString().split('T')[0]}`
        };
    } else {
        return {
            title: topic,
            message: `IMPORTANT UPDATE: Drop-off Patient Procedures

Effective immediately, all CSI clinic locations will implement enhanced procedures for drop-off patients (unattended appointments) to ensure optimal patient care and client satisfaction.

KEY CHANGES:
- Enhanced client communication protocols
- Improved patient comfort measures
- Standardized documentation procedures
- Updated consent and authorization processes

WHAT THIS MEANS FOR STAFF:
- All staff must complete updated training on drop-off procedures
- New forms and documentation requirements are now in effect
- Enhanced monitoring protocols for unattended patients
- Improved client communication standards

WHAT THIS MEANS FOR CLIENTS:
- Better communication during drop-off appointments
- Enhanced patient comfort and care
- More detailed discharge instructions
- Improved follow-up care coordination

ACTION REQUIRED:
- Review new procedures in staff handbook
- Complete required training by end of month
- Update client information materials
- Ensure compliance with new documentation requirements

CONTACT FOR QUESTIONS:
- Clinical Director: [Contact Information]
- Training Coordinator: [Contact Information]
- Quality Assurance Manager: [Contact Information]

This memo is effective immediately and will be reviewed monthly for updates and improvements.`,
            effectivePeriod: `Effective Date: ${currentDate}\nReview Date: ${new Date(Date.now() + 30*24*60*60*1000).toISOString().split('T')[0]}`,
            nextSteps: `NEXT STEPS:
1. Complete required training on new procedures
2. Update client information materials
3. Implement new documentation protocols
4. Schedule follow-up training sessions
5. Monitor compliance and outcomes`,
            contact: `CONTACT FOR QUESTIONS:
- Clinical Director: [Contact Information]
- Training Coordinator: [Contact Information]
- Quality Assurance Manager: [Contact Information]`
        };
    }
}

function generateHandHygienePolicy(topic, type, requirements) {
    const purpose = `This policy establishes comprehensive hand hygiene protocols to prevent healthcare-associated infections and ensure patient safety across all clinic locations. Proper hand hygiene is the most critical infection prevention measure in healthcare settings.`;
    
    const procedure = `HAND HYGIENE PROCEDURES:

1. HANDWASHING TECHNIQUE:
   - Wet hands with warm water
   - Apply soap and lather for at least 20 seconds
   - Scrub all surfaces: palms, backs, fingers, fingernails, wrists
   - Rinse thoroughly with warm water
   - Dry with clean paper towel or air dryer
   - Use paper towel to turn off faucet

2. ALCOHOL-BASED HAND SANITIZER:
   - Apply sanitizer to palm of one hand
   - Rub hands together covering all surfaces
   - Continue rubbing until hands are dry (approximately 20 seconds)
   - Ensure sanitizer contains at least 60% alcohol
3. WHEN TO PERFORM HAND HYGIENE:
   - Before and after patient contact
   - Before and after wearing gloves
   - After contact with patient environment
   - Before eating or drinking
   - After using restroom
   - Before and after handling medications
   - After contact with contaminated surfaces
   - Before and after handling food

4. GLOVE USE PROTOCOLS:
   - Gloves do not replace hand hygiene
   - Perform hand hygiene before putting on gloves
   - Change gloves between patients
   - Remove gloves carefully to avoid contamination
   - Perform hand hygiene immediately after glove removal`;
    
    const roles = `RESPONSIBILITIES:

ALL STAFF:
- Perform hand hygiene at all required times
- Use proper technique for handwashing and sanitizer
- Report hand hygiene compliance issues
- Participate in training and competency assessments

INFECTION CONTROL COORDINATOR:
- Monitor hand hygiene compliance
- Provide education and training
- Investigate infection control breaches
- Maintain compliance records

SUPERVISORS:
- Ensure staff compliance with protocols
- Provide feedback and coaching
- Support infection control initiatives
- Address non-compliance issues`;
    
    const compliance = `COMPLIANCE REQUIREMENTS:

TRAINING:
- Initial hand hygiene training for all new staff
- Annual competency assessments
- Ongoing education and updates
- Documentation of training completion

MONITORING:
- Regular compliance audits
- Direct observation of hand hygiene practices
- Feedback to staff on compliance rates
- Monthly compliance reporting

ENFORCEMENT:
- Progressive discipline for repeated non-compliance
- Recognition programs for excellent compliance
- Regular policy updates based on best practices
- Integration with performance evaluations`;
    
    return {
        title: topic,
        purpose: purpose,
        procedure: procedure,
        roles: roles,
        compliance: compliance
    };
}

function generatePatientSafetyPolicy(topic, type, requirements) {
    const purpose = `This policy establishes comprehensive patient safety protocols to minimize risks, prevent adverse events, and ensure the highest quality of care delivery across all clinic locations. Patient safety is our top priority in all clinical operations.`;
    
    const procedure = `PATIENT SAFETY PROTOCOLS:

1. PATIENT IDENTIFICATION:
   - Verify patient identity using two identifiers (name and ID number)
   - Confirm correct patient before any procedure
   - Use patient ID bands when available
   - Double-check patient information on all forms and records

2. MEDICATION SAFETY:
   - Verify medication name, dose, route, and timing
   - Check for allergies and contraindications
   - Use standardized medication administration protocols
   - Document all medications given
   - Report any medication errors immediately

3. PROCEDURE SAFETY:
   - Follow standardized protocols for all procedures
   - Use time-out procedures before invasive treatments
   - Verify correct procedure and patient
   - Ensure proper equipment and supplies
   - Monitor patient throughout procedure

4. ENVIRONMENTAL SAFETY:
   - Maintain clean, organized treatment areas
   - Ensure proper lighting and ventilation
   - Keep floors dry and clear of obstacles
   - Store hazardous materials properly
   - Maintain emergency equipment and supplies

5. COMMUNICATION SAFETY:
   - Use clear, standardized communication protocols
   - Document all patient communications
   - Provide written instructions for home care
   - Ensure client understanding of treatments
   - Use interpreter services when needed`;
    
    const roles = `SAFETY RESPONSIBILITIES:

ALL STAFF:
- Follow all safety protocols
- Report safety concerns immediately
- Participate in safety training
- Maintain safe work environment

SAFETY OFFICER:
- Monitor compliance with safety protocols
- Investigate safety incidents
- Provide safety education and training
- Maintain safety records and reports

CLINIC MANAGER:
- Ensure adequate safety resources
- Support safety initiatives
- Address safety concerns promptly
- Review safety performance regularly`;
    
    const compliance = `SAFETY COMPLIANCE:

TRAINING:
- Annual safety training for all staff
- Procedure-specific safety training
- Emergency response training
- Documentation of all training

MONITORING:
- Regular safety audits
- Incident reporting and investigation
- Safety committee meetings
- Performance improvement activities

QUALITY ASSURANCE:
- Regular review of safety metrics
- Benchmarking against industry standards
- Continuous improvement initiatives
- Client satisfaction monitoring`;
    
    return {
        title: topic,
        purpose: purpose,
        procedure: procedure,
        roles: roles,
        compliance: compliance
    };
}

function generateDataSecurityPolicy(topic, type, requirements) {
    const purpose = `This policy establishes comprehensive data security protocols to protect patient information, ensure HIPAA compliance, and maintain the confidentiality, integrity, and availability of all electronic and physical health records.`;
    
    const procedure = `DATA SECURITY PROCEDURES:

1. ACCESS CONTROL:
   - Unique user IDs and strong passwords for all systems
   - Role-based access permissions
   - Regular password updates (every 90 days)
   - Automatic account lockout after failed attempts
   - Multi-factor authentication for sensitive systems

2. WORKSTATION SECURITY:
   - Automatic screen lock after 15 minutes of inactivity
   - Secure workstation placement to prevent unauthorized viewing
   - Regular software updates and security patches
   - Antivirus and anti-malware protection
   - Encrypted hard drives for all workstations

3. DATA TRANSMISSION:
   - Encrypted email for patient information
   - Secure file transfer protocols
   - No patient information in unsecured communications
   - Regular security assessments of transmission methods

4. PHYSICAL SECURITY:
   - Locked filing cabinets for paper records
   - Restricted access to server rooms
   - Secure disposal of sensitive documents
   - Visitor access controls and monitoring

5. INCIDENT RESPONSE:
   - Immediate reporting of security breaches
   - Investigation and documentation of incidents
   - Notification procedures for affected patients
   - Corrective action implementation`;
    
    const roles = `SECURITY RESPONSIBILITIES:

ALL STAFF:
- Follow all security protocols
- Report security incidents immediately
- Complete annual security training
- Protect passwords and access credentials

IT SECURITY OFFICER:
- Monitor security systems and access logs
- Investigate security incidents
- Provide security training and education
- Maintain security documentation

PRIVACY OFFICER:
- Ensure HIPAA compliance
- Handle privacy complaints and breaches
- Provide privacy training
- Maintain privacy documentation`;
    
    const compliance = `SECURITY COMPLIANCE:

TRAINING:
- Annual HIPAA and security training
- Role-specific security training
- Incident response training
- Documentation of training completion

MONITORING:
- Regular security audits and assessments
- Access log reviews
- Vulnerability assessments
- Compliance reporting

ENFORCEMENT:
- Progressive discipline for security violations
- Regular policy updates
- Integration with performance evaluations
- Recognition for security excellence`;
    
    return {
        title: topic,
        purpose: purpose,
        procedure: procedure,
        roles: roles,
        compliance: compliance
    };
}

function generateFireEvacuationPolicy(topic, type, requirements) {
    const currentDate = new Date().toISOString().split('T')[0];
    
    if (type === 'admin') {
        return {
            title: topic,
            purpose: `This policy establishes comprehensive fire evacuation procedures to ensure the safety of all staff, patients, and clients in the event of a fire emergency. This policy incorporates NFPA (National Fire Protection Association) guidelines and local fire safety regulations to provide clear, actionable procedures for fire emergencies.`,
            scope: `This policy applies to all CSI clinic locations (Tudor Glen, River Valley, Rosslyn, UPC) and covers all staff members, contractors, clients, and patients present in the facility during a fire emergency.`,
            policyStatement: `CSI clinics will maintain the highest standards of fire safety and evacuation procedures. All staff must be trained and prepared to execute fire evacuation protocols immediately upon detection of fire or activation of fire alarm systems.`,
            definitions: `FIRE ALARM: Audible and visual warning system that activates upon detection of smoke or fire. EVACUATION ROUTE: Designated pathway for safe exit from the building during emergency. ASSEMBLY POINT: Designated safe location outside the building where staff and occupants gather after evacuation. FIRE WARDEN: Designated staff member responsible for coordinating evacuation procedures.`,
            procedure: `FIRE EVACUATION PROCEDURES:

1. IMMEDIATE RESPONSE (0-30 seconds):
   - Upon hearing fire alarm or seeing fire/smoke, immediately activate manual fire alarm if not already activated
   - Call 911 from a safe location and provide exact address and nature of emergency
   - Announce "FIRE EMERGENCY - EVACUATE NOW" throughout the facility
   - Begin immediate evacuation of all personnel and patients

2. EVACUATION PROTOCOL (30 seconds - 5 minutes):
   - Fire Wardens take control of evacuation procedures
   - Direct all occupants to nearest safe exit route
   - Check all rooms and areas to ensure complete evacuation
   - Assist mobility-impaired individuals and patients
   - Close all doors behind you to slow fire spread
   - Do not use elevators - use stairs only

3. PATIENT EVACUATION PRIORITIES:
   - Critical patients: Evacuate first with medical equipment if possible
   - Non-critical patients: Evacuate using carriers or leashes
   - If patient evacuation is impossible, secure animals in carriers and evacuate
   - Document any patients left behind and their location

4. ASSEMBLY AND ACCOUNTABILITY:
   - Proceed to designated assembly point (parking lot area)
   - Fire Wardens conduct headcount of all staff and occupants
   - Account for all patients and document any missing
   - Do not re-enter building until cleared by fire department
   - Maintain distance from building (minimum 100 feet)

5. POST-EVACUATION PROTOCOL:
   - Notify emergency contacts and management
   - Provide information to fire department upon arrival
   - Document incident details and any injuries
   - Coordinate with emergency services for patient care needs
   - Follow fire department instructions for re-entry`,
            roles: `FIRE EVACUATION RESPONSIBILITIES:

FIRE WARDENS (Designated staff):
- Coordinate evacuation procedures
- Ensure complete evacuation of assigned areas
- Conduct headcount at assembly point
- Communicate with emergency services
- Maintain evacuation records

ALL STAFF:
- Follow evacuation procedures immediately
- Assist with patient evacuation
- Close doors behind them during evacuation
- Report to assembly point for accountability
- Assist mobility-impaired individuals

CLINIC MANAGER:
- Ensure fire safety equipment is maintained
- Coordinate with fire department
- Provide post-incident support
- Review and update evacuation procedures
- Conduct regular fire drills

EMERGENCY COORDINATOR:
- Activate emergency response procedures
- Communicate with emergency services
- Coordinate staff assignments
- Maintain emergency contact information`,
            compliance: `FIRE SAFETY COMPLIANCE:

TRAINING REQUIREMENTS:
- Annual fire safety training for all staff (4 hours)
- Quarterly fire drill exercises
- Fire Warden certification training
- Documentation of all training completion

EQUIPMENT MAINTENANCE:
- Monthly fire alarm system testing
- Quarterly fire extinguisher inspections
- Annual sprinkler system maintenance
- Regular evacuation route inspections

MONITORING AND AUDITS:
- Monthly fire safety equipment checks
- Quarterly evacuation drill evaluations
- Annual fire safety compliance audits
- Continuous improvement based on drill outcomes`,
            relatedDocuments: `NFPA 101: Life Safety Code, Local Fire Department Regulations, CSI Emergency Response Plan, CSI Patient Safety Protocols, OSHA Fire Safety Standards`,
            reviewApproval: `Policy reviewed annually by Safety Committee. Updated based on regulatory changes and best practices. Approved by Fire Safety Officer and Clinic Manager. Next review date: ${new Date(Date.now() + 365*24*60*60*1000).toISOString().split('T')[0]}`
        };
    } else if (type === 'sog') {
        return {
            title: topic,
            objective: `To establish standardized fire evacuation procedures that ensure safe and efficient evacuation of all personnel and patients during fire emergencies.`,
            principles: `GUIDING PRINCIPLES:
- Safety of all personnel and patients is the top priority
- Immediate response to fire alarms is mandatory
- Clear communication and coordination are essential
- Regular training and drills ensure preparedness
- Compliance with fire safety regulations is required`,
            procedure: `RECOMMENDED FIRE EVACUATION APPROACH:

1. ALARM RESPONSE:
   - Immediately stop all activities upon hearing fire alarm
   - Activate manual fire alarm if not already activated
   - Call 911 and provide facility address and emergency details
   - Announce evacuation to all occupants

2. EVACUATION STEPS:
   - Use nearest safe exit route
   - Close doors behind you to contain fire
   - Assist patients using carriers or leashes
   - Check all areas for remaining occupants
   - Proceed to designated assembly point

3. ASSEMBLY POINT PROTOCOL:
   - Gather at designated safe location
   - Conduct headcount of all personnel
   - Account for all patients
   - Wait for fire department clearance
   - Maintain safe distance from building`,
            definitions: `FIRE WARDEN: Staff member designated to coordinate evacuation. ASSEMBLY POINT: Safe location outside building for post-evacuation gathering. EVACUATION ROUTE: Designated pathway for safe exit during emergency.`,
            examples: `SCENARIOS:

FIRE DETECTED IN TREATMENT ROOM:
- Immediately activate fire alarm
- Evacuate all patients from treatment area
- Close treatment room door
- Proceed to assembly point
- Notify fire department of patient count

FIRE ALARM ACTIVATES DURING SURGERY:
- Complete surgery if safe to do so within 2 minutes
- Otherwise, secure patient and evacuate immediately
- Notify fire department of patient location
- Coordinate with emergency services for patient care

EVACUATION DURING BUSINESS HOURS:
- Direct clients to nearest exit
- Evacuate all patients in carriers
- Ensure all staff members are accounted for
- Maintain client communication at assembly point`,
            roles: `RESPONSIBILITIES:

FIRE WARDENS:
- Coordinate evacuation procedures
- Ensure complete building evacuation
- Conduct headcount at assembly point
- Communicate with emergency services

ALL STAFF:
- Follow evacuation procedures immediately
- Assist with patient evacuation
- Report to assembly point
- Assist clients and visitors

VETERINARY STAFF:
- Prioritize patient safety during evacuation
- Coordinate with emergency services for patient care
- Document any patient injuries or concerns
- Provide medical information to emergency responders`,
            escalation: `ESCALATION AND SUPPORT:

FIRE DEPARTMENT ARRIVAL:
- Provide building layout and patient information
- Coordinate patient care with emergency services
- Follow fire department instructions
- Document incident details

INJURIES OR CASUALTIES:
- Provide first aid if safe to do so
- Coordinate with emergency medical services
- Document all injuries and treatments
- Notify management and families

EXTENDED EVACUATION:
- Coordinate with local animal control if needed
- Arrange temporary housing for patients
- Communicate with clients about patient status
- Maintain security of evacuated facility`,
            review: `REVIEW AND REVISION:

MONTHLY REVIEWS:
- Evaluate evacuation drill performance
- Assess staff response times
- Identify areas for improvement
- Update procedures as needed

ANNUAL REVIEW:
- Comprehensive review of all procedures
- Benchmark against industry standards
- Update based on regulatory changes
- Train staff on any modifications

NEXT REVIEW DATE: ${new Date(Date.now() + 30*24*60*60*1000).toISOString().split('T')[0]}`
        };
    } else {
        return {
            title: topic,
            message: `URGENT: Fire Evacuation Procedures Update

All CSI clinic staff are required to review and implement updated fire evacuation procedures effective immediately.

KEY UPDATES:
- New evacuation routes posted in all clinic areas
- Updated assembly point locations
- Enhanced patient evacuation protocols
- New Fire Warden assignments

WHAT THIS MEANS FOR STAFF:
- All staff must complete fire safety training by end of month
- Fire drills will be conducted monthly
- New evacuation procedures must be followed exactly
- Fire Wardens have been designated for each clinic location

WHAT THIS MEANS FOR CLIENTS:
- Clients will be directed to safe exits during emergencies
- Patient safety is our top priority during evacuations
- Clear communication will be maintained throughout emergency
- Follow-up care will be coordinated as needed

ACTION REQUIRED:
- Review new evacuation procedures in staff handbook
- Complete fire safety training by month end
- Participate in monthly fire drills
- Know your designated Fire Warden and assembly point

CONTACT FOR QUESTIONS:
- Fire Safety Coordinator: [Contact Information]
- Clinic Manager: [Contact Information]
- Emergency Services: 911

This memo is effective immediately and supersedes all previous fire evacuation procedures.`,
            effectivePeriod: `Effective Date: ${currentDate}\nReview Date: ${new Date(Date.now() + 30*24*60*60*1000).toISOString().split('T')[0]}`,
            nextSteps: `NEXT STEPS:
1. Complete fire safety training by month end
2. Review evacuation routes and assembly points
3. Participate in monthly fire drills
4. Know your Fire Warden and responsibilities
5. Report any fire safety concerns immediately`,
            contact: `CONTACT FOR QUESTIONS:
- Fire Safety Coordinator: [Contact Information]
- Clinic Manager: [Contact Information]
- Emergency Services: 911`
        };
    }
}

function generateEmergencyPolicy(topic, type, requirements) {
    const purpose = `This policy establishes comprehensive emergency response procedures to ensure rapid, effective response to medical emergencies, natural disasters, and other critical situations that may occur in our clinic facilities.`;
    
    const procedure = `EMERGENCY RESPONSE PROCEDURES:

1. MEDICAL EMERGENCIES:
   - Immediate assessment of patient condition
   - Call 911 for life-threatening emergencies
   - Begin appropriate emergency medical care
   - Notify attending veterinarian immediately
   - Document all emergency interventions
   - Contact client/owner as soon as possible

2. FIRE EMERGENCIES:
   - Activate fire alarm system
   - Evacuate all personnel and patients
   - Call 911 from safe location
   - Account for all staff and patients
   - Follow established evacuation routes
   - Do not re-enter building until cleared by fire department

3. SEVERE WEATHER:
   - Monitor weather alerts and warnings
   - Secure outdoor equipment and supplies
   - Move patients to safe interior locations
   - Close clinic if severe weather warning issued
   - Maintain emergency supplies and equipment

4. POWER OUTAGES:
   - Switch to emergency power if available
   - Prioritize critical patient care equipment
   - Use battery-powered lighting and equipment
   - Contact utility company for updates
   - Implement manual record-keeping procedures

5. SECURITY INCIDENTS:
   - Secure all staff and patients
   - Contact law enforcement if necessary
   - Document incident details
   - Follow lockdown procedures if required
   - Provide support to affected staff and clients`;
    
    const roles = `EMERGENCY RESPONSIBILITIES:

EMERGENCY COORDINATOR:
- Direct emergency response efforts
- Communicate with emergency services
- Coordinate staff assignments
- Maintain emergency contact information

ALL STAFF:
- Follow emergency procedures
- Assist with patient evacuation
- Maintain calm and professional demeanor
- Document emergency events

CLINIC MANAGER:
- Ensure adequate emergency supplies
- Coordinate with emergency services
- Provide post-emergency support
- Review and update emergency procedures`;
    
    const compliance = `EMERGENCY COMPLIANCE:

TRAINING:
- Annual emergency response training
- Fire safety and evacuation training
- CPR and first aid certification
- Emergency equipment training

PREPAREDNESS:
- Regular emergency drills and exercises
- Emergency supply inventory and maintenance
- Emergency contact list updates
- Emergency procedure reviews

DOCUMENTATION:
- Emergency incident reporting
- Training completion records
- Emergency drill evaluations
- Continuous improvement planning`;
    
    return {
        title: topic,
        purpose: purpose,
        procedure: procedure,
        roles: roles,
        compliance: compliance
    };
}

function generateMedicationPolicy(topic, type, requirements) {
    const purpose = `This policy establishes comprehensive medication management protocols to ensure safe, accurate, and effective medication administration while preventing medication errors and ensuring regulatory compliance.`;
    
    const procedure = `MEDICATION MANAGEMENT PROCEDURES:

1. MEDICATION STORAGE:
   - Store medications in designated, locked areas
   - Maintain proper temperature and humidity controls
   - Separate controlled substances with additional security
   - Regular inventory of all medications
   - Proper labeling and expiration date monitoring

2. MEDICATION ADMINISTRATION:
   - Verify patient identity before administration
   - Check medication name, dose, route, and timing
   - Review patient allergies and contraindications
   - Use standardized administration protocols
   - Document all medications administered

3. CONTROLLED SUBSTANCES:
   - Maintain controlled substance logs
   - Require two-person verification for administration
   - Regular controlled substance audits
   - Secure storage and disposal procedures
   - Compliance with DEA regulations

4. MEDICATION ERRORS:
   - Immediate reporting of any medication errors
   - Assessment of patient impact
   - Documentation of error details
   - Implementation of corrective actions
   - Root cause analysis and prevention measures

5. MEDICATION EDUCATION:
   - Provide client education on medications
   - Explain proper administration techniques
   - Discuss potential side effects and monitoring
   - Provide written medication information
   - Schedule follow-up appointments as needed`;
    
    const roles = `MEDICATION RESPONSIBILITIES:

VETERINARIANS:
- Prescribe medications appropriately
- Monitor patient response to medications
- Adjust dosages as needed
- Provide medication education to clients

TECHNICIANS:
- Administer medications as prescribed
- Monitor patient response
- Document medication administration
- Maintain medication inventory

PHARMACY STAFF:
- Prepare and dispense medications
- Maintain medication inventory
- Provide medication counseling
- Ensure regulatory compliance`;
    
    const compliance = `MEDICATION COMPLIANCE:

TRAINING:
- Annual medication safety training
- Controlled substance training
- Medication error prevention training
- Documentation of training completion

MONITORING:
- Regular medication audits
- Medication error reporting and analysis
- Controlled substance compliance reviews
- Client satisfaction with medication services

QUALITY ASSURANCE:
- Regular review of medication practices
- Benchmarking against industry standards
- Continuous improvement initiatives
- Integration with quality management systems`;
    
    return {
        title: topic,
        purpose: purpose,
        procedure: procedure,
        roles: roles,
        compliance: compliance
    };
}

function generateInfectionControlPolicy(topic, type, requirements) {
    const purpose = `This policy establishes comprehensive infection prevention and control measures to protect patients, staff, and clients from healthcare-associated infections and ensure a safe clinical environment.`;
    
    const procedure = `INFECTION CONTROL PROCEDURES:

1. STANDARD PRECAUTIONS:
   - Hand hygiene before and after patient contact
   - Use of personal protective equipment (PPE)
   - Proper handling and disposal of sharps
   - Environmental cleaning and disinfection
   - Respiratory hygiene and cough etiquette

2. TRANSMISSION-BASED PRECAUTIONS:
   - Contact precautions for infectious diseases
   - Droplet precautions for respiratory infections
   - Airborne precautions for highly contagious diseases
   - Isolation procedures when indicated
   - Special handling of infectious waste

3. ENVIRONMENTAL CLEANING:
   - Regular cleaning and disinfection of all surfaces
   - Use of EPA-approved disinfectants
   - Proper cleaning equipment and procedures
   - Regular maintenance of cleaning equipment
   - Documentation of cleaning activities

4. WASTE MANAGEMENT:
   - Proper segregation of medical waste
   - Secure storage of infectious waste
   - Regular waste collection and disposal
   - Compliance with waste regulations
   - Documentation of waste management

5. OUTBREAK MANAGEMENT:
   - Early detection of potential outbreaks
   - Immediate investigation and reporting
   - Implementation of control measures
   - Communication with public health authorities
   - Documentation and follow-up`;
    
    const roles = `INFECTION CONTROL RESPONSIBILITIES:

INFECTION CONTROL COORDINATOR:
- Develop and implement infection control programs
- Monitor compliance with protocols
- Investigate infection control incidents
- Provide education and training

ALL STAFF:
- Follow all infection control protocols
- Report potential infections immediately
- Participate in training programs
- Maintain clean work environment

CLINIC MANAGER:
- Ensure adequate infection control resources
- Support infection control initiatives
- Address compliance issues promptly
- Review infection control performance`;
    
    const compliance = `INFECTION CONTROL COMPLIANCE:

TRAINING:
- Annual infection control training
- Role-specific training programs
- New employee orientation
- Documentation of training completion

MONITORING:
- Regular infection control audits
- Surveillance of healthcare-associated infections
- Compliance monitoring and reporting
- Performance improvement activities

QUALITY ASSURANCE:
- Regular review of infection control metrics
- Benchmarking against industry standards
- Continuous improvement initiatives
- Integration with quality management systems`;
    
    return {
        title: topic,
        purpose: purpose,
        procedure: procedure,
        roles: roles,
        compliance: compliance
    };
}

function generateAppointmentPolicy(topic, type, requirements) {
    const purpose = `This policy establishes comprehensive appointment scheduling and management procedures to ensure efficient clinic operations, optimal patient care, and excellent client service across all clinic locations.`;
    
    const procedure = `APPOINTMENT MANAGEMENT PROCEDURES:

1. SCHEDULING PROTOCOLS:
   - Standard appointment time allocations based on service type
   - Buffer time between appointments for documentation
   - Priority scheduling for urgent cases
   - Advance scheduling for routine care
   - Confirmation calls 24-48 hours before appointments

2. APPOINTMENT TYPES:
   - Wellness exams: 30 minutes
   - Sick visits: 45 minutes
   - Surgical consultations: 60 minutes
   - Emergency appointments: As needed
   - Follow-up appointments: 15-30 minutes

3. CLIENT COMMUNICATION:
   - Clear appointment instructions and preparation requirements
   - Reminder calls and confirmations
   - Wait time notifications if delays occur
   - Rescheduling procedures and policies
   - No-show and cancellation policies

4. SCHEDULE MANAGEMENT:
   - Daily schedule reviews and adjustments
   - Emergency appointment integration
   - Overbooking prevention strategies
   - Staff scheduling coordination
   - Resource allocation planning
5. QUALITY ASSURANCE:
   - Regular review of scheduling efficiency
   - Client satisfaction monitoring
   - Staff feedback collection
   - Continuous improvement initiatives
   - Performance metrics tracking`;
    
    const roles = `APPOINTMENT RESPONSIBILITIES:

RECEPTION STAFF:
- Schedule appointments according to protocols
- Confirm appointments and communicate with clients
- Manage schedule changes and cancellations
- Provide excellent client service

VETERINARY STAFF:
- Maintain appointment schedules
- Provide timely and quality patient care
- Communicate schedule changes to reception
- Document all patient interactions

CLINIC MANAGER:
- Oversee appointment system efficiency
- Address scheduling conflicts and issues
- Monitor client satisfaction
- Implement scheduling improvements`;
    
    const compliance = `APPOINTMENT COMPLIANCE:

TRAINING:
- Appointment scheduling training for all staff
- Customer service training
- System training for scheduling software
- Documentation of training completion

MONITORING:
- Regular review of scheduling metrics
- Client satisfaction surveys
- Staff performance evaluations
- System efficiency assessments

QUALITY ASSURANCE:
- Monthly scheduling performance reviews
- Client feedback analysis
- Continuous improvement planning
- Integration with quality management systems`;
    
    return {
        title: topic,
        purpose: purpose,
        procedure: procedure,
        roles: roles,
        compliance: compliance
    };
}

function generateDocumentationPolicy(topic, type, requirements) {
    const purpose = `This policy establishes comprehensive medical record documentation standards to ensure accurate, complete, and timely recording of patient care, legal compliance, and continuity of care across all clinic locations.`;
    
    const procedure = `DOCUMENTATION PROCEDURES:

1. MEDICAL RECORD REQUIREMENTS:
   - Complete patient identification information
   - Detailed history and physical examination findings
   - Accurate diagnosis and treatment plans
   - All medications prescribed and administered
   - Client communications and instructions

2. DOCUMENTATION TIMELINES:
   - Initial examination notes: Within 24 hours
   - Treatment notes: Immediately after procedures
   - Discharge instructions: Before patient departure
   - Follow-up notes: Within 48 hours
   - Emergency cases: Immediately after stabilization

3. RECORD FORMAT AND STANDARDS:
   - Use standardized templates and forms
   - Clear, legible handwriting or electronic entry
   - Objective, factual language
   - Proper medical terminology
   - Chronological organization of entries

4. ELECTRONIC RECORD MANAGEMENT:
   - Secure access controls and user authentication
   - Regular backup and disaster recovery procedures
   - Audit trails for all record access and modifications
   - Integration with practice management systems
   - Compliance with electronic record regulations

5. RECORD RETENTION AND DISPOSAL:
   - Minimum 7-year retention for adult patients
   - Extended retention for minors until age of majority
   - Secure disposal of expired records
   - Compliance with legal and regulatory requirements
   - Documentation of record destruction`;
    
    const roles = `DOCUMENTATION RESPONSIBILITIES:

VETERINARIANS:
- Complete accurate medical record documentation
- Review and sign all medical records
- Ensure compliance with documentation standards
- Provide supervision for staff documentation

TECHNICIANS:
- Document technical procedures and observations
- Assist with medical record maintenance
- Follow documentation protocols
- Participate in documentation training

RECEPTION STAFF:
- Maintain client information accuracy
- Process medical record requests
- Ensure proper record filing and organization
- Assist with record management procedures`;
    
    const compliance = `DOCUMENTATION COMPLIANCE:

TRAINING:
- Annual documentation training for all staff
- Medical terminology education
- Legal requirements training
- Documentation of training completion

MONITORING:
- Regular medical record audits
- Documentation quality assessments
- Compliance monitoring and reporting
- Performance improvement activities

QUALITY ASSURANCE:
- Monthly documentation reviews
- Benchmarking against industry standards
- Continuous improvement initiatives
- Integration with quality management systems`;
    
    return {
        title: topic,
        purpose: purpose,
        procedure: procedure,
        roles: roles,
        compliance: compliance
    };
}

function generateGenericPolicy(topic, type, requirements) {
    const purpose = `This policy establishes comprehensive guidelines for ${topic.toLowerCase()} to ensure consistent, safe, and effective operations across all clinic locations. This policy addresses the specific requirements and best practices for ${topic.toLowerCase()} in our healthcare environment.`;
    
    const procedure = `PROCEDURES FOR ${topic.toUpperCase()}:

1. INITIAL ASSESSMENT:
   - Evaluate current practices and identify areas for improvement
   - Assess staff knowledge and training needs
   - Review existing protocols and procedures
   - Identify potential risks and safety concerns
   - Establish baseline metrics for performance

2. IMPLEMENTATION PROTOCOLS:
   - Develop standardized procedures for ${topic.toLowerCase()}
   - Provide comprehensive staff training
   - Establish monitoring and quality assurance measures
   - Create documentation and reporting systems
   - Implement continuous improvement processes

3. STAFF RESPONSIBILITIES:
   - Follow established protocols and procedures
   - Participate in training and competency assessments
   - Report any issues or concerns immediately
   - Maintain accurate documentation
   - Support continuous improvement efforts

4. QUALITY ASSURANCE:
   - Regular monitoring of compliance and outcomes
   - Performance metrics tracking and analysis
   - Client and staff feedback collection
   - Regular policy review and updates
   - Benchmarking against industry standards

5. CONTINUOUS IMPROVEMENT:
   - Regular evaluation of policy effectiveness
   - Identification of improvement opportunities
   - Implementation of best practices
   - Staff education and training updates
   - Integration with overall quality management systems`;
    
    const roles = `RESPONSIBILITIES FOR ${topic.toUpperCase()}:

ALL STAFF:
- Follow established protocols and procedures
- Participate in training and competency assessments
- Report issues and concerns promptly
- Maintain accurate documentation
- Support continuous improvement efforts

SUPERVISORS:
- Ensure staff compliance with protocols
- Provide training and support to staff
- Monitor performance and outcomes
- Address compliance issues promptly
- Support quality improvement initiatives

CLINIC MANAGER:
- Ensure adequate resources for policy implementation
- Support staff training and development
- Monitor overall policy effectiveness
- Address systemic issues and barriers
- Integrate policy with overall clinic operations`;
    
    const compliance = `COMPLIANCE REQUIREMENTS FOR ${topic.toUpperCase()}:

TRAINING:
- Initial training for all staff on policy requirements
- Annual competency assessments and updates
- Role-specific training for different staff positions
- Documentation of all training completion
- Ongoing education and skill development

MONITORING:
- Regular audits of policy compliance
- Performance metrics tracking and reporting
- Client and staff satisfaction monitoring
- Incident reporting and investigation
- Quality assurance activities

ENFORCEMENT:
- Progressive discipline for non-compliance
- Recognition programs for excellent performance
- Regular policy reviews and updates
- Integration with performance evaluations
- Continuous improvement planning`;
    
    return {
        title: topic,
        purpose: purpose,
        procedure: procedure,
        roles: roles,
        compliance: compliance
    };
}

function displayAIPolicy(policy) {
    console.log('displayAIPolicy called with policy:', policy);
    
    const aiLoading = document.getElementById('aiLoading');
    const aiResult = document.getElementById('aiResult');
    const aiGeneratedContent = document.getElementById('aiGeneratedContent');
    
    if (!aiLoading || !aiResult || !aiGeneratedContent) {
        console.error('Required elements not found:', { aiLoading, aiResult, aiGeneratedContent });
        return;
    }
    
    // Don't show the policy yet - wait for webhook
    // aiLoading.style.display = 'none';
    // aiResult.style.display = 'block';
    
    // Use the new professional formatting
    const formattedContent = formatPolicyContent(policy, policy.type);
    console.log('Formatted content:', formattedContent);
    
    // Add clinic information at the top
    const clinicInfo = `
    <div class="policy-info-header">
        <div class="policy-summary">
            <div class="summary-item">
                <i class="fas fa-building"></i>
                <span><strong>Organizations:</strong> ${policy.clinicNames || 'All Organizations'}</span>
            </div>
            ${policy.keyPoints ? `
            <div class="summary-item">
                <i class="fas fa-lightbulb"></i>
                <span><strong>Key Points:</strong> ${policy.keyPoints}</span>
            </div>
            ` : ''}
        </div>
    </div>`;
    
    aiGeneratedContent.innerHTML = clinicInfo + formattedContent + `
        <div class="ai-result-actions" style="margin-top: 20px; padding-top: 20px; border-top: 1px solid #ddd; display: flex; gap: 10px; justify-content: flex-end;">
            <button class="btn btn-info" onclick="showRefinePolicyModal()" style="background: #667eea; border-color: #667eea; color: white;">
                <i class="fas fa-magic"></i> Refine with AI
            </button>
            <button class="btn btn-secondary" onclick="storeDraft()">
                <i class="fas fa-save"></i> Save as Draft
            </button>
            <button class="btn btn-primary" onclick="saveAIPolicy()">
                <i class="fas fa-check"></i> Publish Policy
            </button>
        </div>
    `;
    
    // Store the generated policy for saving
    window.currentGeneratedPolicy = policy;
    
    // DO NOT automatically save - wait for webhook to complete first
    // savePolicyToStorage(policy);
    
    // Update chat state and ask if anything needs to be changed
    chatState.step = 'policy_generated';
    
}

function editAIPolicy() {
    // Move to create modal with pre-filled data
    closeAIModal();
    openCreateModal();
    
    const policy = window.currentGeneratedPolicy;
    document.getElementById('policyTitle').value = policy.title;
    document.getElementById('policyType').value = policy.type;
    document.getElementById('clinicApplicability').value = policy.clinics;
    document.getElementById('policyPurpose').value = policy.purpose;
    document.getElementById('policyProcedure').value = policy.procedure;
    document.getElementById('policyRoles').value = policy.roles;
    document.getElementById('policyCompliance').value = policy.compliance;
}

function saveAIPolicy() {
    const policy = window.currentGeneratedPolicy;
    
    const newPolicy = {
        id: currentPolicies.length + 1,
        title: policy.title,
        type: policy.type,
        clinics: policy.clinics,
        description: policy.purpose,
        created: new Date().toISOString().split('T')[0],
        updated: new Date().toISOString().split('T')[0]
    };

    currentPolicies.unshift(newPolicy);
    displayPolicies(currentPolicies);
    updateStats();
    closeAIModal();
    
    showNotification('AI-generated policy saved successfully!', 'success');
    
    // Add notification to notification center
    const aiPolicyTitle = window.currentGeneratedPolicy?.title || 'AI-Generated Policy';
    addNotification(`New AI-generated policy "${aiPolicyTitle}" has been published`, 'success');
}

function formatMarkdownForDisplay(markdown) {
    if (!markdown) return '';
    
    let html = markdown
        // Headers
        .replace(/^### (.*$)/gm, '<h4 style="color: #2563eb; margin-top: 20px; margin-bottom: 10px; font-weight: 600;">$1</h4>')
        .replace(/^## (.*$)/gm, '<h3 style="color: #1e40af; margin-top: 25px; margin-bottom: 12px; font-weight: 700; border-bottom: 2px solid #e5e7eb; padding-bottom: 8px;">$1</h3>')
        .replace(/^# (.*$)/gm, '<h2 style="color: #1e3a8a; margin-top: 30px; margin-bottom: 15px; font-weight: 700;">$1</h2>')
        // Bold
        .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
        // Lists
        .replace(/^\- (.*$)/gm, '<li style="margin: 5px 0; padding-left: 20px;">$1</li>')
        .replace(/^1\. (.*$)/gm, '<li style="margin: 5px 0; padding-left: 20px; list-style-type: decimal;">$1</li>')
        // Line breaks
        .replace(/\n/g, '<br>');
    
    // Wrap list items in <ul> tags
    html = html.replace(/(<li[^>]*>.*?<\/li>)/gs, '<ul style="margin: 15px 0; padding-left: 30px;">$1</ul>');
    
    // Wrap in paragraph
    return '<div style="padding: 15px; line-height: 1.8;">' + html + '</div>';
}

function formatPolicyContentForDisplay(content) {
    if (!content) {
        return '<p style="color: #666; font-style: italic;">No content available</p>';
    }
    
    // If content is already HTML, return it
    if (typeof content === 'string' && content.includes('<')) {
        return content;
    }
    
    // If content is a plain string, format it
    if (typeof content === 'string') {
        return formatMarkdownForDisplay(content);
    }
    
    // If content is an object with sections, format those
    if (typeof content === 'object') {
        let html = '';
        for (const [sectionName, sectionContent] of Object.entries(content)) {
            if (sectionContent) {
                const displayName = sectionName.charAt(0).toUpperCase() + sectionName.slice(1).replace(/([A-Z])/g, ' $1');
                html += `
                    <div class="policy-section" style="margin-bottom: 25px;">
                        <h3 style="color: #1e40af; margin-top: 25px; margin-bottom: 12px; font-weight: 700; border-bottom: 2px solid #e5e7eb; padding-bottom: 8px;">${displayName}</h3>
                        <div style="line-height: 1.8;">${typeof sectionContent === 'string' ? formatMarkdownForDisplay(sectionContent) : JSON.stringify(sectionContent)}</div>
                    </div>
                `;
            }
        }
        return html || '<p style="color: #666; font-style: italic;">No content available</p>';
    }
    
    return '<p style="color: #666; font-style: italic;">Content format not supported</p>';
}

function parseWebhookPolicyMarkdown(markdown) {
    if (!markdown) return {};
    
    const sections = {};
    const lines = markdown.split('\n');
    let currentSection = null;
    let currentContent = [];
    
    for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        
        // Check for section headers (## Section Name)
        const sectionMatch = line.match(/^## (.*)$/);
        if (sectionMatch) {
            // Save previous section
            if (currentSection) {
                sections[currentSection.toLowerCase()] = currentContent.join('\n').trim();
            }
            // Start new section
            currentSection = sectionMatch[1];
            currentContent = [];
        } else {
            currentContent.push(line);
        }
    }
    
    // Save last section
    if (currentSection) {
        sections[currentSection.toLowerCase()] = currentContent.join('\n').trim();
    }
    
    return sections;
}

function generateEditablePolicySections(sections) {
    const sectionIcons = {
        'purpose': 'fa-info-circle',
        'scope': 'fa-crosshairs',
        'policy statement': 'fa-gavel',
        'definitions': 'fa-book',
        'procedure / implementation': 'fa-cogs',
        'responsibilities': 'fa-users',
        'consequences / accountability': 'fa-shield-alt',
        'related documents': 'fa-folder',
        'review & approval': 'fa-check-circle'
    };
    
    let html = '';
    
    for (const [sectionName, content] of Object.entries(sections)) {
        const icon = sectionIcons[sectionName] || 'fa-file-alt';
        const displayName = sectionName.charAt(0).toUpperCase() + sectionName.slice(1);
        
        html += `
            <div class="policy-section editable-section" data-field="${sectionName}">
                <h5><i class="fas ${icon}"></i> ${displayName}</h5>
                <div class="policy-content editable-content" contenteditable="true" data-field="${sectionName}">
                    ${content.replace(/\n/g, '<br>')}
                </div>
                <div class="edit-actions" style="display: none;">
                    <button class="btn btn-sm btn-success" onclick="savePolicyField('${sectionName}')">
                        <i class="fas fa-save"></i> Save
                    </button>
                    <button class="btn btn-sm btn-secondary" onclick="cancelPolicyEdit('${sectionName}')">
                        <i class="fas fa-times"></i> Cancel
                    </button>
                </div>
            </div>
        `;
    }
    
    return html;
}

function saveWebhookPolicy() {
    const webhookPolicy = window.currentWebhookPolicy;
    
    if (!webhookPolicy) {
        showNotification('No policy data to save', 'error');
        return;
    }
    
    // Get the policy title from the input field
    const titleInput = document.getElementById('policyTitleInput');
    if (!titleInput) {
        showNotification('Title input field not found', 'error');
        return;
    }
    
    const policyTitle = titleInput.value.trim();
    if (!policyTitle || policyTitle === 'Generated Policy') {
        showNotification('Please enter a policy title before saving', 'error');
        titleInput.focus();
        titleInput.style.borderColor = '#ef4444';
        return;
    }
    
    // Get selected category
    const categoryId = document.getElementById('aiPolicyCategory')?.value || null;
    
    // Parse the webhook policy data
    let policyData = null;
    if (Array.isArray(webhookPolicy) && webhookPolicy.length > 0) {
        policyData = webhookPolicy[0];
    } else if (typeof webhookPolicy === 'object') {
        policyData = webhookPolicy;
    } else {
        showNotification('Invalid policy data format', 'error');
        return;
    }
    
    // Create policy object with temporary ID
    const tempId = 'policy_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
    
    const policyType = policyData.policy_type || 'admin';
    
    // Generate policy code if category is selected
    const policyCode = categoryId ? generatePolicyCode(categoryId, tempId, policyType) : null;
    
    const newPolicy = {
        id: tempId,
        title: policyTitle, // Use the manually entered title
        type: policyType,
        clinics: policyData.applies_to || 'All Organizations',
        content: policyData.markdown || '',
        effectiveDate: policyData.effective_date || new Date().toISOString().split('T')[0],
        version: policyData.version || '1.0',
        approvedBy: policyData.approved_by || 'Administrator',
        company: currentCompany,
        created: new Date().toISOString(),
        updated: new Date().toISOString(),
        generatedBy: 'Webhook',
        categoryId: categoryId,
        policyCode: policyCode
    };
    
    // Save the policy
    if (!currentCompany) {
        showNotification('Please log in first', 'error');
        return;
    }
    
    const companyPolicies = loadCompanyPolicies();
    companyPolicies.push(newPolicy);
    localStorage.setItem(`policies_${currentCompany}`, JSON.stringify(companyPolicies));
    
    showNotification('Policy saved successfully!', 'success');
    
    // Add notification to notification center
    const webhookPolicyTitle = webhookPolicy.policy_title || webhookPolicy.title || 'AI-Generated Policy';
    addNotification(`New policy "${webhookPolicyTitle}" has been published`, 'success');
    
    closeAIModal();
    
    // Reload policies if on admin dashboard
    if (typeof loadMainPoliciesFromStorage === 'function') {
        loadMainPoliciesFromStorage();
        displayMainPolicies();
    }
}

// Draft Management Functions
function storeDraft() {
    const policy = window.currentGeneratedPolicy;
    if (!policy) return;
    
    // Check if we're editing an existing draft
    if (window.editingDraftId) {
        // Update existing draft
        const existingDraftIndex = draftPolicies.findIndex(d => d.id === window.editingDraftId);
        if (existingDraftIndex !== -1) {
            draftPolicies[existingDraftIndex] = {
                ...draftPolicies[existingDraftIndex],
                title: policy.title,
                type: policy.type,
                clinics: policy.clinics,
                content: policy,
                updated: new Date().toISOString().split('T')[0]
            };
            showNotification('Draft updated successfully!', 'success');
        }
        window.editingDraftId = null; // Clear editing flag
    } else {
        // Create new draft
    const draft = {
        id: Date.now(),
        title: policy.title,
        type: policy.type,
        clinics: policy.clinics,
        content: policy,
        company: currentCompany || 'Default Company', // Assign to current company
        created: new Date().toISOString().split('T')[0],
        status: 'draft'
    };
    
    draftPolicies.unshift(draft);
        showNotification('Draft saved successfully!', 'success');
    }
    
    // Save to localStorage to persist across sessions
    saveToLocalStorage('draftPolicies', draftPolicies);
    
    displayDrafts();
    updateStats();
    closeAIModal();
}

function displayDrafts() {
    // Check if draftList element exists
    if (!draftList) {
        console.log('draftList element not found, skipping displayDrafts');
        return;
    }
    
    // Filter drafts by company
    const companyDrafts = currentCompany ? 
        draftPolicies.filter(draft => draft.company === currentCompany || !draft.company) : 
        draftPolicies;
    
    if (companyDrafts.length === 0) {
        draftList.innerHTML = '<p class="no-drafts">No draft policies available.</p>';
        return;
    }
    
    draftList.innerHTML = companyDrafts.map(draft => `
        <div class="draft-item">
            <div class="draft-info">
                <h4>${draft.title}</h4>
                <p>${getTypeLabel(draft.type)} • Created: ${formatDate(draft.created)}</p>
            </div>
            <div class="draft-actions">
                <button class="draft-btn edit" onclick="editDraft(${draft.id})">Edit</button>
                <button class="draft-btn publish" onclick="publishDraft(${draft.id})">Publish</button>
                <button class="draft-btn delete" onclick="deleteDraft(${draft.id})">Delete</button>
            </div>
        </div>
    `).join('');
}

function editDraft(draftId) {
    const draft = draftPolicies.find(d => d.id === draftId);
    if (!draft) return;
    
    // Open AI modal with pre-filled data
    openAIModal();
    
    // Pre-fill the form with draft data
    document.getElementById('aiPolicyTopic').value = draft.title;
    document.getElementById('aiPolicyType').value = draft.type;
    document.getElementById('aiClinicApplicability').value = draft.clinics;
    
    // Store the draft ID for updating
    window.editingDraftId = draftId;
}

function publishDraft(draftId) {
    const draft = draftPolicies.find(d => d.id === draftId);
    if (!draft) return;
    
    const newPolicy = {
        id: currentPolicies.length + 1,
        title: draft.title,
        type: draft.type,
        clinics: draft.clinics,
        description: draft.content.purpose || draft.content.objective || draft.content.message,
        created: new Date().toISOString().split('T')[0],
        updated: new Date().toISOString().split('T')[0]
    };
    
    currentPolicies.unshift(newPolicy);
    saveToLocalStorage('currentPolicies', currentPolicies);
    deleteDraft(draftId);
    displayPolicies(currentPolicies);
    updateStats();
    
    showNotification('Draft published successfully!', 'success');
    
    // Add notification to notification center
    addNotification(`Draft "${newPolicy.title}" has been published as a policy`, 'success');
}

function deleteDraft(draftId) {
    draftPolicies = draftPolicies.filter(d => d.id !== draftId);
    saveToLocalStorage('draftPolicies', draftPolicies);
    displayDrafts();
    updateStats();
    
    showNotification('Draft deleted successfully!', 'success');
}

function regeneratePolicy() {
    // Close current result and regenerate
    aiResult.style.display = 'none';
    aiForm.style.display = 'block';
    
    // Generate new policy with same inputs
    generateAIPolicy();
}
// Enhanced AI Policy Generation with Better Formatting
function formatPolicyContent(content, type) {
    // Helper function to safely get content or show fallback
    const getContent = (field, fallback = 'Content will be generated by AI') => {
        return content[field] && content[field] !== 'undefined' ? content[field] : fallback;
    };
    
    // Helper function to create editable content
    const createEditableContent = (field, value, label, icon) => {
        return `
        <div class="policy-section editable-section" data-field="${field}">
            <h5><i class="fas ${icon}"></i> ${label}</h5>
            <div class="policy-content editable-content" contenteditable="true" data-field="${field}">
                ${value}
            </div>
            <div class="edit-actions" style="display: none;">
                <button class="btn btn-sm btn-success" onclick="savePolicyField('${field}')">
                    <i class="fas fa-save"></i> Save
                </button>
                <button class="btn btn-sm btn-secondary" onclick="cancelPolicyEdit('${field}')">
                    <i class="fas fa-times"></i> Cancel
                </button>
            </div>
        </div>`;
    };
    
    if (type === 'admin') {
        return `
        <div class="policy-preview professional">
            <div class="policy-header">
                <h4>${getContent('title', 'AI-Generated Admin Policy')}</h4>
                <span class="policy-type-badge admin">Admin Policy</span>
            </div>
            
            <div class="policy-meta">
                <div class="meta-item"><strong>Effective Date:</strong> ${getContent('effectiveDate', new Date().toISOString().split('T')[0])}</div>
                <div class="meta-item"><strong>Last Reviewed:</strong> ${getContent('lastReviewed', new Date().toISOString().split('T')[0])}</div>
                <div class="meta-item"><strong>Approved By:</strong> ${getContent('approvedBy', 'CSI Clinical Director')}</div>
                <div class="meta-item"><strong>Version:</strong> ${getContent('version', '1.0')}</div>
            </div>
            
            ${createEditableContent('purpose', getContent('purpose', 'This policy establishes guidelines and procedures for the specified topic.'), 'Purpose', 'fa-info-circle')}
            
            ${createEditableContent('scope', getContent('scope', 'This policy applies to all staff and operations within CSI facilities.'), 'Scope', 'fa-scope')}
            
            ${createEditableContent('policyStatement', getContent('policyStatement', 'It is the policy of CSI to ensure compliance with established procedures and guidelines.'), 'Policy Statement', 'fa-gavel')}
            
            ${createEditableContent('definitions', getContent('definitions', 'Key terms and definitions will be provided as needed.'), 'Definitions', 'fa-book')}
            
            ${createEditableContent('procedures', getContent('procedures', 'Detailed procedures will be outlined based on the specific policy requirements.'), 'Procedure / Implementation', 'fa-cogs')}
            
            ${createEditableContent('responsibilities', getContent('responsibilities', 'All staff members are responsible for following this policy.'), 'Responsibilities', 'fa-users')}
            
            ${createEditableContent('consequences', getContent('consequences', 'Non-compliance will result in appropriate disciplinary action.'), 'Consequences / Accountability', 'fa-shield-alt')}
            
            ${createEditableContent('relatedDocuments', getContent('relatedDocuments', 'Related policies and procedures will be referenced as applicable.'), 'Related Documents', 'fa-folder')}
            
            ${createEditableContent('reviewApproval', getContent('reviewApproval', 'This policy will be reviewed annually and updated as necessary.'), 'Review & Approval', 'fa-check-circle')}
        </div>`;
    } else if (type === 'sog') {
        return `
        <div class="policy-preview professional">
            <div class="policy-header">
                <h4>${getContent('title', 'AI-Generated SOG')}</h4>
                <span class="policy-type-badge sog">Standard Operating Guidelines</span>
            </div>
            
            <div class="policy-meta">
                <div class="meta-item"><strong>Effective Date:</strong> ${getContent('effectiveDate', new Date().toISOString().split('T')[0])}</div>
                <div class="meta-item"><strong>Author:</strong> ${getContent('author', 'CSI Clinical Staff')}</div>
                <div class="meta-item"><strong>Approved By:</strong> ${getContent('approvedBy', 'CSI Medical Director')}</div>
                <div class="meta-item"><strong>Version:</strong> ${getContent('version', '1.0')}</div>
            </div>
            
            ${createEditableContent('objective', getContent('objective', 'To establish standardized operating guidelines for consistent, high-quality operations.'), 'Objective', 'fa-target')}
            
            ${createEditableContent('principles', getContent('principles', 'Safety, quality, and compliance guide all operations.'), 'Guiding Principles', 'fa-compass')}
            
            ${createEditableContent('procedures', getContent('procedures', 'Detailed procedures will be outlined based on the specific guidelines.'), 'Recommended Approach / Procedure', 'fa-route')}
            
            ${createEditableContent('definitions', getContent('definitions', 'Key terms and definitions will be provided as needed.'), 'Definitions', 'fa-book')}
            
            ${createEditableContent('examples', getContent('examples', 'Practical examples and scenarios will be provided for guidance.'), 'Examples / Scenarios', 'fa-lightbulb')}
            
            ${createEditableContent('responsibilities', getContent('responsibilities', 'All staff members are responsible for following these guidelines.'), 'Responsibilities', 'fa-users')}
            
            ${createEditableContent('escalation', getContent('escalation', 'Contact immediate supervisor for guidance and support.'), 'Escalation / Support', 'fa-phone')}
            
            ${createEditableContent('review', getContent('review', 'This guideline will be reviewed bi-annually and updated as necessary.'), 'Review & Revision', 'fa-sync')}
        </div>`;
    } else {
        return `
        <div class="policy-preview professional">
            <div class="policy-header">
                <h4>${getContent('title', 'AI-Generated Communication Memo')}</h4>
                <span class="policy-type-badge memo">Communication Memo</span>
            </div>
            
            <div class="policy-meta">
                <div class="meta-item"><strong>Date:</strong> ${getContent('date', new Date().toISOString().split('T')[0])}</div>
                <div class="meta-item"><strong>From:</strong> ${getContent('from', 'CSI Management')}</div>
                <div class="meta-item"><strong>To:</strong> ${getContent('to', 'All Staff')}</div>
                <div class="meta-item"><strong>Subject:</strong> ${getContent('subject', 'Important Communication')}</div>
            </div>
            
            ${createEditableContent('message', getContent('message', 'This communication memo contains important information for all staff members.'), 'Message', 'fa-envelope')}
            
            ${createEditableContent('effectivePeriod', getContent('effectivePeriod', 'Effective immediately and ongoing until further notice.'), 'Effective Period (if applicable)', 'fa-calendar')}
            
            ${createEditableContent('nextSteps', getContent('nextSteps', 'Please review this communication and implement as directed.'), 'Next Steps / Action Required', 'fa-list-check')}
            
            ${createEditableContent('contact', getContent('contact', 'Contact your immediate supervisor for any questions or clarifications.'), 'Contact for Questions', 'fa-phone')}
        </div>`;
    }
}

// Update AI form fields based on policy type selection
function updateAIFormFields() {
    const policyType = document.getElementById('aiPolicyType').value;
    const dynamicFields = document.getElementById('dynamicAIFormFields');
    
    if (!policyType) {
        dynamicFields.innerHTML = '';
        return;
    }
    
    let fieldsHTML = '';
    
    if (policyType === 'admin') {
        // LEVEL 1 - ADMIN POLICY HEADERS
        fieldsHTML = `
            <div class="form-group">
                <label for="aiEffectiveDate">Effective Date</label>
                <input type="date" id="aiEffectiveDate" required>
            </div>
            <div class="form-group">
                <label for="aiLastReviewed">Last Reviewed</label>
                <input type="date" id="aiLastReviewed" required>
            </div>
            <div class="form-group">
                <label for="aiApprovedBy">Approved By</label>
                <input type="text" id="aiApprovedBy" placeholder="CSI Clinical Director" required>
            </div>
            <div class="form-group">
                <label for="aiVersion">Version #</label>
                <input type="text" id="aiVersion" placeholder="1.0" required>
            </div>
            <div class="form-group">
                <label for="aiPurpose">Purpose</label>
                <textarea id="aiPurpose" rows="3" placeholder="Describe the purpose and objectives of this policy..."></textarea>
            </div>
            <div class="form-group">
                <label for="aiScope">Scope</label>
                <textarea id="aiScope" rows="3" placeholder="Define the scope and applicability of this policy..."></textarea>
            </div>
            <div class="form-group">
                <label for="aiPolicyStatement">Policy Statement</label>
                <textarea id="aiPolicyStatement" rows="3" placeholder="State the official policy statement..."></textarea>
            </div>
            <div class="form-group">
                <label for="aiDefinitions">Definitions</label>
                <textarea id="aiDefinitions" rows="3" placeholder="Define key terms and concepts used in this policy..."></textarea>
            </div>
            <div class="form-group">
                <label for="aiProcedure">Procedure / Implementation</label>
                <textarea id="aiProcedure" rows="5" placeholder="Describe the detailed procedures and implementation steps..."></textarea>
            </div>
            <div class="form-group">
                <label for="aiRoles">Responsibilities</label>
                <textarea id="aiRoles" rows="4" placeholder="Define roles and responsibilities for different staff members..."></textarea>
            </div>
            <div class="form-group">
                <label for="aiCompliance">Consequences / Accountability</label>
                <textarea id="aiCompliance" rows="3" placeholder="Describe compliance requirements and accountability measures..."></textarea>
            </div>
            <div class="form-group">
                <label for="aiRelatedDocuments">Related Documents</label>
                <textarea id="aiRelatedDocuments" rows="2" placeholder="List related policies, procedures, or reference documents..."></textarea>
            </div>
            <div class="form-group">
                <label for="aiReviewApproval">Review & Approval</label>
                <textarea id="aiReviewApproval" rows="2" placeholder="Define review schedule and approval process..."></textarea>
            </div>
        `;
    } else if (policyType === 'sog') {
        // LEVEL 2 - STANDARD OPERATING GUIDELINE HEADERS
        fieldsHTML = `
            <div class="form-group">
                <label for="aiEffectiveDate">Effective Date</label>
                <input type="date" id="aiEffectiveDate" required>
            </div>
            <div class="form-group">
                <label for="aiAuthor">Author</label>
                <input type="text" id="aiAuthor" placeholder="CSI Clinical Staff" required>
            </div>
            <div class="form-group">
                <label for="aiApprovedBy">Approved By</label>
                <input type="text" id="aiApprovedBy" placeholder="CSI Medical Director" required>
            </div>
            <div class="form-group">
                <label for="aiVersion">Version #</label>
                <input type="text" id="aiVersion" placeholder="1.0" required>
            </div>
            <div class="form-group">
                <label for="aiObjective">Objective</label>
                <textarea id="aiObjective" rows="3" placeholder="Define the objective and goals of these guidelines..."></textarea>
            </div>
            <div class="form-group">
                <label for="aiPrinciples">Guiding Principles</label>
                <textarea id="aiPrinciples" rows="3" placeholder="List the guiding principles that inform these guidelines..."></textarea>
            </div>
            <div class="form-group">
                <label for="aiProcedure">Recommended Approach / Procedure</label>
                <textarea id="aiProcedure" rows="5" placeholder="Describe the recommended approach and procedures..."></textarea>
            </div>
            <div class="form-group">
                <label for="aiDefinitions">Definitions</label>
                <textarea id="aiDefinitions" rows="3" placeholder="Define key terms and concepts used in these guidelines..."></textarea>
            </div>
            <div class="form-group">
                <label for="aiExamples">Examples / Scenarios</label>
                <textarea id="aiExamples" rows="4" placeholder="Provide examples and scenarios to illustrate the guidelines..."></textarea>
            </div>
            <div class="form-group">
                <label for="aiRoles">Responsibilities</label>
                <textarea id="aiRoles" rows="4" placeholder="Define roles and responsibilities for different staff members..."></textarea>
            </div>
            <div class="form-group">
                <label for="aiEscalation">Escalation / Support</label>
                <textarea id="aiEscalation" rows="3" placeholder="Describe escalation procedures and support resources..."></textarea>
            </div>
            <div class="form-group">
                <label for="aiReview">Review & Revision</label>
                <textarea id="aiReview" rows="2" placeholder="Define review schedule and revision process..."></textarea>
            </div>
        `;
    } else if (policyType === 'memo') {
        // LEVEL 3 - COMMUNICATION MEMO HEADERS
        fieldsHTML = `
            <div class="form-group">
                <label for="aiDate">Date</label>
                <input type="date" id="aiDate" required>
            </div>
            <div class="form-group">
                <label for="aiFrom">From</label>
                <input type="text" id="aiFrom" placeholder="CSI Management" required>
            </div>
            <div class="form-group">
                <label for="aiTo">To</label>
                <input type="text" id="aiTo" placeholder="All Staff" required>
            </div>
            <div class="form-group">
                <label for="aiSubject">Subject</label>
                <input type="text" id="aiSubject" placeholder="Enter the subject line for this memo..." required>
            </div>
            <div class="form-group">
                <label for="aiMessage">Message</label>
                <textarea id="aiMessage" rows="6" placeholder="Write the main message content for this memo..."></textarea>
            </div>
            <div class="form-group">
                <label for="aiEffectivePeriod">Effective Period (if applicable)</label>
                <textarea id="aiEffectivePeriod" rows="2" placeholder="Define when this memo is effective and any expiration dates..."></textarea>
            </div>
            <div class="form-group">
                <label for="aiNextSteps">Next Steps / Action Required</label>
                <textarea id="aiNextSteps" rows="3" placeholder="List the next steps and actions required from recipients..."></textarea>
            </div>
            <div class="form-group">
                <label for="aiContact">Contact for Questions</label>
                <textarea id="aiContact" rows="2" placeholder="Provide contact information for questions about this memo..."></textarea>
            </div>
        `;
    }
    
    dynamicFields.innerHTML = fieldsHTML;
    
    // Set default dates
    const today = new Date().toISOString().split('T')[0];
    const dateInputs = dynamicFields.querySelectorAll('input[type="date"]');
    dateInputs.forEach(input => {
        input.value = today;
    });
}

// Update manual form fields based on policy type selection
function updateManualFormFields() {
    const policyType = document.getElementById('policyType').value;
    const dynamicFields = document.getElementById('dynamicManualFormFields');
    
    if (!policyType) {
        dynamicFields.innerHTML = '';
        return;
    }
    
    let fieldsHTML = '';
    
    if (policyType === 'admin') {
        // LEVEL 1 - ADMIN POLICY HEADERS
        fieldsHTML = `
            <div class="form-group">
                <label for="effectiveDate">Effective Date</label>
                <input type="date" id="effectiveDate">
            </div>
            <div class="form-group">
                <label for="lastReviewed">Last Reviewed</label>
                <input type="date" id="lastReviewed">
            </div>
            <div class="form-group">
                <label for="approvedBy">Approved By</label>
                <input type="text" id="approvedBy" placeholder="CSI Clinical Director">
            </div>
            <div class="form-group">
                <label for="version">Version #</label>
                <input type="text" id="version" placeholder="1.0">
            </div>
            <div class="form-group">
                <label for="purpose">Purpose</label>
                <textarea id="purpose" rows="3"></textarea>
            </div>
            <div class="form-group">
                <label for="scope">Scope</label>
                <textarea id="scope" rows="3"></textarea>
            </div>
            <div class="form-group">
                <label for="policyStatement">Policy Statement</label>
                <textarea id="policyStatement" rows="3"></textarea>
            </div>
            <div class="form-group">
                <label for="definitions">Definitions</label>
                <textarea id="definitions" rows="3"></textarea>
            </div>
            <div class="form-group">
                <label for="procedure">Procedure / Implementation</label>
                <textarea id="procedure" rows="5"></textarea>
            </div>
            <div class="form-group">
                <label for="roles">Responsibilities</label>
                <textarea id="roles" rows="4"></textarea>
            </div>
            <div class="form-group">
                <label for="compliance">Consequences / Accountability</label>
                <textarea id="compliance" rows="3"></textarea>
            </div>
            <div class="form-group">
                <label for="relatedDocuments">Related Documents</label>
                <textarea id="relatedDocuments" rows="2"></textarea>
            </div>
            <div class="form-group">
                <label for="reviewApproval">Review & Approval</label>
                <textarea id="reviewApproval" rows="2"></textarea>
            </div>
        `;
    } else if (policyType === 'sog') {
        // LEVEL 2 - STANDARD OPERATING GUIDELINE HEADERS
        fieldsHTML = `
            <div class="form-group">
                <label for="effectiveDate">Effective Date</label>
                <input type="date" id="effectiveDate">
            </div>
            <div class="form-group">
                <label for="author">Author</label>
                <input type="text" id="author" placeholder="CSI Clinical Staff">
            </div>
            <div class="form-group">
                <label for="approvedBy">Approved By</label>
                <input type="text" id="approvedBy" placeholder="CSI Medical Director">
            </div>
            <div class="form-group">
                <label for="version">Version #</label>
                <input type="text" id="version" placeholder="1.0">
            </div>
            <div class="form-group">
                <label for="objective">Objective</label>
                <textarea id="objective" rows="3"></textarea>
            </div>
            <div class="form-group">
                <label for="principles">Guiding Principles</label>
                <textarea id="principles" rows="3"></textarea>
            </div>
            <div class="form-group">
                <label for="procedure">Recommended Approach / Procedure</label>
                <textarea id="procedure" rows="5"></textarea>
            </div>
            <div class="form-group">
                <label for="definitions">Definitions</label>
                <textarea id="definitions" rows="3"></textarea>
            </div>
            <div class="form-group">
                <label for="examples">Examples / Scenarios</label>
                <textarea id="examples" rows="4"></textarea>
            </div>
            <div class="form-group">
                <label for="roles">Responsibilities</label>
                <textarea id="roles" rows="4"></textarea>
            </div>
            <div class="form-group">
                <label for="escalation">Escalation / Support</label>
                <textarea id="escalation" rows="3"></textarea>
            </div>
            <div class="form-group">
                <label for="review">Review & Revision</label>
                <textarea id="review" rows="2"></textarea>
            </div>
        `;
    } else if (policyType === 'memo') {
        // LEVEL 3 - COMMUNICATION MEMO HEADERS
        fieldsHTML = `
            <div class="form-group">
                <label for="date">Date</label>
                <input type="date" id="date">
            </div>
            <div class="form-group">
                <label for="from">From</label>
                <input type="text" id="from" placeholder="CSI Management">
            </div>
            <div class="form-group">
                <label for="to">To</label>
                <input type="text" id="to" placeholder="All Staff">
            </div>
            <div class="form-group">
                <label for="subject">Subject</label>
                <input type="text" id="subject">
            </div>
            <div class="form-group">
                <label for="message">Message</label>
                <textarea id="message" rows="6"></textarea>
            </div>
            <div class="form-group">
                <label for="effectivePeriod">Effective Period (if applicable)</label>
                <textarea id="effectivePeriod" rows="2"></textarea>
            </div>
            <div class="form-group">
                <label for="nextSteps">Next Steps / Action Required</label>
                <textarea id="nextSteps" rows="3"></textarea>
            </div>
            <div class="form-group">
                <label for="contact">Contact for Questions</label>
                <textarea id="contact" rows="2"></textarea>
            </div>
        `;
    }
    
    dynamicFields.innerHTML = fieldsHTML;
    
    // Set default dates
    const today = new Date().toISOString().split('T')[0];
    const dateInputs = dynamicFields.querySelectorAll('input[type="date"]');
    dateInputs.forEach(input => {
        input.value = today;
    });
    
    // Update policy code when policy type changes
    updateManualPolicyCode();
}

// Survey step navigation functions
function nextStep(stepNumber) {
    // Hide current step
    document.querySelector('.survey-step.active').classList.remove('active');
    // Show next step
    document.getElementById(`step${stepNumber}`).classList.add('active');
}

function prevStep(stepNumber) {
    // Hide current step
    document.querySelector('.survey-step.active').classList.remove('active');
    // Show previous step
    document.getElementById(`step${stepNumber}`).classList.add('active');
}

function generatePolicyFromSurvey() {
    const topic = document.getElementById('aiPolicyTopic').value;
    const type = document.getElementById('aiPolicyType').value;
    const clinics = Array.from(document.querySelectorAll('input[name="clinics"]:checked')).map(cb => cb.value);
    const specificNeeds = document.getElementById('aiSpecificNeeds').value;
    const urgency = document.getElementById('aiUrgency').value;
    const regulations = document.getElementById('aiRegulations').value;
    const existingPolicies = document.getElementById('aiExistingPolicies').value;
    const specialConsiderations = document.getElementById('aiSpecialConsiderations').value;
    const useChatGPT = document.getElementById('useChatGPT').checked;

    // Show loading with research simulation
    document.getElementById('aiSurveyForm').style.display = 'none';
    document.getElementById('aiLoading').style.display = 'block';
    document.getElementById('aiResult').style.display = 'none';
    
    // Different loading messages based on AI mode
    const loadingMessages = useChatGPT ? [
        "Connecting to ChatGPT API...",
        "Analyzing policy requirements with advanced AI...",
        "Researching industry best practices...",
        "Generating comprehensive policy content...",
        "Formatting with CSI-specific headers...",
        "Finalizing professional document..."
    ] : [
        "AI is analyzing your specific needs and requirements...",
        "Researching latest industry best practices and standards...",
        "Analyzing regulatory compliance requirements...",
        "Cross-referencing with existing CSI policies...",
        "Generating comprehensive policy framework...",
        "Incorporating veterinary industry standards (AAHA, AVMA)...",
        "Optimizing for clinic-specific implementation...",
        "Formatting with professional CSI headers...",
        "Finalizing policy structure and content..."
    ];
    
    let messageIndex = 0;
    const messageInterval = setInterval(() => {
        const loadingText = document.querySelector('.ai-loading p');
        if (loadingText && messageIndex < loadingMessages.length) {
            loadingText.textContent = loadingMessages[messageIndex];
            messageIndex++;
        }
    }, 500);

    // Generate policy based on selected AI mode
    if (useChatGPT) {
        // Use ChatGPT for generation
        setTimeout(async () => {
            clearInterval(messageInterval);
            try {
                const generatedPolicy = await generatePolicyWithChatGPT(topic, type, clinics, specificNeeds, urgency, regulations, existingPolicies, specialConsiderations);
                displayAIPolicy(generatedPolicy);
            } catch (error) {
                console.error('ChatGPT generation failed:', error);
                // Fallback to local AI
                const generatedPolicy = generatePolicyFromSurveyData(topic, type, clinics, specificNeeds, urgency, regulations, existingPolicies, specialConsiderations);
                displayAIPolicy(generatedPolicy);
            }
        }, 4000);
    } else {
        // Use local AI generation
        setTimeout(() => {
            clearInterval(messageInterval);
            const generatedPolicy = generatePolicyFromSurveyData(topic, type, clinics, specificNeeds, urgency, regulations, existingPolicies, specialConsiderations);
            displayAIPolicy(generatedPolicy);
        }, 3000);
    }
}

function toggleAIMode() {
    const useChatGPT = document.getElementById('useChatGPT').checked;
    const modeInfo = document.getElementById('aiModeInfo');
    
    if (useChatGPT) {
        modeInfo.innerHTML = '<small>ChatGPT: Más avanzado, requiere conexión a internet</small>';
        modeInfo.style.color = '#28a745';
    } else {
        modeInfo.innerHTML = '<small>Local AI: Rápido, seguro, funciona sin internet</small>';
        modeInfo.style.color = '#6c757d';
    }
}

// Enhanced Policy Generation with Advanced AI Logic
function generateAdvancedPolicyFromSurveyData(topic, type, clinics, specificNeeds, urgency, regulations, existingPolicies, specialConsiderations) {
    const clinicNames = getClinicNames(clinics).join(', ');
    const typeLabel = getTypeLabel(type);
    const currentDate = new Date().toISOString().split('T')[0];
    
    // Advanced AI analysis of survey data
    const urgencyLevel = analyzeUrgency(urgency);
    const regulatoryCompliance = analyzeRegulations(regulations);
    const policyContext = analyzePolicyContext(topic, specificNeeds, specialConsiderations);
    
    // Combine all survey data into comprehensive requirements with AI analysis
    const combinedRequirements = [
        specificNeeds,
        urgencyLevel,
        regulatoryCompliance,
        existingPolicies ? `Existing policies: ${existingPolicies}` : '',
        specialConsiderations ? `Special considerations: ${specialConsiderations}` : '',
        policyContext
    ].filter(Boolean).join('. ');
    
    // Generate comprehensive, topic-specific policy content with proper CSI headers
    const policyContent = generateCSIPolicyWithHeaders(topic, type, combinedRequirements, currentDate, specificNeeds, existingPolicies);
    
    return {
        ...policyContent,
        type: type,
        clinics: clinics,
        additionalRequirements: combinedRequirements,
        keyPoints: specificNeeds,
        previousDocuments: existingPolicies,
        clinicNames: clinicNames,
        typeLabel: typeLabel,
        urgency: urgency,
        regulations: regulations
    };
}

// ChatGPT Integration Functions
async function generatePolicyWithChatGPT(topic, type, clinics, specificNeeds, urgency, regulations, existingPolicies, specialConsiderations) {
    const clinicNames = getClinicNames(clinics).join(', ');
    const typeLabel = getTypeLabel(type);
    const currentDate = new Date().toISOString().split('T')[0];
    
    // Create a comprehensive prompt for ChatGPT
    const prompt = createChatGPTPrompt(topic, type, clinics, specificNeeds, urgency, regulations, existingPolicies, specialConsiderations);
    
    try {
        // Call ChatGPT API
        const response = await callChatGPTAPI(prompt);
        
        // Parse the response and create policy object
        const policyContent = parseChatGPTResponse(response, type, currentDate);
        
        return {
            ...policyContent,
            type: type,
            clinics: clinics,
            additionalRequirements: specificNeeds,
            keyPoints: specificNeeds,
            previousDocuments: existingPolicies,
            clinicNames: clinicNames,
            typeLabel: typeLabel,
            urgency: urgency,
            regulations: regulations,
            generatedBy: 'ChatGPT'
        };
    } catch (error) {
        console.error('ChatGPT API Error:', error);
        // Fallback to local AI generation
        return generateAdvancedPolicyFromSurveyData(topic, type, clinics, specificNeeds, urgency, regulations, existingPolicies, specialConsiderations);
    }
}

function createChatGPTPrompt(topic, type, clinics, specificNeeds, urgency, regulations, existingPolicies, specialConsiderations) {
    const clinicNames = getClinicNames(clinics).join(', ');
    const typeLabel = getTypeLabel(type);
    
    let prompt = `You are a healthcare policy expert creating a professional ${typeLabel} for CSI (Clinical Services Inc.) veterinary clinics. 

TOPIC: ${topic}
TYPE: ${typeLabel}
CLINICS: ${clinicNames}
URGENCY: ${urgency}
REGULATIONS: ${regulations}
SPECIFIC NEEDS: ${specificNeeds}
EXISTING POLICIES: ${existingPolicies}
SPECIAL CONSIDERATIONS: ${specialConsiderations}

Please create a comprehensive, professional policy document with the following structure:`;

    if (type === 'admin') {
        prompt += `

LEVEL 1 — ADMIN POLICY HEADERS:
• Document Title / Header Info
• Effective Date
• Last Reviewed  
• Approved By
• Version #
• Purpose
• Scope
• Policy Statement
• Definitions
• Procedure / Implementation
• Responsibilities
• Consequences / Accountability
• Related Documents
• Review & Approval

Make sure each section contains detailed, specific content relevant to veterinary healthcare operations.`;
    } else if (type === 'sog') {
        prompt += `

LEVEL 2 — STANDARD OPERATING GUIDELINE (SOG) HEADERS:
• SOG Title / Header Info
• Effective Date
• Author
• Approved By
• Version #
• Objective
• Guiding Principles
• Recommended Approach / Procedure
• Definitions
• Examples / Scenarios
• Responsibilities
• Escalation / Support
• Review & Revision

Provide step-by-step procedures and practical examples for veterinary staff.`;
    } else {
        prompt += `

LEVEL 3 — COMMUNICATION MEMO HEADERS:
• CSI Communication Memo Header
• Date
• From
• To
• Subject
• Message
• Effective Period (if applicable)
• Next Steps / Action Required
• Contact for Questions

Create a clear, actionable communication for all staff members.`;
    }

    prompt += `

IMPORTANT: 
- Use professional healthcare language appropriate for veterinary clinics
- Include specific procedures and protocols
- Reference relevant regulations (OSHA, HIPAA, AAHA, AVMA, DEA) where applicable
- Make content actionable and practical for daily operations
- Ensure compliance with veterinary industry standards

Please format your response as a structured policy document with clear headings and detailed content for each section.`;

    return prompt;
}

async function callChatGPTAPI(prompt) {
    // Get API key from user or use environment variable
    const apiKey = getChatGPTAPIKey();
    
    console.log('ChatGPT API Key retrieved:', apiKey ? 'Yes' : 'No');
    console.log('Current company:', currentCompany);
    
    if (!apiKey) {
        throw new Error('ChatGPT API key not configured. Please add your OpenAI API key in the Master Admin Dashboard for your company.');
    }
    
    try {
        console.log('Making ChatGPT API call...');
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
                        content: `You are a professional policy writer for veterinary healthcare facilities. You are part of a policy management system that creates comprehensive, professional policies for veterinary clinics and healthcare organizations.

CONTEXT:
- You are creating policies for veterinary healthcare facilities
- Policies must comply with industry standards (AAHA, AVMA, OSHA, HIPAA)
- You are working within a policy management system with specific formatting requirements
- Users can request modifications to policies after generation

POLICY TYPES:
1. ADMIN POLICIES - High-level organizational policies with these sections:
   - Document Title / Header Info
   - Effective Date
   - Last Reviewed
   - Approved By
   - Version #
   - Purpose
   - Scope
   - Policy Statement
   - Definitions
   - Procedure / Implementation
   - Responsibilities
   - Consequences / Accountability
   - Related Documents
   - Review & Approval

2. STANDARD OPERATING GUIDELINES (SOG) - Operational procedures with these sections:
   - SOG Title / Header Info
   - Effective Date
   - Author
   - Approved By
   - Version #
   - Objective
   - Guiding Principles
   - Recommended Approach / Procedure
   - Definitions
   - Examples / Scenarios
   - Responsibilities
   - Escalation / Support
   - Review & Revision

3. COMMUNICATION MEMOS - Internal communications with these sections:
   - CSI Communication Memo Header
   - Date
   - From
   - To
   - Subject
   - Message
   - Effective Period (if applicable)
   - Next Steps / Action Required
   - Contact for Questions
REQUIREMENTS:
- Create comprehensive, actionable policies
- Include detailed procedures and step-by-step instructions
- Address compliance with relevant regulations
- Include specific responsibilities and accountability measures
- Make policies ready for immediate implementation
- Use professional healthcare/veterinary terminology
- Format as structured policy document with clear headings

Format your response as a complete policy document with all necessary sections filled out with detailed, professional content.`
                    },
                    {
                        role: 'user',
                        content: prompt
                    }
                ],
                max_tokens: 4000,
                temperature: 0.7
            })
        });

        if (!response.ok) {
            console.error('ChatGPT API request failed:', response.status, response.statusText);
            throw new Error(`API request failed: ${response.status} ${response.statusText}`);
        }

        const data = await response.json();
        console.log('ChatGPT API response received:', data);
        
        if (!data.choices || !data.choices[0] || !data.choices[0].message) {
            console.error('Invalid response format:', data);
            throw new Error('Invalid response format from ChatGPT API');
        }

        console.log('ChatGPT API call successful');
        return data;
    } catch (error) {
        console.error('ChatGPT API Error:', error);
        throw new Error(`Failed to generate policy: ${error.message}`);
    }
}

// Webhook loading indicator functions
function showWebhookLoading() {
    console.log('Showing webhook loading indicator');
    // Keep the AI loading screen visible
    document.getElementById('aiLoading').style.display = 'block';
    const loadingText = document.getElementById('aiLoading').querySelector('p');
    if (loadingText) {
        loadingText.textContent = 'AI generating your policy...';
    }
}

function hideWebhookLoading() {
    console.log('Hiding webhook loading indicator');
    // Webhook complete - now show the policy results
    document.getElementById('aiLoading').style.display = 'none';
}

// Webhook function to send policy generation data
// Helper function to get company users' emails
function getCompanyUserEmails() {
    const allUsers = JSON.parse(localStorage.getItem('masterUsers') || '[]');
    const companyUsers = allUsers.filter(user => user.company === currentCompany);
    
    // Return array of user emails
    return companyUsers.map(user => ({
        username: user.username,
        email: user.email || '',
        role: user.role || 'User'
    }));
}

// Webhook function to send policy data when published
async function sendPolicyPublishWebhook(policyData) {
    const webhookUrl = 'http://localhost:5678/webhook/d523361e-1e04-4c16-a86e-bbb1d7729fcb';
    
    console.log('📤 Sending policy publish webhook to:', webhookUrl);
    
    // Get all users in the company
    const allUsers = JSON.parse(localStorage.getItem('masterUsers') || '[]');
    const companyUsers = allUsers.filter(user => user.company === currentCompany);
    
    // Get the organizations this policy applies to
    const policyOrgs = policyData.clinicNames || 'All Organizations';
    const applicableOrgs = policyOrgs === 'All Organizations' ? ['All Organizations'] : policyOrgs.split(', ').map(org => org.trim());
    
    // Filter users based on policy's organizations
    const applicableUsers = companyUsers.filter(user => {
        if (applicableOrgs.includes('All Organizations')) return true;
        
        // Check if user has any of the applicable organizations
        if (user.organizations && Array.isArray(user.organizations)) {
            return user.organizations.some(org => applicableOrgs.includes(org));
        }
        
        // If user doesn't have specific organizations, include them
        return true;
    });
    
    // Prepare user data with names and emails
    const usersData = applicableUsers.map(user => ({
        id: user.id,
        username: user.username,
        email: user.email || '',
        role: user.role || 'User',
        organizations: user.organizations || []
    }));
    
    const webhookPayload = {
        event: 'policy_published',
        timestamp: new Date().toISOString(),
        policy: {
            id: policyData.id,
            title: policyData.title,
            type: policyData.type,
            policyCode: policyData.policyCode,
            organizations: policyData.clinicNames,
            description: policyData.description,
            company: policyData.company || currentCompany,
            created: policyData.created,
            updated: policyData.updated,
            categoryId: policyData.categoryId
        },
        applicableUsers: {
            count: usersData.length,
            users: usersData
        },
        createdBy: {
            username: currentUser?.username || 'Unknown',
            email: currentUser?.email || '',
            company: currentCompany || 'Unknown'
        }
    };
    
    try {
        console.log('📤 Sending webhook with data:', webhookPayload);
        
        const response = await fetch(webhookUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(webhookPayload)
        });
        
        if (response.ok) {
            const responseData = await response.text();
            console.log('✅ Policy publish webhook sent successfully');
            console.log('Webhook response:', responseData);
            return responseData;
        } else {
            console.warn('⚠️ Policy publish webhook failed:', response.status);
            throw new Error(`Webhook failed with status: ${response.status}`);
        }
    } catch (error) {
        console.error('❌ Policy publish webhook error:', error);
        // Don't throw - we don't want to block policy creation if webhook fails
        return null;
    }
}

async function sendPolicyReportWebhook(policyData) {
    // Get webhook URL for policy reports
    const reportWebhookUrl = localStorage.getItem('webhookUrlReport') || 'http://localhost:5678/webhook-report';
    
    console.log('Sending policy report webhook to:', reportWebhookUrl);
    
    // Get company user emails
    const companyUsers = getCompanyUserEmails();
    
    // Prepare full policy report data
    const reportData = {
        timestamp: new Date().toISOString(),
        company: currentCompany || 'Unknown',
        companyUsers: companyUsers,
        policyReport: {
            id: policyData.id,
            title: policyData.title,
            type: policyData.type,
            content: policyData.content || policyData.description,
            organizations: policyData.clinicNames || policyData.organizationNames,
            effectiveDate: policyData.effectiveDate,
            version: policyData.version,
            approvedBy: policyData.approvedBy,
            createdBy: currentUser?.username || 'Unknown',
            lastModified: policyData.lastModified || new Date().toISOString(),
            status: 'active'
        }
    };
    
    try {
        console.log('Sending policy report webhook with data:', reportData);
        
        const response = await fetch(reportWebhookUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(reportData)
        });
        
        if (response.ok) {
            const responseData = await response.text();
            console.log('Policy report webhook sent successfully');
            console.log('Webhook response:', responseData);
            return responseData;
        } else {
            console.warn('Policy report webhook failed:', response.status);
            throw new Error(`Policy report webhook failed with status: ${response.status}`);
        }
    } catch (error) {
        console.error('Policy report webhook error:', error);
        // Don't throw - we don't want to block policy saving if webhook fails
        return null;
    }
}

async function sendPolicyGenerationWebhook(policyData) {
    // Get webhook URL from localStorage or use default
    // Check if it's an AI-generated policy (should use ChatGPT webhook)
    const isAIGenerated = policyData.generatedBy === 'ChatGPT' || policyData.type;
    
    let webhookUrl;
    if (isAIGenerated) {
        // AI Policy Assistant webhook
        webhookUrl = localStorage.getItem('webhookUrlAI') || 'http://localhost:5678/webhook/05da961e-9df0-490e-815f-92d8bc9f9c1e';
    } else {
        // Manual policy or other webhook
        webhookUrl = localStorage.getItem('webhookUrlManual') || localStorage.getItem('webhookUrlAI') || 'http://localhost:5678/webhook/05da961e-9df0-490e-815f-92d8bc9f9c1e';
    }
    
    console.log('Using webhook URL:', webhookUrl, 'for AI-generated:', isAIGenerated);
    
    const webhookData = {
        timestamp: new Date().toISOString(),
        policyType: policyData.type,
        organizations: policyData.clinicNames || policyData.organizationNames,
        userPrompt: policyData.prompt || policyData.userPrompt,
        company: currentCompany || 'Unknown',
        username: currentUser?.username || 'Unknown',
        tool: isAIGenerated ? 'ai-policy-assistant' : 'manual-policy'
    };
    
    try {
        console.log('Sending webhook with policy generation data:', webhookData);
        // Using GET request with query parameters
        const queryParams = new URLSearchParams(webhookData);
        const response = await fetch(`${webhookUrl}?${queryParams}`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json'
            }
        });
        
        if (response.ok) {
            const responseData = await response.text();
            console.log('Webhook sent successfully');
            console.log('Webhook response:', responseData);
            return responseData;
        } else {
            console.warn('Webhook failed:', response.status);
            throw new Error(`Webhook failed with status: ${response.status}`);
        }
    } catch (error) {
        console.error('Webhook error:', error);
        throw error; // Now we throw so caller can handle it
    }
}

async function generateEnhancedLocalResponse(prompt) {
    // Extract key information from the prompt
    const topic = extractFromPrompt(prompt, 'TOPIC:');
    const type = extractFromPrompt(prompt, 'TYPE:');
    const clinics = extractFromPrompt(prompt, 'CLINICS:');
    const urgency = extractFromPrompt(prompt, 'URGENCY:');
    const regulations = extractFromPrompt(prompt, 'REGULATIONS:');
    const specificNeeds = extractFromPrompt(prompt, 'SPECIFIC NEEDS:');
    
    // Generate a comprehensive policy response
    let response = `# ${topic} - ${type}\n\n`;
    
    if (type.includes('Admin Policy')) {
        response += generateAdminPolicyContent(topic, clinics, urgency, regulations, specificNeeds);
    } else if (type.includes('Standard Operating Guidelines')) {
        response += generateSOGContent(topic, clinics, urgency, regulations, specificNeeds);
    } else if (type.includes('Communication Memo')) {
        response += generateMemoContent(topic, clinics, urgency, regulations, specificNeeds);
    }
    
    return response;
}

function extractFromPrompt(prompt, keyword) {
    const lines = prompt.split('\n');
    for (let line of lines) {
        if (line.includes(keyword)) {
            return line.replace(keyword, '').trim();
        }
    }
    return '';
}

function expandAndProfessionalize(userNotes, sectionType, topic, urgency, regulations) {
    if (!userNotes || userNotes.trim() === '') {
        return getDefaultContent(sectionType, topic);
    }
    
    // Convert user notes to professional, expanded content
    let expandedContent = '';
    
    switch (sectionType) {
        case 'purpose':
            expandedContent = expandPurpose(userNotes, topic, urgency, regulations);
            break;
        case 'procedures':
            expandedContent = expandProcedures(userNotes, topic, urgency, regulations);
            break;
        case 'responsibilities':
            expandedContent = expandResponsibilities(userNotes, topic, urgency, regulations);
            break;
        default:
            expandedContent = professionalizeText(userNotes, topic, urgency, regulations);
    }
    
    return expandedContent;
}

function expandPurpose(userNotes, topic, urgency, regulations) {
    const urgencyText = urgency === 'immediate' ? 'immediate implementation' : urgency === 'high' ? 'priority implementation' : 'standard implementation';
    const regulatoryText = regulations ? ` in compliance with ${regulations}` : '';
    
    return `The primary objective of this policy is to ${userNotes.toLowerCase()}${regulatoryText}. This policy is designed for ${urgencyText} and establishes clear guidelines for all staff members to ensure consistent, safe, and effective operations. The policy addresses specific challenges and requirements related to ${topic.toLowerCase()} while maintaining the highest standards of patient care and regulatory compliance.`;
}

function expandProcedures(userNotes, topic, urgency, regulations) {
    const steps = userNotes.split(/[,;]/).map(step => step.trim()).filter(step => step);
    
    if (steps.length === 0) {
        return getDefaultContent('procedures', topic);
    }
    
    let expandedProcedures = `The following procedures have been established to address the specific requirements outlined:`;
    
    steps.forEach((step, index) => {
        expandedProcedures += `\n\n${index + 1}. **${professionalizeStepTitle(step)}**: ${professionalizeStepDescription(step, topic, urgency, regulations)}`;
    });
    
    expandedProcedures += `\n\n**Implementation Guidelines**: All staff members must follow these procedures consistently. Regular training and competency assessments will ensure proper implementation. Documentation of all activities is required for compliance and quality assurance purposes.`;
    
    return expandedProcedures;
}

function expandResponsibilities(userNotes, topic, urgency, regulations) {
    const responsibilityText = userNotes.toLowerCase();
    let expandedResponsibilities = `**Primary Responsibilities**: ${professionalizeText(userNotes, topic, urgency, regulations)}`;
    
    // Add role-specific responsibilities based on settings
    if (roles.length > 0) {
        expandedResponsibilities += `\n\n**Role-Specific Responsibilities**:`;
        roles.forEach(role => {
            expandedResponsibilities += `\n\n**${role.name}**: ${role.description}. In relation to ${topic.toLowerCase()}, this role is responsible for ensuring compliance with established procedures and maintaining documentation as required.`;
        });
    }
    
    expandedResponsibilities += `\n\n**Accountability Measures**: All staff members are accountable for following these procedures. Regular monitoring and performance evaluations will ensure compliance with policy requirements.`;
    
    return expandedResponsibilities;
}

function professionalizeText(text, topic, urgency, regulations) {
    // Convert casual notes to professional language
    let professionalText = text;
    
    // Replace casual phrases with professional equivalents
    const replacements = {
        'make sure': 'ensure',
        'need to': 'must',
        'should': 'shall',
        'have to': 'are required to',
        'gotta': 'must',
        'wanna': 'want to',
        'gonna': 'will',
        'stuff': 'procedures',
        'things': 'elements',
        'check': 'verify',
        'look at': 'review',
        'do': 'perform',
        'get': 'obtain',
        'put': 'place',
        'use': 'utilize',
        'tell': 'inform',
        'ask': 'request',
        'help': 'assist',
        'fix': 'resolve',
        'clean': 'sanitize',
        'wash': 'cleanse'
    };
    
    Object.entries(replacements).forEach(([casual, professional]) => {
        const regex = new RegExp(`\\b${casual}\\b`, 'gi');
        professionalText = professionalText.replace(regex, professional);
    });
    
    // Add professional context
    if (topic) {
        professionalText = professionalText.replace(/\b(policy|procedure|process)\b/gi, `${topic} policy`);
    }
    
    return professionalText.charAt(0).toUpperCase() + professionalText.slice(1);
}

function professionalizeStepTitle(step) {
    const title = step.trim();
    const capitalized = title.charAt(0).toUpperCase() + title.slice(1);
    
    // Add professional context if needed
    if (!title.includes('procedure') && !title.includes('process') && !title.includes('protocol')) {
        return `${capitalized} Procedure`;
    }
    
    return capitalized;
}

function professionalizeStepDescription(step, topic, urgency, regulations) {
    let description = professionalizeText(step, topic, urgency, regulations);
    
    // Add specific details based on the step content
    if (step.toLowerCase().includes('check') || step.toLowerCase().includes('verify')) {
        description += ' This includes thorough examination and documentation of findings.';
    } else if (step.toLowerCase().includes('clean') || step.toLowerCase().includes('wash')) {
        description += ' Proper sanitization procedures must be followed according to established protocols.';
    } else if (step.toLowerCase().includes('train') || step.toLowerCase().includes('teach')) {
        description += ' Training must be documented and competency assessments completed.';
    } else if (step.toLowerCase().includes('report') || step.toLowerCase().includes('document')) {
        description += ' All documentation must be accurate, complete, and maintained according to regulatory requirements.';
    }
    
    return description;
}

function getDefaultContent(sectionType, topic) {
    const defaults = {
        purpose: `This policy establishes comprehensive guidelines for ${topic.toLowerCase()} to ensure consistent, safe, and effective operations across all CSI clinic locations.`,
        procedures: `1. **Initial Assessment**: Evaluate current practices and identify areas for improvement\n2. **Staff Training**: Provide comprehensive training on ${topic.toLowerCase()} procedures\n3. **Implementation**: Roll out standardized procedures across all clinic locations\n4. **Monitoring**: Regular assessment of compliance and effectiveness\n5. **Continuous Improvement**: Regular review and updates based on feedback and regulatory changes`,
        responsibilities: `**All Staff**: Follow established protocols, participate in training, report issues promptly\n**Supervisors**: Ensure compliance, provide training, monitor performance\n**Clinic Managers**: Support implementation, address systemic issues, integrate with overall operations`
    };
    
    return defaults[sectionType] || 'Professional content will be generated based on the specific requirements.';
}

function generateAdminPolicyContent(topic, clinics, urgency, regulations, specificNeeds) {
    const expandedPurpose = expandAndProfessionalize(specificNeeds, 'purpose', topic, urgency, regulations);
    const expandedProcedures = expandAndProfessionalize(specificNeeds, 'procedures', topic, urgency, regulations);
    const expandedResponsibilities = expandAndProfessionalize(specificNeeds, 'responsibilities', topic, urgency, regulations);
    
    return `## PURPOSE
${expandedPurpose}

This policy establishes comprehensive guidelines for ${topic.toLowerCase()} to ensure consistent, safe, and effective operations across all CSI clinic locations (${clinics}). This policy addresses the specific requirements and best practices for ${topic.toLowerCase()} in our veterinary healthcare environment.

## SCOPE
This policy applies to all staff members, including veterinarians, veterinary technicians, support staff, and administrative personnel at the following CSI locations: ${clinics}. The policy covers all aspects of ${topic.toLowerCase()} operations and procedures.

## POLICY STATEMENT
CSI is committed to maintaining the highest standards of ${topic.toLowerCase()} practices. All staff members must adhere to the procedures outlined in this policy to ensure compliance with regulatory requirements and industry best practices.

${regulations ? `Regulatory Compliance: This policy ensures compliance with ${regulations}.` : ''}

## DEFINITIONS
- **${topic}**: The comprehensive set of procedures and guidelines outlined in this policy
- **CSI Staff**: All employees working at CSI clinic locations
- **Compliance**: Adherence to all applicable regulations and internal procedures
- **Documentation**: Written records of all ${topic.toLowerCase()} activities

## PROCEDURE / IMPLEMENTATION
${expandedProcedures}

${urgency ? `Priority Level: ${urgency} - This policy requires immediate attention and implementation.` : ''}

## RESPONSIBILITIES
${expandedResponsibilities}

## CONSEQUENCES / ACCOUNTABILITY
Non-compliance with this policy may result in disciplinary action up to and including termination. All staff members are responsible for understanding and following these procedures.

## RELATED DOCUMENTS
- CSI Employee Handbook
- Regulatory compliance guidelines
- Industry best practice standards
- Training materials and procedures

## REVIEW & APPROVAL
This policy will be reviewed annually and updated as necessary to reflect changes in regulations, industry standards, or operational requirements.`;
}

function generateSOGContent(topic, clinics, urgency, regulations, specificNeeds) {
    return `## OBJECTIVE
To provide standardized operating procedures for ${topic.toLowerCase()} across all CSI clinic locations (${clinics}), ensuring consistent, efficient, and safe operations.

${specificNeeds ? `Specific Requirements: ${specificNeeds}` : ''}

## GUIDING PRINCIPLES
- Patient safety is the top priority
- Consistency across all clinic locations
- Compliance with regulatory requirements
- Continuous improvement and staff development

## RECOMMENDED APPROACH / PROCEDURE
1. **Preparation**: Gather necessary equipment and materials
2. **Assessment**: Evaluate the situation and determine appropriate actions
3. **Implementation**: Follow step-by-step procedures
4. **Documentation**: Record all activities and outcomes
5. **Follow-up**: Monitor results and make adjustments as needed

${urgency ? `Priority Level: ${urgency} - This procedure requires immediate implementation.` : ''}

## DEFINITIONS
- **Standard Operating Procedure**: Documented process for completing specific tasks
- **Quality Assurance**: Systematic approach to ensuring consistent outcomes
- **Compliance**: Adherence to established procedures and regulations

## EXAMPLES / SCENARIOS
Common scenarios include routine operations, emergency situations, and special cases. Each scenario requires specific procedures and documentation.

${regulations ? `Regulatory Compliance: This procedure ensures compliance with ${regulations}.` : ''}

## RESPONSIBILITIES
**Staff Members**: Follow procedures, maintain documentation, report issues
**Supervisors**: Monitor compliance, provide support, address concerns
**Management**: Ensure resources are available, support continuous improvement

## ESCALATION / SUPPORT
For questions or concerns, contact your immediate supervisor or clinic manager. Emergency situations should be escalated immediately.

## REVIEW & REVISION
This guideline will be reviewed quarterly and updated based on staff feedback, regulatory changes, and operational improvements.`;
}

function generateMemoContent(topic, clinics, urgency, regulations, specificNeeds) {
    return `## MESSAGE
This memo serves to inform all staff members at CSI clinic locations (${clinics}) about important updates regarding ${topic.toLowerCase()}.

${specificNeeds ? `Key Requirements: ${specificNeeds}` : ''}

All staff members must follow the updated procedures outlined in this communication to ensure compliance with regulatory requirements and maintain the highest standards of patient care.

## EFFECTIVE PERIOD
This communication is effective immediately and will remain in effect until further notice.

## NEXT STEPS / ACTION REQUIRED
All staff members are required to:
1. Review this information carefully
2. Implement any necessary changes
3. Contact supervisors with questions
4. Ensure compliance with updated procedures

${urgency ? `Note: This is a ${urgency} priority communication.` : ''}

## CONTACT FOR QUESTIONS
For questions about this memo or related procedures, please contact your immediate supervisor or the clinic manager at your location.`;
}

// Duplicate parseChatGPTResponse function removed - using the more comprehensive version defined later

function parsePolicyContent(content) {
    const sections = {};
    const lines = content.split('\n');
    let currentSection = '';
    let currentContent = [];
    
    for (let line of lines) {
        if (line.startsWith('## ')) {
            // Save previous section
            if (currentSection) {
                sections[currentSection] = currentContent.join('\n').trim();
            }
            // Start new section
            currentSection = line.replace('## ', '').trim();
            currentContent = [];
        } else if (currentSection && line.trim()) {
            currentContent.push(line);
        }
    }
    
    // Save last section
    if (currentSection) {
        sections[currentSection] = currentContent.join('\n').trim();
    }
    
    return sections;
}

// Advanced AI Analysis Functions
function analyzeUrgency(urgency) {
    const urgencyAnalysis = {
        'immediate': 'This policy requires immediate implementation due to regulatory compliance, safety concerns, or operational necessity. All staff must be trained and procedures implemented within 48 hours.',
        'soon': 'This policy should be implemented within the next month to maintain compliance and operational efficiency. Training and implementation should be scheduled promptly.',
        'planned': 'This policy is part of regular policy updates and improvements. Implementation can be scheduled as part of normal operations and training cycles.'
    };
    return urgencyAnalysis[urgency] || '';
}

function analyzeRegulations(regulations) {
    if (!regulations || !regulations.trim()) return '';
    
    const regulationAnalysis = {
        'osha': 'OSHA compliance requirements mandate specific safety protocols, training programs, and documentation standards.',
        'hipaa': 'HIPAA compliance requires strict privacy protection, data security measures, and patient information handling protocols.',
        'aaha': 'AAHA standards require evidence-based practices, quality assurance measures, and comprehensive care protocols.',
        'avma': 'AVMA guidelines establish professional standards, ethical practices, and quality of care requirements.',
        'dea': 'DEA regulations require controlled substance protocols, secure storage, and comprehensive documentation.'
    };
    
    let analysis = '';
    const regLower = regulations.toLowerCase();
    for (const [key, value] of Object.entries(regulationAnalysis)) {
        if (regLower.includes(key)) {
            analysis += value + ' ';
        }
    }
    
    return analysis.trim();
}

function analyzePolicyContext(topic, specificNeeds, specialConsiderations) {
    const contextAnalysis = {
        'fire': 'Fire safety policies require immediate response protocols, evacuation procedures, and emergency coordination.',
        'safety': 'Safety policies must address risk assessment, prevention measures, and incident response procedures.',
        'hygiene': 'Hygiene policies require infection control measures, sanitation protocols, and health monitoring.',
        'data': 'Data policies must address security, privacy, access control, and compliance requirements.',
        'emergency': 'Emergency policies require rapid response protocols, communication procedures, and resource management.',
        'medication': 'Medication policies require safety protocols, administration procedures, and regulatory compliance.',
        'infection': 'Infection control policies require prevention measures, monitoring protocols, and outbreak response.',
        'appointment': 'Appointment policies require scheduling efficiency, client communication, and resource management.',
        'documentation': 'Documentation policies require accuracy standards, retention protocols, and compliance measures.'
    };
    
    let context = '';
    const topicLower = topic.toLowerCase();
    for (const [key, value] of Object.entries(contextAnalysis)) {
        if (topicLower.includes(key)) {
            context += value + ' ';
        }
    }
    
    return context.trim();
}


function generatePolicyFromSurveyData(topic, type, clinics, specificNeeds, urgency, regulations, existingPolicies, specialConsiderations) {
    const clinicNames = getClinicNames(clinics).join(', ');
    const typeLabel = getTypeLabel(type);
    const currentDate = new Date().toISOString().split('T')[0];
    
    // Combine all survey data into comprehensive requirements
    const combinedRequirements = [
        specificNeeds,
        urgency ? `Urgency: ${urgency}` : '',
        regulations ? `Regulations: ${regulations}` : '',
        existingPolicies ? `Existing policies: ${existingPolicies}` : '',
        specialConsiderations ? `Special considerations: ${specialConsiderations}` : ''
    ].filter(Boolean).join('. ');
    
    // Generate comprehensive, topic-specific policy content with proper CSI headers
    const policyContent = generateCSIPolicyWithHeaders(topic, type, combinedRequirements, currentDate, specificNeeds, existingPolicies);
    
    return {
        ...policyContent,
        type: type,
        clinics: clinics,
        additionalRequirements: combinedRequirements,
        keyPoints: specificNeeds,
        previousDocuments: existingPolicies,
        clinicNames: clinicNames,
        typeLabel: typeLabel
    };
}

// Document Export Functionality
function exportPolicy(format) {
    const policy = window.currentGeneratedPolicy;
    if (!policy) {
        alert('No policy available to export. Please generate a policy first.');
        return;
    }
    
    if (format === 'pdf') {
        exportToPDF(policy);
    } else if (format === 'docx') {
        exportToWord(policy);
    }
}

function exportToPDF(policy) {
    // Create a new window for PDF generation
    const printWindow = window.open('', '_blank');
    const policyHTML = generatePolicyHTML(policy);
    
    printWindow.document.write(`
        <!DOCTYPE html>
        <html>
        <head>
            <title>${policy.title}</title>
            <style>
                body { font-family: Arial, sans-serif; margin: 40px; line-height: 1.6; }
                .policy-header { border-bottom: 2px solid #333; padding-bottom: 20px; margin-bottom: 30px; }
                .policy-meta { background: #f5f5f5; padding: 15px; margin-bottom: 20px; border-radius: 5px; }
                .policy-section { margin-bottom: 25px; }
                .policy-section h5 { color: #333; border-bottom: 1px solid #ccc; padding-bottom: 5px; }
                .policy-content { margin-top: 10px; white-space: pre-wrap; }
                @media print { body { margin: 20px; } }
            </style>
        </head>
        <body>
            ${policyHTML}
        </body>
        </html>
    `);
    
    printWindow.document.close();
    printWindow.print();
}

function exportToWord(policy) {
    // Create Word document content
    const policyHTML = generatePolicyHTML(policy);
    
    // Convert HTML to Word format
    const wordContent = `
        <html xmlns:o='urn:schemas-microsoft-com:office:office' 
              xmlns:w='urn:schemas-microsoft-com:office:word' 
              xmlns='http://www.w3.org/TR/REC-html40'>
        <head>
            <meta charset='utf-8'>
            <title>${policy.title}</title>
            <!--[if gte mso 9]>
            <xml>
                <w:WordDocument>
                    <w:View>Print</w:View>
                    <w:Zoom>90</w:Zoom>
                </w:WordDocument>
            </xml>
            <![endif]-->
            <style>
                body { font-family: Arial, sans-serif; margin: 40px; line-height: 1.6; }
                .policy-header { border-bottom: 2px solid #333; padding-bottom: 20px; margin-bottom: 30px; }
                .policy-meta { background: #f5f5f5; padding: 15px; margin-bottom: 20px; border-radius: 5px; }
                .policy-section { margin-bottom: 25px; }
                .policy-section h5 { color: #333; border-bottom: 1px solid #ccc; padding-bottom: 5px; }
                .policy-content { margin-top: 10px; white-space: pre-wrap; }
            </style>
        </head>
        <body>
            ${policyHTML}
        </body>
        </html>
    `;
    
    // Create and download the Word document
    const blob = new Blob([wordContent], { type: 'application/msword' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${policy.title.replace(/[^a-z0-9]/gi, '_').toLowerCase()}.doc`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
}
function generatePolicyHTML(policy) {
    const currentDate = new Date().toLocaleDateString();
    
    if (policy.type === 'admin') {
        return `
            <div class="policy-header">
                <h1>${policy.title}</h1>
                <div class="policy-meta">
                    <p><strong>Effective Date:</strong> ${policy.effectiveDate}</p>
                    <p><strong>Last Reviewed:</strong> ${policy.lastReviewed}</p>
                    <p><strong>Approved By:</strong> ${policy.approvedBy}</p>
                    <p><strong>Version:</strong> ${policy.version}</p>
                    <p><strong>Applicable Clinics:</strong> ${policy.clinicNames}</p>
                </div>
            </div>
            
            <div class="policy-section">
                <h5>Purpose</h5>
                <div class="policy-content">${policy.purpose}</div>
            </div>
            
            <div class="policy-section">
                <h5>Scope</h5>
                <div class="policy-content">${policy.scope}</div>
            </div>
            
            <div class="policy-section">
                <h5>Policy Statement</h5>
                <div class="policy-content">${policy.policyStatement}</div>
            </div>
            
            <div class="policy-section">
                <h5>Definitions</h5>
                <div class="policy-content">${policy.definitions}</div>
            </div>
            
            <div class="policy-section">
                <h5>Procedure / Implementation</h5>
                <div class="policy-content">${policy.procedure}</div>
            </div>
            
            <div class="policy-section">
                <h5>Responsibilities</h5>
                <div class="policy-content">${policy.roles}</div>
            </div>
            
            <div class="policy-section">
                <h5>Consequences / Accountability</h5>
                <div class="policy-content">${policy.compliance}</div>
            </div>
            
            <div class="policy-section">
                <h5>Related Documents</h5>
                <div class="policy-content">${policy.relatedDocuments}</div>
            </div>
            
            <div class="policy-section">
                <h5>Review & Approval</h5>
                <div class="policy-content">${policy.reviewApproval}</div>
            </div>
        `;
    } else if (policy.type === 'sog') {
        return `
            <div class="policy-header">
                <h1>${policy.title}</h1>
                <div class="policy-meta">
                    <p><strong>Effective Date:</strong> ${policy.effectiveDate}</p>
                    <p><strong>Author:</strong> ${policy.author}</p>
                    <p><strong>Approved By:</strong> ${policy.approvedBy}</p>
                    <p><strong>Version:</strong> ${policy.version}</p>
                    <p><strong>Applicable Clinics:</strong> ${policy.clinicNames}</p>
                </div>
            </div>
            
            <div class="policy-section">
                <h5>Objective</h5>
                <div class="policy-content">${policy.objective}</div>
            </div>
            
            <div class="policy-section">
                <h5>Guiding Principles</h5>
                <div class="policy-content">${policy.principles}</div>
            </div>
            
            <div class="policy-section">
                <h5>Recommended Approach / Procedure</h5>
                <div class="policy-content">${policy.procedure}</div>
            </div>
            
            <div class="policy-section">
                <h5>Definitions</h5>
                <div class="policy-content">${policy.definitions}</div>
            </div>
            
            <div class="policy-section">
                <h5>Examples / Scenarios</h5>
                <div class="policy-content">${policy.examples}</div>
            </div>
            
            <div class="policy-section">
                <h5>Responsibilities</h5>
                <div class="policy-content">${policy.roles}</div>
            </div>
            
            <div class="policy-section">
                <h5>Escalation / Support</h5>
                <div class="policy-content">${policy.escalation}</div>
            </div>
            
            <div class="policy-section">
                <h5>Review & Revision</h5>
                <div class="policy-content">${policy.review}</div>
            </div>
        `;
    } else {
        return `
            <div class="policy-header">
                <h1>CSI Communication Memo</h1>
                <div class="policy-meta">
                    <p><strong>Date:</strong> ${policy.date}</p>
                    <p><strong>From:</strong> ${policy.from}</p>
                    <p><strong>To:</strong> ${policy.to}</p>
                    <p><strong>Subject:</strong> ${policy.subject}</p>
                    <p><strong>Applicable Clinics:</strong> ${policy.clinicNames}</p>
                </div>
            </div>
            
            <div class="policy-section">
                <h5>Message</h5>
                <div class="policy-content">${policy.message}</div>
            </div>
            
            <div class="policy-section">
                <h5>Effective Period</h5>
                <div class="policy-content">${policy.effectivePeriod}</div>
            </div>
            
            <div class="policy-section">
                <h5>Next Steps / Action Required</h5>
                <div class="policy-content">${policy.nextSteps}</div>
            </div>
            
            <div class="policy-section">
                <h5>Contact for Questions</h5>
                <div class="policy-content">${policy.contact}</div>
            </div>
        `;
    }
}

// Password Protection Functions

function displayAdminDrafts() {
    const adminDraftList = document.getElementById('adminDraftList');
    
    if (draftPolicies.length === 0) {
        adminDraftList.innerHTML = '<p class="no-drafts">No draft policies available.</p>';
        return;
    }
    
    adminDraftList.innerHTML = draftPolicies.map(draft => `
        <div class="draft-item">
            <div class="draft-info">
                <h4>${draft.title}</h4>
                <p><strong>Type:</strong> ${getTypeLabel(draft.type)}</p>
                <p><strong>Clinics:</strong> ${draft.clinicNames}</p>
                <p><strong>Created:</strong> ${draft.created}</p>
            </div>
            <div class="draft-actions">
                <button class="btn btn-small btn-primary" onclick="editDraft(${draft.id})">
                    <i class="fas fa-edit"></i> Edit
                </button>
                <button class="btn btn-small btn-success" onclick="publishDraft(${draft.id})">
                    <i class="fas fa-check"></i> Publish
                </button>
                <button class="btn btn-small btn-danger" onclick="deleteDraft(${draft.id})">
                    <i class="fas fa-trash"></i> Delete
                </button>
            </div>
        </div>
    `).join('');
}

// Modal Functions
function populateOrganizationsDropdown() {
    console.log('🏢 populateOrganizationsDropdown called');
    const clinicSelect = document.getElementById('clinicApplicability');
    if (!clinicSelect) {
        console.error('❌ clinicApplicability select element not found!');
        return;
    }
    
    // Clear existing options
    clinicSelect.innerHTML = '';
    
    console.log('🏢 Current company:', currentCompany);
    
    // Load ALL organizations from all sources
    let companyOrgs = [];
    
    // Try localStorage organizations first
    const orgData = localStorage.getItem('organizations');
    if (orgData) {
        const loadedOrgs = JSON.parse(orgData);
        console.log('📋 All organizations in localStorage:', loadedOrgs);
        if (currentCompany && loadedOrgs[currentCompany]) {
            companyOrgs = loadedOrgs[currentCompany];
        } else {
            // Get all organizations from all companies
            companyOrgs = Object.values(loadedOrgs).flat();
            companyOrgs = [...new Set(companyOrgs)]; // Remove duplicates
        }
        console.log('✅ Loaded organizations:', companyOrgs);
    }
    
    // If still empty, try masterCompanies
    if (companyOrgs.length === 0) {
        const masterCompanies = JSON.parse(localStorage.getItem('masterCompanies') || '[]');
        if (masterCompanies.length > 0) {
            companyOrgs = masterCompanies.map(company => company.name);
            console.log('✅ Using master companies:', companyOrgs);
        }
    }
    
    // If STILL empty, show a message
    if (companyOrgs.length === 0) {
        clinicSelect.innerHTML = '<option value="">No organizations available. Add organizations in Admin Dashboard.</option>';
        console.warn('⚠️ No organizations found for any source!');
        return;
    }
    
    // Add organizations to dropdown
    companyOrgs.forEach(org => {
        const option = document.createElement('option');
        option.value = org.toLowerCase().replace(/\s+/g, '-');
        option.textContent = org;
        clinicSelect.appendChild(option);
    });
    
    console.log('✅ Added', companyOrgs.length, 'organizations to dropdown');
}

function populateAIOrganizations() {
    // Get the AI organizations checkbox group
    const clinicGroup = document.getElementById('aiClinicApplicabilityCheckboxes');
    if (!clinicGroup) return;
    
    // Clear existing checkboxes
    clinicGroup.innerHTML = '';
    
    // Load organizations from localStorage for the current company
    const orgData = localStorage.getItem('organizations');
    let companyOrgs = [];
    
    if (orgData) {
        const loadedOrgs = JSON.parse(orgData);
        companyOrgs = loadedOrgs[currentCompany] || [];
    } else if (organizations[currentCompany]) {
        companyOrgs = organizations[currentCompany];
    }
    
    // If no company-specific orgs, try master companies
    if (companyOrgs.length === 0) {
        const masterCompanies = JSON.parse(localStorage.getItem('masterCompanies') || '[]');
        if (masterCompanies.length > 0) {
            companyOrgs = masterCompanies.map(company => company.name);
        }
    }
    
    // Fall back to default organizations if still empty
    if (companyOrgs.length === 0) {
        companyOrgs = ['Tudor Glen', 'River Valley', 'Rosslyn', 'UPC'];
    }
    
    if (companyOrgs.length === 0) {
        clinicGroup.innerHTML = '<p style="color: #999;">No organizations available. Add organizations in the Admin Dashboard.</p>';
        return;
    }
    
    // Add organizations from the companies
    companyOrgs.forEach(org => {
        const label = document.createElement('label');
        label.innerHTML = `<input type="checkbox" name="clinics" value="${org.toLowerCase().replace(/\s+/g, '-')}"> ${org}`;
        clinicGroup.appendChild(label);
    });
}

function openCreateModal() {
    console.log('📝 openCreateModal called');
    // Keep admin dashboard open, just open create modal on top
    // Open create policy modal (z-index 3500, above admin modal at 2000)
    document.getElementById('createModal').style.display = 'block';
    
    // Small delay to ensure DOM is ready
    setTimeout(() => {
    // Populate category dropdown
    populateManualCategoryDropdown();
    }, 50);
}

function closeCreateModal() {
    document.getElementById('createModal').style.display = 'none';
    document.getElementById('policyForm').reset();
    document.getElementById('dynamicManualFormFields').innerHTML = '';
    
    // Keep admin dashboard open if it was open
    const adminModal = document.getElementById('adminModal');
    if (adminModal && adminModal.style.display !== 'none') {
        console.log('Admin dashboard is open, keeping it visible');
        // Already open, do nothing
        return;
    }
}

// ChatGPT-Style Policy Creation System
let chatState = {
    step: 'start',
    isGenerating: false,
    currentPolicy: null
};

function populateRolesAndDisciplinaryActions() {
    // Load from admin settings or use defaults
    const defaultRoles = ['Clinic Manager', 'Medical Director', 'Staff'];
    const defaultDisciplinaryActions = ['Verbal Warning', 'Written Warning', 'Suspension', 'Termination'];
    
    // Load organizations for the current company
    let allOrgs = [];
    
    // First try to load from localStorage organizations for the current company
    const orgData = localStorage.getItem('organizations');
    console.log('Current company:', currentCompany);
    console.log('Organizations from localStorage:', orgData);
    
    if (orgData) {
        const loadedOrgs = JSON.parse(orgData);
        console.log('Parsed organizations:', loadedOrgs);
        console.log('Company keys in loadedOrgs:', Object.keys(loadedOrgs));
        
        // Get organizations for current company
        allOrgs = loadedOrgs[currentCompany] || [];
        console.log('Organizations for company:', allOrgs);
    }
    
    // If no company-specific orgs, use the in-memory organizations object
    if (allOrgs.length === 0 && organizations[currentCompany]) {
        allOrgs = organizations[currentCompany];
        console.log('Loaded from in-memory organizations:', allOrgs);
    }
    
    // If still empty, try master companies
    if (allOrgs.length === 0) {
        const masterCompanies = JSON.parse(localStorage.getItem('masterCompanies') || '[]');
        if (masterCompanies && masterCompanies.length > 0) {
            allOrgs = masterCompanies.map(company => company.name);
            console.log('Loaded organizations from master companies:', allOrgs);
        }
    }
    
    // Fall back to default if still empty
    if (allOrgs.length === 0) {
        allOrgs = ['Tudor Glen', 'River Valley', 'Rosslyn', 'UPC'];
        console.log('Using default organizations:', allOrgs);
    }
    
    console.log('Final allOrgs:', allOrgs);
    
    // Check what's stored in localStorage
    const storedRoles = localStorage.getItem('adminRoles') || localStorage.getItem('masterRoles') || localStorage.getItem('roles');
    const storedDisciplinaryActions = localStorage.getItem('adminDisciplinaryActions') || localStorage.getItem('masterDisciplinaryActions') || localStorage.getItem('disciplinaryActions');
    
    // Get saved settings from admin or use defaults
    // Parse stored data - could be objects or arrays
    let roles = defaultRoles;
    let disciplinaryActions = defaultDisciplinaryActions;
    
    if (storedRoles) {
        const parsed = JSON.parse(storedRoles);
        roles = Array.isArray(parsed) ? parsed.map(r => {
            return typeof r === 'object' && r !== null && r.name ? r.name : (typeof r === 'string' ? r : String(r));
        }) : defaultRoles;
    }
    
    if (storedDisciplinaryActions) {
        const parsed = JSON.parse(storedDisciplinaryActions);
        disciplinaryActions = Array.isArray(parsed) ? parsed.map(a => {
            return typeof a === 'object' && a !== null && a.name ? a.name : (typeof a === 'string' ? a : String(a));
        }) : defaultDisciplinaryActions;
    }
    
    // Populate responsibility toggles
    const responsibilityToggles = document.getElementById('responsibilityToggles');
    if (responsibilityToggles) {
        responsibilityToggles.innerHTML = roles.map(role => `
            <label class="toggle-item">
                <input type="checkbox" name="responsibleRoles" value="${role}" checked>
                <span class="toggle-label">${role}</span>
            </label>
        `).join('');
    }
    
    // Populate disciplinary action toggles
    const disciplinaryToggles = document.getElementById('disciplinaryToggles');
    if (disciplinaryToggles) {
        disciplinaryToggles.innerHTML = disciplinaryActions.map(action => `
            <label class="toggle-item">
                <input type="checkbox" name="disciplinaryActions" value="${action}" checked>
                <span class="toggle-label">${action}</span>
            </label>
        `).join('');
    }
    
    // Update organization checkboxes
    const orgToggles = document.querySelector('.organization-toggles');
    if (orgToggles && allOrgs.length > 0) {
        orgToggles.innerHTML = `
            <label class="toggle-item">
                <input type="checkbox" id="org-all" onchange="toggleAllOrganizations()">
                <span class="toggle-label">All Organizations</span>
            </label>
            ${allOrgs.map(org => `
                <label class="toggle-item">
                    <input type="checkbox" id="org-${org.toLowerCase().replace(/\s+/g, '-')}" value="${org.toLowerCase().replace(/\s+/g, '-')}">
                    <span class="toggle-label">${org}</span>
                </label>
            `).join('')}
        `;
    }
}

function openAIModal() {
    // Track if admin dashboard was open before opening AI modal
    const adminModal = document.getElementById('adminModal');
    const wasAdminOpen = adminModal && adminModal.style.display !== 'none';
    
    // Store this state so we know to reopen it later
    window.wasAdminModalOpen = wasAdminOpen;
    
    // Close admin dashboard first
    closeAdminModal();
    
    // Open AI modal
    document.getElementById('aiModal').style.display = 'block';
    document.getElementById('aiResult').style.display = 'none';
    document.getElementById('aiLoading').style.display = 'none';
    
    // Show all policy configuration options and chat interface
    document.querySelector('.policy-type-selection').style.display = 'block';
    document.querySelector('.policy-options-selection').style.display = 'block';
    document.querySelector('.chat-container').style.display = 'block';
    document.getElementById('aiSurveyForm').style.display = 'none';
    
    // Populate roles and disciplinary actions from settings (includes organizations)
    populateRolesAndDisciplinaryActions();
    
    // Populate AI survey organizations
    populateAIOrganizations();
    
    resetChat();
}

function closeAIModal() {
    const aiModal = document.getElementById('aiModal');
    if (aiModal) {
        aiModal.style.display = 'none';
    }
    resetChat();
    
    // Automatically reopen admin dashboard when closing AI modal
    setTimeout(() => {
        openAdminModal();
    }, 250);
}

function showPolicyOptions() {
    document.querySelector('.policy-type-selection').style.display = 'block';
    document.querySelector('.policy-options-selection').style.display = 'block';
    document.querySelector('.chat-container').style.display = 'none';
}

function showChatInterface() {
    document.querySelector('.policy-type-selection').style.display = 'block';
    document.querySelector('.policy-options-selection').style.display = 'block';
    document.querySelector('.chat-container').style.display = 'block';
}

function resetChat() {
    chatState = {
        step: 'start',
        isGenerating: false,
        currentPolicy: null
    };
    
    // Clear conversation history
    conversationHistory = [];
    
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

function selectPolicyType(type) {
    // This function is no longer needed in the ChatGPT-style flow
    // Users will just type their request directly
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
    
    // Store in conversation history
    conversationHistory.push({ role: 'user', content: message });
}

function getClinicNames(clinicIds) {
    const clinicMap = {
        'tudor-glen': 'Tudor Glen',
        'river-valley': 'River Valley',
        'rosslyn': 'Rosslyn',
        'upc': 'UPC'
    };
    return clinicIds.map(id => clinicMap[id] || id);
}

function addAIMessage(message, quickOptions = null) {
    const chatMessages = document.getElementById('chatMessages');
    const messageDiv = document.createElement('div');
    messageDiv.className = 'message ai-message';
    
    let quickOptionsHTML = '';
    if (quickOptions) {
        quickOptionsHTML = '<div class="quick-options">';
        quickOptions.forEach(option => {
            quickOptionsHTML += `<button class="btn btn-sm btn-outline" onclick="selectQuickOption('${option}')">${option}</button>`;
        });
        quickOptionsHTML += '</div>';
    }
    
    messageDiv.innerHTML = `
        <div class="message-avatar">
            <i class="fas fa-robot"></i>
        </div>
        <div class="message-content">
            <p>${message}</p>
            ${quickOptionsHTML}
        </div>
    `;
    chatMessages.appendChild(messageDiv);
    chatMessages.scrollTop = chatMessages.scrollHeight;
    
    // Store in conversation history
    conversationHistory.push({ role: 'assistant', content: message });
}

function selectQuickOption(option) {
    if (option === 'Other (type your own)') {
        document.getElementById('chatInput').focus();
        return;
    }
    
    document.getElementById('chatInput').value = option;
    sendChatMessage();
}

function handleChatKeyPress(event) {
    if (event.key === 'Enter') {
        sendChatMessage();
    }
}

function sendChatMessage() {
    const input = document.getElementById('chatInput');
    const message = input.value.trim();
    
    if (!message || chatState.isGenerating) return;
    
    // Clear input immediately
    input.value = '';
    
    // Add user message once
    addUserMessage(message);
    
    // Process the message based on current step
    processChatMessage(message);
}

function processChatMessage(message) {
    if (chatState.isGenerating) return;
    
    if (chatState.step === 'start') {
        // User's first message - generate policy directly
        generatePolicyFromPrompt(message);
    } else if (chatState.step === 'policy_generated') {
        // User wants to modify the policy
        if (message.toLowerCase().includes('yes') || message.toLowerCase().includes('modify') || message.toLowerCase().includes('change')) {
            addAIMessage(`What would you like me to change or modify in the policy? Please describe the specific changes you need.`);
            chatState.step = 'modify_policy';
        } else if (message.toLowerCase().includes('no') || message.toLowerCase().includes('perfect') || message.toLowerCase().includes('good')) {
            addAIMessage(`Great! Your policy is ready. You can save it, export it, or create another policy. What would you like to do next?`);
            chatState.step = 'policy_complete';
        } else {
            // Treat as modification request
            modifyPolicy(message);
        }
    } else if (chatState.step === 'modify_policy') {
        // User is providing modification details
        modifyPolicy(message);
    }
}

function generatePolicyFromPrompt(prompt) {
    console.log('generatePolicyFromPrompt called with:', prompt);
    chatState.isGenerating = true;
    
    // Hide chat and show loading immediately
    document.querySelector('.chat-container').style.display = 'none';
    document.getElementById('aiLoading').style.display = 'block';
    
    // Generate policy with ChatGPT
    generatePolicyFromPromptData(prompt)
        .then(generatedPolicy => {
            console.log('Policy generated successfully:', generatedPolicy);
            chatState.currentPolicy = generatedPolicy;
            
            // Save policy through webhook
            savePolicyToStorage(generatedPolicy);
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
        const typeLabel = getTypeLabel(policyType);
        
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
            typeLabel: typeLabel,
            prompt: prompt,
            selectedRoles: selectedRoles,
            selectedDisciplinaryActions: selectedDisciplinaryActions,
            generatedBy: 'ChatGPT'
        };
    } catch (error) {
        console.error('Error generating policy with ChatGPT:', error);
        // Fallback to simple local generation if ChatGPT fails
        console.log('Falling back to simple local generation...');
        
        // Get the variables that might be undefined due to the error
        const fallbackOrganizations = getSelectedOrganizations();
        const fallbackOrganizationNames = fallbackOrganizations.map(org => getOrganizationName(org)).join(', ');
        const fallbackRoles = getSelectedRoles();
        const fallbackRoleNames = fallbackRoles.map(role => role.name).join(', ');
        const fallbackDisciplinaryActions = getSelectedDisciplinaryActions();
        const fallbackDisciplinaryActionNames = fallbackDisciplinaryActions.map(action => action.name).join(', ');
        
        const policyContent = generateSimpleFallbackPolicy(prompt, policyType, fallbackOrganizationNames, fallbackRoleNames, fallbackDisciplinaryActionNames);
        
        return {
            ...policyContent,
            selectedRoles: fallbackRoles,
            selectedDisciplinaryActions: fallbackDisciplinaryActions
        };
    }
}

function continueChat() {
    // Hide result and show chat again
    document.getElementById('aiResult').style.display = 'none';
    document.querySelector('.chat-container').style.display = 'block';
    
    addAIMessage(`Great! Your policy has been generated. Is there anything else you'd like to modify or add?`, [
        'Modify the policy content',
        'Add more details',
        'Create another policy',
        'Save and finish'
    ]);
    chatState.step = 'modify';
}

// Settings Modal Functions
function openSettingsModal() {
    // Close admin dashboard first
    closeAdminModal();
    // Open settings modal
    document.getElementById('settingsModal').classList.add('show');
    displayRoles();
    displayDisciplinaryActions();
    displayOrganizations(); // Load organizations when settings opens
}

function closeSettingsModal() {
    document.getElementById('settingsModal').classList.remove('show');
    
    // Automatically reopen admin dashboard when closing settings
    setTimeout(() => {
        openAdminModal();
    }, 250);
}
// Profile Modal Functions
function showProfileModal() {
    console.log('Opening profile modal...');
    const modal = document.getElementById('profileModal');
    
    if (modal && currentUser) {
        modal.style.display = 'block';
        modal.classList.add('show');
        
        // Populate profile data
        updateProfileInfo();
        
        console.log('Profile modal opened');
    } else if (!currentUser) {
        showNotification('Please log in to view your profile', 'info');
    }
}

function closeProfileModal() {
    console.log('Closing profile modal...');
    const modal = document.getElementById('profileModal');
    
    if (modal) {
        modal.style.display = 'none';
        modal.classList.remove('show');
        console.log('Profile modal closed');
    }
}

function updateProfileInfo() {
    if (!currentUser) return;
    
    // Update profile header
    document.getElementById('profileUserName').textContent = currentUser.username || 'Guest User';
    document.getElementById('profileUserCompany').textContent = currentUser.company || 'Not assigned';
    document.getElementById('profileUserStatus').textContent = currentUser.active ? 'Active' : 'Inactive';
    document.getElementById('profileUserStatus').className = `profile-status ${currentUser.active ? 'active' : 'inactive'}`;
    
    // Update account info tab
    document.getElementById('profileUsername').textContent = currentUser.username || 'guest';
    document.getElementById('profileEmail').textContent = currentUser.email || 'guest@example.com';
    document.getElementById('profileCompany').textContent = currentUser.company || 'Not assigned';
    document.getElementById('profileRole').textContent = currentUser.role || 'Guest';
}

function showProfileTab(tabName) {
    // Hide all tabs
    document.querySelectorAll('.profile-tab').forEach(tab => tab.classList.remove('active'));
    document.querySelectorAll('.tab-btn').forEach(btn => btn.classList.remove('active'));
    
    // Show selected tab
    const selectedTab = document.getElementById(`${tabName}Tab`);
    if (selectedTab) {
        selectedTab.classList.add('active');
    }
    
    // Update button
    event.target.classList.add('active');
}

// Modal open/close functions for settings
function openAddDisciplinaryModal() {
    const modal = document.getElementById('addDisciplinaryModal');
    if (modal) {
        modal.style.display = 'block';
        modal.classList.add('show');
        const form = document.getElementById('addDisciplinaryForm');
        if (form) form.reset();
    }
}

function closeAddDisciplinaryModal() {
    const modal = document.getElementById('addDisciplinaryModal');
    if (modal) {
        modal.style.display = 'none';
        modal.classList.remove('show');
        const form = document.getElementById('addDisciplinaryForm');
        if (form) form.reset();
    }
}

function openAddOrganizationModal() {
    const modal = document.getElementById('addOrganizationModal');
    if (modal) {
        modal.style.display = 'block';
        modal.classList.add('show');
        const form = document.getElementById('addOrganizationForm');
        if (form) form.reset();
    }
}

function closeAddOrganizationModal() {
    const modal = document.getElementById('addOrganizationModal');
    if (modal) {
        modal.style.display = 'none';
        modal.classList.remove('show');
        const form = document.getElementById('addOrganizationForm');
        if (form) form.reset();
    }
}

function openAddDocumentModal() {
    const modal = document.getElementById('addDocumentModal');
    if (modal) {
        modal.style.display = 'block';
        modal.classList.add('show');
        const form = document.getElementById('addDocumentForm');
        if (form) form.reset();
    }
}

function closeAddDocumentModal() {
    const modal = document.getElementById('addDocumentModal');
    if (modal) {
        modal.style.display = 'none';
        modal.classList.remove('show');
        const form = document.getElementById('addDocumentForm');
        if (form) form.reset();
    }
}

function openAddCategoryModal() {
    const modal = document.getElementById('addCategoryModal');
    if (modal) {
        modal.style.display = 'block';
        modal.classList.add('show');
        const form = document.getElementById('addCategoryForm');
        if (form) form.reset();
        
        // Focus on first input
        setTimeout(() => {
            const firstInput = document.getElementById('modalCategoryName');
            if (firstInput) {
                firstInput.focus();
            }
        }, 100);
    }
}

function closeAddCategoryModal() {
    const modal = document.getElementById('addCategoryModal');
    if (modal) {
        modal.style.display = 'none';
        modal.classList.remove('show');
        const form = document.getElementById('addCategoryForm');
        if (form) form.reset();
    }
}

function showSettingsTab(tabName) {
    // Hide all tabs
    document.querySelectorAll('.settings-tab').forEach(tab => tab.classList.remove('active'));
    document.querySelectorAll('.tab-btn').forEach(btn => btn.classList.remove('active'));
    
    // Show selected tab
    const tabElement = document.getElementById(tabName + 'Tab');
    if (tabElement) {
        tabElement.classList.add('active');
    }
    event.target.classList.add('active');
    
    // Load data when specific tab is opened
    if (tabName === 'webhooks') {
        loadWebhookUrls();
    } else if (tabName === 'documents') {
        loadDocuments();
    } else if (tabName === 'categories') {
        loadCategories();
    } else if (tabName === 'organizations') {
        displayOrganizations();
    }
}

function loadWebhookUrls() {
    const aiUrlInput = document.getElementById('webhookUrlAI');
    const manualUrlInput = document.getElementById('webhookUrlManual');
    const reportUrlInput = document.getElementById('webhookUrlReport');
    const emailUrlInput = document.getElementById('emailWebhookUrl');
    
    if (aiUrlInput) {
        const savedUrl = localStorage.getItem('webhookUrlAI');
        if (savedUrl) {
            aiUrlInput.value = savedUrl;
        }
    }
    
    if (manualUrlInput) {
        const savedUrl = localStorage.getItem('webhookUrlManual');
        if (savedUrl) {
            manualUrlInput.value = savedUrl;
        }
    }
    
    if (reportUrlInput) {
        const savedUrl = localStorage.getItem('webhookUrlReport');
        if (savedUrl) {
            reportUrlInput.value = savedUrl;
        }
    }
    
    if (emailUrlInput) {
        const savedUrl = localStorage.getItem('emailWebhookUrl');
        if (savedUrl) {
            emailUrlInput.value = savedUrl;
        }
    }
}

function saveWebhookUrls() {
    const aiUrl = document.getElementById('webhookUrlAI')?.value.trim();
    const manualUrl = document.getElementById('webhookUrlManual')?.value.trim();
    const reportUrl = document.getElementById('webhookUrlReport')?.value.trim();
    const emailUrl = document.getElementById('emailWebhookUrl')?.value.trim();
    const statusDiv = document.getElementById('webhookStatus');
    
    if (aiUrl) {
        localStorage.setItem('webhookUrlAI', aiUrl);
    }
    
    if (manualUrl) {
        localStorage.setItem('webhookUrlManual', manualUrl);
    }
    
    if (reportUrl) {
        localStorage.setItem('webhookUrlReport', reportUrl);
    }
    
    if (emailUrl) {
        localStorage.setItem('emailWebhookUrl', emailUrl);
    }
    
    if (statusDiv) {
        statusDiv.innerHTML = '<div class="notification success">Webhook URLs saved successfully!</div>';
        setTimeout(() => {
            statusDiv.innerHTML = '';
        }, 3000);
    }
    
    console.log('Webhook URLs saved:', { aiUrl, manualUrl, reportUrl, emailUrl });
}

// Add Role Modal Functions
function openAddRoleModal() {
    const modal = document.getElementById('addRoleModal');
    if (modal) {
        modal.style.display = 'block';
        modal.classList.add('show');
        
        // Reset form
        const form = document.getElementById('addRoleForm');
        if (form) {
            form.reset();
        }
        
        // Focus on first input
        setTimeout(() => {
            const firstInput = document.getElementById('modalRoleName');
            if (firstInput) {
                firstInput.focus();
            }
        }, 100);
    }
}

function closeAddRoleModal() {
    const modal = document.getElementById('addRoleModal');
    if (modal) {
        modal.style.display = 'none';
        modal.classList.remove('show');
        
        // Reset form
        const form = document.getElementById('addRoleForm');
        if (form) {
            form.reset();
        }
    }
}

function addRole() {
    // Get values from modal inputs (preferred) or fallback to old inputs
    const nameInput = document.getElementById('modalRoleName');
    const descInput = document.getElementById('modalRoleDescription');
    const staffInput = document.getElementById('modalRoleStaffName');
    const emailInput = document.getElementById('modalRoleEmail');
    
    // Fallback to old input IDs for backward compatibility
    const name = nameInput ? nameInput.value.trim() : (document.getElementById('newRoleName')?.value.trim() || '');
    const description = descInput ? descInput.value.trim() : (document.getElementById('newRoleDescription')?.value.trim() || '');
    const staffName = staffInput ? staffInput.value.trim() : (document.getElementById('newRoleStaffName')?.value.trim() || '');
    const email = emailInput ? emailInput.value.trim() : (document.getElementById('newRoleEmail')?.value.trim() || '');
    
    if (!name || !description || !staffName || !email) {
        showNotification('Please fill in all fields: role name, description, staff name, and email.', 'error');
        return;
    }
    
    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
        showNotification('Please enter a valid email address.', 'error');
        return;
    }
    
    const newRole = {
        id: roles.length > 0 ? Math.max(...roles.map(r => r.id)) + 1 : 1,
        name: name,
        description: description,
        staffName: staffName,
        email: email,
        company: currentCompany || 'Default Company' // Assign to current company
    };
    
    roles.push(newRole);
    saveToLocalStorage('roles', roles);
    displayRoles();
    
    // Close modal
    closeAddRoleModal();
    
    // Show success message
    showNotification(`Role "${name}" added successfully!`, 'success');
}

function deleteRole(roleId) {
    if (confirm('Are you sure you want to delete this role?')) {
        roles = roles.filter(role => role.id !== roleId);
        saveToLocalStorage('roles', roles);
        displayRoles();
    }
}

function displayRoles() {
    const rolesList = document.getElementById('rolesList');
    
    // Filter roles by company
    const companyRoles = currentCompany ? 
        roles.filter(role => role.company === currentCompany || !role.company) : 
        roles;
    
    if (companyRoles.length === 0) {
        rolesList.innerHTML = '<p class="no-items">No roles defined. Add your first role above.</p>';
        return;
    }
    
    rolesList.innerHTML = companyRoles.map(role => `
        <div class="item-card">
            <div class="item-info">
                <h4>${role.name}</h4>
                <p><strong>Staff:</strong> ${role.staffName} (${role.email})</p>
                <p>${role.description}</p>
            </div>
            <div class="item-actions">
                <button onclick="deleteRole(${role.id})" class="btn btn-sm btn-danger">
                    <i class="fas fa-trash"></i> Delete
                </button>
            </div>
        </div>
    `).join('');
}

function addDisciplinaryAction() {
    // Try modal inputs first, fallback to old inputs
    const nameInput = document.getElementById('modalActionName');
    const descInput = document.getElementById('modalActionDescription');
    const penaltiesInput = document.getElementById('modalActionPenalties');
    const severityInput = document.getElementById('modalActionSeverity');
    
    const name = nameInput ? nameInput.value.trim() : (document.getElementById('newActionName')?.value.trim() || '');
    const description = descInput ? descInput.value.trim() : (document.getElementById('newActionDescription')?.value.trim() || '');
    const penalties = penaltiesInput ? penaltiesInput.value.trim() : (document.getElementById('newActionPenalties')?.value.trim() || '');
    const severity = severityInput ? severityInput.value : (document.getElementById('newActionSeverity')?.value || 'minor');
    
    if (!name || !description || !penalties) {
        showNotification('Please fill in all fields: action name, description, and penalties.', 'error');
        return;
    }
    
    const newAction = {
        id: disciplinaryActions.length > 0 ? Math.max(...disciplinaryActions.map(a => a.id)) + 1 : 1,
        name: name,
        description: description,
        penalties: penalties,
        severity: severity,
        company: currentCompany || 'Default Company'
    };
    
    disciplinaryActions.push(newAction);
    saveToLocalStorage('disciplinaryActions', disciplinaryActions);
    displayDisciplinaryActions();
    
    // Close modal
    closeAddDisciplinaryModal();
    
    // Show success message
    showNotification(`Disciplinary action "${name}" added successfully!`, 'success');
}

function deleteDisciplinaryAction(actionId) {
    if (confirm('Are you sure you want to delete this disciplinary action?')) {
        disciplinaryActions = disciplinaryActions.filter(action => action.id !== actionId);
        saveToLocalStorage('disciplinaryActions', disciplinaryActions);
        displayDisciplinaryActions();
    }
}

function displayDisciplinaryActions() {
    const disciplinaryList = document.getElementById('disciplinaryList');
    
    // Filter disciplinary actions by company
    const companyActions = currentCompany ? 
        disciplinaryActions.filter(action => action.company === currentCompany || !action.company) : 
        disciplinaryActions;
    
    if (companyActions.length === 0) {
        disciplinaryList.innerHTML = '<p class="no-items">No disciplinary actions defined. Add your first action above.</p>';
        return;
    }
    
    disciplinaryList.innerHTML = companyActions.map(action => `
        <div class="item-card">
            <div class="item-info">
                <h4>${action.name} <span class="severity-badge severity-${action.severity}">${action.severity}</span></h4>
                <p>${action.description}</p>
                <p><strong>Penalties:</strong> ${action.penalties}</p>
            </div>
            <div class="item-actions">
                <button onclick="deleteDisciplinaryAction(${action.id})" class="btn btn-sm btn-danger">
                    <i class="fas fa-trash"></i> Delete
                </button>
            </div>
        </div>
    `).join('');
}

// Duplicate generatePolicyWithChatGPT function removed - using the more comprehensive version defined earlier

function createSimpleChatGPTPrompt(userPrompt, currentDate, policyType, organizationNames, roleNames, disciplinaryActionNames) {
    console.log('Creating ChatGPT prompt for:', userPrompt);
    
    let policyStructure = '';
    
    if (policyType === 'admin') {
        policyStructure = `
LEVEL 1 — ADMIN POLICY STRUCTURE:
Please create a comprehensive Admin Policy with the following sections:

Document Title / Header Info:
• Effective Date: ${currentDate}
• Last Reviewed: ${currentDate}
• Approved By: [To be filled by administrator]
• Version #: 1.0

Required Sections:
1. Purpose - Clear statement of why this policy exists
2. Scope - Who and what this policy applies to
3. Policy Statement - The main policy content
4. Definitions - Key terms and definitions
5. Procedure / Implementation - Step-by-step implementation
6. Responsibilities - Who is responsible for what
7. Consequences / Accountability - What happens if policy is violated
8. Related Documents - References to other relevant policies
9. Review & Approval - Process for reviewing and updating

Organizations: ${organizationNames}
Responsible Roles: ${roleNames}
Disciplinary Actions: ${disciplinaryActionNames}`;
    } else if (policyType === 'sog') {
        policyStructure = `
LEVEL 2 — STANDARD OPERATING GUIDELINE (SOG) STRUCTURE:
Please create a comprehensive SOG with the following sections:

SOG Title / Header Info:
• Effective Date: ${currentDate}
• Author: [To be filled by administrator]
• Approved By: [To be filled by administrator]
• Version #: 1.0

Required Sections:
1. Objective - Clear goal of this guideline
2. Guiding Principles - Core principles to follow
3. Recommended Approach / Procedure - Detailed procedures
4. Definitions - Key terms and definitions
5. Examples / Scenarios - Real-world examples
6. Responsibilities - Who does what
7. Escalation / Support - When and how to escalate
8. Review & Revision - Process for updates

Organizations: ${organizationNames}
Responsible Roles: ${roleNames}
Disciplinary Actions: ${disciplinaryActionNames}`;
    } else if (policyType === 'memo') {
        policyStructure = `
LEVEL 3 — COMMUNICATION MEMO STRUCTURE:
Please create a professional Communication Memo with the following sections:

CSI Communication Memo Header:
• Date: ${currentDate}
• From: [Administrator Name]
• To: All Staff
• Subject: [Based on user prompt]

Required Sections:
1. Message - Main communication content
2. Effective Period - When this takes effect (if applicable)
3. Next Steps / Action Required - What staff need to do
4. Contact for Questions - Who to contact for clarification

Organizations: ${organizationNames}
Responsible Roles: ${roleNames}
Disciplinary Actions: ${disciplinaryActionNames}`;
    }
    
    const prompt = `You are a professional policy writer for CSI (Comprehensive Specialty Imaging) veterinary clinics. 

USER REQUEST: "${userPrompt}"

${policyStructure}

INSTRUCTIONS:
- Create a comprehensive, professional policy document
- Use proper healthcare industry terminology
- Make it specific to veterinary clinic operations
- Ensure all required sections are included
- Write in a clear, professional tone
- Include specific details relevant to the request
- Make it actionable and practical for clinic staff

Please generate the complete policy document with all sections properly formatted and filled out.`;
    
    return prompt;
}

// Duplicate function removed - using the main callChatGPTAPI function above

function parseChatGPTResponse(response, topic, type) {
    console.log('parseChatGPTResponse called with:', { topic, type, response });
    
    // Handle both string and object responses
    let content;
    if (typeof response === 'string') {
        content = response;
    } else if (response.choices && response.choices[0] && response.choices[0].message) {
        content = response.choices[0].message.content;
    } else {
        content = response;
    }
    
    console.log('Parsing content:', content);
    
    // Create a basic policy structure with the actual content
    const currentDate = new Date().toISOString().split('T')[0];
    
    // Determine policy type
    const policyType = type === 'admin' ? 'admin' : 
                      type === 'sog' ? 'sog' : 'memo';
    
    // Create basic policy structure
    const policy = {
        title: `${topic} Policy`,
        type: policyType,
        effectiveDate: currentDate,
        lastReviewed: currentDate,
        approvedBy: 'CSI Clinical Director',
        version: '1.0',
        created: currentDate,
        updated: currentDate,
        description: `AI-generated ${policyType} policy for ${topic}`,
        status: 'active',
        content: content // Store the full ChatGPT response
    };
    
    // Try to extract specific sections from the content
    const sections = extractPolicySections(content, policyType);
    console.log('Extracted sections:', sections);
    
    // Merge extracted sections with basic policy
    const finalPolicy = { ...policy, ...sections };
    console.log('Final policy object:', finalPolicy);
    
    return finalPolicy;
}

function extractPolicySections(content, policyType) {
    const sections = {};
    
    // Split content into lines for parsing
    const lines = content.split('\n');
    let currentSection = '';
    let currentContent = [];
    
    for (let line of lines) {
        const trimmedLine = line.trim();
        
        // Look for section headers (various formats)
        if (trimmedLine.match(/^#{1,3}\s+(.+)/) || 
            trimmedLine.match(/^(.+?):\s*$/) ||
            trimmedLine.match(/^(.+?)\s*-\s*$/)) {
            
            // Save previous section
            if (currentSection && currentContent.length > 0) {
                sections[currentSection] = currentContent.join('\n').trim();
            }
            
            // Start new section
            currentSection = trimmedLine.replace(/^#{1,3}\s+/, '').replace(/:\s*$/, '').replace(/\s*-\s*$/, '').toUpperCase();
            currentContent = [];
        } else if (trimmedLine && currentSection) {
            currentContent.push(line);
        }
    }
    
    // Save last section
    if (currentSection && currentContent.length > 0) {
        sections[currentSection] = currentContent.join('\n').trim();
    }
    
    // Map common section names to policy fields
    const fieldMapping = {
        'PURPOSE': 'purpose',
        'SCOPE': 'scope',
        'POLICY STATEMENT': 'policyStatement',
        'PROCEDURES': 'procedures',
        'RESPONSIBILITIES': 'responsibilities',
        'CONSEQUENCES': 'consequences',
        'ACCOUNTABILITY': 'accountability',
        'MESSAGE': 'message',
        'FROM': 'from',
        'TO': 'to',
        'SUBJECT': 'subject',
        'EFFECTIVE PERIOD': 'effectivePeriod',
        'NEXT STEPS': 'nextSteps',
        'CONTACT': 'contact'
    };
    
    const mappedSections = {};
    for (const [key, value] of Object.entries(sections)) {
        const mappedKey = fieldMapping[key] || key.toLowerCase().replace(/\s+/g, '');
        mappedSections[mappedKey] = value;
    }
    
    return mappedSections;
}

// Policy editing functionality
let originalPolicyContent = {};

function savePolicyField(field) {
    const editableContent = document.querySelector(`[data-field="${field}"].editable-content`);
    const editActions = editableContent.parentElement.querySelector('.edit-actions');
    
    if (editableContent && editActions) {
        // Save the new content
        const newContent = editableContent.innerHTML;
        if (window.currentGeneratedPolicy) {
            window.currentGeneratedPolicy[field] = newContent;
            
            // Save the updated policy to localStorage
            savePolicyToStorage(window.currentGeneratedPolicy);
        }
        
        // Hide edit actions
        editActions.style.display = 'none';
        editableContent.contentEditable = false;
        
        // Remove editing styling
        editableContent.classList.remove('editing');
        
        showSuccessMessage(`Policy field "${field}" saved successfully!`);
        
        console.log(`Saved policy field ${field}:`, newContent);
    }
}

function cancelPolicyEdit(field) {
    const editableContent = document.querySelector(`[data-field="${field}"].editable-content`);
    const editActions = editableContent.parentElement.querySelector('.edit-actions');
    
    if (editableContent && editActions) {
        // Restore original content
        if (originalPolicyContent[field]) {
            editableContent.innerHTML = originalPolicyContent[field];
        }
        
        // Hide edit actions
        editActions.style.display = 'none';
        editableContent.contentEditable = false;
        
        // Remove editing styling
        editableContent.classList.remove('editing');
        
        console.log(`Cancelled edit for policy field ${field}`);
    }
}

// Add event listeners for editable content
document.addEventListener('click', function(e) {
    if (e.target.classList.contains('editable-content')) {
        startEditing(e.target);
    }
});

function startEditing(element) {
    // Store original content
    const field = element.getAttribute('data-field');
    originalPolicyContent[field] = element.innerHTML;
    
    // Enable editing
    element.contentEditable = true;
    element.classList.add('editing');
    
    // Show edit actions
    const editActions = element.parentElement.querySelector('.edit-actions');
    if (editActions) {
        editActions.style.display = 'block';
    }
    
    // Focus and select content
    element.focus();
    
    console.log(`Started editing policy field: ${field}`);
}
// Policy saving and storage functions
async function savePolicyToStorage(policy) {
    if (!policy || !currentCompany) {
        console.error('Cannot save policy: missing policy or company');
        return;
    }
    
    // Generate a unique ID for the policy if it doesn't have one
    if (!policy.id) {
        policy.id = 'policy_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
    }
    
    // Add metadata
    policy.company = currentCompany;
    policy.lastModified = new Date().toISOString();
    policy.modifiedBy = currentUser ? currentUser.username : 'Unknown';
    
    // Load existing policies for this company
    const companyPolicies = loadCompanyPolicies();
    
    // Update or add the policy
    const existingIndex = companyPolicies.findIndex(p => p.id === policy.id);
    if (existingIndex >= 0) {
        companyPolicies[existingIndex] = policy;
        console.log('Updated existing policy:', policy.id);
    } else {
        companyPolicies.push(policy);
        console.log('Added new policy:', policy.id);
    }
    
    // Save back to localStorage
    localStorage.setItem(`policies_${currentCompany}`, JSON.stringify(companyPolicies));
    
    // Save timestamp to trigger cross-browser sync
    localStorage.setItem(`policies_${currentCompany}_updated`, new Date().toISOString());
    
    // Dispatch event to notify other admins/users in the same company
    window.dispatchEvent(new CustomEvent('companyPoliciesUpdated', {
        detail: { company: currentCompany, policies: companyPolicies }
    }));
    
    // Send policy report webhook with full policy report and company user emails
    try {
        await sendPolicyReportWebhook(policy);
        console.log('Policy report webhook sent successfully');
    } catch (error) {
        console.error('Failed to send policy report webhook:', error);
        // Don't block policy saving if webhook fails
    }
    
    // Send new policy notification emails to all company users
    try {
        await sendNewPolicyNotificationEmail(policy);
        console.log('New policy notification emails sent successfully');
    } catch (error) {
        console.error('Failed to send new policy notification emails:', error);
        // Don't block policy saving if email sending fails
    }
    
    // Send webhook notification with loading indicator and wait for response
    if (policy.generatedBy === 'ChatGPT' || policy.type) {
        showWebhookLoading();
        
        try {
            const webhookResponse = await sendPolicyGenerationWebhook(policy);
            console.log('Webhook response received:', webhookResponse);
            
            // Show ONLY the webhook response, not the policy
            document.getElementById('aiLoading').style.display = 'none';
            document.getElementById('aiResult').style.display = 'block';
            
            // Parse the webhook response as JSON
            let responseData = null;
            try {
                responseData = JSON.parse(webhookResponse);
            } catch (e) {
                // Not JSON, show as text
                responseData = webhookResponse;
            }
            
            const aiGeneratedContent = document.getElementById('aiGeneratedContent');
            if (aiGeneratedContent) {
                
                // Format the response based on whether it's structured data
                let displayContent = '';
                
                if (Array.isArray(responseData) && responseData.length > 0 && responseData[0].markdown) {
                    // It's a formatted policy from webhook
                    const policy = responseData[0];
                    
                    // Parse markdown into editable sections
                    const sections = parseWebhookPolicyMarkdown(policy.markdown);
                    
                    displayContent = `
                        <div class="policy-preview professional">
                            <div class="policy-header">
                                <div class="form-group" style="margin-bottom: 15px;">
                                    <label for="policyTitleInput" style="display: block; margin-bottom: 5px; font-weight: 600; color: #333;">
                                        <i class="fas fa-heading"></i> Policy Title <span style="color: red;">*</span>
                                    </label>
                                    <input type="text" id="policyTitleInput" value="${policy.policy_title || 'Generated Policy'}" required
                                           style="width: 100%; padding: 12px; border: 2px solid #ddd; border-radius: 6px; font-size: 1.1rem; font-weight: 600;"
                                           placeholder="Enter policy title..." 
                                           oninput="this.style.borderColor='#ddd'" />
                                    <small style="color: #666; display: block; margin-top: 5px;">This title is required to save the policy</small>
                                </div>
                                <span class="policy-type-badge admin">${policy.policy_type || 'Policy'}</span>
                            </div>
                            
                            <div class="policy-meta">
                                <div class="meta-item"><strong>Company:</strong> ${policy.company}</div>
                                <div class="meta-item"><strong>Effective Date:</strong> ${policy.effective_date}</div>
                                <div class="meta-item"><strong>Applies To:</strong> ${policy.applies_to}</div>
                                <div class="meta-item"><strong>Author:</strong> ${policy.author}</div>
                                <div class="meta-item"><strong>Version:</strong> ${policy.version}</div>
                            </div>
                            
                            <div class="policy-content-display" style="max-height: 600px; overflow-y: auto;">
                                ${generateEditablePolicySections(sections)}
                            </div>
                            
                            <div class="form-group" style="margin-top: 20px; margin-bottom: 20px;">
                                <label for="aiPolicyCategory" style="display: block; margin-bottom: 5px; font-weight: 600; color: #333;">
                                    <i class="fas fa-tags"></i> Select Category (for policy code generation)
                                </label>
                                <select id="aiPolicyCategory" onchange="updateAIPolicyCode()" style="width: 100%; padding: 12px; border: 2px solid #ddd; border-radius: 6px; font-size: 1rem;">
                                    <option value="">No Category (optional)</option>
                                </select>
                                <small style="color: #666; display: block; margin-top: 5px;">Policy code will be generated in format: Type.Category#.Policy#.Year (e.g., ADMIN.1.2.2025)</small>
                                <div id="aiPolicyCodeDisplay" style="display: none; margin-top: 10px; padding: 10px; background: #f0f8ff; border-radius: 6px;">
                                    <strong>Policy Code:</strong> <span id="aiPolicyCodeText"></span>
                                </div>
                            </div>
                            
                            <div class="ai-result-actions" style="margin-top: 20px;">
                                <button class="btn btn-info" onclick="showRefinePolicyModal()" style="background: #667eea; border-color: #667eea; color: white;">
                                    <i class="fas fa-magic"></i> Refine with AI
                                </button>
                                <button class="btn btn-success" onclick="saveWebhookPolicy()">
                                    <i class="fas fa-save"></i> Save Policy
                                </button>
                                <button class="btn btn-secondary" onclick="closeAIModal()">
                                    <i class="fas fa-times"></i> Close
                                </button>
                            </div>
                        </div>
                    `;
                } else if (typeof responseData === 'object') {
                    // Generic JSON response
                    displayContent = `
                        <div style="text-align: center; padding: 40px;">
                            <h4 style="color: #0066cc; margin-bottom: 20px;">✅ Webhook Response Received</h4>
                            <div style="background: #f0f8ff; border: 2px solid #0066cc; border-radius: 8px; padding: 20px; margin: 20px auto; max-width: 800px;">
                                <pre style="background: white; padding: 15px; border-radius: 4px; overflow-x: auto; white-space: pre-wrap; word-wrap: break-word; text-align: left; margin: 0;">${JSON.stringify(responseData, null, 2)}</pre>
                            </div>
                            <div class="ai-result-actions">
                                <button class="btn btn-primary" onclick="closeAIModal()">Close</button>
                            </div>
                        </div>
                    `;
                } else {
                    // Plain text response
                    displayContent = `
                        <div style="text-align: center; padding: 40px;">
                            <h4 style="color: #0066cc; margin-bottom: 20px;">✅ Webhook Response Received</h4>
                            <div style="background: #f0f8ff; border: 2px solid #0066cc; border-radius: 8px; padding: 20px; margin: 20px auto; max-width: 800px;">
                                <pre style="background: white; padding: 15px; border-radius: 4px; overflow-x: auto; white-space: pre-wrap; word-wrap: break-word; text-align: left; margin: 0;">${webhookResponse}</pre>
                            </div>
                            <div class="ai-result-actions">
                                <button class="btn btn-primary" onclick="closeAIModal()">Close</button>
                            </div>
                        </div>
                    `;
                }
                
                aiGeneratedContent.innerHTML = displayContent;
                
                // Populate category dropdown after HTML is rendered
                populateAICategoryDropdown();
            }
            
            // Store the webhook policy data for saving
            window.currentWebhookPolicy = responseData;
            
            // Only sync to master admin dashboard if webhook succeeded
            syncPoliciesToMasterAdmin(companyPolicies);
    console.log(`Policy saved for company ${currentCompany}:`, policy.title);
        } catch (error) {
            console.error('Webhook error:', error);
            
            // Show ONLY the webhook error, not the policy
            document.getElementById('aiLoading').style.display = 'none';
            document.getElementById('aiResult').style.display = 'block';
            
            const aiGeneratedContent = document.getElementById('aiGeneratedContent');
            if (aiGeneratedContent) {
                aiGeneratedContent.innerHTML = `
                    <div style="text-align: center; padding: 40px;">
                        <h4 style="color: #cc0000; margin-bottom: 20px;">❌ Webhook Error</h4>
                        <div style="background: #ffe6e6; border: 2px solid #cc0000; border-radius: 8px; padding: 20px; margin: 20px auto; max-width: 800px;">
                            <h5 style="color: #cc0000; margin: 0 0 15px 0;">Error Message:</h5>
                            <p style="margin: 0; color: #cc0000; font-size: 16px;">${error.message}</p>
                        </div>
                        <div class="ai-result-actions">
                            <button class="btn btn-primary" onclick="closeAIModal()">Close</button>
                        </div>
                    </div>
                `;
            }
        }
    }
}

function openPoliciesModal() {
    // Load policies for current company
    const policies = loadCompanyPolicies();
    
    // Create modern modal with card-based layout
    const modalHtml = `
        <div id="policiesModal" class="modal" style="display: block; z-index: 3000;">
            <div class="modal-content" style="max-width: 1400px; padding: 0;">
                <!-- Header -->
                <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; color: white; border-radius: 8px 8px 0 0;">
                    <div style="display: flex; justify-content: space-between; align-items: center;">
                        <div>
                            <h2 style="margin: 0; color: white; font-size: 28px;">
                                <i class="fas fa-file-alt"></i> Manage Policies
                            </h2>
                            <p style="margin: 5px 0 0 0; color: rgba(255,255,255,0.9);">${policies.length} policy/policies in ${currentCompany}</p>
                        </div>
                        <button onclick="closePoliciesModal()" style="background: rgba(255,255,255,0.2); border: none; color: white; font-size: 28px; cursor: pointer; padding: 5px 15px; border-radius: 4px;">
                            &times;
                        </button>
                    </div>
                </div>
                
                <!-- Toolbar -->
                <div style="padding: 20px; background: #f8f9fa; border-bottom: 1px solid #dee2e6;">
                    <div style="display: flex; gap: 15px; align-items: center; flex-wrap: wrap;">
                        <!-- Search -->
                        <div style="flex: 1; min-width: 200px;">
                            <input type="text" id="policySearchInput" placeholder="Search policies..." 
                                   onkeyup="searchPolicies()"
                                   style="width: 100%; padding: 12px 15px; border: 1px solid #ddd; border-radius: 6px; font-size: 14px;">
                        </div>
                        
                        <!-- Bulk Actions -->
                        <button onclick="selectAllPolicies()" style="padding: 12px 20px; background: #6c757d; color: white; border: none; border-radius: 6px; cursor: pointer; font-size: 14px;">
                            <i class="fas fa-check-square"></i> Select All
                        </button>
                        <button onclick="bulkDeletePolicies()" id="bulkDeleteBtn" disabled 
                                style="padding: 12px 20px; background: #dc3545; color: white; border: none; border-radius: 6px; cursor: pointer; font-size: 14px; opacity: 0.5; cursor: not-allowed;">
                            <i class="fas fa-trash"></i> Delete Selected
                        </button>
                        
                        <div id="selectedCount" style="padding: 12px 15px; color: #666; font-size: 14px; font-weight: 600;">
                            0 selected
                        </div>
                    </div>
                </div>
                
                <!-- Policy Cards Grid -->
                <div style="padding: 20px; max-height: 600px; overflow-y: auto;">
                    ${policies.length === 0 ? `
                        <div style="text-align: center; padding: 60px 20px; color: #999;">
                            <i class="fas fa-file-alt" style="font-size: 64px; margin-bottom: 20px; opacity: 0.3;"></i>
                            <h3 style="margin: 0; color: #666;">No Policies Found</h3>
                            <p style="margin: 10px 0 0 0;">No policies have been created yet.</p>
                        </div>
                    ` : `
                        <div style="display: grid; grid-template-columns: repeat(auto-fill, minmax(350px, 1fr)); gap: 20px;">
                            ${policies.map(policy => `
                                <div class="policy-card" style="background: white; border: 1px solid #e0e0e0; border-radius: 12px; padding: 20px; box-shadow: 0 2px 4px rgba(0,0,0,0.1); transition: transform 0.2s, box-shadow 0.2s;" onmouseover="this.style.transform='translateY(-2px)'; this.style.boxShadow='0 4px 8px rgba(0,0,0,0.15)'" onmouseout="this.style.transform='translateY(0)'; this.style.boxShadow='0 2px 4px rgba(0,0,0,0.1)'">
                                    <!-- Checkbox -->
                                    <div style="margin-bottom: 15px;">
                                        <input type="checkbox" class="policy-checkbox" data-policy-id="${policy.id}" onchange="updateSelectedCount()"
                                               style="width: 18px; height: 18px; cursor: pointer; margin-right: 10px;">
                                        <span style="font-size: 12px; color: #888;">Select to manage</span>
                                    </div>
                                    
                                    <!-- Policy Title -->
                                    <h3 style="margin: 0 0 12px 0; font-size: 18px; color: #333; font-weight: 600;">
                                        ${policy.title || 'Untitled Policy'}
                                    </h3>
                                    
                                    <!-- Policy Type Badge -->
                                    <div style="margin-bottom: 15px;">
                                        <span style="background: #e3f2fd; color: #1976d2; padding: 6px 12px; border-radius: 20px; font-size: 12px; font-weight: 600;">
                                            ${getTypeLabel(policy.type) || 'N/A'}
                                        </span>
                                    </div>
                                    
                                    <!-- Policy Details -->
                                    <div style="margin-bottom: 15px; padding: 12px; background: #f8f9fa; border-radius: 8px;">
                                        <div style="font-size: 13px; color: #666; margin-bottom: 6px;">
                                            <i class="fas fa-calendar"></i> <strong>Effective Date:</strong> ${policy.effectiveDate || 'Not set'}
                                        </div>
                                        <div style="font-size: 13px; color: #666; margin-bottom: 6px;">
                                            <i class="fas fa-tag"></i> <strong>Version:</strong> ${policy.version || '1.0'}
                                        </div>
                                        <div style="font-size: 13px; color: #666;">
                                            <i class="fas fa-building"></i> <strong>Organizations:</strong> ${(policy.clinicNames || policy.organizations || policy.clinics || 'All')}
                                        </div>
                                    </div>
                                    
                                    <!-- Action Buttons -->
                                    <div style="display: flex; gap: 8px; flex-wrap: wrap;">
                                        <button onclick="viewPolicyFromManage('${policy.id}')" 
                                                style="flex: 1; padding: 10px; background: #0066cc; color: white; border: none; border-radius: 6px; cursor: pointer; font-size: 13px; font-weight: 600;">
                                            <i class="fas fa-eye"></i> View
                                        </button>
                                        <button onclick="editPolicy('${policy.id}')" 
                                                style="flex: 1; padding: 10px; background: #ffc107; color: #000; border: none; border-radius: 6px; cursor: pointer; font-size: 13px; font-weight: 600;">
                                            <i class="fas fa-edit"></i> Edit
                                        </button>
                                        <button onclick="deletePolicy('${policy.id}')" 
                                                style="flex: 1; padding: 10px; background: #dc3545; color: white; border: none; border-radius: 6px; cursor: pointer; font-size: 13px; font-weight: 600;">
                                            <i class="fas fa-trash"></i> Delete
                                        </button>
                                    </div>
                                </div>
                            `).join('')}
                        </div>
                    `}
                </div>
            </div>
        </div>
    `;
    
    // Create and show modal
    const existingModal = document.getElementById('policiesModal');
    if (existingModal) {
        existingModal.remove();
    }
    
    document.body.insertAdjacentHTML('beforeend', modalHtml);
}

// Helper function for viewing policy from manage modal
function viewPolicyFromManage(policyId) {
    closePoliciesModal();
    viewPolicy(policyId);
}

function searchPolicies() {
    const searchTerm = document.getElementById('policySearchInput').value.toLowerCase();
    const cards = document.querySelectorAll('.policy-card');
    
    cards.forEach(card => {
        const text = card.textContent.toLowerCase();
        card.style.display = text.includes(searchTerm) ? '' : 'none';
    });
}

function toggleSelectAll(checkbox) {
    const checkboxes = document.querySelectorAll('.policy-checkbox');
    checkboxes.forEach(cb => {
        cb.checked = checkbox.checked;
        updateBulkActionButtons();
    });
}

function updateSelectedCount() {
    const checkboxes = document.querySelectorAll('.policy-checkbox:checked');
    const count = checkboxes.length;
    document.getElementById('selectedCount').textContent = `${count} selected`;
    updateBulkActionButtons();
}

function updateBulkActionButtons() {
    const checkboxes = document.querySelectorAll('.policy-checkbox:checked');
    const count = checkboxes.length;
    const bulkEditBtn = document.getElementById('bulkEditBtn');
    const bulkDeleteBtn = document.getElementById('bulkDeleteBtn');
    
    if (bulkEditBtn) bulkEditBtn.disabled = count === 0;
    if (bulkDeleteBtn) bulkDeleteBtn.disabled = count === 0;
}

function selectAllPolicies() {
    const checkboxes = document.querySelectorAll('.policy-checkbox');
    const selectAllCheckbox = document.getElementById('selectAllCheckbox');
    
    checkboxes.forEach(cb => cb.checked = true);
    if (selectAllCheckbox) selectAllCheckbox.checked = true;
    updateSelectedCount();
}

function bulkEditPolicies() {
    const checkboxes = document.querySelectorAll('.policy-checkbox:checked');
    if (checkboxes.length === 0) return;
    
    showNotification('Bulk edit functionality coming soon', 'info');
}

function bulkDeletePolicies() {
    const checkboxes = document.querySelectorAll('.policy-checkbox:checked');
    if (checkboxes.length === 0) return;
    
    if (!confirm(`Are you sure you want to delete ${checkboxes.length} policy/policies?`)) {
        return;
    }
    
    const policies = loadCompanyPolicies();
    const idsToDelete = Array.from(checkboxes).map(cb => cb.dataset.policyId);
    const filtered = policies.filter(p => !idsToDelete.includes(p.id));
    
    localStorage.setItem(`policies_${currentCompany}`, JSON.stringify(filtered));
    
    showNotification(`${checkboxes.length} policies deleted successfully`, 'success');
    closePoliciesModal();
    openPoliciesModal(); // Refresh modal
}

function closePoliciesModal() {
    const modal = document.getElementById('policiesModal');
    if (modal) {
        modal.remove();
    }
}

function openUsersModal() {
    // Load users for current company
    const allUsers = JSON.parse(localStorage.getItem('masterUsers') || '[]');
    const users = allUsers.filter(u => u.company === currentCompany);
    
    // Create a completely redesigned modal
    const modalHtml = `
        <div id="usersModal" class="modal" style="display: block; z-index: 3000;">
            <div class="modal-content" style="max-width: 1200px; padding: 0;">
                <!-- Header with title and actions -->
                <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; color: white; border-radius: 8px 8px 0 0;">
                    <div style="display: flex; justify-content: space-between; align-items: center;">
                        <div>
                            <h2 style="margin: 0; color: white; font-size: 28px;">
                                <i class="fas fa-users"></i> Manage Users
                            </h2>
                            <p style="margin: 5px 0 0 0; color: rgba(255,255,255,0.9);">${users.length} user(s) in ${currentCompany}</p>
                        </div>
                        <button onclick="closeUsersModal()" style="background: rgba(255,255,255,0.2); border: none; color: white; font-size: 28px; cursor: pointer; padding: 5px 15px; border-radius: 4px;">
                            &times;
                        </button>
                    </div>
                </div>
                
                <!-- Toolbar -->
                <div style="padding: 20px; background: #f8f9fa; border-bottom: 1px solid #dee2e6;">
                    <div style="display: flex; gap: 15px; align-items: center; flex-wrap: wrap;">
                        <!-- Search -->
                        <div style="flex: 1; min-width: 200px;">
                            <input type="text" id="userSearchInput" placeholder="Search users..." 
                                   onkeyup="searchUsers()"
                                   style="width: 100%; padding: 12px 15px; border: 1px solid #ddd; border-radius: 6px; font-size: 14px;">
                        </div>
                        
                        <!-- Bulk Actions -->
                        <button onclick="selectAllUsers()" style="padding: 12px 20px; background: #6c757d; color: white; border: none; border-radius: 6px; cursor: pointer; font-size: 14px;">
                            <i class="fas fa-check-square"></i> Select All
                        </button>
                        <button onclick="bulkEditUsers()" id="bulkEditUserBtn" disabled 
                                style="padding: 12px 20px; background: #ffc107; color: #000; border: none; border-radius: 6px; cursor: pointer; font-size: 14px; opacity: 0.5; cursor: not-allowed;">
                            <i class="fas fa-edit"></i> Bulk Edit
                        </button>
                        <button onclick="bulkDeleteUsers()" id="bulkDeleteUserBtn" disabled 
                                style="padding: 12px 20px; background: #dc3545; color: white; border: none; border-radius: 6px; cursor: pointer; font-size: 14px; opacity: 0.5; cursor: not-allowed;">
                            <i class="fas fa-trash"></i> Delete Selected
                        </button>
                        
                        <div id="selectedUserCount" style="padding: 12px 15px; color: #666; font-size: 14px; font-weight: 600;">
                            0 selected
                        </div>
                    </div>
                </div>
                
                <!-- User Cards Grid -->
                <div style="padding: 20px; max-height: 600px; overflow-y: auto;">
                    ${users.length === 0 ? `
                        <div style="text-align: center; padding: 60px 20px; color: #999;">
                            <i class="fas fa-users" style="font-size: 64px; margin-bottom: 20px; opacity: 0.3;"></i>
                            <h3 style="margin: 0; color: #666;">No Users Found</h3>
                            <p style="margin: 10px 0 0 0;">No users have been created for this company yet.</p>
                        </div>
                    ` : `
                        <div style="display: grid; grid-template-columns: repeat(auto-fill, minmax(320px, 1fr)); gap: 20px;">
                            ${users.map(user => `
                                <div class="user-card" style="background: white; border: 1px solid #e0e0e0; border-radius: 12px; padding: 20px; box-shadow: 0 2px 4px rgba(0,0,0,0.1); transition: transform 0.2s, box-shadow 0.2s;">
                                    <div style="display: flex; align-items: flex-start; gap: 15px;">
                                        <!-- Checkbox -->
                                        <input type="checkbox" class="user-checkbox" data-user-id="${user.id}" onchange="updateSelectedUserCount()"
                                               style="margin-top: 5px; width: 18px; height: 18px; cursor: pointer;">
                                        
                                        <!-- User Info -->
                                        <div style="flex: 1;">
                                            <!-- Header -->
                                            <div style="display: flex; justify-content: space-between; align-items: start; margin-bottom: 12px;">
                                                <div>
                                                    <h3 style="margin: 0; font-size: 18px; color: #333;">${user.username || 'N/A'}</h3>
                                                    <p style="margin: 4px 0 0 0; color: #666; font-size: 14px;">${user.email || 'No email'}</p>
                                                </div>
                                                <span class="policy-type-badge ${user.role === 'admin' ? 'admin' : 'user'}" 
                                                      style="padding: 4px 12px; border-radius: 20px; font-size: 12px; font-weight: 600; white-space: nowrap;">
                                                    ${user.role === 'admin' ? '<i class="fas fa-crown"></i> Admin' : '<i class="fas fa-user"></i> User'}
                                                </span>
                                            </div>
                                            
                                            <!-- Organizations -->
                                            <div style="margin-bottom: 15px;">
                                                <div style="font-size: 12px; color: #888; margin-bottom: 6px; font-weight: 600;">
                                                    <i class="fas fa-building"></i> Organizations
                                                </div>
                                                <div style="display: flex; flex-wrap: wrap; gap: 6px;">
                                                    ${(user.organizations && user.organizations.length > 0) ? 
                                                        user.organizations.map(org => `
                                                            <span style="background: #e3f2fd; color: #1976d2; padding: 4px 10px; border-radius: 12px; font-size: 12px; font-weight: 500;">
                                                                ${org}
                                                            </span>
                                                        `).join('') : 
                                                        '<span style="color: #999; font-size: 12px; font-style: italic;">No organizations assigned</span>'
                                                    }
                                                </div>
                                            </div>
                                            
                                            <!-- Company & Created -->
                                            <div style="display: flex; gap: 15px; font-size: 12px; color: #888; margin-bottom: 15px; padding-top: 12px; border-top: 1px solid #f0f0f0;">
                                                <div><i class="fas fa-building"></i> ${user.company}</div>
                                                <div><i class="fas fa-calendar"></i> ${user.created ? new Date(user.created).toLocaleDateString() : 'N/A'}</div>
                                            </div>
                                            
                                            <!-- Actions -->
                                            <div style="display: flex; gap: 8px; margin-top: 12px;">
                                                <button onclick="editUser('${user.id}')" 
                                                        style="flex: 1; padding: 8px 12px; background: #ffc107; color: #000; border: none; border-radius: 6px; cursor: pointer; font-size: 13px; font-weight: 600; transition: background 0.2s;">
                                                    <i class="fas fa-edit"></i> Edit
                                                </button>
                                                <button onclick="deleteUser('${user.id}')" 
                                                        style="flex: 1; padding: 8px 12px; background: #dc3545; color: white; border: none; border-radius: 6px; cursor: pointer; font-size: 13px; font-weight: 600; transition: background 0.2s;">
                                                    <i class="fas fa-trash"></i> Delete
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            `).join('')}
                        </div>
                    `}
                </div>
            </div>
        </div>
    `;
    
    // Create and show modal
    const existingModal = document.getElementById('usersModal');
    if (existingModal) {
        existingModal.remove();
    }
    
    document.body.insertAdjacentHTML('beforeend', modalHtml);
}

function closeUsersModal() {
    const modal = document.getElementById('usersModal');
    if (modal) {
        modal.remove();
    }
}

function searchUsers() {
    const searchTerm = document.getElementById('userSearchInput').value.toLowerCase();
    const cards = document.querySelectorAll('.user-card');
    
    cards.forEach(card => {
        const text = card.textContent.toLowerCase();
        card.style.display = text.includes(searchTerm) ? '' : 'none';
    });
}

function toggleSelectAllUsers(checkbox) {
    const checkboxes = document.querySelectorAll('.user-checkbox');
    checkboxes.forEach(cb => {
        cb.checked = checkbox.checked;
        updateBulkUserActionButtons();
    });
}

function updateSelectedUserCount() {
    const checkboxes = document.querySelectorAll('.user-checkbox:checked');
    const count = checkboxes.length;
    document.getElementById('selectedUserCount').textContent = `${count} selected`;
    updateBulkUserActionButtons();
}

function updateBulkUserActionButtons() {
    const checkboxes = document.querySelectorAll('.user-checkbox:checked');
    const count = checkboxes.length;
    const bulkEditBtn = document.getElementById('bulkEditUserBtn');
    const bulkDeleteBtn = document.getElementById('bulkDeleteUserBtn');
    
    if (bulkEditBtn) bulkEditBtn.disabled = count === 0;
    if (bulkDeleteBtn) bulkDeleteBtn.disabled = count === 0;
}

function selectAllUsers() {
    const checkboxes = document.querySelectorAll('.user-checkbox');
    const selectAllCheckbox = document.getElementById('selectAllUserCheckbox');
    
    checkboxes.forEach(cb => cb.checked = true);
    if (selectAllCheckbox) selectAllCheckbox.checked = true;
    updateSelectedUserCount();
}

function bulkEditUsers() {
    const checkboxes = document.querySelectorAll('.user-checkbox:checked');
    if (checkboxes.length === 0) return;
    
    const allUsers = JSON.parse(localStorage.getItem('masterUsers') || '[]');
    const selectedIds = Array.from(checkboxes).map(cb => cb.dataset.userId);
    const selectedUsers = allUsers.filter(u => selectedIds.includes(u.id) || selectedIds.includes(String(u.id)));
    
    // Get organizations from the first selected user's company
    const allOrganizations = JSON.parse(localStorage.getItem('organizations') || '{}');
    const companyOrgs = selectedUsers.length > 0 ? (allOrganizations[selectedUsers[0].company] || []) : [];
    
    // Create bulk edit modal
    const bulkEditModal = document.createElement('div');
    bulkEditModal.className = 'modal';
    bulkEditModal.id = 'bulkEditUserModal';
    bulkEditModal.style.display = 'block';
    bulkEditModal.style.zIndex = '3100';
    bulkEditModal.innerHTML = `
        <div class="modal-content" style="max-width: 600px;">
            <div class="modal-header">
                <h3>Bulk Edit ${selectedUsers.length} User(s)</h3>
                <span class="close" onclick="document.getElementById('bulkEditUserModal').remove()">&times;</span>
            </div>
            <div class="modal-body">
                <form id="bulkEditUserForm">
                    <div class="form-group">
                        <label for="bulkEditRole">Change Role To:</label>
                        <select id="bulkEditRole" class="form-control">
                            <option value="">-- Don't change --</option>
                            <option value="user">User</option>
                            <option value="admin">Admin</option>
                        </select>
                        <small style="color: #666;">Only selected users will be updated</small>
                    </div>
                    
                    <div class="form-group">
                        <label>Update Organizations:</label>
                        <div style="margin-top: 10px;">
                            ${companyOrgs.length > 0 ? companyOrgs.map(org => `
                                <label style="display: block; margin-bottom: 8px;">
                                    <input type="checkbox" name="bulkOrganizations" value="${org}">
                                    ${org}
                                </label>
                            `).join('') : '<p style="color: #666;">No organizations configured for this company.</p>'}
                        </div>
                        <small style="color: #666;">Checking an organization will ADD it to all selected users. Unchecked organizations will not be modified.</small>
                    </div>
                    
                    <div class="form-actions">
                        <button type="submit" class="btn btn-primary">Apply Changes to All Selected Users</button>
                        <button type="button" class="btn btn-secondary" onclick="document.getElementById('bulkEditUserModal').remove()">Cancel</button>
                    </div>
                </form>
            </div>
        </div>
    `;
    
    document.body.appendChild(bulkEditModal);
    
    // Handle form submission
    document.getElementById('bulkEditUserForm').addEventListener('submit', function(e) {
        e.preventDefault();
        
        const newRole = document.getElementById('bulkEditRole').value;
        const orgCheckboxes = document.querySelectorAll('input[name="bulkOrganizations"]:checked');
        const orgsToAdd = Array.from(orgCheckboxes).map(cb => cb.value);
        
        // Update all selected users
        selectedUsers.forEach(user => {
            if (newRole) {
                user.role = newRole;
                
                // CRITICAL: If we're editing the currently logged in user, update currentUser
                if (currentUser && (currentUser.id === user.id || currentUser.username === user.username)) {
                    console.log('Updating currentUser role from', currentUser.role, 'to', newRole);
                    currentUser.role = newRole;
                    saveToLocalStorage('currentUser', currentUser);
                }
            }
            
            if (orgsToAdd.length > 0) {
                if (!user.organizations) {
                    user.organizations = [];
                }
                // Add organizations if they don't already exist
                orgsToAdd.forEach(org => {
                    if (!user.organizations.includes(org)) {
                        user.organizations.push(org);
                    }
                });
                
                // CRITICAL: If we're editing the currently logged in user, update organizations
                if (currentUser && (currentUser.id === user.id || currentUser.username === user.username)) {
                    currentUser.organizations = user.organizations;
                    saveToLocalStorage('currentUser', currentUser);
                }
            }
        });
        
        // Save to localStorage
        localStorage.setItem('masterUsers', JSON.stringify(allUsers));
        
        // Dispatch master data updated event
        window.dispatchEvent(new CustomEvent('masterDataUpdated', {
            detail: {
                users: allUsers
            }
        }));
        
        showNotification(`${selectedUsers.length} user(s) updated successfully`, 'success');
        bulkEditModal.remove();
        
        // Refresh the users modal
        closeUsersModal();
        openUsersModal();
    });
}

function bulkDeleteUsers() {
    const checkboxes = document.querySelectorAll('.user-checkbox:checked');
    if (checkboxes.length === 0) return;
    
    if (!confirm(`Are you sure you want to delete ${checkboxes.length} user(s)? This action cannot be undone.`)) {
        return;
    }
    
    const allUsers = JSON.parse(localStorage.getItem('masterUsers') || '[]');
    const idsToDelete = Array.from(checkboxes).map(cb => cb.dataset.userId);
    const filtered = allUsers.filter(p => !idsToDelete.includes(p.id));
    
    localStorage.setItem('masterUsers', JSON.stringify(filtered));
    
    showNotification(`${checkboxes.length} user(s) deleted successfully`, 'success');
    closeUsersModal();
    openUsersModal(); // Refresh modal
}

function viewUser(userId) {
    console.log('viewUser called with userId:', userId);
    const allUsers = JSON.parse(localStorage.getItem('masterUsers') || '[]');
    const user = allUsers.find(u => u.id === userId || u.id === String(userId));
    
    if (!user) {
        console.error('User not found. ID:', userId, 'Available IDs:', allUsers.map(u => u.id));
        showNotification('User not found. Please try refreshing the page.', 'error');
        return;
    }
    
    alert(`User: ${user.username}\nEmail: ${user.email}\nRole: ${user.role}\nCompany: ${user.company}\nCreated: ${user.created ? new Date(user.created).toLocaleDateString() : 'N/A'}`);
}
function editUser(userId) {
    console.log('editUser called with userId:', userId, typeof userId);
    const allUsers = JSON.parse(localStorage.getItem('masterUsers') || '[]');
    const allOrganizations = JSON.parse(localStorage.getItem('organizations') || '{}');
    
    console.log('Total users in storage:', allUsers.length);
    console.log('User IDs in storage:', allUsers.map(u => ({ id: u.id, type: typeof u.id, username: u.username })));
    
    // Try multiple matching strategies
    let user = allUsers.find(u => u.id === userId);
    if (!user) user = allUsers.find(u => u.id == userId); // Loose equality
    if (!user) user = allUsers.find(u => String(u.id) === String(userId)); // String comparison
    if (!user) user = allUsers.find(u => u.id === parseInt(userId)); // Number comparison
    
    if (!user) {
        console.error('User not found. Searched for:', userId, 'Type:', typeof userId);
        console.error('Available IDs:', allUsers.map(u => ({ id: u.id, type: typeof u.id, username: u.username })));
        showNotification('User not found. Please try refreshing the page.', 'error');
        return;
    }
    
    console.log('Found user:', user);
    
    // Get organizations for this company
    const companyOrgs = allOrganizations[user.company] || [];
    
    // Get user's current organizations (if they exist)
    const userOrgs = user.organizations || [];
    
    // Create modal for editing user
    const editModal = document.createElement('div');
    editModal.className = 'modal';
    editModal.id = 'editUserModal';
    editModal.style.display = 'block';
    editModal.style.zIndex = '3100';
    editModal.innerHTML = `
        <div class="modal-content" style="max-width: 600px;">
            <div class="modal-header">
                <h3>Edit User - ${user.username}</h3>
                <span class="close" onclick="document.getElementById('editUserModal').remove()">&times;</span>
            </div>
            <div class="modal-body">
                <form id="editUserForm">
                    <div class="form-group">
                        <label for="editUserRole">Role:</label>
                        <select id="editUserRole" class="form-control" required>
                            <option value="user" ${user.role === 'user' ? 'selected' : ''}>User</option>
                            <option value="admin" ${user.role === 'admin' ? 'selected' : ''}>Admin</option>
                        </select>
                    </div>
                    
                    <div class="form-group">
                        <label>Organizations (select all that apply):</label>
                        <div style="margin-top: 10px;">
                            ${companyOrgs.length > 0 ? companyOrgs.map(org => `
                                <label style="display: block; margin-bottom: 8px;">
                                    <input type="checkbox" name="organizations" value="${org}" 
                                           ${userOrgs.includes(org) ? 'checked' : ''}>
                                    ${org}
                                </label>
                            `).join('') : '<p style="color: #666;">No organizations configured for this company.</p>'}
                        </div>
                    </div>
                    
                    <div class="form-actions">
                        <button type="submit" class="btn btn-primary">Save Changes</button>
                        <button type="button" class="btn btn-secondary" onclick="document.getElementById('editUserModal').remove()">Cancel</button>
                    </div>
                </form>
            </div>
        </div>
    `;
    
    document.body.appendChild(editModal);
    
    // Handle form submission
    document.getElementById('editUserForm').addEventListener('submit', function(e) {
        e.preventDefault();
        
        const newRole = document.getElementById('editUserRole').value;
        const checkboxes = document.querySelectorAll('input[name="organizations"]:checked');
        const selectedOrgs = Array.from(checkboxes).map(cb => cb.value);
        
        // Update user
        user.role = newRole;
        user.organizations = selectedOrgs;
        
        // CRITICAL: If we're editing the currently logged in user, update currentUser
        if (currentUser && (currentUser.id === user.id || currentUser.username === user.username)) {
            console.log('Updating currentUser role from', currentUser.role, 'to', newRole);
            currentUser.role = newRole;
            currentUser.organizations = selectedOrgs;
            saveToLocalStorage('currentUser', currentUser);
        }
        
        // Save to localStorage
        localStorage.setItem('masterUsers', JSON.stringify(allUsers));
        
        // Dispatch master data updated event
        window.dispatchEvent(new CustomEvent('masterDataUpdated', {
            detail: {
                users: allUsers
            }
        }));
        
        showNotification('User updated successfully', 'success');
        editModal.remove();
        
        // Refresh the users modal
        closeUsersModal();
        openUsersModal();
    });
}

function deleteUser(userId) {
    if (!confirm('Are you sure you want to delete this user?')) {
        return;
    }
    
    const allUsers = JSON.parse(localStorage.getItem('masterUsers') || '[]');
    const filtered = allUsers.filter(u => u.id !== userId);
    localStorage.setItem('masterUsers', JSON.stringify(filtered));
    
    showNotification('User deleted successfully', 'success');
    closeUsersModal();
    openUsersModal(); // Refresh modal
}

function viewPolicy(policyId) {
    console.log('viewPolicy called with policyId:', policyId);
    const policies = loadCompanyPolicies();
    console.log('Available policies:', policies.map(p => ({ id: p.id, title: p.title })));
    
    // Handle both string and number IDs
    const policy = policies.find(p => p.id === policyId || p.id === String(policyId) || String(p.id) === policyId);
    
    if (!policy) {
        console.error('Policy not found with ID:', policyId);
        showNotification('Policy not found', 'error');
        return;
    }
    
    console.log('Found policy:', policy);
    
    // Show the policy view modal
    const modal = document.getElementById('policyViewModal');
    const titleElement = document.getElementById('policyViewTitle');
    const contentElement = document.getElementById('policyViewContent');
    
    if (!modal || !titleElement || !contentElement) {
        console.error('Policy view modal elements not found');
        return;
    }
    
    // Set title
    titleElement.textContent = policy.title || 'Policy Details';
    
    // Format the policy content
    const formattedContent = formatPolicyContentForDisplay(policy.content);
    
    // Build the full policy HTML
    const policyHTML = `
        <div class="policy-view-header" style="background: #f8f9fa; padding: 20px; border-radius: 8px; margin-bottom: 20px;">
            <div style="display: flex; justify-content: space-between; align-items: flex-start; flex-wrap: wrap; gap: 15px;">
                <div>
                    <h4 style="margin: 0 0 10px 0; color: #1f2937;">${policy.title}</h4>
                    <span class="policy-type-badge" style="display: inline-block; padding: 4px 12px; background: #2563eb; color: white; border-radius: 4px; font-size: 0.875rem;">
                        ${policy.type || 'Policy'}
                    </span>
                </div>
            </div>
        </div>
        
        <div class="policy-view-meta" style="margin-bottom: 25px; padding: 15px; background: #f8f9fa; border-radius: 8px;">
            ${policy.effectiveDate ? `
                <div style="margin-bottom: 8px;">
                    <strong><i class="fas fa-calendar"></i> Effective Date:</strong> 
                    <span>${policy.effectiveDate}</span>
                </div>
            ` : ''}
            ${policy.version ? `
                <div style="margin-bottom: 8px;">
                    <strong><i class="fas fa-code-branch"></i> Version:</strong> 
                    <span>${policy.version}</span>
                </div>
            ` : ''}
            ${policy.approvedBy ? `
                <div style="margin-bottom: 8px;">
                    <strong><i class="fas fa-user-check"></i> Approved By:</strong> 
                    <span>${policy.approvedBy}</span>
                </div>
            ` : ''}
            ${policy.clinics ? `
                <div style="margin-bottom: 8px;">
                    <strong><i class="fas fa-building"></i> Applicable Organizations:</strong> 
                    <span>${policy.clinics}</span>
                </div>
            ` : ''}
        </div>
        
        <div class="policy-view-content" style="line-height: 1.8;">
            ${formattedContent}
        </div>
    `;
    
    contentElement.innerHTML = policyHTML;
    
    // Show the modal
    modal.style.display = 'block';
}

function closePolicyViewModal() {
    const modal = document.getElementById('policyViewModal');
    if (modal) {
        modal.style.display = 'none';
    }
}

function updatePolicyCode() {
    const categoryId = document.getElementById('editPolicyCode')?.value;
    const policyId = document.getElementById('editPolicyId')?.value;
    const policyType = document.getElementById('editPolicyType')?.value;
    const codeDisplay = document.getElementById('policyCodeDisplay');
    const codeInput = document.getElementById('editPolicyCodeDisplay');
    
    if (categoryId && codeDisplay && codeInput) {
        const code = generatePolicyCode(categoryId, policyId, policyType);
        if (code) {
            codeInput.value = code;
            codeDisplay.style.display = 'block';
        } else {
            codeDisplay.style.display = 'none';
        }
    } else if (codeDisplay) {
        codeDisplay.style.display = 'none';
    }
}

function editPolicy(policyId) {
    console.log('editPolicy called with policyId:', policyId);
    const policies = loadCompanyPolicies();
    
    // Handle both string and number IDs
    const policy = policies.find(p => p.id === policyId || p.id === String(policyId) || String(p.id) === policyId);
    
    if (!policy) {
        console.error('Policy not found with ID:', policyId);
        showNotification('Policy not found', 'error');
        return;
    }
    
    console.log('Found policy to edit:', policy);
    
    // Populate edit form with structured fields
    document.getElementById('editPolicyId').value = policy.id;
    document.getElementById('editPolicyTitle').value = policy.title || '';
    document.getElementById('editPolicyType').value = policy.type || 'admin';
    document.getElementById('editPolicyEffectiveDate').value = policy.effectiveDate || new Date().toISOString().split('T')[0];
    document.getElementById('editPolicyVersion').value = policy.version || '1.0';
    
    // Populate structured policy sections
    // If structured fields exist, use them
    if (policy.purpose || policy.scope || policy.policyStatement) {
        document.getElementById('editPolicyPurpose').value = policy.purpose || '';
        document.getElementById('editPolicyScope').value = policy.scope || '';
        document.getElementById('editPolicyStatement').value = policy.policyStatement || '';
        document.getElementById('editPolicyProcedures').value = policy.procedures || '';
        document.getElementById('editPolicyResponsibilities').value = policy.responsibilities || '';
        document.getElementById('editPolicyConsequences').value = policy.consequences || policy.accountability || '';
        document.getElementById('editPolicyContent').value = '';
    } else {
        // Legacy policies - put all content in appropriate structured fields
        const content = policy.content || policy.description || '';
        
        // Try to split content by common section headers
        const sections = parseLegacyPolicyContent(content);
        
        document.getElementById('editPolicyPurpose').value = sections.purpose || '';
        document.getElementById('editPolicyScope').value = sections.scope || '';
        document.getElementById('editPolicyStatement').value = sections.policyStatement || sections.statement || '';
        document.getElementById('editPolicyProcedures').value = sections.procedures || '';
        document.getElementById('editPolicyResponsibilities').value = sections.responsibilities || '';
        document.getElementById('editPolicyConsequences').value = sections.consequences || sections.accountability || '';
        
        // Store any remaining content in additional content field
        document.getElementById('editPolicyContent').value = sections.additional || '';
    }
    
    // Populate organizations checkboxes
    populateEditOrganizations(policy);
    
    // Populate related documents checkboxes
    populateEditRelatedDocuments(policy);
    
    // Populate categories dropdown
    populateCategoriesDropdown();
    
    // Set selected category if it exists
    if (policy.categoryId) {
        const categorySelect = document.getElementById('editPolicyCode');
        if (categorySelect) {
            categorySelect.value = policy.categoryId;
        }
        // Update policy code display
        setTimeout(() => updatePolicyCode(), 100);
    }
    
    // Show existing policy code if it exists
    if (policy.policyCode) {
        const codeDisplay = document.getElementById('policyCodeDisplay');
        const codeInput = document.getElementById('editPolicyCodeDisplay');
        if (codeDisplay && codeInput) {
            codeInput.value = policy.policyCode;
            codeDisplay.style.display = 'block';
        }
    }
    
    // Show modal
    document.getElementById('policyEditModal').style.display = 'block';
}

function populateEditOrganizations(policy) {
    const orgsList = document.getElementById('editOrganizationsList');
    if (!orgsList) return;
    
    // Get organizations from localStorage
    const organizations = JSON.parse(localStorage.getItem('organizations') || '{}');
    const companyOrgs = organizations[currentCompany] || [];
    
    // Get organizations from policy (handle different formats)
    const policyOrgs = policy.clinicNames || policy.organizations || policy.clinics || '';
    const policyOrgArray = Array.isArray(policyOrgs) ? policyOrgs : policyOrgs.split(',').map(o => o.trim());
    
    if (companyOrgs.length === 0) {
        orgsList.innerHTML = '<p style="color: #666;">No organizations configured. Add organizations in Settings.</p>';
        return;
    }
    
    orgsList.innerHTML = companyOrgs.map(org => {
        const orgName = typeof org === 'object' ? org.name : org;
        const isChecked = policyOrgArray.includes(orgName) || policyOrgArray.includes('All Organizations');
        return `
            <label style="display: flex; align-items: center; gap: 8px; padding: 8px 12px; background: #f8f9fa; border-radius: 4px; border: 1px solid #e0e0e0; cursor: pointer; margin-bottom: 8px;">
                <input type="checkbox" name="editOrganizations" value="${orgName}" ${isChecked ? 'checked' : ''}>
                <span>${orgName}</span>
            </label>
        `;
    }).join('');
}

function parseLegacyPolicyContent(content) {
    const sections = {
        purpose: '',
        scope: '',
        policyStatement: '',
        statement: '',
        procedures: '',
        responsibilities: '',
        consequences: '',
        accountability: '',
        definitions: '',
        relatedDocuments: '',
        reviewApproval: '',
        additional: ''
    };

    if (!content) return sections;

    // Normalize line endings and split
    const lines = content.replace(/\r\n?/g, '\n').split('\n');

    // Map of header keywords to our canonical section keys
    const headerMap = [
        { re: /purpose/i, key: 'purpose' },
        { re: /scope/i, key: 'scope' },
        { re: /policy\s*statement|statement/i, key: 'policyStatement' },
        { re: /procedure|implementation/i, key: 'procedures' },
        { re: /responsibilit/i, key: 'responsibilities' },
        { re: /consequence|non-?compliance|accountability/i, key: 'consequences' },
        { re: /definition/i, key: 'definitions' },
        { re: /related\s*documents?/i, key: 'relatedDocuments' },
        { re: /review\s*&\s*approval|review\s*and\s*approval/i, key: 'reviewApproval' }
    ];

    // A header is considered if the line matches one of:
    // - Markdown headers: 1-3 hashes + text
    // - Numbered headers: "1.", "2)", etc. followed by text and optional colon
    // - Plain uppercase word headers ending with a colon
    const isHeader = (text) => {
        const t = text.trim();
        const candidates = [
            /^#{1,3}\s*(.+)$/i,
            /^(\d+\s*[\.)-]\s*)?(.+?):?$/i,
        ];
        for (const re of candidates) {
            const m = t.match(re);
            if (m) {
                const label = (m[1] && !m[2]) ? m[1] : (m[2] || m[1] || t);
                const clean = String(label).replace(/^[\d\s\.)-]+/, '').trim();
                for (const { re: hre, key } of headerMap) {
                    if (hre.test(clean)) return key;
                }
            }
        }
        return null;
    };

    let currentKey = 'additional';
    const buckets = Object.keys(sections).reduce((acc, k) => { acc[k] = []; return acc; }, {});

    for (const rawLine of lines) {
        const line = rawLine.trimEnd();
        if (!line.trim()) { // preserve blank lines inside a section
            buckets[currentKey].push('');
            continue;
        }
        const headerKey = isHeader(line);
        if (headerKey) {
            currentKey = headerKey;
            continue; // do not include the header line itself
        }
        buckets[currentKey].push(rawLine);
    }

    // Commit buckets to sections (join and trim)
    for (const key of Object.keys(sections)) {
        const text = buckets[key].join('\n').trim();
        if (text) sections[key] = text;
    }

    // Backfill: if we parsed generic 'statement', map it to policyStatement when that is empty
    if (!sections.policyStatement && sections.statement) {
        sections.policyStatement = sections.statement;
    }

    return sections;
}

function savePolicyEdit(event) {
    event.preventDefault();
    
    const policyId = document.getElementById('editPolicyId').value;
    const policies = loadCompanyPolicies();
    const policyIndex = policies.findIndex(p => p.id === policyId);
    
    if (policyIndex === -1) {
        showNotification('Policy not found', 'error');
        return;
    }
    
    // Get selected organizations
    const selectedOrgs = Array.from(document.querySelectorAll('input[name="editOrganizations"]:checked'))
        .map(cb => cb.value);
    
    // Get selected related documents
    const selectedDocs = Array.from(document.querySelectorAll('input[name="editRelatedDocuments"]:checked'))
        .map(cb => parseInt(cb.value));
    
    // Get selected category
    const categoryId = document.getElementById('editPolicyCode')?.value || null;
    
    // Get policy type
    const policyType = document.getElementById('editPolicyType').value;
    
    // Generate policy code if category is selected
    const policyCode = categoryId ? generatePolicyCode(categoryId, policyId, policyType) : null;
    
    // Update policy with structured fields
    policies[policyIndex] = {
        ...policies[policyIndex],
        // Basic fields
        title: document.getElementById('editPolicyTitle').value,
        type: policyType,
        clinicNames: selectedOrgs.join(', '),
        effectiveDate: document.getElementById('editPolicyEffectiveDate').value,
        version: document.getElementById('editPolicyVersion').value,
        categoryId: categoryId,
        policyCode: policyCode,
        
        // Structured policy sections
        purpose: document.getElementById('editPolicyPurpose').value,
        scope: document.getElementById('editPolicyScope').value,
        policyStatement: document.getElementById('editPolicyStatement').value,
        procedures: document.getElementById('editPolicyProcedures').value,
        responsibilities: document.getElementById('editPolicyResponsibilities').value,
        consequences: document.getElementById('editPolicyConsequences').value,
        
        // Additional/legacy content
        content: document.getElementById('editPolicyContent').value,
        
        // Related documents
        relatedDocuments: selectedDocs,
        
        // Metadata
        lastModified: new Date().toISOString(),
        modifiedBy: currentUser ? currentUser.username : 'Unknown'
    };
    
    // Save to localStorage
    localStorage.setItem(`policies_${currentCompany}`, JSON.stringify(policies));
    
    // Trigger sync events
    localStorage.setItem(`policies_${currentCompany}_updated`, new Date().toISOString());
    window.dispatchEvent(new CustomEvent('companyPoliciesUpdated', {
        detail: { company: currentCompany, policies: policies }
    }));
    
    // Refresh displays
    loadPoliciesFromStorage();
    
    // Close modal
    closePolicyEditModal();
    
    showNotification('Policy updated successfully', 'success');
}

function closePolicyEditModal() {
    document.getElementById('policyEditModal').style.display = 'none';
    document.getElementById('policyEditForm').reset();
}

function deletePolicy(policyId) {
    if (!confirm('Are you sure you want to delete this policy?')) {
        return;
    }
    
    const policies = loadCompanyPolicies();
    const filtered = policies.filter(p => p.id !== policyId);
    localStorage.setItem(`policies_${currentCompany}`, JSON.stringify(filtered));
    
    showNotification('Policy deleted successfully', 'success');
    closePoliciesModal();
    openPoliciesModal(); // Refresh modal
}

function loadCompanyPolicies() {
    if (!currentCompany) {
        return [];
    }
    
    const stored = localStorage.getItem(`policies_${currentCompany}`);
    if (stored) {
        try {
            return JSON.parse(stored);
        } catch (error) {
            console.error('Error parsing stored policies:', error);
            return [];
        }
    }
    return [];
}

function syncPoliciesToMasterAdmin(policies) {
    // Safety check
    if (!policies || !Array.isArray(policies)) {
        console.error('syncPoliciesToMasterAdmin: policies is not an array:', policies);
        return;
    }
    
    // Load master admin data
    const masterData = loadMasterAdminData();
    
    if (masterData && masterData.companies) {
        // Find current company in master data
        const companyIndex = masterData.companies.findIndex(c => c.name === currentCompany);
        if (companyIndex >= 0) {
            // Update company with policy count
            masterData.companies[companyIndex].policies = policies.length;
            masterData.companies[companyIndex].lastActive = new Date().toISOString();
            
            // Save updated master data
            localStorage.setItem('masterAdminData', JSON.stringify(masterData));
            
            // Dispatch event to notify master admin dashboard
            window.dispatchEvent(new CustomEvent('masterDataUpdated', {
                detail: { type: 'policies', data: masterData }
            }));
        }
    }
}

function loadPoliciesFromStorage() {
    const companyPolicies = loadCompanyPolicies();
    
    // Filter policies based on user's organizations if user is not admin
    let visiblePolicies = companyPolicies;
    
    if (currentUser && currentUser.role === 'user' && currentUser.organizations) {
        // User is not an admin, filter policies by their assigned organizations
        const userOrganizations = Array.isArray(currentUser.organizations) 
            ? currentUser.organizations 
            : currentUser.organizations.split(',').map(org => org.trim());
        
        console.log('Filtering policies for user organizations:', userOrganizations);
        
        visiblePolicies = companyPolicies.filter(policy => {
            // Get the policy's applicable organizations
            const policyOrganizations = policy.clinicNames || policy.organizations || policy.clinics || '';
            const policyOrgArray = Array.isArray(policyOrganizations) 
                ? policyOrganizations 
                : policyOrganizations.split(',').map(org => org.trim());
            
            // Check if "All Organizations" is in the policy
            if (policyOrgArray.includes('All Organizations') || policyOrgArray.length === 0) {
                return true; // Show policies that apply to all organizations
            }
            
            // Check if any of the user's organizations match the policy's organizations
            const hasMatchingOrg = userOrganizations.some(userOrg => 
                policyOrgArray.some(policyOrg => 
                    policyOrg.includes(userOrg) || userOrg.includes(policyOrg)
                )
            );
            
            return hasMatchingOrg;
        });
        
        console.log(`Filtered ${visiblePolicies.length} policies from ${companyPolicies.length} total policies`);
    } else {
        console.log('User is admin or has no organization restrictions');
    }
    
    // Update the global policies array
    policies.length = 0; // Clear existing policies
    policies.push(...visiblePolicies);
    
    // Also update currentPolicies for the main view
    currentPolicies.length = 0; // Clear existing currentPolicies
    currentPolicies.push(...visiblePolicies);
    
    // Display policies
    displayPolicies(visiblePolicies);
    
    console.log(`Loaded ${visiblePolicies.length} policies for company ${currentCompany}`);
}

// Setup signup form event listeners
function setupSignupFormListeners() {
    console.log('Setting up signup form listeners...');
    
    // Get elements
    const signupForm = document.getElementById('signupForm');
    const signupButton = document.querySelector('#signupForm button[type="submit"]');
    
    console.log('Signup form element:', signupForm);
    console.log('Signup button element:', signupButton);
    
    if (signupForm) {
        // Remove any existing listeners
        const newForm = signupForm.cloneNode(true);
        signupForm.parentNode.replaceChild(newForm, signupForm);
        
        // Add new event listener
        document.getElementById('signupForm').addEventListener('submit', function(e) {
            console.log('Signup form submit event triggered');
            e.preventDefault();
            signupUser(e);
        });
        console.log('Signup form event listener attached');
    }
    
    if (signupButton) {
        // Remove any existing listeners
        const newButton = signupButton.cloneNode(true);
        signupButton.parentNode.replaceChild(newButton, signupButton);
        
        // Add new event listener
        document.querySelector('#signupForm button[type="submit"]').addEventListener('click', function(e) {
            console.log('Signup button click event triggered');
            e.preventDefault();
            signupUser(e);
        });
        console.log('Signup button event listener attached');
    }
}

// User Management Functions
function showSignupModal() {
    console.log('showSignupModal called');
    const modal = document.getElementById('signupModal');
    if (modal) {
    modal.classList.add('show');
        console.log('Signup modal shown');
    
    // Ensure event listeners are attached when modal is shown
    setTimeout(() => {
        setupSignupFormListeners();
    }, 100);
    } else {
        console.error('Signup modal element not found');
    }
}

function closeSignupModal() {
    const modal = document.getElementById('signupModal');
    if (modal) {
        modal.classList.remove('show');
    }
    
    const signupForm = document.getElementById('signupForm');
    if (signupForm) {
        signupForm.reset();
    }
    
    const errorMsg = document.getElementById('signup-error-message');
    if (errorMsg) {
        errorMsg.style.display = 'none';
    }
}

function showLoginModal() {
    console.log('showLoginModal called');
    const modal = document.getElementById('loginModal');
    if (modal) {
        modal.classList.add('show');
        console.log('Login modal shown');
    } else {
        console.error('Login modal element not found');
    }
}

function closeLoginModal() {
    document.getElementById('loginModal').classList.remove('show');
    document.getElementById('loginForm').reset();
    document.getElementById('login-error-message').style.display = 'none';
}
function signupUser(event) {
    event.preventDefault();
    
    console.log('Signup form submitted');
    
    // Get button reference outside try block so it's available in catch
    const signupButton = document.querySelector('#signupForm button[type="submit"]');
    console.log('Signup button found:', !!signupButton);
    
    try {
        console.log('Step 1: Starting signup process');
        
        // Show loading state on button
    if (signupButton) {
        signupButton.textContent = 'Creating Account...';
        signupButton.disabled = true;
    }
        console.log('Step 2: Button state updated');
    
    const username = document.getElementById('signupUsername').value.trim();
    const email = document.getElementById('signupEmail').value.trim();
    const password = document.getElementById('signupPassword').value.trim();
    const accessCode = document.getElementById('signupAccessCode').value.trim();
    
    console.log('Step 3: Form data extracted:', { username, email, password: '***', accessCode });
    
    // Validate required fields
    if (!username || !email || !password || !accessCode) {
        console.log('Step 4: Validation failed - missing fields');
        showSignupError('Please fill in all required fields.');
        // Reset button
        if (signupButton) {
            signupButton.textContent = 'Create Account';
            signupButton.disabled = false;
        }
        return;
    }
    console.log('Step 5: Field validation passed');
    
    // Validate access code against master admin data
    console.log('Step 6: Loading master admin data...');
    const masterData = loadMasterAdminData();
    console.log('Step 7: Master data loaded:', masterData);
    console.log('Access codes available:', masterData.accessCodes);
    console.log('Access code entered:', accessCode);
    
    // Log each access code for debugging
    if (masterData.accessCodes && masterData.accessCodes.length > 0) {
        masterData.accessCodes.forEach((code, index) => {
            console.log(`Access code ${index + 1}:`, {
                code: code.code,
                status: code.status,
                expiryDate: code.expiryDate,
                usedBy: code.usedBy,
                maxCompanies: code.maxCompanies,
                description: code.description
            });
        });
        
        // Show available access codes for easy reference
        const availableCodes = masterData.accessCodes.map(code => code.code).join(', ');
        console.log('Available access codes:', availableCodes);
    } else {
        console.log('No access codes found in master data');
    }
    
    console.log('Step 8: Starting access code validation...');
    
    let validAccessCode = false;
    let foundAccessCode = null;
    
    if (masterData && masterData.accessCodes && masterData.accessCodes.length > 0) {
        console.log('Step 9: Checking access codes...');
        console.log('Starting access code validation...');
        console.log('Looking for code:', accessCode);
        
        foundAccessCode = masterData.accessCodes.find(code => {
            console.log(`Checking code: ${code.code}`);
            console.log(`  - Code match: ${code.code === accessCode}`);
            console.log(`  - Status active: ${code.status === 'active'}`);
            console.log(`  - Not expired: ${!code.expiryDate || new Date(code.expiryDate) > new Date()}`);
            console.log(`  - Code object:`, code);
            
            const isValid = code.code === accessCode && 
                code.status === 'active' && 
                (!code.expiryDate || new Date(code.expiryDate) > new Date());
                
            console.log(`  - Overall valid: ${isValid}`);
            if (isValid) {
                console.log('Found valid access code:', code);
            }
            return isValid;
        });
        
        console.log('Step 10: Access code search completed. Found:', foundAccessCode);
        validAccessCode = !!foundAccessCode;
        
        // Show why the access code wasn't found
        if (!foundAccessCode) {
            console.log('Access code validation failed. Checking each condition:');
            masterData.accessCodes.forEach((code, index) => {
                console.log(`Code ${index + 1} (${code.code}):`, {
                    codeMatch: code.code === accessCode,
                    statusActive: code.status === 'active',
                    notExpired: !code.expiryDate || new Date(code.expiryDate) > new Date(),
                    usedBy: code.usedBy
                });
            });
        } else {
            console.log('Access code found and validated successfully!');
        }
    } else {
        console.log('Step 11: No master data or access codes found - access code required');
        validAccessCode = false;
    }
    
    console.log('Step 12: Access code validation result:', validAccessCode);
    
    if (!validAccessCode) {
        console.log('Step 13: Access code validation failed, showing error');
        // Check if master data is available
        if (!masterData || !masterData.accessCodes || masterData.accessCodes.length === 0) {
            showSignupError('No access codes are currently available. Please contact your administrator to create access codes in the Master Admin dashboard.');
        } else {
        // Check if the code exists but has issues
        const existingCode = masterData.accessCodes.find(code => code.code === accessCode);
        if (existingCode) {
            if (existingCode.status !== 'active') {
                showSignupError('Access code is not active. Please contact your administrator.');
                } else if (existingCode.expiryDate && new Date(existingCode.expiryDate) <= new Date()) {
                    showSignupError('Access code has expired. Please contact your administrator for a new code.');
            } else {
                showSignupError('Access code validation failed. Please check with your administrator.');
            }
        } else {
            showSignupError('Invalid access code. Please check with your administrator for a valid code.');
            }
        }
        // Reset button
        if (signupButton) {
            signupButton.textContent = 'Create Account';
            signupButton.disabled = false;
        }
        return;
    }
    
    console.log('Step 14: Access code validation passed, checking username/email...');
    
    // Check if username already exists across all users
    const allUsers = masterData ? masterData.users : users;
    console.log('Step 15: Checking username uniqueness...');
    if (allUsers.find(user => user.username === username)) {
        console.log('Step 16: Username already exists');
        showSignupError('Username already exists. Please choose a different username.');
        // Reset button
        if (signupButton) {
            signupButton.textContent = 'Create Account';
            signupButton.disabled = false;
        }
        return;
    }
    console.log('Step 17: Username is unique');
    
    // Check if email already exists across all users
    console.log('Step 18: Checking email uniqueness...');
    if (allUsers.find(user => user.email === email)) {
        console.log('Step 19: Email already exists');
        showSignupError('Email already exists. Please use a different email.');
        // Reset button
        if (signupButton) {
            signupButton.textContent = 'Create Account';
            signupButton.disabled = false;
        }
        return;
    }
    console.log('Step 20: Email is unique');
    
    // Create new user with company based on access code
    console.log('Step 21: Creating user object...');
    const newUser = {
        id: Date.now(),
        username: username,
        email: email,
        password: password,
        company: foundAccessCode ? foundAccessCode.description || 'CSI Company' : 'CSI Company',
        role: 'user',
        accessCode: accessCode,
        created: new Date().toISOString().split('T')[0]
    };
    
    console.log('Step 22: User object created:', newUser);
    console.log('Creating user:', newUser);
    console.log('masterData available:', !!masterData);
    console.log('foundAccessCode:', !!foundAccessCode);
    
    // Update master admin data if available
    if (masterData && foundAccessCode) {
        console.log('Step 23: Updating master admin data...');
        // Update the access code usage
        foundAccessCode.usedBy.push(newUser.company);
        localStorage.setItem('masterAccessCodes', JSON.stringify(masterData.accessCodes));
        
        // Add user to master users list
        masterData.users.push(newUser);
        localStorage.setItem('masterUsers', JSON.stringify(masterData.users));
        
        // Also add to local users list for consistency
        users.push(newUser);
        saveToLocalStorage('users', users);
        
        // Dispatch event to notify admin-master of the new user
        console.log('Step 24: Dispatching masterDataUpdated event...');
        window.dispatchEvent(new CustomEvent('masterDataUpdated', {
            detail: {
                users: masterData.users,
                companies: masterData.companies,
                accessCodes: masterData.accessCodes
            }
        }));
        console.log('Step 25: Event dispatched successfully');
    } else {
        console.log('Step 26: No valid access code - user creation not allowed');
        // No valid access code - user creation not allowed
        console.log('User creation blocked - no valid access code provided');
        showSignupError('A valid access code is required to create an account. Please contact your administrator.');
        
        // Reset button
        if (signupButton) {
            signupButton.textContent = 'Create Account';
            signupButton.disabled = false;
        }
        return;
    }
    
    // Commented out welcome email - only sending new policy notifications for now
    // console.log('Step 27: Sending welcome email...');
    // sendWelcomeEmail(newUser);
    
    console.log('Step 27: Auto-logging in user...');
    // Auto-login the new user
    currentUser = newUser;
    currentCompany = newUser.company;
    saveToLocalStorage('currentUser', currentUser);
    saveToLocalStorage('currentCompany', currentCompany);
    
    console.log('Step 28: User saved to localStorage:', {
        users: users.length,
        currentUser: currentUser.username,
        currentCompany: currentCompany
    });
    
    console.log('Step 29: Updating UI...');
    // Update UI
    updateUserInterface();
    closeSignupModal();
    
    console.log('Step 30: Resetting signup button...');
    // Reset signup button
    if (signupButton) {
        signupButton.textContent = 'Create Account';
        signupButton.disabled = false;
    }
    
    console.log('Step 31: Loading policies...');
    // Load policies from storage after successful signup
    if (currentCompany) {
        loadPoliciesFromStorage();
    }
    
    console.log('Step 32: Showing success message...');
    
    // Add user-logged-in class to body
    document.body.classList.add('user-logged-in');
    
    // Hide welcome modal
    const welcomeModal = document.getElementById('welcomeModal');
    if (welcomeModal) {
        welcomeModal.style.display = 'none';
    }
    
    // Show success message
    showNotification('Account created successfully! You are now logged in.', 'success');
    
    console.log('Step 33: Signup process completed successfully!');
    
    } catch (error) {
        console.error('Error during signup:', error);
        console.error('Error stack:', error.stack);
        console.error('Error details:', {
            message: error.message,
            name: error.name,
            line: error.lineNumber,
            column: error.columnNumber
        });
        
        showSignupError('An error occurred during account creation. Please try again.');
        
        // Reset button on error
        if (signupButton) {
            signupButton.textContent = 'Create Account';
            signupButton.disabled = false;
        }
    }
}

// Send welcome email to new user
async function sendWelcomeEmail(user) {
    try {
        console.log('Sending welcome email to:', user.email);
        
        // Get email webhook URL from settings
        const emailWebhookUrl = localStorage.getItem('emailWebhookUrl') || 'http://localhost:5678/webhook/d523361e-1e04-4c16-a86e-bbb1d7729fcb';
        
        // Prepare email data
        const emailData = {
            to: user.email,
            subject: 'Welcome to Policy Pro!',
            html: `
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
                    <h2 style="color: #2563eb;">Welcome to Policy Pro!</h2>
                    <p>Hi ${user.username},</p>
                    <p>Your account has been successfully created. Here are your account details:</p>
                    <div style="background: #f0f8ff; padding: 15px; border-radius: 8px; margin: 20px 0;">
                        <p style="margin: 5px 0;"><strong>Username:</strong> ${user.username}</p>
                        <p style="margin: 5px 0;"><strong>Email:</strong> ${user.email}</p>
                        <p style="margin: 5px 0;"><strong>Company:</strong> ${user.company}</p>
                    </div>
                    <p>You can now access all your company policies and documents.</p>
                    <p style="margin-top: 30px;">Best regards,<br>The Policy Pro Team</p>
                </div>
            `,
            text: `Welcome to Policy Pro!\n\nHi ${user.username},\n\nYour account has been successfully created.\n\nUsername: ${user.username}\nEmail: ${user.email}\nCompany: ${user.company}\n\nYou can now access all your company policies and documents.\n\nBest regards,\nThe Policy Pro Team`,
            type: 'welcome_email',
            recipient: user.email,
            company: user.company,
            timestamp: new Date().toISOString()
        };
        
        // Send to webhook
        const response = await fetch(emailWebhookUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(emailData)
        });
        
        if (response.ok) {
            console.log('Welcome email sent successfully');
        } else {
            console.warn('Welcome email webhook failed:', response.status);
        }
    } catch (error) {
        console.error('Error sending welcome email:', error);
        // Don't block signup process if email fails
    }
}

// Send new policy notification email to all company users
async function sendNewPolicyNotificationEmail(policy) {
    try {
        console.log('Sending new policy notification emails for:', policy.title);
        
        // Get email webhook URL from settings
        const emailWebhookUrl = localStorage.getItem('emailWebhookUrl') || 'http://localhost:5678/webhook/d523361e-1e04-4c16-a86e-bbb1d7729fcb';
        
        // Get all users for this company
        const companyUsers = getCompanyUserEmails();
        
        if (companyUsers.length === 0) {
            console.log('No users to notify for company:', currentCompany);
            return;
        }
        
        // Create user-friendly date format
        const effectiveDate = policy.effectiveDate ? new Date(policy.effectiveDate).toLocaleDateString() : 'Not specified';
        
        // Prepare webhook data with FULL policy details and ALL company user emails
        const webhookData = {
            timestamp: new Date().toISOString(),
            type: 'new_policy_notification',
            company: currentCompany || 'Unknown',
            
            // Full policy data
            policy: {
                id: policy.id,
                title: policy.title,
                type: policy.type,
                content: policy.content || policy.description || '',
                organizations: policy.clinicNames || policy.organizationNames || '',
                effectiveDate: policy.effectiveDate || '',
                version: policy.version || '1.0',
                approvedBy: policy.approvedBy || '',
                createdBy: policy.modifiedBy || currentUser?.username || 'Unknown',
                lastModified: policy.lastModified || new Date().toISOString(),
                status: 'active',
                generatedBy: policy.generatedBy || 'manual'
            },
            
            // All company users with their emails
            companyUsers: companyUsers,
            
            // Email configuration for webhook to send emails
            emailConfig: {
                to: companyUsers.map(user => user.email), // Array of email addresses
                subject: `New Policy: ${policy.title}`,
                recipients: companyUsers
            }
        };
        
        // Send to webhook with full policy and user data
        const response = await fetch(emailWebhookUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(webhookData)
        });
        
        if (response.ok) {
            console.log('New policy notification webhook sent successfully with full policy data to', companyUsers.length, 'users');
        } else {
            console.warn('New policy notification webhook failed:', response.status);
        }
    } catch (error) {
        console.error('Error sending new policy notification emails:', error);
        // Don't block policy saving if email sending fails
    }
}

// Helper function to truncate text for email preview
function truncateText(text, maxLength) {
    if (!text) return '';
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength) + '...';
}

function loginUser(event) {
    event.preventDefault();
    
    // Show loading state on button
    const loginButton = document.querySelector('#loginForm button[type="submit"]');
    
    // Helper function to reset button
    const resetButton = () => {
        if (loginButton) {
            loginButton.textContent = 'Login';
            loginButton.disabled = false;
        }
    };
    
    try {
        if (loginButton) {
            loginButton.textContent = 'Logging in...';
            loginButton.disabled = true;
            
            // Failsafe timeout to reset button after 10 seconds
            setTimeout(() => {
                if (loginButton.disabled) {
                    console.log('Login timeout - resetting button');
                    resetButton();
                }
            }, 10000);
        }
        
        const username = document.getElementById('loginUsername').value.trim();
        const password = document.getElementById('loginPassword').value.trim();
        
        if (!username || !password) {
            showLoginError('Please fill in all required fields.');
            resetButton();
            return;
        }
        
        // Find user by username/email and password
        console.log('Looking for user:', { username, password: '***' });
        
        // Load all users from masterUsers (from localStorage) to include all users across all companies
        const allUsers = JSON.parse(localStorage.getItem('masterUsers') || '[]');
        console.log('Available users:', allUsers.map(u => ({ username: u.username, email: u.email, hasPassword: !!u.password })));
        
        const user = allUsers.find(u => (u.username === username || u.email === username) && u.password === password);
        
        if (!user) {
            console.log('User not found or password incorrect');
            showLoginError('Invalid username/email or password. Please try again.');
            resetButton();
            return;
        }
        
        console.log('User found:', user.username);
        
        // Set current user and company
        currentUser = user;
        currentCompany = user.company;
        saveToLocalStorage('currentUser', currentUser);
        saveToLocalStorage('currentCompany', currentCompany);
        
        // Update UI
        updateUserInterface();
        closeLoginModal();
        
        // Add user-logged-in class to body
        document.body.classList.add('user-logged-in');
        
        // Hide welcome modal
        const welcomeModal = document.getElementById('welcomeModal');
        if (welcomeModal) {
            welcomeModal.style.display = 'none';
        }
        
        // Show success message
        showSuccessMessage('Login successful! Welcome back!');
        
        // Load policies from storage after successful login
        if (currentCompany) {
            loadPoliciesFromStorage();
        }
        
        // Reset button after successful login
        resetButton();
        
    } catch (error) {
        console.error('Login error:', error);
        showLoginError('An error occurred during login. Please try again.');
        resetButton();
    }
}

// Feature Tour System
let tourSteps = [
    {
        title: 'Welcome to Policy Pro! 🎉',
        description: '🐧 This interactive tour will show you all the key features. Let\'s get started!',
        icon: '🐧',
        action: null
    },
    {
        title: '1️⃣ View Policies',
        description: '🐧 Scroll down to see your policy library. You can view, search, and filter all your policies here.',
        icon: '🐧',
        action: 'scroll-to-policies'
    },
    {
        title: '2️⃣ Admin Dashboard',
        description: '🐧 Welcome to your admin dashboard! Here you can manage all policies, users, and settings.',
        icon: '🐧',
        action: 'show-admin-dashboard'
    },
    {
        title: '🎉 Admin Dashboard Open!',
        description: '🐧 The admin dashboard is now open! Here are the key features you can explore. Click Next to see what each does.',
        icon: '🐧',
        action: null
    },
    {
        title: 'Create Policies',
        description: '🐧 Click "Create New Policy" to add policies manually, or use "AI Policy Generator" for AI-powered creation!',
        icon: '🐧',
        action: null
    },
    {
        title: 'AI Policy Generator',
        description: '🐧 Try the "AI Policy Generator" - describe what you need and AI will create a professional policy for you!',
        icon: '🐧',
        action: null
    },
    {
        title: 'Upload Documents',
        description: '🐧 Use "Upload Policy Documents" to import existing policies from files. The system processes them automatically!',
        icon: '🐧',
        action: null
    },
    {
        title: 'Manage Your Team',
        description: '🐧 Click "Manage Users" to add team members, assign roles, and control who can access what.',
        icon: '🐧',
        action: null
    },
    {
        title: 'Customize Settings',
        description: '🐧 Click "Settings" to set up organizations, categories, disciplinary actions, and webhooks.',
        icon: '🐧',
        action: null
    },
    {
        title: 'Your Profile',
        description: '🐧 Click your profile icon in the top navigation to view your account info and preferences.',
        icon: '🐧',
        action: null
    },
    {
        title: 'You\'re All Set! 🚀',
        description: '🐧 You now know all the key features! Start creating policies, managing users, and exploring. Happy policy management!',
        icon: '🐧',
        action: null
    }
];

let currentTourStep = 0;

function startTour() {
    console.log('🚀 Starting feature tour...');
    currentTourStep = 0;
    showTourStep(0);
}

// Manual trigger for testing
function testTour() {
    console.log('🧪 Test tour triggered manually');
    localStorage.removeItem('tourCompleted'); // Clear completion status
    currentTourStep = 0;
    showTourStep(0);
}

// Make startTour globally accessible
window.startTour = startTour;
window.testTour = testTour;


function nextTourStep() {
    currentTourStep++;
    
    if (currentTourStep >= tourSteps.length) {
        endTour();
        return;
    }
    
    const step = tourSteps[currentTourStep];
    
    // Show the step first
    showTourStep(currentTourStep);
    
    // Debug logging
    console.log(`Tour step ${currentTourStep}: title="${step.title}", action="${step.action}"`);
    
    // Execute action AFTER showing the step (so user sees the message while action happens)
    if (step.action) {
        console.log(`Step ${currentTourStep} has action "${step.action}", executing...`);
        setTimeout(() => {
            executeTourAction(step.action);
        }, 500);
    } else {
        console.log(`Step ${currentTourStep} has no action`);
    }
}

function skipTour() {
    console.log('⏭️ Tour skipped');
    endTour();
}

function endTour() {
    const modal = document.getElementById('tourModal');
    const overlay = document.getElementById('tourOverlay');
    
    if (modal) modal.style.display = 'none';
    if (overlay) overlay.style.display = 'none';
    
    // Mark tour as completed
    localStorage.setItem('tourCompleted', 'true');
}

function showTourStep(stepIndex) {
    console.log('Showing tour step:', stepIndex, 'of', tourSteps.length);
    
    if (stepIndex >= tourSteps.length) {
        console.log('Tour complete, ending');
        endTour();
        return;
    }
    
    const step = tourSteps[stepIndex];
    const modal = document.getElementById('tourModal');
    const overlay = document.getElementById('tourOverlay');
    
    console.log('Tour modal:', modal);
    console.log('Tour overlay:', overlay);
    
    if (!modal || !overlay) {
        console.error('Tour modal or overlay not found!');
        return;
    }
    
    // Update modal content
    const iconEl = document.getElementById('tourIcon');
    const titleEl = document.getElementById('tourTitle');
    const descEl = document.getElementById('tourDescription');
    
    if (iconEl) {
        // Keep the 3D animated structure but update the emoji
        const innerDiv = iconEl.querySelector('div');
        if (innerDiv) {
            innerDiv.textContent = step.icon;
        } else {
            // If structure doesn't exist, create it
            iconEl.innerHTML = `<div style="transform: perspective(500px) rotateY(-10deg) rotateX(-5deg) translateZ(20px); transition: transform 0.3s; animation: penguinWaddle 2s infinite ease-in-out;">${step.icon}</div>`;
        }
    }
    if (titleEl) titleEl.textContent = step.title;
    if (descEl) descEl.textContent = step.description;
    
    // Show modal and overlay (light overlay, non-blocking)
    console.log('Showing tour modal and overlay');
    modal.style.display = 'block';
    if (overlay) overlay.style.display = 'block';
    
    // Add a subtle pulse animation
    if (modal) {
        modal.style.animation = 'none';
        setTimeout(() => {
            modal.style.animation = 'pulse 0.5s ease-in-out';
        }, 10);
    }
    
    // Update button text based on step
    const nextBtn = document.getElementById('tourNext');
    if (nextBtn) {
        if (stepIndex === tourSteps.length - 1) {
            nextBtn.textContent = 'Finish';
            nextBtn.innerHTML = 'Finish <i class="fas fa-check"></i>';
        } else {
            nextBtn.textContent = 'Next';
            nextBtn.innerHTML = 'Next <i class="fas fa-arrow-right"></i>';
        }
    }
    
    console.log('Tour step displayed successfully');
}

function executeTourAction(action) {
    console.log('🎯 Executing tour action:', action);
    
    switch(action) {
        case 'scroll-to-policies':
            setTimeout(() => {
                document.getElementById('policies').scrollIntoView({ behavior: 'smooth', block: 'start' });
            }, 500);
            break;
            
        case 'open-admin-dashboard':
        case 'show-admin-dashboard':
            // Open admin dashboard directly
            console.log('Opening admin dashboard...');
            openPasswordModal();
            break;
            
        case 'show-create-policy':
        case 'show-ai-assistant':
        case 'show-manage-users':
        case 'show-settings':
        case 'show-profile':
            // Don't end tour, just let them explore
            console.log('User can explore the feature');
            break;
    }
}
// Demo Account Function
function startDemo() {
    console.log('🎮 Starting demo...');
    
    const demoCompany = 'Demo Company';
    const demoUser = {
        id: 'demo-user-1',
        username: 'demo',
        password: 'demo123',
        email: 'demo@policypro.com',
        fullName: 'Demo User',
        company: demoCompany,
        role: 'admin',
        created: new Date().toISOString().split('T')[0]
    };
    
    // Initialize demo company if it doesn't exist
    const masterCompanies = JSON.parse(localStorage.getItem('masterCompanies') || '[]');
    let demoCompanyData = masterCompanies.find(c => c.name === demoCompany);
    
    if (!demoCompanyData) {
        // Create demo company
        demoCompanyData = {
            id: 'demo-company-1',
            name: demoCompany,
            industry: 'Technology',
            plan: 'pro',
            adminPassword: 'demo123',
            created: new Date().toISOString().split('T')[0],
            users: 1,
            policies: 3,
            status: 'active'
        };
        masterCompanies.push(demoCompanyData);
        localStorage.setItem('masterCompanies', JSON.stringify(masterCompanies));
    }
    
    // Initialize demo user
    const masterUsers = JSON.parse(localStorage.getItem('masterUsers') || '[]');
    const existingDemoUser = masterUsers.find(u => u.username === 'demo' && u.company === demoCompany);
    
    if (!existingDemoUser) {
        masterUsers.push(demoUser);
        localStorage.setItem('masterUsers', JSON.stringify(masterUsers));
    }
    
    // Create sample policies for demo
    const demoPolicies = [
        {
            id: 'demo-policy-1',
            title: 'Data Security Policy',
            type: 'admin',
            clinics: ['All Organizations'],
            clinicNames: 'All Organizations',
            description: 'This policy establishes guidelines for data security and protection of sensitive information.',
            content: 'Purpose: To ensure the secure handling of data.\n\nProcedures: All data must be encrypted.\n\nCompliance: Required monthly reviews.',
            company: demoCompany,
            created: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
            lastModified: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
            status: 'active',
            categoryId: null,
            policyCode: 'ADMIN.1.1.2025'
        },
        {
            id: 'demo-policy-2',
            title: 'Employee Code of Conduct',
            type: 'admin',
            clinics: ['All Organizations'],
            clinicNames: 'All Organizations',
            description: 'Guidelines for professional behavior and ethical conduct.',
            content: 'Purpose: Maintain professional standards.\n\nGuidelines: Respect, integrity, accountability.',
            company: demoCompany,
            created: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
            lastModified: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
            status: 'active',
            categoryId: null,
            policyCode: 'ADMIN.1.2.2025'
        },
        {
            id: 'demo-policy-3',
            title: 'Remote Work Guidelines',
            type: 'sog',
            clinics: ['All Organizations'],
            clinicNames: 'All Organizations',
            description: 'Standard operating guidelines for remote work arrangements.',
            content: 'Purpose: Establish remote work protocols.\n\nProcedures: Check-in times, communication requirements, productivity expectations.',
            company: demoCompany,
            created: new Date(Date.now() - 21 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
            lastModified: new Date(Date.now() - 21 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
            status: 'active',
            categoryId: null,
            policyCode: 'SOG.1.1.2025'
        }
    ];
    
    // Save demo policies
    localStorage.setItem(`policies_${demoCompany}`, JSON.stringify(demoPolicies));
    
    // Set up organizations for demo company
    const organizations = JSON.parse(localStorage.getItem('organizations') || '{}');
    if (!organizations[demoCompany]) {
        organizations[demoCompany] = [demoCompany];
        localStorage.setItem('organizations', JSON.stringify(organizations));
    }
    
    // Log in as demo user
    currentUser = demoUser;
    currentCompany = demoCompany;
    saveToLocalStorage('currentUser', currentUser);
    saveToLocalStorage('currentCompany', currentCompany);
    
    // Update UI
    document.body.classList.add('user-logged-in');
    updateUserInterface();
    
    // Load demo policies
    loadPoliciesFromStorage();
    
    // Hide landing page
    const landingPage = document.getElementById('landingPage');
    if (landingPage) {
        landingPage.style.display = 'none';
    }
    
    // Show success notification
    showNotification('🎮 Demo mode activated! Explore Policy Pro with sample data.', 'success');
    
    // Always start the feature tour for demo mode
    console.log('✅ Demo started successfully');
    console.log('🚀 Starting tour in 1 second...');
    
    // Scroll to top
    window.scrollTo(0, 0);
    
    // Start tour with shorter delay
    setTimeout(() => {
        console.log('⏰ Tour timer fired');
        
        const modal = document.getElementById('tourModal');
        const overlay = document.getElementById('tourOverlay');
        console.log('Tour modal found:', !!modal);
        console.log('Tour overlay found:', !!overlay);
        
        if (typeof startTour === 'function') {
            console.log('Calling startTour()...');
            startTour();
        } else {
            console.error('❌ startTour function not found!');
        }
    }, 1000);
}

// Duplicate requireLogin function removed - using the one defined earlier

function logoutUser() {
    currentUser = null;
    currentCompany = null;
    saveToLocalStorage('currentUser', null);
    saveToLocalStorage('currentCompany', null);
    
    // Clear admin session flag
    localStorage.removeItem('adminSessionActive');
    
    // Reload page to clear all state
    window.location.reload();
}

function updateUserInterface() {
    const navMenu = document.querySelector('.nav-menu');
    
    if (currentUser) {
        // User is logged in - hide login/signup buttons and show sign-out
        const authButtons = document.querySelectorAll('.auth-button');
        const authDivider = document.querySelector('.auth-buttons-divider');
        const signOutBtn = document.querySelector('.auth-signout');
        
        authButtons.forEach(btn => {
            btn.style.display = 'none';
        });
        
        if (authDivider) {
            authDivider.style.display = 'none';
        }
        if (signOutBtn) {
            signOutBtn.style.display = 'flex';
        }
        
        // Update the notification badge
        updateNotificationBadge();
        
        // Filter policies by company
        filterPoliciesByCompany();
    } else {
        // User is not logged in - show login/signup buttons and hide sign-out
        const authButtons = document.querySelectorAll('.auth-button');
        const authDivider = document.querySelector('.auth-buttons-divider');
        const signOutBtn = document.querySelector('.auth-signout');
        
        authButtons.forEach(btn => {
            btn.style.display = 'flex';
        });
        
        if (authDivider) {
            authDivider.style.display = 'inline-block';
        }
        if (signOutBtn) {
            signOutBtn.style.display = 'none';
        }
        
        updateNotificationBadge();
    }
}

function filterPoliciesByCompany() {
    if (currentCompany) {
        const companyPolicies = currentPolicies.filter(policy => 
            policy.company === currentCompany || !policy.company
        );
        displayPolicies(companyPolicies);
    } else {
        displayPolicies(currentPolicies);
    }
}

function showSignupError(message) {
    const errorElement = document.getElementById('signup-error-message');
    errorElement.textContent = message;
    errorElement.style.display = 'block';
}

function showLoginError(message) {
    const errorElement = document.getElementById('login-error-message');
    errorElement.textContent = message;
    errorElement.style.display = 'block';
}

// User Management in Admin Settings
function addUser() {
    const username = document.getElementById('newUserName').value.trim();
    const email = document.getElementById('newUserEmail').value.trim();
    const company = document.getElementById('newUserCompany').value.trim();
    const role = document.getElementById('newUserRole').value;
    
    if (!username || !email || !company) {
        alert('Please fill in all fields.');
        return;
    }
    
    // Check if username already exists
    if (users.find(user => user.username === username)) {
        alert('Username already exists. Please choose a different username.');
        return;
    }
    
    // Check if email already exists
    if (users.find(user => user.email === email)) {
        alert('Email already exists. Please use a different email.');
        return;
    }
    
    const newUser = {
        id: Date.now(),
        username: username,
        email: email,
        company: company,
        role: role,
        accessCode: '123',
        created: new Date().toISOString().split('T')[0]
    };
    
    users.push(newUser);
    saveToLocalStorage('users', users);
    displayUsers();
    
    // Clear form
    document.getElementById('newUserName').value = '';
    document.getElementById('newUserEmail').value = '';
    document.getElementById('newUserCompany').value = '';
    document.getElementById('newUserRole').value = 'user';
    
    alert('User added successfully!');
}

function deleteUser(userId) {
    if (confirm('Are you sure you want to delete this user?')) {
        users = users.filter(user => user.id !== userId);
        saveToLocalStorage('users', users);
        displayUsers();
        alert('User deleted successfully!');
    }
}

function displayUsers() {
    const usersList = document.getElementById('usersList');
    if (!usersList) {
        console.log('usersList element not found, skipping displayUsers');
        return;
    }
    
    if (users.length === 0) {
        usersList.innerHTML = '<p class="no-items">No users found. Add your first user above.</p>';
        return;
    }
    
    usersList.innerHTML = users.map(user => `
        <div class="user-card">
            <div class="user-info">
                <h4>${user.username} <span class="user-role ${user.role}">${user.role}</span></h4>
                <p><strong>Email:</strong> ${user.email}</p>
                <p><strong>Company:</strong> ${user.company}</p>
                <p><strong>Created:</strong> ${user.created}</p>
            </div>
            <div class="user-actions">
                <button onclick="deleteUser(${user.id})" class="btn btn-sm btn-danger">
                    <i class="fas fa-trash"></i> Delete
                </button>
            </div>
        </div>
    `).join('');
}

// Admin Dashboard Functions
function openPasswordModal() {
    console.log('openPasswordModal function called!');
    console.log('Current user:', currentUser);
    console.log('Current company:', currentCompany);
    console.log('User role:', currentUser?.role);
    console.log('Role type:', typeof currentUser?.role);
    console.log('Full user object:', JSON.stringify(currentUser, null, 2));
    
    // Check if user has admin privileges - check multiple possible role values
    // Only bypass password if role is explicitly 'admin', otherwise require password
    const isAdmin = currentUser && currentUser.role && 
        (currentUser.role === 'admin' || 
         currentUser.role === 'Admin' || 
         currentUser.role.toLowerCase() === 'admin');
    
    console.log('Is admin check result:', isAdmin);
    console.log('Admin bypass check details:', {
        hasUser: !!currentUser,
        hasRole: !!currentUser?.role,
        roleValue: currentUser?.role,
        roleLowercase: currentUser?.role?.toLowerCase(),
        isExactAdmin: currentUser?.role === 'admin',
        isCapitalAdmin: currentUser?.role === 'Admin',
        isLowerCaseMatch: currentUser?.role?.toLowerCase() === 'admin'
    });
    
    // CRITICAL: If role is 'user', ALWAYS require password regardless of any other check
    const isUserRole = currentUser?.role === 'user' || currentUser?.role === 'User';
    console.log('Is user role?', isUserRole);
    
    if (isUserRole) {
        console.log('🔐 User has user role - requiring password, bypassing admin check');
        // Skip the admin bypass and go straight to password modal
    }
    // For debugging - if this is true, the user will bypass password
    else if (isAdmin) {
        console.log('✅ User has admin role, granting immediate access without password');
        showNotification('Admin access granted!', 'success');
        openAdminModal(); // Open admin dashboard directly
        return;
    }
    
    // User doesn't have admin privileges, show password modal
    console.log('❌ User does not have admin role, showing password modal');
    console.log('User role value:', currentUser?.role);
    console.log('User role === "admin"?', currentUser?.role === 'admin');
    console.log('User role === "user"?', currentUser?.role === 'user');
    
    const modal = document.getElementById('passwordModal');
    console.log('Password modal element:', modal);
    
    if (modal) {
        console.log('Modal found, opening...');
        modal.style.display = 'block';
        modal.classList.add('show');
        
        // Update company info in modal
        const companyNameEl = document.getElementById('adminCompanyName');
        const companyUserEl = document.getElementById('adminCompanyUser');
        const passwordCompanyEl = document.getElementById('adminPasswordCompanyName');
        
        if (companyNameEl && currentCompany) {
            companyNameEl.textContent = currentCompany;
        }
        if (companyUserEl && currentUser) {
            companyUserEl.textContent = currentUser.username;
        }
        if (passwordCompanyEl && currentCompany) {
            passwordCompanyEl.textContent = currentCompany;
        }
        
        // Focus on password field
            const passwordField = document.getElementById('adminPasswordModal');
            if (passwordField) {
                passwordField.focus();
            }
        
        console.log('✅ Password modal opened successfully for non-admin user');
    } else {
        console.error('❌ Password modal not found!');
        alert('Password modal not found! Please refresh the page and try again.');
    }
}

function closePasswordModal() {
    console.log('Closing password modal...');
    const modal = document.getElementById('passwordModal');
    
    if (modal) {
        modal.style.display = 'none';
        modal.classList.remove('show');
        
        // Clear password field
        const passwordField = document.getElementById('adminPasswordModal');
        if (passwordField) {
            passwordField.value = '';
        }
        
        // Hide error messages
        const errorMessage = document.getElementById('error-message');
        if (errorMessage) {
            errorMessage.style.display = 'none';
        }
        
        console.log('Password modal closed');
    }
}

function checkAdminPassword(event) {
    if (event) {
        event.preventDefault();
    }
    
    console.log('🔍 checkAdminPassword function called!');
    console.log('Event:', event);
    console.log('Checking admin password...');
    console.log('Full currentUser object:', JSON.stringify(currentUser, null, 2));
    console.log('🔍 About to check if user is admin...');
    
    // First, check if user is logged in with their company
    if (!currentUser || !currentCompany) {
        console.log('User not logged in with company');
        showSignupModal();
        return;
    }
    
    // Check if user has admin role - bypass password
    console.log('🔍 Checking user role:', currentUser.role);
    console.log('Role comparison results:');
    console.log('  currentUser.role === "admin":', currentUser.role === 'admin');
    console.log('  currentUser.role === "Admin":', currentUser.role === 'Admin');
    console.log('  currentUser.role.toLowerCase() === "admin":', currentUser.role && currentUser.role.toLowerCase() === 'admin');
    
    if (currentUser.role === 'admin' || currentUser.role === 'Admin' || (currentUser.role && currentUser.role.toLowerCase() === 'admin')) {
        console.log('✅ User has admin role, granting access without password');
        closePasswordModal();
        openAdminModal();
        showNotification('Admin access granted!', 'success');
        return;
    } else {
        console.log('❌ User does not have admin role, requiring password');
        console.log('🔍 Proceeding to password validation...');
    }
    
    const password = document.getElementById('adminPasswordModal').value;
    console.log('Password entered:', password ? '***' : 'empty');
    console.log('Current user:', currentUser);
    console.log('Current company:', currentCompany);
    
    // Load master admin data to get company-specific passwords
    const masterData = loadMasterAdminData();
    
    // Check if current company has a specific admin password
    if (currentCompany && masterData && masterData.companies) {
        const company = masterData.companies.find(c => c.name === currentCompany);
        if (company && company.adminPassword) {
            console.log('Checking company-specific admin password');
            if (password === company.adminPassword) {
                console.log('Company admin password correct!');
                closePasswordModal();
                openAdminModal();
                showNotification('Admin access granted!', 'success');
                return;
            } else {
                console.log('Company admin password incorrect');
                showNotification('Incorrect admin password', 'error');
                return;
            }
        }
    }
    
    // Fallback to default admin password
    if (password === 'admin123') {
        console.log('Default admin password correct!');
        closePasswordModal();
        openAdminModal();
        showNotification('Admin access granted!', 'success');
    } else {
        console.log('Admin password incorrect');
        showNotification('Incorrect admin password', 'error');
    }
}

function openAdminModal() {
    console.log('Opening admin modal...');
    const modal = document.getElementById('adminModal');
    
    if (modal) {
        modal.style.display = 'block';
        modal.classList.add('show');
        
        // Update admin stats
        updateAdminStats();
        
        console.log('Admin modal opened');
    } else {
        alert('Admin modal not found!');
    }
}

function closeAdminModal() {
    console.log('Closing admin modal...');
    const modal = document.getElementById('adminModal');
    
    if (modal) {
        modal.style.display = 'none';
        modal.classList.remove('show');
        console.log('Admin modal closed');
    }
}

function updateAdminStats() {
    console.log('Updating admin stats...');
    
    try {
        // Update policy counts
        const totalPolicies = policies.length;
        const draftCount = policies.filter(p => p.status === 'draft').length;
        const userCount = users.length;
        
        // Update DOM elements
        const totalPoliciesEl = document.getElementById('adminTotalPolicies');
        const draftCountEl = document.getElementById('adminDraftCount');
        const userCountEl = document.getElementById('adminUserCount');
        
        if (totalPoliciesEl) totalPoliciesEl.textContent = totalPolicies;
        if (draftCountEl) draftCountEl.textContent = draftPolicies.length; // Use draftPolicies array, not policies with status
        if (userCountEl) userCountEl.textContent = userCount;
        
        // Also update admin draft list
        displayAdminDrafts();
        displayDrafts(); // Display drafts on main page too
        
        console.log('Admin stats updated:', { totalPolicies, draftCount: draftPolicies.length, userCount });
    } catch (error) {
        console.error('Error updating admin stats:', error);
        // Don't block modal opening if stats update fails
    }
}

// API Key Management Functions
function saveAPIKey() {
    const apiKey = document.getElementById('apiKey').value.trim();
    
    if (!apiKey) {
        showAPIStatus('Please enter an API key.', 'error');
        return;
    }
    
    setChatGPTAPIKey(apiKey);
    showAPIStatus('API key saved successfully!', 'success');
}

function testAPIKey() {
    const apiKey = document.getElementById('apiKey').value.trim();
    
    if (!apiKey) {
        showAPIStatus('Please enter an API key first.', 'error');
        return;
    }
    
    // Temporarily set the API key for testing
    const originalKey = getChatGPTAPIKey();
    setChatGPTAPIKey(apiKey);
    
    showAPIStatus('Testing API connection...', 'info');
    
    // Test with a simple request
    fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${apiKey}`
        },
        body: JSON.stringify({
            model: 'gpt-3.5-turbo',
            messages: [
                {
                    role: 'user',
                    content: 'Hello, this is a test message.'
                }
            ],
            max_tokens: 10
        })
    })
    .then(response => {
        if (response.ok) {
            showAPIStatus('API connection successful! ChatGPT is ready to use.', 'success');
        } else {
            showAPIStatus(`API connection failed: ${response.status} ${response.statusText}`, 'error');
        }
    })
    .catch(error => {
        showAPIStatus(`API connection failed: ${error.message}`, 'error');
    })
    .finally(() => {
        // Restore original API key
        if (originalKey) {
            setChatGPTAPIKey(originalKey);
        }
    });
}

function clearAPIKey() {
    if (confirm('Are you sure you want to clear the API key?')) {
        clearChatGPTAPIKey();
        document.getElementById('apiKey').value = '';
        showAPIStatus('API key cleared successfully.', 'success');
    }
}

function showAPIStatus(message, type) {
    const statusElement = document.getElementById('api-status');
    statusElement.textContent = message;
    statusElement.className = `api-status ${type}`;
    statusElement.style.display = 'block';
    
    // Auto-hide success messages after 5 seconds
    if (type === 'success') {
        setTimeout(() => {
            statusElement.style.display = 'none';
        }, 5000);
    }
}

// Duplicate openSettingsModal function removed - using the version defined earlier

// Essential functions for basic functionality
function getOrganizationName(orgId) {
    const orgMap = {
        'tudor-glen': 'Tudor Glen',
        'river-valley': 'River Valley',
        'rosslyn': 'Rosslyn',
        'upc': 'UPC'
    };
    return orgMap[orgId] || orgId;
}

function getSelectedOrganizations() {
    const orgCheckboxes = document.querySelectorAll('.organization-toggles input[type="checkbox"]:checked');
    const selected = [];
    
    orgCheckboxes.forEach(cb => {
        if (cb.id !== 'org-all' && cb.value) {
            selected.push(cb.value);
        } else if (cb.id === 'org-all' && cb.checked) {
            return ['tudor-glen', 'river-valley', 'rosslyn', 'upc'];
        }
    });
    
    if (selected.length === 0 || document.getElementById('org-all')?.checked) {
        return ['tudor-glen', 'river-valley', 'rosslyn', 'upc'];
    }
    
    return selected;
}

function getSelectedRoles() {
    const roleCheckboxes = document.querySelectorAll('input[name="responsibleRoles"]:checked');
    const roles = [];
    
    roleCheckboxes.forEach(cb => {
        if (cb.value && cb.checked) {
            roles.push({ name: cb.value });
        }
    });
    
    if (roles.length === 0) {
        return [
            { name: 'Clinic Manager' },
            { name: 'Medical Director' },
            { name: 'Staff' }
        ];
    }
    
    return roles;
}

function getSelectedDisciplinaryActions() {
    const actionCheckboxes = document.querySelectorAll('input[name="disciplinaryActions"]:checked');
    const actions = [];
    
    actionCheckboxes.forEach(cb => {
        if (cb.value && cb.checked) {
            actions.push({ name: cb.value });
        }
    });
    
    if (actions.length === 0) {
        return [
            { name: 'Verbal Warning' },
            { name: 'Written Warning' },
            { name: 'Suspension' },
            { name: 'Termination' }
        ];
    }
    
    return actions;
}

// Test function for policy generation
function testPolicyGeneration() {
    console.log('Testing policy generation...');
    const testPrompt = 'Create a test policy for recheck exams vs office visits';
    
    // Test the policy generation function directly
    generatePolicyFromPromptData(testPrompt)
        .then(result => {
            console.log('Test policy generation successful:', result);
            alert('Policy generation test successful! Check console for details.');
        })
        .catch(error => {
            console.error('Test policy generation failed:', error);
            alert('Policy generation test failed: ' + error.message);
        });
}
// Send follow-up prompt with conversation history
async function sendFollowUpPrompt() {
    const followUpInput = document.getElementById('followUpInput');
    const followUpPrompt = followUpInput.value.trim();
    
    if (!followUpPrompt) {
        showNotification('Please enter a follow-up message', 'error');
        return;
    }
    
    // Add current follow-up to conversation history
    conversationHistory.push({ role: 'user', content: followUpPrompt });
    
    // Get the current policy content - extract only the text, not HTML
    const aiGeneratedElement = document.getElementById('aiGeneratedContent');
    let currentPolicyText = '';
    if (aiGeneratedElement) {
        // Extract text from the policy sections - but limit the size
        const sections = aiGeneratedElement.querySelectorAll('.policy-section');
        currentPolicyText = Array.from(sections).slice(0, 3).map(section => {
            const title = section.querySelector('h5')?.textContent || '';
            const content = section.querySelector('.policy-content')?.textContent || '';
            // Truncate content to max 300 chars per section
            return `${title}\n${content.substring(0, 300)}`;
        }).join('\n\n');
    }
    
    // Prepare the follow-up data with full conversation history
    const followUpData = {
        conversationHistory: conversationHistory,
        currentPolicyText: currentPolicyText,
        newPrompt: followUpPrompt,
        company: currentCompany || 'Unknown',
        username: currentUser?.username || 'Unknown'
    };
    
    console.log('Sending follow-up prompt with full conversation history:', {
        conversationLength: conversationHistory.length,
        newPrompt: followUpPrompt,
        company: currentCompany
    });
    
    // Show loading state
    document.getElementById('aiLoading').style.display = 'block';
    document.getElementById('aiResult').style.display = 'none';
    
    try {
        // Get webhook URL
        const webhookUrl = localStorage.getItem('webhookUrlAI') || 'http://localhost:5678/webhook/05da961e-9df0-490e-815f-92d8bc9f9c1e';
        
        // Use GET method with URL parameters to avoid CORS preflight
        // Truncate conversation history to last 3 messages to avoid URL length issues
        const recentHistory = conversationHistory.slice(-3);
        const params = new URLSearchParams({
            conversationHistory: JSON.stringify(recentHistory),
            currentPolicyText: currentPolicyText.substring(0, 500), // Truncate to avoid URL length issues
            newPrompt: followUpPrompt,
            company: currentCompany || 'Unknown',
            username: currentUser?.username || 'Unknown'
        });
        
        const response = await fetch(`${webhookUrl}?${params.toString()}`);
        
        if (response.ok) {
            const webhookResponse = await response.text();
            console.log('Follow-up webhook response:', webhookResponse);
            
            // Display the updated policy
            document.getElementById('aiLoading').style.display = 'none';
            document.getElementById('aiResult').style.display = 'block';
            
            // Parse and display the response
            let responseData = null;
            try {
                responseData = JSON.parse(webhookResponse);
            } catch (e) {
                responseData = webhookResponse;
            }
            
            if (responseData && Array.isArray(responseData) && responseData.length > 0 && responseData[0].markdown) {
                const policy = responseData[0];
                document.getElementById('aiGeneratedContent').innerHTML = `
                    <div class="policy-preview professional">
                        <div class="policy-header">
                            <div class="form-group" style="margin-bottom: 15px;">
                                <label for="policyTitleInput" style="display: block; margin-bottom: 5px; font-weight: 600; color: #333;">
                                    <i class="fas fa-heading"></i> Policy Title <span style="color: red;">*</span>
                                </label>
                                <input type="text" id="policyTitleInput" value="${policy.policy_title || 'Updated Policy'}" required
                                       style="width: 100%; padding: 12px; border: 2px solid #ddd; border-radius: 6px; font-size: 1.1rem; font-weight: 600;"
                                       placeholder="Enter policy title..." 
                                       oninput="this.style.borderColor='#ddd'" />
                                <small style="color: #666; display: block; margin-top: 5px;">This title is required to save the policy</small>
                            </div>
                            <span class="policy-type-badge admin">${policy.policy_type || 'Policy'}</span>
                        </div>
                        <div class="policy-meta">
                            ${policy.effective_date ? `<span>Effective Date: ${policy.effective_date}</span>` : ''}
                            ${policy.version ? `<span>Version: ${policy.version}</span>` : ''}
                        </div>
                        <div class="policy-content-display" style="max-height: 600px; overflow-y: auto;">
                            ${generateEditablePolicySections(parseWebhookPolicyMarkdown(policy.markdown))}
                        </div>
                        
                        <div class="form-group" style="margin-top: 20px; margin-bottom: 20px;">
                            <label for="aiPolicyCategory" style="display: block; margin-bottom: 5px; font-weight: 600; color: #333;">
                                <i class="fas fa-tags"></i> Select Category (for policy code generation)
                            </label>
                            <select id="aiPolicyCategory" onchange="updateAIPolicyCode()" style="width: 100%; padding: 12px; border: 2px solid #ddd; border-radius: 6px; font-size: 1rem;">
                                <option value="">No Category (optional)</option>
                            </select>
                            <small style="color: #666; display: block; margin-top: 5px;">Policy code will be generated in format: Category#.Policy#.Year</small>
                            <div id="aiPolicyCodeDisplay" style="display: none; margin-top: 10px; padding: 10px; background: #f0f8ff; border-radius: 6px;">
                                <strong>Policy Code:</strong> <span id="aiPolicyCodeText"></span>
                            </div>
                        </div>
                        
                        <div class="ai-result-actions" style="margin-top: 20px;">
                            <button class="btn btn-success" onclick="saveWebhookPolicy()">
                                <i class="fas fa-save"></i> Save Policy
                            </button>
                            <button class="btn btn-secondary" onclick="closeAIModal()">
                                <i class="fas fa-times"></i> Close
                            </button>
                        </div>
                    </div>
                `;
                
                // Populate category dropdown after HTML is rendered
                populateAICategoryDropdown();
    } else {
                document.getElementById('aiGeneratedContent').innerHTML = `<pre>${webhookResponse}</pre>`;
            }
            
            // Add AI response to conversation history
            if (responseData && Array.isArray(responseData) && responseData.length > 0 && responseData[0].markdown) {
                conversationHistory.push({ role: 'assistant', content: 'Policy updated based on your request' });
            }
            
            // Clear the follow-up input
            followUpInput.value = '';
            
            showNotification('Policy updated successfully!', 'success');
        } else {
            throw new Error(`Webhook failed with status: ${response.status}`);
        }
    } catch (error) {
        console.error('Follow-up prompt error:', error);
            document.getElementById('aiLoading').style.display = 'none';
            document.getElementById('aiResult').style.display = 'block';
        document.getElementById('aiGeneratedContent').innerHTML = `
            <div style="color: red;">
                <p><strong>Error:</strong> Failed to process follow-up prompt</p>
                    <p>${error.message}</p>
                </div>
            `;
        showNotification('Failed to process follow-up prompt', 'error');
    }
}


// Document Management Functions
let documents = [];
let categories = [];

function loadDocuments() {
    const stored = localStorage.getItem('documents');
    documents = stored ? JSON.parse(stored) : [];
    displayDocuments();
}

function saveDocuments() {
    localStorage.setItem('documents', JSON.stringify(documents));
}

function displayDocuments() {
    const documentsList = document.getElementById('documentsList');
    if (!documentsList) return;
    
    if (documents.length === 0) {
        documentsList.innerHTML = '<p style="color: #999; text-align: center; padding: 20px;">No documents added yet.</p>';
        return;
    }
    
    documentsList.innerHTML = documents.map((doc, index) => `
        <div class="item-card" style="background: white; border: 1px solid #e0e0e0; border-radius: 8px; padding: 15px; margin-bottom: 10px;">
            <div style="display: flex; justify-content: space-between; align-items: start;">
                <div style="flex: 1;">
                    <h4 style="margin: 0 0 5px 0; color: #333;">${doc.name}</h4>
                    ${doc.description ? `<p style="margin: 0 0 10px 0; color: #666; font-size: 14px;">${doc.description}</p>` : ''}
                    <p style="margin: 0; color: #0066cc; font-size: 14px;">${doc.url}</p>
                </div>
                <button onclick="deleteDocument(${index})" class="btn btn-small btn-danger">
                    <i class="fas fa-trash"></i>
                </button>
            </div>
        </div>
    `).join('');
}

function addDocument() {
    // Try modal inputs first, fallback to old inputs
    const nameInput = document.getElementById('modalDocName');
    const urlInput = document.getElementById('modalDocUrl');
    const descInput = document.getElementById('modalDocDescription');
    
    const name = nameInput ? nameInput.value.trim() : (document.getElementById('newDocumentName')?.value.trim() || '');
    const url = urlInput ? urlInput.value.trim() : (document.getElementById('newDocumentUrl')?.value.trim() || '');
    const description = descInput ? descInput.value.trim() : (document.getElementById('newDocumentDescription')?.value.trim() || '');
    
    if (!name || !url) {
        showNotification('Please fill in document name and URL', 'error');
        return;
    }
    
    const newDocument = {
        id: Date.now(),
        name: name,
        url: url,
        description: description,
        created: new Date().toISOString()
    };
    
    documents.push(newDocument);
    saveDocuments();
    displayDocuments();
    
    // Close modal
    closeAddDocumentModal();
    
    // Show success message
    showNotification(`Document "${name}" added successfully!`, 'success');
    
    // Clear form
    document.getElementById('newDocumentName').value = '';
    document.getElementById('newDocumentUrl').value = '';
    document.getElementById('newDocumentDescription').value = '';
    
    showNotification('Document added successfully', 'success');
}

function deleteDocument(index) {
    if (confirm('Are you sure you want to delete this document?')) {
        documents.splice(index, 1);
        saveDocuments();
        displayDocuments();
        showNotification('Document deleted successfully', 'success');
    }
}

function populateEditRelatedDocuments(policy) {
    const docsList = document.getElementById('editRelatedDocumentsList');
    if (!docsList) return;
    
    if (documents.length === 0) {
        docsList.innerHTML = '<p style="color: #666; padding: 10px; background: #f8f9fa; border-radius: 4px;">No documents available. Add documents in Settings.</p>';
        return;
    }
    
    const policyDocIds = policy.relatedDocuments || [];
    const policyDocIdArray = Array.isArray(policyDocIds) ? policyDocIds : [];
    
    docsList.innerHTML = documents.map(doc => {
        const isChecked = policyDocIdArray.includes(doc.id);
        return `
            <label style="display: flex; align-items: center; gap: 8px; padding: 12px; background: white; border-radius: 4px; border: 1px solid #e0e0e0; cursor: pointer; margin-bottom: 8px;">
                <input type="checkbox" name="editRelatedDocuments" value="${doc.id}" ${isChecked ? 'checked' : ''}>
                <div style="flex: 1;">
                    <strong>${doc.name}</strong>
                    ${doc.description ? `<p style="margin: 4px 0 0 0; font-size: 13px; color: #666;">${doc.description}</p>` : ''}
                    <a href="${doc.url}" target="_blank" style="font-size: 12px; color: #0066cc;">
                        <i class="fas fa-external-link-alt"></i> View Document
                    </a>
                </div>
        </label>
        `;
    }).join('');
}

// Welcome Modal Functions
function showWelcomeModal() {
    const welcomeModal = document.getElementById('welcomeModal');
    if (welcomeModal) {
        welcomeModal.style.display = 'block';
    }
}

function closeWelcomeModal() {
    const welcomeModal = document.getElementById('welcomeModal');
    if (welcomeModal) {
        welcomeModal.style.display = 'none';
    }
}

function showIndividualSignup() {
    closeSignupModal();
    setTimeout(() => {
        const modal = document.getElementById('individualSignupModal');
    if (modal) {
            modal.classList.add('show');
        }
    }, 300);
}

function showCompanySignup() {
    console.log('showCompanySignup called');
    closeSignupModal();
    
    setTimeout(() => {
        const modal = document.getElementById('pricingModal');
        console.log('Pricing modal element:', modal);
    if (modal) {
        modal.style.display = 'block';
        modal.classList.add('show');
            console.log('Pricing modal opened');
            } else {
            console.error('Pricing modal not found');
        }
    }, 300);
}

function closePricingModal() {
    const modal = document.getElementById('pricingModal');
    if (modal) {
        modal.style.display = 'none';
        modal.classList.remove('show');
    }
}

function selectPlan(plan) {
    console.log('Selected plan:', plan);
    
    // Store the selected plan in localStorage
    localStorage.setItem('selectedPlan', plan);
    
    // Map plan to display name
    const planNames = {
        'free-trial': 'Free Trial (2 Weeks)',
        'basic': 'Basic ($29/month)',
        'pro': 'Pro ($99/month)',
        'enterprise': 'Enterprise (Custom)'
    };
    
    // Update the plan display in the signup modal
    const planDisplay = document.getElementById('selectedPlanDisplay');
    if (planDisplay) {
        planDisplay.textContent = planNames[plan] || plan;
    }
    
    // Close pricing modal
    closePricingModal();
    
    // Open company signup form after a short delay
    setTimeout(() => {
        console.log('Attempting to open company signup modal...');
        const modal = document.getElementById('companySignupModal');
        console.log('Company signup modal element:', modal);
    
    if (modal) {
            console.log('Opening company signup modal...');
        modal.style.display = 'block';
        modal.classList.add('show');
            
            // Setup form listeners
            setupCompanySignupFormListeners();
            console.log('Company signup modal opened successfully');
    } else {
            console.error('Company signup modal not found!');
        }
    }, 300);
    
    // Show notification about plan selection
    showNotification('Selected ' + planNames[plan] + ' plan. Complete your account setup below.', 'success');
}

function closeCompanySignupModal() {
    const modal = document.getElementById('companySignupModal');
    if (modal) {
        modal.style.display = 'none';
        modal.classList.remove('show');
    }
    
    const form = document.getElementById('companySignupForm');
    if (form) {
        form.reset();
    }
    
    const errorMsg = document.getElementById('company-signup-error-message');
    if (errorMsg) {
        errorMsg.style.display = 'none';
    }
}

// Tooltip functions
function showTooltip(element) {
    const tooltip = element.nextElementSibling;
    if (tooltip) {
        tooltip.style.opacity = '1';
    }
}

function hideTooltip(element) {
    const tooltip = element.nextElementSibling;
    if (tooltip) {
        tooltip.style.opacity = '0';
    }
}

// Setup company signup form event listeners
function setupCompanySignupFormListeners() {
    const companySignupForm = document.getElementById('companySignupForm');
    if (companySignupForm) {
        companySignupForm.addEventListener('submit', function(e) {
            e.preventDefault();
            handleCompanySignup();
        });
    }
}

// Handle company signup form submission
function handleCompanySignup() {
    const companyName = document.getElementById('companyName').value;
    const companyIndustry = document.getElementById('companyIndustry').value;
    const companyPhone = document.getElementById('companyPhone').value;
    const adminFullName = document.getElementById('adminFullName').value;
    const adminEmail = document.getElementById('adminEmail').value;
    const adminUsername = document.getElementById('adminUsername').value;
    const adminPassword = document.getElementById('adminPassword').value;
    const adminPasswordConfirm = document.getElementById('adminPasswordConfirm').value;
    const companyAdminPassword = document.getElementById('companyAdminPassword').value;
    
    // Validate passwords match
    if (adminPassword !== adminPasswordConfirm) {
        const errorMsg = document.getElementById('company-signup-error-message');
        if (errorMsg) {
            errorMsg.textContent = 'Passwords do not match';
            errorMsg.style.display = 'block';
        }
        return;
    }
    
    // Get selected plan
    const selectedPlan = localStorage.getItem('selectedPlan') || 'free-trial';
    
    console.log('Creating company:', companyName);
    
    // Load existing data
    const masterCompanies = JSON.parse(localStorage.getItem('masterCompanies') || '[]');
    const masterUsers = JSON.parse(localStorage.getItem('masterUsers') || '[]');
    const accessCodes = JSON.parse(localStorage.getItem('masterAccessCodes') || '[]');
    
    // Create company
    const newCompany = {
        id: Date.now().toString(),
        name: companyName,
        industry: companyIndustry || '',
        phone: companyPhone || '',
        plan: selectedPlan,
        adminPassword: companyAdminPassword,
        created: new Date().toISOString().split('T')[0]
    };
    
    masterCompanies.push(newCompany);
    localStorage.setItem('masterCompanies', JSON.stringify(masterCompanies));
    
    // Create access code for the company
    const newAccessCode = {
        id: Date.now().toString() + '_code',
        code: companyName.substring(0, 3).toUpperCase() + Date.now().toString().slice(-6),
        description: companyName,
        companyId: newCompany.id,
        created: new Date().toISOString().split('T')[0]
    };
    
    accessCodes.push(newAccessCode);
    localStorage.setItem('masterAccessCodes', JSON.stringify(accessCodes));
    
    // Create admin user
    const newUser = {
        id: Date.now().toString() + '_user',
        username: adminUsername,
        email: adminEmail,
        password: adminPassword,
        fullName: adminFullName,
        company: companyName,
        role: 'admin',
        created: new Date().toISOString().split('T')[0],
        accessCode: newAccessCode.code
    };
    
    masterUsers.push(newUser);
    localStorage.setItem('masterUsers', JSON.stringify(masterUsers));
    
    // Add company to organizations
    const organizations = JSON.parse(localStorage.getItem('organizations') || '{}');
    if (!organizations[companyName]) {
        organizations[companyName] = [companyName];
        localStorage.setItem('organizations', JSON.stringify(organizations));
    }
    
    console.log('Company created:', newCompany);
    console.log('User created:', newUser);
    console.log('Access code created:', newAccessCode);
    
    // 🔄 SYNC TO MASTER ADMIN - Dispatch event to notify master admin dashboard
    window.dispatchEvent(new CustomEvent('masterDataUpdated', {
        detail: {
            companies: masterCompanies,
            users: masterUsers,
            accessCodes: accessCodes,
            organizations: organizations,
            timestamp: new Date().toISOString(),
            source: 'main-site-signup'
        }
    }));
    
    console.log('✅ Dispatched masterDataUpdated event to sync with admin dashboard');
    
    // Show success message
    showNotification('Company created successfully! Logging you in...', 'success');
    
    // Close modal and login
    closeCompanySignupModal();
    
    // Set as current user and company
    currentUser = newUser;
    currentCompany = companyName;
    
    // Save to localStorage
    saveToLocalStorage('currentUser', currentUser);
    saveToLocalStorage('currentCompany', currentCompany);
    
    // Add user-logged-in class to body
    document.body.classList.add('user-logged-in');
    
    // Update UI
    updateUserInterface();
    
    // Load policies
    loadPoliciesFromStorage();
    
    showNotification(`Welcome ${adminFullName}! Your company "${companyName}" has been set up.`, 'success');
}

function showCompanyCodeSignup() {
    closeSignupModal(); // Close the signup type selection modal
    closePricingModal(); // Close pricing modal if open
    setTimeout(() => {
        const modal = document.getElementById('companyCodeSignupModal');
        if (modal) {
            modal.classList.add('show');
        }
    }, 300);
}

function closeCompanyCodeSignupModal() {
    const modal = document.getElementById('companyCodeSignupModal');
    if (modal) {
        modal.classList.remove('show');
        document.getElementById('companyCodeSignupForm').reset();
        document.getElementById('company-code-signup-error-message').style.display = 'none';
    }
}

function closeIndividualSignupModal() {
    const modal = document.getElementById('individualSignupModal');
    if (modal) {
        modal.classList.remove('show');
        document.getElementById('individualSignupForm').reset();
        document.getElementById('individual-signup-error-message').style.display = 'none';
    }
}

function showWelcomeLogin() {
    closeSignupModal();
    setTimeout(() => {
        showLoginModal();
    }, 300);
}

// Check if user should see welcome modal
function checkWelcomeModal() {
    if (!currentUser) {
        showWelcomeModal();
    }
}

// Categories Management Functions
function loadCategories() {
    const stored = localStorage.getItem('categories');
    categories = stored ? JSON.parse(stored) : [];
    displayCategories();
}

// Generate policy code in format: TYPE.categoryNumber.policyNumberInCategory.year
function generatePolicyCode(categoryId, policyId, policyType) {
    if (!categoryId) return null;
    
    // Map policy type to code
    const typeCodes = {
        'admin': 'ADMIN',
        'sog': 'SOG',
        'memo': 'MEMO',
        'protocol': 'PROTO',
        'proto': 'PROTO'
    };
    
    const typeCode = typeCodes[policyType?.toLowerCase()] || 'ADMIN';
    
    loadCategories(); // Ensure categories are loaded
    const category = categories.find(cat => cat.id === parseInt(categoryId) || cat.id === categoryId);
    if (!category) return null;
    
    // Get all policies in this category with the same type
    const policies = loadCompanyPolicies();
    const categoryIdNum = parseInt(categoryId);
    const policiesInCategory = policies.filter(p => 
        (p.categoryId === categoryIdNum || p.categoryId === categoryId) && 
        p.policyCode && 
        p.type === policyType
    );
    
    // Find the policy's position in the category (or get next number if new)
    let policyNumber;
    if (policyId && policiesInCategory.length > 0) {
        // Policy already exists - find its position
        const sortedPolicies = policiesInCategory.sort((a, b) => {
            const dateA = a.created ? new Date(a.created) : a.date ? new Date(a.date) : new Date(0);
            const dateB = b.created ? new Date(b.created) : b.date ? new Date(b.date) : new Date(0);
            return dateA - dateB;
        });
        policyNumber = sortedPolicies.findIndex(p => p.id === policyId) + 1;
        if (policyNumber === 0) {
            policyNumber = policiesInCategory.length + 1;
        }
    } else {
        // New policy - get next number
        policyNumber = policiesInCategory.length + 1;
    }
    
    const currentYear = new Date().getFullYear();
    return `${typeCode}.${category.number}.${policyNumber}.${currentYear}`;
}

function saveCategories() {
    localStorage.setItem('categories', JSON.stringify(categories));
}

function displayCategories() {
    const categoriesList = document.getElementById('categoriesList');
    if (!categoriesList) return;
    
    if (categories.length === 0) {
        categoriesList.innerHTML = '<p style="color: #999; text-align: center; padding: 20px;">No categories created yet. Add your first category above.</p>';
        return;
    }
    
    categoriesList.innerHTML = categories.map((category, index) => `
        <div class="item-card" style="background: white; border: 1px solid #e0e0e0; border-radius: 8px; padding: 15px; margin-bottom: 10px;">
            <div style="display: flex; justify-content: space-between; align-items: start;">
                <div style="flex: 1;">
                    <h4 style="margin: 0 0 5px 0; color: #333; display: flex; align-items: center; gap: 10px;">
                        <span style="background: #667eea; color: white; padding: 6px 12px; border-radius: 4px; font-size: 14px; font-weight: bold;">${category.number || 'N/A'}</span>
                        <span style="font-size: 16px;">${category.name || 'Untitled Category'}</span>
                    </h4>
            </div>
                <button onclick="deleteCategory(${index})" class="btn btn-small btn-danger">
                    <i class="fas fa-trash"></i>
                </button>
            </div>
        </div>
    `).join('');
}

function addCategory() {
    const name = document.getElementById('newCategoryName')?.value.trim();
    const number = document.getElementById('newCategoryNumber')?.value;
    
    if (!name || !number) {
        showNotification('Please fill in category name and number', 'error');
        return;
    }
    
    const newCategory = {
        id: Date.now(),
        name: name,
        number: parseInt(number),
        created: new Date().toISOString()
    };
    
    categories.push(newCategory);
    saveCategories();
    displayCategories();
    
    // Clear form
    document.getElementById('newCategoryName').value = '';
    document.getElementById('newCategoryNumber').value = '';
    
    showNotification('Category added successfully', 'success');
}

function deleteCategory(index) {
    if (confirm('Are you sure you want to delete this category?')) {
        categories.splice(index, 1);
        saveCategories();
        displayCategories();
        showNotification('Category deleted successfully', 'success');
    }
}

// Policy Advisor Functions
function openPolicyAdvisor() {
    if (!currentUser) {
        showNotification('Please log in to use the Policy Advisor', 'error');
        return;
    }
    
    document.getElementById('policyAdvisorModal').style.display = 'block';
    document.getElementById('advisorQuestion').value = '';
    document.getElementById('advisorLoading').style.display = 'none';
    document.getElementById('advisorResponse').style.display = 'none';
}

function closePolicyAdvisor() {
    document.getElementById('policyAdvisorModal').style.display = 'none';
}

async function sendPolicyAdvisorRequest() {
    const question = document.getElementById('advisorQuestion').value.trim();
    
    if (!question) {
        showNotification('Please enter a question', 'error');
        return;
    }
    
    // Show loading
    document.getElementById('advisorLoading').style.display = 'block';
    document.getElementById('advisorResponse').style.display = 'none';
    
    try {
        // Get all policies
        const allPolicies = loadCompanyPolicies();
        
        if (allPolicies.length === 0) {
            document.getElementById('advisorLoading').style.display = 'none';
            showNotification('No policies found', 'warning');
            return;
        }
        
        // Format policies
        let policiesText = '';
        allPolicies.forEach(policy => {
            policiesText += `${policy.title || 'Untitled'} (${policy.type || 'N/A'})\n`;
            if (policy.description) policiesText += `${policy.description}\n`;
            if (policy.content) {
                try {
                    const parsed = JSON.parse(policy.content);
                    policiesText += `${JSON.stringify(parsed)}\n`;
                } catch {
                    policiesText += `${policy.content}\n`;
                }
            }
            policiesText += '\n---\n\n';
        });
        
        const promptText = `Question: ${question}\n\nPolicies:\n${policiesText}\n\nProvide guidance based on these policies.`;
        
        const webhookUrl = localStorage.getItem('webhookUrlAI') || 'http://localhost:5678/webhook/05da961e-9df0-490e-815f-92d8bc9f9c1e';
        
        // Use GET with URL params to avoid CORS preflight (like sendFollowUpPrompt)
        const params = new URLSearchParams({
            conversationHistory: JSON.stringify([{ role: 'user', content: promptText }]),
            currentPolicyText: policiesText.substring(0, 500),
            newPrompt: question,
            company: currentCompany || 'Unknown',
            username: currentUser?.username || 'Unknown',
            tool: 'policy-advisor'
        });
        
        const response = await fetch(`${webhookUrl}?${params.toString()}`);
        
        if (response.ok) {
            const result = await response.text();
            document.getElementById('advisorLoading').style.display = 'none';
            document.getElementById('advisorResponse').style.display = 'block';
            document.getElementById('advisorResultText').textContent = result;
        } else {
            throw new Error(`HTTP ${response.status}`);
        }
    } catch (error) {
        console.error('Policy advisor error:', error);
        document.getElementById('advisorLoading').style.display = 'none';
        document.getElementById('advisorResponse').style.display = 'block';
        document.getElementById('advisorResultText').textContent = 'Error: ' + error.message;
    }
}

// Notification Center Functions
function toggleNotificationCenter() {
    const notificationCenter = document.getElementById('notificationCenter');
    const badge = document.getElementById('notificationBadge');
    
    if (notificationCenter) {
        if (notificationCenter.style.display === 'none' || notificationCenter.style.display === '') {
            notificationCenter.style.display = 'block';
            updateNotificationDisplay();
        } else {
            notificationCenter.style.display = 'none';
        }
    }
}

function addNotification(message, type = 'info', action = null) {
    const notification = {
        id: Date.now(),
        message: message,
        type: type,
        action: action,
        timestamp: new Date().toISOString(),
        read: false
    };
    
    notifications.unshift(notification);
    
    // Keep only last 50 notifications
    if (notifications.length > 50) {
        notifications = notifications.slice(0, 50);
    }
    
    saveToLocalStorage('notifications', notifications);
    updateNotificationBadge();
    updateNotificationDisplay();
}

function updateNotificationBadge() {
    const badge = document.getElementById('notificationBadge');
    const unreadCount = notifications.filter(n => !n.read).length;
    
    if (badge) {
        if (unreadCount > 0) {
            badge.textContent = unreadCount;
            badge.style.display = 'inline-block';
        } else {
            badge.style.display = 'none';
        }
    }
}

function updateNotificationDisplay() {
    const notificationList = document.getElementById('notificationList');
    
    if (!notificationList) return;
    
    const unreadNotifications = notifications.filter(n => !n.read);
    
    if (unreadNotifications.length === 0 && notifications.length === 0) {
        notificationList.innerHTML = '<div class="no-notifications">No notifications</div>';
        return;
    }
    
    // Show only unread notifications
    notificationList.innerHTML = unreadNotifications.map(notif => `
        <div class="notification-item" onclick="markNotificationRead(${notif.id})">
            <i class="fas fa-circle" style="color: #667eea; font-size: 8px;"></i>
            <div class="notification-content">
                <p>${notif.message}</p>
                <span class="notification-time">${formatNotificationTime(notif.timestamp)}</span>
            </div>
        </div>
    `).join('');
    
    if (unreadNotifications.length === 0) {
        notificationList.innerHTML = '<div class="no-notifications">No new notifications</div>';
    }
}

function markNotificationRead(id) {
    const notification = notifications.find(n => n.id === id);
    if (notification) {
        notification.read = true;
        saveToLocalStorage('notifications', notifications);
        updateNotificationBadge();
        updateNotificationDisplay();
    }
}
function clearAllNotifications() {
    notifications = notifications.map(n => ({ ...n, read: true }));
    saveToLocalStorage('notifications', notifications);
    updateNotificationBadge();
    updateNotificationDisplay();
}

function formatNotificationTime(timestamp) {
    const now = new Date();
    const time = new Date(timestamp);
    const diff = Math.floor((now - time) / 1000);
    
    if (diff < 60) return 'Just now';
    if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
    if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
    return `${Math.floor(diff / 86400)}d ago`;
}

function populateCategoriesDropdown() {
    loadCategories();
    const select = document.getElementById('editPolicyCode');
    if (!select) return;
    
    select.innerHTML = '<option value="">Select a category (optional)</option>';
    categories.forEach(category => {
        const option = document.createElement('option');
        option.value = category.id;
        option.textContent = `${category.number} - ${category.name}`;
        select.appendChild(option);
    });
}

// Populate AI category dropdown
function populateAICategoryDropdown() {
    loadCategories();
    const select = document.getElementById('aiPolicyCategory');
    if (!select) return;
    
    select.innerHTML = '<option value="">No Category (optional)</option>';
    categories.forEach(category => {
        const option = document.createElement('option');
        option.value = category.id;
        option.textContent = `${category.number} - ${category.name}`;
        select.appendChild(option);
    });
}

// Update AI policy code display
function updateAIPolicyCode() {
    const categoryId = document.getElementById('aiPolicyCategory')?.value;
    const codeDisplay = document.getElementById('aiPolicyCodeDisplay');
    const codeText = document.getElementById('aiPolicyCodeText');
    
    // Get selected policy type from AI modal
    const policyTypeEl = document.querySelector('#aiModal input[name="policyType"]:checked');
    const policyType = policyTypeEl?.value || 'admin';
    
    if (categoryId && codeDisplay && codeText) {
        // Generate a temporary code (we'll regenerate when saving)
        loadCategories();
        const category = categories.find(cat => cat.id === parseInt(categoryId) || cat.id === categoryId);
        if (category) {
            const policies = loadCompanyPolicies();
            const categoryPolicies = policies.filter(p => (p.categoryId === parseInt(categoryId) || p.categoryId === categoryId) && p.policyCode && p.type === policyType);
            const policyNumber = categoryPolicies.length + 1;
            const currentYear = new Date().getFullYear();
            
            // Map policy type to code
            const typeCodes = {
                'admin': 'ADMIN',
                'sog': 'SOG',
                'memo': 'MEMO',
                'protocol': 'PROTO',
                'proto': 'PROTO'
            };
            const typeCode = typeCodes[policyType?.toLowerCase()] || 'ADMIN';
            
            const code = `${typeCode}.${category.number}.${policyNumber}.${currentYear}`;
            
            codeText.textContent = code;
            codeDisplay.style.display = 'block';
        }
    } else if (codeDisplay) {
        codeDisplay.style.display = 'none';
    }
}

// Populate manual category dropdown
function populateManualCategoryDropdown() {
    loadCategories();
    const select = document.getElementById('manualPolicyCategory');
    if (!select) return;
    
    select.innerHTML = '<option value="">No Category (optional)</option>';
    categories.forEach(category => {
        const option = document.createElement('option');
        option.value = category.id;
        option.textContent = `${category.number} - ${category.name}`;
        select.appendChild(option);
    });
}

// Update manual policy code display
function updateManualPolicyCode() {
    const categoryId = document.getElementById('manualPolicyCategory')?.value;
    const codeDisplay = document.getElementById('manualPolicyCodeDisplay');
    const codeText = document.getElementById('manualPolicyCodeText');
    
    // Get selected policy type from manual form (the ID is 'policyType', not 'manualPolicyType')
    const policyType = document.getElementById('policyType')?.value || 'admin';
    
    if (categoryId && codeDisplay && codeText) {
        // Generate a temporary code (we'll regenerate when saving)
        loadCategories();
        const category = categories.find(cat => cat.id === parseInt(categoryId) || cat.id === categoryId);
        if (category) {
            const policies = loadCompanyPolicies();
            const categoryPolicies = policies.filter(p => (p.categoryId === parseInt(categoryId) || p.categoryId === categoryId) && p.policyCode && p.type === policyType);
            const policyNumber = categoryPolicies.length + 1;
            const currentYear = new Date().getFullYear();
            
            // Map policy type to code
            const typeCodes = {
                'admin': 'ADMIN',
                'sog': 'SOG',
                'memo': 'MEMO',
                'protocol': 'PROTO',
                'proto': 'PROTO'
            };
            const typeCode = typeCodes[policyType?.toLowerCase()] || 'ADMIN';
            
            const code = `${typeCode}.${category.number}.${policyNumber}.${currentYear}`;
            
            codeText.textContent = code;
            codeDisplay.style.display = 'block';
        }
    } else if (codeDisplay) {
        codeDisplay.style.display = 'none';
    }
}