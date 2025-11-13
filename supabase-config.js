// Supabase Configuration
// Replace these with your actual Supabase project credentials

const SUPABASE_URL = 'YOUR_SUPABASE_URL'; // e.g., 'https://xxxxx.supabase.co'
const SUPABASE_ANON_KEY = 'YOUR_SUPABASE_ANON_KEY'; // Your Supabase anonymous/public key

// Initialize Supabase client
let supabaseClient = null;

function initSupabase() {
    // Check if Supabase is configured
    if (SUPABASE_URL === 'YOUR_SUPABASE_URL' || SUPABASE_ANON_KEY === 'YOUR_SUPABASE_ANON_KEY') {
        console.warn('⚠️ Supabase not configured. Using localStorage fallback.');
        return null; // Will use localStorage fallback
    }
    
    if (typeof supabase !== 'undefined') {
        try {
            supabaseClient = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
            console.log('✅ Supabase client initialized');
            return supabaseClient;
        } catch (error) {
            console.error('❌ Error initializing Supabase:', error);
            return null;
        }
    } else {
        console.warn('⚠️ Supabase JS library not loaded. Using localStorage fallback.');
        return null;
    }
}

// Initialize on load
if (typeof window !== 'undefined') {
    // Load Supabase JS library dynamically if not already loaded
    if (typeof supabase === 'undefined') {
        const script = document.createElement('script');
        script.src = 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2';
        script.onload = () => {
            initSupabase();
        };
        document.head.appendChild(script);
    } else {
        initSupabase();
    }
}

