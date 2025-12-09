// Supabase Configuration
const SUPABASE_URL = 'https://hneyncvndwejbvkxndpz.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhuZXluY3ZuZHdlamJ2a3huZHB6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjM4MzYwNjIsImV4cCI6MjA3OTQxMjA2Mn0.uN9VzRZ-HNNci5nwbVnNUCnmBDaF3F4vsmVjsKQHerc';

// Initialize Supabase client (for reading data)
let supabaseClient = null;

function initSupabase() {
    if (typeof window !== 'undefined') {
        // Check if supabase library is loaded
        if (typeof supabase !== 'undefined' && supabase.createClient) {
            try {
                supabaseClient = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
                console.log('✅ Supabase client initialized');
                
                // Expose globally
                window.supabaseClient = supabaseClient;
                window.SUPABASE_URL = SUPABASE_URL;
                return true;
            } catch (error) {
                console.error('❌ Error initializing Supabase client:', error);
                return false;
            }
        } else {
            // Wait for supabase library to load
            setTimeout(initSupabase, 100);
            return false;
        }
    }
    return false;
}

// Try to initialize immediately
initSupabase();

// Also try on DOMContentLoaded
if (typeof window !== 'undefined') {
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initSupabase);
    } else {
        initSupabase();
    }
}

// Webhook Configuration
const WEBHOOK_URL = 'https://jackwilde.app.n8n.cloud/webhook/561e4d2b-3047-456b-acf0-fb22e460ed4a';

// Webhook utility function
async function sendToWebhook(data, type) {
    try {
        // Map type to operation name
        let operationType;
        if (type === 'company') {
            operationType = 'companycreated';
        } else if (type === 'companydeleted' || type === 'companyDeleted') {
            operationType = 'companydeleted';
        } else if (type === 'access_code' || type === 'accesscode') {
            operationType = 'accesscode';
        } else if (type === 'accesscodedeleted' || type === 'accessCodeDeleted') {
            operationType = 'accesscodedeleted';
        } else if (type === 'user') {
            operationType = 'usercreated';
        } else if (type === 'userdeleted' || type === 'userDeleted') {
            operationType = 'userdeleted';
        } else if (type === 'policy') {
            operationType = 'policysaved';
        } else {
            operationType = type; // Fallback to original type
        }
        
        const payload = {
            type: operationType, // 'companycreated', 'accesscode', 'usercreated', or 'policysaved'
            data: data,
            timestamp: new Date().toISOString()
        };
        
        const response = await fetch(WEBHOOK_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(payload)
        });
        
        if (!response.ok) {
            console.error('Webhook error:', response.status, response.statusText);
            return { success: false, error: `HTTP ${response.status}` };
        }
        
        const result = await response.json().catch(() => ({}));
        console.log(`✅ ${operationType} data sent to webhook successfully`);
        return { success: true, data: result };
    } catch (error) {
        console.error(`❌ Error sending ${type} to webhook:`, error);
        return { success: false, error: error.message };
    }
}

// Expose sendToWebhook globally for use in script.js
if (typeof window !== 'undefined') {
    window.sendToWebhook = sendToWebhook;
}

if (typeof globalThis !== 'undefined') {
    globalThis.sendToWebhook = sendToWebhook;
}

