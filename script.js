// Sample Policy Data
const samplePolicies = [
    {
        id: 1,
        title: "Patient Privacy and Confidentiality",
        type: "admin",
        clinics: ["tudor-glen", "river-valley", "rosslyn", "upc"],
        description: "Guidelines for maintaining patient privacy and confidentiality in all clinic operations.",
        created: "2024-01-15",
        updated: "2024-01-15"
    },
    {
        id: 2,
        title: "Emergency Response Procedures",
        type: "sog",
        clinics: ["tudor-glen", "river-valley"],
        description: "Standard operating procedures for handling medical emergencies and critical situations.",
        created: "2024-01-10",
        updated: "2024-01-20"
    },
    {
        id: 3,
        title: "Monthly Staff Meeting Schedule",
        type: "memos",
        clinics: ["tudor-glen", "river-valley", "rosslyn", "upc"],
        description: "Updated schedule for monthly staff meetings and training sessions.",
        created: "2024-01-25",
        updated: "2024-01-25"
    },
    {
        id: 4,
        title: "Medical Equipment Maintenance",
        type: "sog",
        clinics: ["tudor-glen", "river-valley", "rosslyn", "upc"],
        description: "Procedures for regular maintenance and calibration of medical equipment.",
        created: "2024-01-12",
        updated: "2024-01-18"
    },
    {
        id: 5,
        title: "Staff Training Requirements",
        type: "admin",
        clinics: ["tudor-glen", "river-valley", "rosslyn", "upc"],
        description: "Mandatory training requirements for all clinic staff members.",
        created: "2024-01-08",
        updated: "2024-01-22"
    },
    {
        id: 6,
        title: "New Patient Intake Process",
        type: "sog",
        clinics: ["tudor-glen", "river-valley"],
        description: "Step-by-step process for new patient registration and initial assessment.",
        created: "2024-01-20",
        updated: "2024-01-20"
    }
];

let currentPolicies = [...samplePolicies];

// DOM Elements
const policiesGrid = document.getElementById('policiesGrid');
const policySearch = document.getElementById('policySearch');
const filterButtons = document.querySelectorAll('.filter-btn');
const totalPoliciesElement = document.getElementById('totalPolicies');
const recentUpdatesElement = document.getElementById('recentUpdates');
const createModal = document.getElementById('createModal');
const policyForm = document.getElementById('policyForm');

// Initialize the application
document.addEventListener('DOMContentLoaded', function() {
    displayPolicies(currentPolicies);
    updateStats();
    setupEventListeners();
});

// Event Listeners
function setupEventListeners() {
    // Search functionality
    policySearch.addEventListener('input', function() {
        const searchTerm = this.value.toLowerCase();
        const filteredPolicies = currentPolicies.filter(policy => 
            policy.title.toLowerCase().includes(searchTerm) ||
            policy.description.toLowerCase().includes(searchTerm)
        );
        displayPolicies(filteredPolicies);
    });

    // Filter buttons
    filterButtons.forEach(button => {
        button.addEventListener('click', function() {
            // Remove active class from all buttons
            filterButtons.forEach(btn => btn.classList.remove('active'));
            // Add active class to clicked button
            this.classList.add('active');
            
            const filter = this.getAttribute('data-filter');
            filterPolicies(filter);
        });
    });

    // Form submission
    policyForm.addEventListener('submit', function(e) {
        e.preventDefault();
        createNewPolicy();
    });

    // Smooth scrolling for navigation links
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            e.preventDefault();
            const target = document.querySelector(this.getAttribute('href'));
            if (target) {
                target.scrollIntoView({
                    behavior: 'smooth',
                    block: 'start'
                });
            }
        });
    });
}

// Display Policies
function displayPolicies(policies) {
    if (policies.length === 0) {
        policiesGrid.innerHTML = '<div class="no-policies">No policies found matching your criteria.</div>';
        return;
    }

    policiesGrid.innerHTML = policies.map(policy => `
        <div class="policy-item" data-type="${policy.type}">
            <div class="policy-header">
                <div>
                    <h3 class="policy-title">${policy.title}</h3>
                    <span class="policy-type ${policy.type}">${getTypeLabel(policy.type)}</span>
                </div>
            </div>
            <div class="policy-clinics">
                <strong>Applicable Clinics:</strong> ${getClinicNames(policy.clinics).join(', ')}
            </div>
            <div class="policy-description">
                ${policy.description}
            </div>
            <div class="policy-meta">
                <span>Created: ${formatDate(policy.created)}</span>
                <span>Updated: ${formatDate(policy.updated)}</span>
            </div>
        </div>
    `).join('');
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
function createNewPolicy() {
    const formData = {
        title: document.getElementById('policyTitle').value,
        type: document.getElementById('policyType').value,
        clinics: Array.from(document.getElementById('clinicApplicability').selectedOptions).map(option => option.value),
        purpose: document.getElementById('policyPurpose').value,
        procedure: document.getElementById('policyProcedure').value,
        roles: document.getElementById('policyRoles').value,
        compliance: document.getElementById('policyCompliance').value
    };

    const newPolicy = {
        id: currentPolicies.length + 1,
        title: formData.title,
        type: formData.type,
        clinics: formData.clinics,
        description: formData.purpose,
        created: new Date().toISOString().split('T')[0],
        updated: new Date().toISOString().split('T')[0]
    };

    currentPolicies.unshift(newPolicy);
    displayPolicies(currentPolicies);
    updateStats();
    closeCreateModal();
    
    // Reset form
    policyForm.reset();
    
    // Show success message
    showNotification('Policy created successfully!', 'success');
}

// Modal Functions
function openCreateModal() {
    createModal.style.display = 'block';
    document.body.style.overflow = 'hidden';
}

function closeCreateModal() {
    createModal.style.display = 'none';
    document.body.style.overflow = 'auto';
}

// Close modal when clicking outside
window.addEventListener('click', function(e) {
    if (e.target === createModal) {
        closeCreateModal();
    }
});

// Update Statistics
function updateStats() {
    totalPoliciesElement.textContent = currentPolicies.length;
    
    // Count recent updates (last 7 days)
    const recentDate = new Date();
    recentDate.setDate(recentDate.getDate() - 7);
    const recentUpdates = currentPolicies.filter(policy => 
        new Date(policy.updated) >= recentDate
    ).length;
    
    recentUpdatesElement.textContent = recentUpdates;
}

// Helper Functions
function getTypeLabel(type) {
    const labels = {
        'admin': 'Admin Policy',
        'sog': 'Standard Operating Guidelines',
        'memos': 'Communication Memos'
    };
    return labels[type] || type;
}

function getClinicNames(clinicCodes) {
    const clinicNames = {
        'tudor-glen': 'Tudor Glen',
        'river-valley': 'River Valley',
        'rosslyn': 'Rosslyn',
        'upc': 'UPC'
    };
    return clinicCodes.map(code => clinicNames[code] || code);
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

// Mobile menu toggle (if needed)
document.addEventListener('DOMContentLoaded', function() {
    const navToggle = document.querySelector('.nav-toggle');
    const navMenu = document.querySelector('.nav-menu');
    
    if (navToggle && navMenu) {
        navToggle.addEventListener('click', function() {
            navMenu.classList.toggle('active');
        });
    }
});
