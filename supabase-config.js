// Supabase Configuration
// This file contains your Supabase credentials and setup

// Your Supabase project credentials
const SUPABASE_URL = 'https://wkbntjfiwzoauzxnowfc.supabase.co'
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndrYm50amZpd3pvYXV6eG5vd2ZjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjE5MTc4NzIsImV4cCI6MjA3NzQ5Mzg3Mn0.CgilBvYCUkbScycnZ8OWy_eAjUF0i698lcDbWHcM5ic'

// Feature flag - Controls whether to use Supabase or localStorage
// Set to FALSE to keep using localStorage (current behavior)
// Set to TRUE to use Supabase backend
const USE_SUPABASE = false

// Initialize Supabase client
let supabaseClient = null

try {
    if (typeof supabase !== 'undefined') {
        supabaseClient = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY)
        console.log('✅ Supabase client initialized successfully')
        
        // Test connection
        testSupabaseConnection()
    } else {
        console.warn('⚠️ Supabase library not loaded yet')
    }
} catch (error) {
    console.error('❌ Error initializing Supabase:', error)
}

// Test Supabase connection
async function testSupabaseConnection() {
    try {
        const { data, error } = await supabaseClient.from('companies').select('count')
        if (error) {
            console.log('📊 Supabase connected (no data yet):', error.message)
        } else {
            console.log('✅ Supabase connection test successful')
        }
    } catch (error) {
        console.log('📊 Supabase ready for setup')
    }
}

// Helper function to check if Supabase is active
function isSupabaseActive() {
    return USE_SUPABASE && supabaseClient !== null
}

console.log(`🔧 Supabase Mode: ${USE_SUPABASE ? 'ENABLED' : 'DISABLED (using localStorage)'}`)