// Policy webhook function - exposed globally for use in script.js
if (typeof window !== 'undefined') {
    window.sendPolicyToWebhook = async function(policy) {
        if (!policy) {
            console.error('Cannot send policy to webhook: policy is missing');
            return { success: false, error: 'Policy is missing' };
        }
        
        // Collect all policy text content into a single string
        let fullPolicyText = '';
        
        // Try to get the full HTML/text content
        if (policy.content) {
            // If it's HTML, extract text content
            if (typeof policy.content === 'string' && policy.content.includes('<')) {
                // Create a temporary element to extract text
                const tempDiv = typeof document !== 'undefined' ? document.createElement('div') : null;
                if (tempDiv) {
                    tempDiv.innerHTML = policy.content;
                    fullPolicyText = tempDiv.textContent || tempDiv.innerText || '';
                } else {
                    // Fallback: use the HTML as-is
                    fullPolicyText = policy.content;
                }
            } else {
                fullPolicyText = policy.content;
            }
        }
        
        // Add structured sections if they exist
        const sections = [];
        if (policy.purpose) sections.push(`Purpose: ${policy.purpose}`);
        if (policy.scope) sections.push(`Scope: ${policy.scope}`);
        if (policy.policyStatement) sections.push(`Policy Statement: ${policy.policyStatement}`);
        if (policy.statement) sections.push(`Statement: ${policy.statement}`);
        if (policy.procedures) sections.push(`Procedures: ${policy.procedures}`);
        if (policy.responsibilities) sections.push(`Responsibilities: ${policy.responsibilities}`);
        if (policy.consequences) sections.push(`Consequences: ${policy.consequences}`);
        if (policy.markdown) sections.push(policy.markdown);
        if (policy.text) sections.push(policy.text);
        
        // Combine all text content
        if (sections.length > 0) {
            fullPolicyText = fullPolicyText ? `${fullPolicyText}\n\n${sections.join('\n\n')}` : sections.join('\n\n');
        }
        
        // If we still don't have text, try to get from preview element
        if (!fullPolicyText && typeof document !== 'undefined') {
            const preview = document.getElementById('policyPreview');
            if (preview) {
                fullPolicyText = preview.textContent || preview.innerText || preview.innerHTML || '';
            }
        }
        
        // Fallback: use title if no content found
        if (!fullPolicyText) {
            fullPolicyText = policy.title || policy.name || 'No content available';
        }
        
        // Extract key policy data
        const policyData = {
            type: 'policysaved', // Webhook type for routing
            id: policy.id,
            title: policy.title || policy.name || 'Untitled Policy',
            name: policy.title || policy.name || 'Untitled Policy', // Keep for backward compatibility
            text: fullPolicyText, // Full policy text content
            policyType: policy.type || 'admin', // Policy type (renamed to avoid conflict with webhook type)
            status: policy.status || 'active', // Policy status
            company: policy.company || null,
            clinicNames: policy.clinicNames || policy.organizations || policy.clinics || null,
            effectiveDate: policy.effectiveDate || null,
            version: policy.version || '1.0',
            created: policy.created || policy.created_at || new Date().toISOString(),
            lastModified: policy.lastModified || policy.last_modified || new Date().toISOString(),
            modifiedBy: policy.modifiedBy || policy.modified_by || null,
            // Include structured sections if available
            purpose: policy.purpose || null,
            scope: policy.scope || null,
            policyStatement: policy.policyStatement || null,
            procedures: policy.procedures || null,
            responsibilities: policy.responsibilities || null,
            consequences: policy.consequences || null,
            categoryId: policy.categoryId || null,
            policyCode: policy.policyCode || null,
            relatedDocuments: policy.relatedDocuments || null
        };
        
        return await sendToWebhook(policyData, 'policy');
    };
}

// Helper function to normalize user data (profiles -> legacy format for compatibility)
function normalizeProfileToUser(profile, companyName = null) {
    return {
        id: profile.id,
        username: profile.username || profile.email?.split('@')[0] || 'user',
        email: profile.email,
        full_name: profile.full_name || profile.fullName || '',
        company: companyName || profile.company || '',
        company_id: profile.company_id,
        role: profile.role || 'user',
        organizations: profile.organizations || [],
        created: profile.created_at || profile.created,
        created_at: profile.created_at,
        lastLogin: profile.last_login_at || profile.lastLogin,
        status: 'active'
    };
}

// Expose normalizeProfileToUser globally for use in script.js
if (typeof window !== 'undefined') {
    window.normalizeProfileToUser = normalizeProfileToUser;
}

// Helper function to convert legacy user format to profile format
function convertUserToProfile(user, companyId = null) {
    return {
        username: user.username,
        email: user.email,
        full_name: user.full_name || user.fullName || user.username,
        company_id: companyId || user.company_id,
        role: user.role || 'user',
        organizations: Array.isArray(user.organizations) ? user.organizations : (user.organizations ? [user.organizations] : [])
    };
}