// Supabase Database Functions
const SupabaseDB = {
    // Users table operations
    async getUsers() {
        if (!supabaseClient) {
            await new Promise(resolve => setTimeout(resolve, 100)); // Wait for init
            if (!supabaseClient) return [];
        }
        const { data, error } = await supabaseClient
            .from('users')
            .select('*');
        if (error) {
            console.error('Error fetching users:', error);
            return [];
        }
        return data || [];
    },

    async createUser(user) {
        console.log('🔵 createUser called with:', { ...user, password: '***' });
        console.log('🔵 supabaseClient:', !!supabaseClient);
        console.log('🔵 SUPABASE_URL:', SUPABASE_URL);
        
        // Fallback to localStorage if Supabase not configured
        if (!supabaseClient || SUPABASE_URL === 'YOUR_SUPABASE_URL') {
            console.log('📦 Using localStorage fallback for user creation');
            try {
                const users = JSON.parse(localStorage.getItem('masterUsers') || '[]');
                console.log('📦 Current users in localStorage:', users.length);
                
                const newUser = {
                    id: `user-${Date.now()}`,
                    ...user,
                    created_at: user.created || user.created_at || new Date().toISOString(),
                    last_login_at: null,
                    fullName: user.fullName || user.full_name || '',
                    status: user.status || 'active'
                };
                
                console.log('📦 New user object:', { ...newUser, password: '***' });
                
                users.push(newUser);
                localStorage.setItem('masterUsers', JSON.stringify(users));
                
                // Verify save
                const verifyUsers = JSON.parse(localStorage.getItem('masterUsers') || '[]');
                console.log('📦 Verified users in localStorage:', verifyUsers.length);
                
                console.log('✅ User created in localStorage:', newUser);
                return newUser;
            } catch (error) {
                console.error('❌ Error in localStorage fallback:', error);
                console.error('❌ Error stack:', error.stack);
                return null;
            }
        }
        
        if (!supabaseClient) {
            await new Promise(resolve => setTimeout(resolve, 100));
            if (!supabaseClient) {
                console.error('❌ supabaseClient still null after wait');
                return null;
            }
        }
        const { data, error } = await supabaseClient
            .from('users')
            .insert([user])
            .select()
            .single();
        if (error) {
            console.error('Error creating user:', error);
            console.error('Error details:', error.message, error.details);
            return null;
        }
        return data;
    },

    async updateUser(userId, updates) {
        if (!supabaseClient) {
            await new Promise(resolve => setTimeout(resolve, 100));
            if (!supabaseClient) return null;
        }
        const { data, error } = await supabaseClient
            .from('users')
            .update(updates)
            .eq('id', userId)
            .select()
            .single();
        if (error) {
            console.error('Error updating user:', error);
            return null;
        }
        return data;
    },

    async deleteUser(userId) {
        if (!supabaseClient) {
            await new Promise(resolve => setTimeout(resolve, 100));
            if (!supabaseClient) return false;
        }
        const { error } = await supabaseClient
            .from('users')
            .delete()
            .eq('id', userId);
        if (error) {
            console.error('Error deleting user:', error);
            return false;
        }
        return true;
    },

    // Companies table operations
    async getCompanies() {
        if (!supabaseClient) {
            await new Promise(resolve => setTimeout(resolve, 100));
            if (!supabaseClient) return [];
        }
        const { data, error } = await supabaseClient
            .from('companies')
            .select('*');
        if (error) {
            console.error('Error fetching companies:', error);
            return [];
        }
        return data || [];
    },

    async createCompany(company) {
        if (!supabaseClient) {
            await new Promise(resolve => setTimeout(resolve, 100));
            if (!supabaseClient) return null;
        }
        const { data, error } = await supabaseClient
            .from('companies')
            .insert([company])
            .select()
            .single();
        if (error) {
            console.error('Error creating company:', error);
            return null;
        }
        return data;
    },

    async updateCompany(companyId, updates) {
        if (!supabaseClient) {
            await new Promise(resolve => setTimeout(resolve, 100));
            if (!supabaseClient) return null;
        }
        const { data, error } = await supabaseClient
            .from('companies')
            .update(updates)
            .eq('id', companyId)
            .select()
            .single();
        if (error) {
            console.error('Error updating company:', error);
            return null;
        }
        return data;
    },

    async deleteCompany(companyId) {
        if (!supabaseClient) {
            await new Promise(resolve => setTimeout(resolve, 100));
            if (!supabaseClient) return false;
        }
        const { error } = await supabaseClient
            .from('companies')
            .delete()
            .eq('id', companyId);
        if (error) {
            console.error('Error deleting company:', error);
            return false;
        }
        return true;
    },

    // Access codes table operations
    async getAccessCodes() {
        // Fallback to localStorage if Supabase not configured
        if (!supabaseClient || SUPABASE_URL === 'YOUR_SUPABASE_URL') {
            console.log('📦 Using localStorage fallback for access codes');
            const codes = JSON.parse(localStorage.getItem('masterAccessCodes') || '[]');
            // Convert camelCase to snake_case for consistency
            return codes.map(code => ({
                ...code,
                created_date: code.createdDate || code.created_date,
                expiry_date: code.expiryDate || code.expiry_date,
                max_companies: code.maxCompanies || code.max_companies,
                used_by: code.usedBy || code.used_by || []
            }));
        }
        
        if (!supabaseClient) {
            await new Promise(resolve => setTimeout(resolve, 100));
            if (!supabaseClient) return [];
        }
        const { data, error } = await supabaseClient
            .from('access_codes')
            .select('*');
        if (error) {
            console.error('Error fetching access codes:', error);
            return [];
        }
        return data || [];
    },

    async createAccessCode(accessCode) {
        // Fallback to localStorage if Supabase not configured
        if (!supabaseClient || SUPABASE_URL === 'YOUR_SUPABASE_URL') {
            console.log('📦 Using localStorage fallback for access code creation');
            const codes = JSON.parse(localStorage.getItem('masterAccessCodes') || '[]');
            const newCode = {
                id: `code-${Date.now()}`,
                ...accessCode,
                // Convert snake_case to camelCase for localStorage compatibility
                createdDate: accessCode.created_date,
                expiryDate: accessCode.expiry_date,
                maxCompanies: accessCode.max_companies,
                usedBy: accessCode.used_by || []
            };
            codes.push(newCode);
            localStorage.setItem('masterAccessCodes', JSON.stringify(codes));
            return newCode;
        }
        
        if (!supabaseClient) {
            await new Promise(resolve => setTimeout(resolve, 100));
            if (!supabaseClient) return null;
        }
        const { data, error } = await supabaseClient
            .from('access_codes')
            .insert([accessCode])
            .select()
            .single();
        if (error) {
            console.error('Error creating access code:', error);
            return null;
        }
        return data;
    },

    async updateAccessCode(codeId, updates) {
        if (!supabaseClient) {
            await new Promise(resolve => setTimeout(resolve, 100));
            if (!supabaseClient) return null;
        }
        const { data, error } = await supabaseClient
            .from('access_codes')
            .update(updates)
            .eq('id', codeId)
            .select()
            .single();
        if (error) {
            console.error('Error updating access code:', error);
            return null;
        }
        return data;
    },

    async deleteAccessCode(codeId) {
        // Fallback to localStorage if Supabase not configured
        if (!supabaseClient || SUPABASE_URL === 'YOUR_SUPABASE_URL') {
            console.log('📦 Using localStorage fallback for access code deletion');
            const codes = JSON.parse(localStorage.getItem('masterAccessCodes') || '[]');
            const filtered = codes.filter(c => c.id !== codeId);
            localStorage.setItem('masterAccessCodes', JSON.stringify(filtered));
            return true;
        }
        
        if (!supabaseClient) {
            await new Promise(resolve => setTimeout(resolve, 100));
            if (!supabaseClient) return false;
        }
        const { error } = await supabaseClient
            .from('access_codes')
            .delete()
            .eq('id', codeId);
        if (error) {
            console.error('Error deleting access code:', error);
            return false;
        }
        return true;
    },

    async findAccessCodeByCode(code) {
        // Fallback to localStorage if Supabase not configured
        if (!supabaseClient || SUPABASE_URL === 'YOUR_SUPABASE_URL') {
            console.log('📦 Using localStorage fallback for access code lookup');
            const codes = JSON.parse(localStorage.getItem('masterAccessCodes') || '[]');
            const found = codes.find(c => c.code === code && (c.status === 'active' || !c.status));
            if (found) {
                // Convert camelCase to snake_case for consistency
                return {
                    ...found,
                    created_date: found.createdDate || found.created_date,
                    expiry_date: found.expiryDate || found.expiry_date,
                    max_companies: found.maxCompanies || found.max_companies,
                    used_by: found.usedBy || found.used_by || []
                };
            }
            return null;
        }
        
        if (!supabaseClient) {
            await new Promise(resolve => setTimeout(resolve, 100));
            if (!supabaseClient) return null;
        }
        const { data, error } = await supabaseClient
            .from('access_codes')
            .select('*')
            .eq('code', code)
            .eq('status', 'active')
            .single();
        if (error) {
            if (error.code === 'PGRST116') {
                // No rows returned
                return null;
            }
            console.error('Error finding access code:', error);
            return null;
        }
        return data;
    }
};

