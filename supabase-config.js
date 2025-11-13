// Supabase Configuration
// Replace these with your actual Supabase project credentials

const SUPABASE_URL = 'YOUR_SUPABASE_URL'; // e.g., 'https://xxxxx.supabase.co'
const SUPABASE_ANON_KEY = 'YOUR_SUPABASE_ANON_KEY'; // Your Supabase anonymous/public key

// Initialize Supabase client
let supabaseClient = null;

function initSupabase() {
    if (typeof supabase !== 'undefined') {
        supabaseClient = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
        return supabaseClient;
    } else {
        console.error('Supabase JS library not loaded. Please include: <script src="https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2"></script>');
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
        if (!supabaseClient) {
            await new Promise(resolve => setTimeout(resolve, 100));
            if (!supabaseClient) return null;
        }
        const { data, error } = await supabaseClient
            .from('users')
            .insert([user])
            .select()
            .single();
        if (error) {
            console.error('Error creating user:', error);
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

