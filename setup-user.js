// Quick script to create/update user account
const SUPABASE_URL = 'https://wkbntjfiwzoauzxnowfc.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndrYm50amZpd3pvYXV6eG5vd2ZjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjE5MTc4NzIsImV4cCI6MjA3NzQ5Mzg3Mn0.CgilBvYCUkbScycnZ8OWy_eAjUF0i698lcDbWHcM5ic';

// You'll need to install: npm install @supabase/supabase-js
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

async function setupUser() {
    const email = 'wildejack1010@gmail.com';
    const password = 'Harlem1085';

    try {
        // Try to sign in first (in case user exists)
        console.log('Attempting to sign in...');
        const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
            email,
            password
        });

        if (!signInError && signInData.user) {
            console.log('✅ User already exists and can sign in');
            const userId = signInData.user.id;

            // Check if profile exists
            const { data: profile } = await supabase
                .from('profiles')
                .select('*')
                .eq('id', userId)
                .single();

            if (!profile) {
                // Create profile
                console.log('Creating profile...');
                const { error: profileError } = await supabase
                    .from('profiles')
                    .insert([{
                        id: userId,
                        email: email,
                        full_name: 'Jack Wilde',
                        role: 'manager', // Set as manager for full access
                        clinic: 'Main Clinic'
                    }]);

                if (profileError) {
                    console.error('Error creating profile:', profileError);
                } else {
                    console.log('✅ Profile created');
                }
            } else {
                console.log('✅ Profile already exists');
                // Update role to manager if not already
                if (profile.role !== 'manager') {
                    await supabase
                        .from('profiles')
                        .update({ role: 'manager' })
                        .eq('id', userId);
                    console.log('✅ Updated role to manager');
                }
            }
        } else {
            // User doesn't exist, create new account
            console.log('User does not exist, creating new account...');
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
                console.error('❌ Error creating user:', signUpError.message);
                return;
            }

            if (signUpData.user) {
                console.log('✅ User account created');
                const userId = signUpData.user.id;

                // Wait a moment for the user to be fully created
                await new Promise(resolve => setTimeout(resolve, 1000));

                // Create profile
                const { error: profileError } = await supabase
                    .from('profiles')
                    .insert([{
                        id: userId,
                        email: email,
                        full_name: 'Jack Wilde',
                        role: 'manager', // Set as manager
                        clinic: 'Main Clinic'
                    }]);

                if (profileError) {
                    console.error('Error creating profile:', profileError);
                    console.log('You may need to create the profile manually in Supabase dashboard');
                } else {
                    console.log('✅ Profile created with manager role');
                }
            }
        }

        console.log('\n✅ Setup complete!');
        console.log('You can now log in with:');
        console.log(`Email: ${email}`);
        console.log(`Password: ${password}`);
    } catch (error) {
        console.error('❌ Error:', error.message);
    }
}

setupUser();

