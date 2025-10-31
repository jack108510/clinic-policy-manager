// Supabase Helper Functions
// These functions wrap Supabase operations and provide a smooth migration path from localStorage

// ============================================
// AUTHENTICATION HELPERS
// ============================================

/**
 * Sign up a new user with email and password
 * @param {string} email - User's email
 * @param {string} password - User's password
 * @param {object} metadata - Additional user data (fullName, username, company, etc.)
 * @returns {object} { user, error }
 */
async function supabaseSignUp(email, password, metadata = {}) {
    if (!isSupabaseActive()) {
        console.log('Supabase disabled, using localStorage signup')
        return { user: null, error: { message: 'Supabase not active' } }
    }

    try {
        const { data, error } = await supabaseClient.auth.signUp({
            email: email,
            password: password,
            options: {
                data: {
                    full_name: metadata.fullName || metadata.full_name,
                    username: metadata.username,
                    company: metadata.company,
                    role: metadata.role || 'user'
                }
            }
        })

        if (error) {
            console.error('Supabase signup error:', error)
            return { user: null, error }
        }

        console.log('✅ User signed up successfully:', data.user?.email)
        return { user: data.user, session: data.session, error: null }
    } catch (error) {
        console.error('Signup exception:', error)
        return { user: null, error }
    }
}

/**
 * Sign in an existing user
 * @param {string} email - User's email
 * @param {string} password - User's password
 * @returns {object} { user, session, error }
 */
async function supabaseSignIn(email, password) {
    if (!isSupabaseActive()) {
        console.log('Supabase disabled, using localStorage login')
        return { user: null, error: { message: 'Supabase not active' } }
    }

    try {
        const { data, error } = await supabaseClient.auth.signInWithPassword({
            email: email,
            password: password
        })

        if (error) {
            console.error('Supabase signin error:', error)
            return { user: null, session: null, error }
        }

        console.log('✅ User signed in successfully:', data.user?.email)
        return { user: data.user, session: data.session, error: null }
    } catch (error) {
        console.error('Signin exception:', error)
        return { user: null, session: null, error }
    }
}

/**
 * Sign out the current user
 * @returns {object} { error }
 */
async function supabaseSignOut() {
    if (!isSupabaseActive()) {
        console.log('Supabase disabled, using localStorage logout')
        return { error: null }
    }

    try {
        const { error } = await supabaseClient.auth.signOut()
        if (error) {
            console.error('Supabase signout error:', error)
            return { error }
        }
        console.log('✅ User signed out successfully')
        return { error: null }
    } catch (error) {
        console.error('Signout exception:', error)
        return { error }
    }
}

/**
 * Get the current authenticated user
 * @returns {object} { user, error }
 */
async function supabaseGetCurrentUser() {
    if (!isSupabaseActive()) {
        return { user: null, error: { message: 'Supabase not active' } }
    }

    try {
        const { data: { user }, error } = await supabaseClient.auth.getUser()
        return { user, error }
    } catch (error) {
        console.error('Get user exception:', error)
        return { user: null, error }
    }
}

/**
 * Get the current session
 * @returns {object} { session, error }
 */
async function supabaseGetSession() {
    if (!isSupabaseActive()) {
        return { session: null, error: { message: 'Supabase not active' } }
    }

    try {
        const { data: { session }, error } = await supabaseClient.auth.getSession()
        return { session, error }
    } catch (error) {
        console.error('Get session exception:', error)
        return { session: null, error }
    }
}

// ============================================
// DATABASE HELPERS - COMPANIES
// ============================================

/**
 * Create a new company
 * @param {object} companyData - Company information
 * @returns {object} { data, error }
 */
async function supabaseCreateCompany(companyData) {
    if (!isSupabaseActive()) {
        return { data: null, error: { message: 'Supabase not active' } }
    }

    try {
        const { data, error } = await supabaseClient
            .from('companies')
            .insert([{
                name: companyData.name,
                industry: companyData.industry,
                phone: companyData.phone,
                plan: companyData.plan || 'free-trial',
                admin_password: companyData.adminPassword
            }])
            .select()
            .single()

        if (error) {
            console.error('Create company error:', error)
            return { data: null, error }
        }

        console.log('✅ Company created:', data.name)
        return { data, error: null }
    } catch (error) {
        console.error('Create company exception:', error)
        return { data: null, error }
    }
}

/**
 * Get a company by name
 * @param {string} companyName
 * @returns {object} { data, error }
 */
