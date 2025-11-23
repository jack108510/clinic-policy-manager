// Complete setup script for new Supabase project
const SUPABASE_URL = 'https://hneyncvndwejbvkxndpz.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhuZXluY3ZuZHdlamJ2a3huZHB6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjM4MzYwNjIsImV4cCI6MjA3OTQxMjA2Mn0.uN9VzRZ-HNNci5nwbVnNUCnmBDaF3F4vsmVjsKQHerc';

const { createClient } = require('@supabase/supabase-js');
const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

async function setupProject() {
    console.log('🚀 Setting up new Supabase project...\n');

    // Step 1: Create user account
    console.log('1. Creating user account...');
    const email = 'wildejack1010@gmail.com';
    const password = 'Harlem1085';

    try {
        const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
            email,
            password,
            options: {
                data: {
                    full_name: 'Jack Wilde'
                }
            }
        });

        if (signUpError) {
            if (signUpError.message.includes('already registered')) {
                console.log('   ✅ User already exists');
            } else {
                console.error('   ❌ Error:', signUpError.message);
                return;
            }
        } else if (signUpData.user) {
            console.log('   ✅ User account created');
        }

        // Sign in to get user ID
        const { data: signInData } = await supabase.auth.signInWithPassword({
            email,
            password
        });

        if (!signInData?.user) {
            console.log('   ⚠️  Could not sign in. You may need to disable email confirmation first.');
            console.log('   Go to: https://supabase.com/dashboard/project/hneyncvndwejbvkxndpz/auth/providers');
            console.log('   Turn OFF "Confirm email" and try again.\n');
        } else {
            const userId = signInData.user.id;
            console.log('   ✅ Signed in successfully');

            // Create or update profile
            const { data: existingProfile } = await supabase
                .from('profiles')
                .select('*')
                .eq('id', userId)
                .single();

            if (existingProfile) {
                await supabase
                    .from('profiles')
                    .update({ role: 'manager', full_name: 'Jack Wilde', clinic: 'Main Clinic' })
                    .eq('id', userId);
                console.log('   ✅ Profile updated to manager role');
            } else {
                const { error: profileError } = await supabase
                    .from('profiles')
                    .insert([{
                        id: userId,
                        email: email,
                        full_name: 'Jack Wilde',
                        role: 'manager',
                        clinic: 'Main Clinic'
                    }]);

                if (profileError) {
                    console.log('   ⚠️  Profile table might not exist yet. Run the SQL schema first.');
                } else {
                    console.log('   ✅ Profile created with manager role');
                }
            }
        }
    } catch (error) {
        console.error('   ❌ Error:', error.message);
    }

    console.log('\n📋 Next Steps:');
    console.log('1. Go to: https://supabase.com/dashboard/project/hneyncvndwejbvkxndpz');
    console.log('2. Go to SQL Editor');
    console.log('3. Copy and paste the SQL from: database/schema.sql');
    console.log('4. Run the SQL to create all tables');
    console.log('5. Go to: Authentication > Providers > Email');
    console.log('6. Turn OFF "Confirm email"');
    console.log('7. Then you can log in with:');
    console.log('   Email: wildejack1010@gmail.com');
    console.log('   Password: Harlem1085\n');
}

setupProject().catch(console.error);