// Database Functions (using localStorage only, no Supabase)
const SupabaseDB = {
    // Auth operations - simplified to localStorage only
    async signUp(email, password, metadata = {}) {
        // Store user in localStorage
        const users = JSON.parse(localStorage.getItem('masterUsers') || '[]');
        const newUser = {
            id: `user-${Date.now()}`,
            email: email,
            username: metadata.username || email.split('@')[0],
            full_name: metadata.full_name || metadata.username || email.split('@')[0],
            created_at: new Date().toISOString(),
            status: 'active'
        };
        users.push(newUser);
        localStorage.setItem('masterUsers', JSON.stringify(users));
        return { data: { user: newUser }, error: null };
    },

    async signIn(email, password) {
        // Check localStorage for user
        const users = JSON.parse(localStorage.getItem('masterUsers') || '[]');
        const user = users.find(u => u.email === email);
        if (user) {
            return { data: { user: user }, error: null };
        }
        return { data: null, error: { message: 'Invalid credentials' } };
    },

    async signOut() {
        // Clear any session data
        return { error: null };
    },

    async getCurrentUser() {
        // Return current user from localStorage if available
        const currentUserId = localStorage.getItem('currentUserId');
        if (currentUserId) {
            const users = JSON.parse(localStorage.getItem('masterUsers') || '[]');
            return users.find(u => u.id === currentUserId) || null;
        }
        return null;
    },

    // Profiles table operations (READ from Supabase, WRITE via webhook)
    async getUsers() {
        // Try to fetch from Supabase first
        if (supabaseClient) {
            try {
                console.log('📡 Fetching users from Supabase...');
                const { data, error } = await supabaseClient
                    .from('profiles')
                    .select('*');
                
                if (error) {
                    console.error('Supabase error while fetching profiles', error);
                    throw error;
                }
                
                if (data && data.length > 0) {
                    console.log(`✅ Loaded ${data.length} users from Supabase`);
                    // Normalize to user format
                    return data.map(profile => normalizeProfileToUser(profile));
                }
            } catch (error) {
                console.warn('Falling back to local data. Verify Supabase tables, RLS policies, or API availability.');
            }
        }
        
        // Fallback to localStorage
        console.log('📦 Falling back to localStorage users:', JSON.parse(localStorage.getItem('masterUsers') || '[]').length);
        const users = JSON.parse(localStorage.getItem('masterUsers') || '[]');
        return users;
    },

    async createUser(userData) {
        console.log('🔵 createUser called with:', { ...userData, password: '***' });
        try {
            const newUser = {
                id: userData.id || `user-${Date.now()}`, // Use provided ID or generate new one
                ...userData,
                created_at: userData.created || userData.created_at || new Date().toISOString(),
                last_login_at: null,
                fullName: userData.full_name || userData.fullName || userData.username || '',
                status: userData.status || 'active'
            };
            
            // Send to webhook FIRST (webhook stores the data)
            console.log('📤 Sending user to webhook...');
            try {
                const webhookResult = await sendToWebhook(newUser, 'user');
                if (webhookResult && webhookResult.success) {
                    console.log('✅ User data sent to webhook successfully');
                } else {
                    console.warn('⚠️ Webhook call had issues:', webhookResult);
                    // Continue anyway - don't block user creation if webhook fails
                }
            } catch (webhookError) {
                console.error('❌ Error sending user to webhook:', webhookError);
                // Continue anyway - don't block user creation if webhook fails
            }
            
            // Also save to localStorage as cache (check if user already exists)
            const users = JSON.parse(localStorage.getItem('masterUsers') || '[]');
            const existingIndex = users.findIndex(u => u.id === newUser.id || u.email === newUser.email);
            if (existingIndex === -1) {
                users.push(newUser);
                localStorage.setItem('masterUsers', JSON.stringify(users));
                console.log('✅ User cached in localStorage:', newUser.username || newUser.email);
            } else {
                // Update existing user
                users[existingIndex] = { ...users[existingIndex], ...newUser };
                localStorage.setItem('masterUsers', JSON.stringify(users));
                console.log('✅ User updated in localStorage:', newUser.username || newUser.email);
            }
            return newUser;
        } catch (error) {
            console.error('❌ Error in createUser:', error);
            return null;
        }
    },

    async updateUser(userId, updates) {
        const users = JSON.parse(localStorage.getItem('masterUsers') || '[]');
        const index = users.findIndex(u => u.id === userId);
        if (index !== -1) {
            users[index] = { ...users[index], ...updates };
            localStorage.setItem('masterUsers', JSON.stringify(users));
            return users[index];
        }
            return null;
    },

    async deleteUser(userId) {
        const users = JSON.parse(localStorage.getItem('masterUsers') || '[]');
        const filtered = users.filter(u => u.id !== userId);
        localStorage.setItem('masterUsers', JSON.stringify(filtered));
        return true;
    },

    // Companies table operations (READ from Supabase, WRITE via webhook)
    async getCompanies() {
        // Try to fetch from Supabase first
        if (supabaseClient) {
            try {
                console.log('📡 Fetching companies from Supabase...');
                const { data, error } = await supabaseClient
                    .from('companies')
                    .select('*');
                
                if (error) {
                    console.error('Supabase error while fetching companies', error);
                    throw error;
                }
                
                if (data && data.length > 0) {
                    console.log(`✅ Loaded ${data.length} companies from Supabase`);
                    return data;
                }
            } catch (error) {
                console.warn('Falling back to local data. Verify Supabase tables, RLS policies, or API availability.');
            }
        }
        
        // Fallback to localStorage
        console.log('📦 Falling back to localStorage companies');
        return JSON.parse(localStorage.getItem('masterCompanies') || '[]');
    },

    async createCompany(company) {
        // Create company object
        const newCompany = {
            id: `company-${Date.now()}`,
            ...company,
            created_at: company.created_at || new Date().toISOString(),
            status: 'active',
            users: 0,
            policies: 0
        };
        
        // Send to webhook (webhook stores the data)
        console.log('📤 Sending company to webhook...');
        await sendToWebhook(newCompany, 'company');
        
        // Also cache in localStorage
        const companies = JSON.parse(localStorage.getItem('masterCompanies') || '[]');
        companies.push(newCompany);
        localStorage.setItem('masterCompanies', JSON.stringify(companies));
        
        return newCompany;
    },

    async findCompanyByName(name) {
        console.log('📦 Using localStorage for finding company');
            const companies = JSON.parse(localStorage.getItem('masterCompanies') || '[]');
            return companies.find(c => c.name === name) || null;
    },

    async updateCompany(companyId, updates) {
        const companies = JSON.parse(localStorage.getItem('masterCompanies') || '[]');
        const index = companies.findIndex(c => c.id === companyId);
        if (index !== -1) {
            companies[index] = { ...companies[index], ...updates };
            localStorage.setItem('masterCompanies', JSON.stringify(companies));
            return companies[index];
        }
            return null;
    },

    async deleteCompany(companyId) {
        const companies = JSON.parse(localStorage.getItem('masterCompanies') || '[]');
        const filtered = companies.filter(c => c.id !== companyId);
        localStorage.setItem('masterCompanies', JSON.stringify(filtered));
        return true;
    },

    // Access codes table operations (READ from Supabase, WRITE via webhook)
    async getAccessCodes() {
        // Try to fetch from Supabase first
        if (supabaseClient) {
            try {
                console.log('📡 Fetching access codes from Supabase...');
                const { data, error } = await supabaseClient
                    .from('access_codes')
                    .select('*');
                
                if (error) {
                    console.error('Error fetching access codes:', error);
                    throw error;
                }
                
                if (data && data.length > 0) {
                    console.log(`✅ Loaded ${data.length} access codes from Supabase`);
                    return data.map(code => ({
                        ...code,
                        created_date: code.createdDate || code.created_date,
                        expiry_date: code.expiryDate || code.expiry_date,
                        max_companies: code.maxCompanies || code.max_companies,
                        used_by: code.usedBy || code.used_by || []
                    }));
                }
            } catch (error) {
                console.warn('Falling back to local data. Verify Supabase tables, RLS policies, or API availability.');
            }
        }
        
        // Fallback to localStorage
        console.log('📦 Falling back to localStorage access codes');
        const codes = JSON.parse(localStorage.getItem('masterAccessCodes') || '[]');
        return codes.map(code => ({
            ...code,
            created_date: code.createdDate || code.created_date,
            expiry_date: code.expiryDate || code.expiry_date,
            max_companies: code.maxCompanies || code.max_companies,
            used_by: code.usedBy || code.used_by || []
        }));
    },

    async createAccessCode(accessCode) {
        // Create access code object
        const newCode = {
            id: `code-${Date.now()}`,
            ...accessCode,
            created_date: accessCode.created_date || accessCode.createdDate || new Date().toISOString().slice(0, 10),
            expiry_date: accessCode.expiry_date || accessCode.expiryDate || null,
            max_companies: accessCode.max_companies || accessCode.maxCompanies || 10,
            used_by: accessCode.used_by || accessCode.usedBy || [],
            status: accessCode.status || 'active'
        };
        
        // Send to webhook (webhook stores the data)
        console.log('📤 Sending access code to webhook...');
        await sendToWebhook(newCode, 'access_code');
        
        // Also cache in localStorage
        const codes = JSON.parse(localStorage.getItem('masterAccessCodes') || '[]');
        codes.push(newCode);
        localStorage.setItem('masterAccessCodes', JSON.stringify(codes));
        
        return newCode;
    },

    async updateAccessCode(codeId, updates) {
        const codes = JSON.parse(localStorage.getItem('masterAccessCodes') || '[]');
        const index = codes.findIndex(c => c.id === codeId);
        if (index !== -1) {
            codes[index] = { ...codes[index], ...updates };
            localStorage.setItem('masterAccessCodes', JSON.stringify(codes));
            return codes[index];
        }
            return null;
    },

    async deleteAccessCode(codeId) {
        console.log('📦 Using localStorage for access code deletion');
            const codes = JSON.parse(localStorage.getItem('masterAccessCodes') || '[]');
            const filtered = codes.filter(c => c.id !== codeId);
            localStorage.setItem('masterAccessCodes', JSON.stringify(filtered));
        return true;
    },

    getClient() {
        return supabaseClient; // Return Supabase client for reading data
    },

    async findAccessCodeByCode(code) {
        // Normalize the search code
        const searchCode = String(code || '').trim().toUpperCase();
        
        // Try to fetch from Supabase first
        if (supabaseClient) {
            try {
                console.log('📡 Searching for access code in Supabase...');
                const { data, error } = await supabaseClient
                    .from('access_codes')
                    .select('*')
                    .ilike('code', searchCode)
                    .eq('status', 'active')
                    .limit(1);
                
                if (!error && data && data.length > 0) {
                    const found = data[0];
                    console.log('✅ Found code in Supabase:', found.code);
                    return {
                        ...found,
                        created_date: found.createdDate || found.created_date,
                        expiry_date: found.expiryDate || found.expiry_date,
                        max_companies: found.maxCompanies || found.max_companies,
                        used_by: found.usedBy || found.used_by || []
                    };
                }
            } catch (error) {
                console.warn('Error searching Supabase, falling back to localStorage');
            }
        }
        
        // Fallback to localStorage
        console.log('📦 Searching in localStorage for access code');
        console.log('🔍 Searching for code:', searchCode);
        const codes = JSON.parse(localStorage.getItem('masterAccessCodes') || '[]');
        console.log('📋 Total codes in localStorage:', codes.length);
        
        // Try exact match first (case-sensitive)
        let found = codes.find(c => {
            const codeValue = String(c.code || '').trim();
            return codeValue === code || codeValue === searchCode;
        });
        
        // If not found, try case-insensitive match
        if (!found) {
            found = codes.find(c => {
                const codeValue = String(c.code || '').trim().toUpperCase();
                return codeValue === searchCode;
            });
        }
        
        // Check if found and is active
        if (found) {
            const isActive = found.status === 'active' || !found.status;
            console.log('✅ Found code:', found.code, 'Status:', found.status, 'Active:', isActive);
            
            if (isActive) {
                return {
                    ...found,
                    created_date: found.createdDate || found.created_date,
                    expiry_date: found.expiryDate || found.expiry_date,
                    max_companies: found.maxCompanies || found.max_companies,
                    used_by: found.usedBy || found.used_by || []
                };
            } else {
                console.log('❌ Code found but not active');
            }
        } else {
            console.log('❌ Code not found');
        }
        return null;
    }
};