async function supabaseGetCompanyByName(companyName) {
    if (!isSupabaseActive()) {
        return { data: null, error: { message: 'Supabase not active' } }
    }

    try {
        const { data, error } = await supabaseClient
            .from('companies')
            .select('*')
            .eq('name', companyName)
            .single()

        return { data, error }
    } catch (error) {
        console.error('Get company exception:', error)
        return { data: null, error }
    }
}

// ============================================
// DATABASE HELPERS - PROFILES
// ============================================

/**
 * Create or update user profile
 * @param {object} profileData - Profile information
 * @returns {object} { data, error }
 */
async function supabaseUpsertProfile(profileData) {
    if (!isSupabaseActive()) {
        return { data: null, error: { message: 'Supabase not active' } }
    }

    try {
        const { data, error } = await supabaseClient
            .from('profiles')
            .upsert([{
                id: profileData.id,
                username: profileData.username,
                full_name: profileData.fullName || profileData.full_name,
                email: profileData.email,
                company_id: profileData.companyId || profileData.company_id,
                role: profileData.role || 'user',
                organizations: profileData.organizations || []
            }])
            .select()
            .single()

        if (error) {
            console.error('Upsert profile error:', error)
            return { data: null, error }
        }

        console.log('✅ Profile saved:', data.username)
        return { data, error: null }
    } catch (error) {
        console.error('Upsert profile exception:', error)
        return { data: null, error }
    }
}

/**
 * Get all profiles for a company
 * @param {string} companyId
 * @returns {object} { data, error }
 */
async function supabaseGetCompanyProfiles(companyId) {
    if (!isSupabaseActive()) {
        return { data: [], error: { message: 'Supabase not active' } }
    }

    try {
        const { data, error } = await supabaseClient
            .from('profiles')
            .select('*')
            .eq('company_id', companyId)
            .order('created_at', { ascending: false })

        return { data: data || [], error }
    } catch (error) {
        console.error('Get company profiles exception:', error)
        return { data: [], error }
    }
}

// ============================================
// DATABASE HELPERS - POLICIES
// ============================================

/**
 * Create a new policy
 * @param {object} policyData - Policy information
 * @returns {object} { data, error }
 */
async function supabaseCreatePolicy(policyData) {
    if (!isSupabaseActive()) {
        return { data: null, error: { message: 'Supabase not active' } }
    }

    try {
        const { data, error } = await supabaseClient
            .from('policies')
            .insert([{
                company_id: policyData.companyId || policyData.company_id,
                title: policyData.title,
                type: policyData.type,
                policy_code: policyData.policyCode || policyData.policy_code,
                purpose: policyData.purpose,
                scope: policyData.scope,
                policy_statement: policyData.policyStatement || policyData.policy_statement,
                procedures: policyData.procedures,
                responsibilities: policyData.responsibilities,
                consequences: policyData.consequences,
                definitions: policyData.definitions,
                related_documents: policyData.relatedDocuments || policyData.related_documents,
                review_approval: policyData.reviewApproval || policyData.review_approval,
                additional_content: policyData.additionalContent || policyData.additional_content,
                effective_date: policyData.effectiveDate || policyData.effective_date,
                version: policyData.version || '1.0',
                author: policyData.author,
                approved_by: policyData.approvedBy || policyData.approved_by,
                applies_to: policyData.appliesTo || policyData.applies_to,
                clinic_names: policyData.clinicNames || policyData.clinic_names,
                created_by: policyData.createdBy || policyData.created_by
            }])
            .select()
            .single()

        if (error) {
            console.error('Create policy error:', error)
            return { data: null, error }
        }

        console.log('✅ Policy created:', data.title)
        return { data, error: null }
    } catch (error) {
        console.error('Create policy exception:', error)
        return { data: null, error }
    }
}

/**
 * Get all policies for a company
 * @param {string} companyId
 * @returns {object} { data, error }
 */
async function supabaseGetCompanyPolicies(companyId) {
    if (!isSupabaseActive()) {
        return { data: [], error: { message: 'Supabase not active' } }
    }

    try {
        const { data, error } = await supabaseClient
            .from('policies')
            .select('*')
            .eq('company_id', companyId)
            .order('created_at', { ascending: false })

        return { data: data || [], error }
    } catch (error) {
        console.error('Get company policies exception:', error)
        return { data: [], error }
    }
}

/**
 * Update a policy
 * @param {string} policyId
 * @param {object} updates
 * @returns {object} { data, error }
 */
