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
const aiModal = document.getElementById('aiModal');
const aiForm = document.getElementById('aiForm');
const aiLoading = document.getElementById('aiLoading');
const aiResult = document.getElementById('aiResult');
const aiGeneratedContent = document.getElementById('aiGeneratedContent');

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

    // AI Form submission
    aiForm.addEventListener('submit', function(e) {
        e.preventDefault();
        generateAIPolicy();
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
    if (e.target === aiModal) {
        closeAIModal();
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

// AI Policy Generation Functions
function openAIModal() {
    aiModal.style.display = 'block';
    document.body.style.overflow = 'hidden';
    // Reset form and hide results
    aiForm.style.display = 'block';
    aiLoading.style.display = 'none';
    aiResult.style.display = 'none';
    aiForm.reset();
}

function closeAIModal() {
    aiModal.style.display = 'none';
    document.body.style.overflow = 'auto';
}

function generateAIPolicy() {
    const topic = document.getElementById('aiPolicyTopic').value;
    const type = document.getElementById('aiPolicyType').value;
    const clinics = Array.from(document.getElementById('aiClinicApplicability').selectedOptions).map(option => option.value);
    const requirements = document.getElementById('aiAdditionalRequirements').value;

    // Show loading
    aiForm.style.display = 'none';
    aiLoading.style.display = 'block';
    aiResult.style.display = 'none';

    // Simulate AI generation (in a real app, this would call an AI API)
    setTimeout(() => {
        const generatedPolicy = generatePolicyContent(topic, type, clinics, requirements);
        displayAIPolicy(generatedPolicy);
    }, 2000);
}

function generatePolicyContent(topic, type, clinics, requirements) {
    // This is a sophisticated policy generator that creates realistic healthcare policies
    const clinicNames = getClinicNames(clinics).join(', ');
    const typeLabel = getTypeLabel(type);
    
    // Policy templates based on type
    const policyTemplates = {
        admin: {
            purpose: `This administrative policy establishes guidelines for ${topic.toLowerCase()} within our healthcare facilities.`,
            procedure: `All staff members must follow the established procedures for ${topic.toLowerCase()} to ensure consistent, safe, and effective operations across all clinic locations.`,
            roles: `Administrative staff are responsible for implementing and monitoring compliance with this policy. Clinical staff must adhere to all established procedures.`,
            compliance: `Compliance with this policy is mandatory for all staff members. Regular audits will be conducted to ensure adherence to established guidelines.`
        },
        sog: {
            purpose: `These standard operating guidelines provide detailed procedures for ${topic.toLowerCase()} to ensure patient safety and quality care delivery.`,
            procedure: `Step-by-step procedures for ${topic.toLowerCase()} must be followed by all clinical staff. These guidelines are based on current best practices and regulatory requirements.`,
            roles: `Clinical staff are responsible for following these guidelines during patient care. Supervisors must ensure proper training and compliance monitoring.`,
            compliance: `All clinical staff must complete training on these guidelines before implementation. Regular competency assessments will be conducted.`
        },
        memos: {
            purpose: `This communication memo provides important information regarding ${topic.toLowerCase()} for all staff members.`,
            procedure: `Please review the following information regarding ${topic.toLowerCase()}. All staff members are required to acknowledge receipt and understanding of this communication.`,
            roles: `All staff members must read and understand this communication. Department heads are responsible for ensuring their teams are informed.`,
            compliance: `Acknowledgment of this communication is required within 48 hours of receipt. Please contact your supervisor if you have any questions.`
        }
    };

    const template = policyTemplates[type];
    
    // Enhanced content based on topic
    let enhancedProcedure = template.procedure;
    let enhancedRoles = template.roles;
    
    // Add topic-specific enhancements
    if (topic.toLowerCase().includes('hand hygiene')) {
        enhancedProcedure = `Hand hygiene is the most effective way to prevent healthcare-associated infections. All staff must perform hand hygiene before and after patient contact, before donning gloves, after removing gloves, and when hands are visibly soiled. Use alcohol-based hand sanitizer or soap and water as appropriate.`;
        enhancedRoles = `All healthcare workers are responsible for proper hand hygiene. Infection control staff monitor compliance and provide education.`;
    } else if (topic.toLowerCase().includes('patient safety')) {
        enhancedProcedure = `Patient safety is our top priority. All staff must identify and report potential safety hazards immediately. Follow established protocols for patient identification, medication administration, and fall prevention.`;
        enhancedRoles = `All staff members are responsible for maintaining a safe environment. Quality improvement teams review incidents and implement corrective actions.`;
    } else if (topic.toLowerCase().includes('data security')) {
        enhancedProcedure = `Protect patient information by following HIPAA guidelines. Use strong passwords, secure workstations, and report any suspected breaches immediately.`;
        enhancedRoles = `All staff must complete HIPAA training. IT staff maintain security systems and investigate potential breaches.`;
    }

    return {
        title: topic,
        type: type,
        clinics: clinics,
        purpose: template.purpose,
        procedure: enhancedProcedure,
        roles: enhancedRoles,
        compliance: template.compliance,
        additionalRequirements: requirements,
        clinicNames: clinicNames,
        typeLabel: typeLabel
    };
}

function displayAIPolicy(policy) {
    aiLoading.style.display = 'none';
    aiResult.style.display = 'block';
    
    aiGeneratedContent.innerHTML = `
        <div class="policy-preview">
            <h4>${policy.title}</h4>
            <div class="preview-section">
                <div class="preview-label">Policy Type:</div>
                <div class="preview-content">${policy.typeLabel}</div>
            </div>
            <div class="preview-section">
                <div class="preview-label">Applicable Clinics:</div>
                <div class="preview-content">${policy.clinicNames}</div>
            </div>
            <div class="preview-section">
                <div class="preview-label">Purpose:</div>
                <div class="preview-content">${policy.purpose}</div>
            </div>
            <div class="preview-section">
                <div class="preview-label">Procedure:</div>
                <div class="preview-content">${policy.procedure}</div>
            </div>
            <div class="preview-section">
                <div class="preview-label">Roles & Responsibilities:</div>
                <div class="preview-content">${policy.roles}</div>
            </div>
            <div class="preview-section">
                <div class="preview-label">Compliance Requirements:</div>
                <div class="preview-content">${policy.compliance}</div>
            </div>
            ${policy.additionalRequirements ? `
            <div class="preview-section">
                <div class="preview-label">Additional Requirements:</div>
                <div class="preview-content">${policy.additionalRequirements}</div>
            </div>
            ` : ''}
        </div>
    `;
    
    // Store the generated policy for saving
    window.currentGeneratedPolicy = policy;
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
}

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