async function supabaseUpdatePolicy(policyId, updates) {
    if (!isSupabaseActive()) {
        return { data: null, error: { message: 'Supabase not active' } }
    }

    try {
        const { data, error } = await supabaseClient
            .from('policies')
            .update(updates)
            .eq('id', policyId)
            .select()
            .single()

        if (error) {
            console.error('Update policy error:', error)
            return { data: null, error }
        }

        console.log('✅ Policy updated:', data.title)
        return { data, error: null }
    } catch (error) {
        console.error('Update policy exception:', error)
        return { data: null, error }
    }
}

/**
 * Delete a policy
 * @param {string} policyId
 * @returns {object} { error }
 */
async function supabaseDeletePolicy(policyId) {
    if (!isSupabaseActive()) {
        return { error: { message: 'Supabase not active' } }
    }

    try {
        const { error } = await supabaseClient
            .from('policies')
            .delete()
            .eq('id', policyId)

        if (error) {
            console.error('Delete policy error:', error)
            return { error }
        }

        console.log('✅ Policy deleted')
        return { error: null }
    } catch (error) {
        console.error('Delete policy exception:', error)
        return { error }
    }
}

// ============================================
// DATABASE HELPERS - POLICY VIEWS
// ============================================

/**
 * Track a policy view
 * @param {string} policyId
 * @param {string} userId
 * @param {string} username
 * @returns {object} { data, error }
 */
async function supabaseTrackPolicyView(policyId, userId, username) {
    if (!isSupabaseActive()) {
        return { data: null, error: { message: 'Supabase not active' } }
    }

    try {
        const { data, error } = await supabaseClient
            .from('policy_views')
            .upsert([{
                policy_id: policyId,
                user_id: userId,
                username: username
            }], {
                onConflict: 'policy_id,user_id'
            })
            .select()

        return { data, error }
    } catch (error) {
        console.error('Track policy view exception:', error)
        return { data: null, error }
    }
}

/**
 * Get all viewers for a policy
 * @param {string} policyId
 * @returns {object} { data, error }
 */
async function supabaseGetPolicyViewers(policyId) {
    if (!isSupabaseActive()) {
        return { data: [], error: { message: 'Supabase not active' } }
    }

    try {
        const { data, error } = await supabaseClient
            .from('policy_views')
            .select('*')
            .eq('policy_id', policyId)
            .order('viewed_at', { ascending: false })

        return { data: data || [], error }
    } catch (error) {
        console.error('Get policy viewers exception:', error)
        return { data: [], error }
    }
}

// ============================================
// TESTING & UTILITIES
// ============================================

/**
 * Test Supabase authentication with a demo user
 */
async function testSupabaseAuth() {
    console.log('🧪 Testing Supabase Authentication...')
    
    const testEmail = `test-${Date.now()}@gmail.com`  // Use gmail.com instead
    const testPassword = 'test123456'
    
    // Test signup
    const signupResult = await supabaseSignUp(testEmail, testPassword, {
        fullName: 'Test User',
        username: 'testuser',
        company: 'Test Company'
    })
    
    if (signupResult.error) {
        console.error('❌ Signup test failed:', signupResult.error.message)
        return false
    }
    
    console.log('✅ Signup test passed')
    
    // Test signin
    const signinResult = await supabaseSignIn(testEmail, testPassword)
    
    if (signinResult.error) {
        console.error('❌ Signin test failed:', signinResult.error.message)
        return false
    }
    
    console.log('✅ Signin test passed')
    
    // Test signout
    const signoutResult = await supabaseSignOut()
    
    if (signoutResult.error) {
        console.error('❌ Signout test failed:', signoutResult.error.message)
        return false
    }
    
    console.log('✅ Signout test passed')
    console.log('🎉 All authentication tests passed!')
    
    return true
}

// Make functions globally available
window.supabaseHelpers = {
    // Auth
    signUp: supabaseSignUp,
    signIn: supabaseSignIn,
    signOut: supabaseSignOut,
    getCurrentUser: supabaseGetCurrentUser,
    getSession: supabaseGetSession,
    
    // Companies
    createCompany: supabaseCreateCompany,
    getCompanyByName: supabaseGetCompanyByName,
    
    // Profiles
    upsertProfile: supabaseUpsertProfile,
    getCompanyProfiles: supabaseGetCompanyProfiles,
    
    // Policies
    createPolicy: supabaseCreatePolicy,
    getCompanyPolicies: supabaseGetCompanyPolicies,
    updatePolicy: supabaseUpdatePolicy,
    deletePolicy: supabaseDeletePolicy,
    
    // Policy Views
    trackPolicyView: supabaseTrackPolicyView,
    getPolicyViewers: supabaseGetPolicyViewers,
    
    // Testing
    testAuth: testSupabaseAuth
}

console.log('✅ Supabase helper functions loaded')

