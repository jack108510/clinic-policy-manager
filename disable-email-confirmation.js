// Script to disable email confirmation in Supabase
// You'll need your SUPABASE_SERVICE_ROLE_KEY from Supabase Dashboard > Settings > API

const SUPABASE_URL = 'https://wkbntjfiwzoauzxnowfc.supabase.co';
// Get this from: Supabase Dashboard > Settings > API > service_role key (secret)
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || 'YOUR_SERVICE_ROLE_KEY_HERE';

async function disableEmailConfirmation() {
    if (SUPABASE_SERVICE_ROLE_KEY === 'YOUR_SERVICE_ROLE_KEY_HERE') {
        console.log('❌ Please set SUPABASE_SERVICE_ROLE_KEY environment variable');
        console.log('Get it from: Supabase Dashboard > Settings > API > service_role key');
        console.log('\nOr run: SUPABASE_SERVICE_ROLE_KEY=your_key node disable-email-confirmation.js');
        return;
    }

    try {
        // Use the Management API to update auth settings
        const response = await fetch(`${SUPABASE_URL}/rest/v1/auth/config`, {
            method: 'PATCH',
            headers: {
                'Content-Type': 'application/json',
                'apikey': SUPABASE_SERVICE_ROLE_KEY,
                'Authorization': `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`
            },
            body: JSON.stringify({
                EXTERNAL_EMAIL_ENABLED: true,
                MAILER_AUTOCONFIRM: true  // This auto-confirms emails
            })
        });

        if (!response.ok) {
            // Try alternative endpoint
            console.log('Trying alternative method...');
            const altResponse = await fetch(`https://api.supabase.com/v1/projects/wkbntjfiwzoauzxnowfc/auth/config`, {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`
                },
                body: JSON.stringify({
                    MAILER_AUTOCONFIRM: true
                })
            });

            if (!altResponse.ok) {
                throw new Error(`API Error: ${altResponse.status} ${altResponse.statusText}`);
            }
        }

        console.log('✅ Email confirmation disabled!');
        console.log('Users can now sign in without confirming their email.');
    } catch (error) {
        console.error('❌ Error:', error.message);
        console.log('\n📝 Manual Method:');
        console.log('1. Go to: https://supabase.com/dashboard/project/wkbntjfiwzoauzxnowfc/auth/providers');
        console.log('2. Click on "Email" provider');
        console.log('3. Find "Confirm email" setting');
        console.log('4. Turn it OFF');
        console.log('5. Save changes');
    }
}

// Alternative: Use Supabase Management API
async function disableViaManagementAPI() {
    console.log('Using Management API method...');
    // This requires the Supabase Management API token, which is different
    // For now, we'll provide the manual method
    console.log('\n📝 To disable email confirmation manually:');
    console.log('1. Go to: https://supabase.com/dashboard');
    console.log('2. Select your project');
    console.log('3. Go to: Authentication > Providers');
    console.log('4. Click on "Email"');
    console.log('5. Find "Confirm email" toggle');
    console.log('6. Turn it OFF');
    console.log('7. Save');
}

disableEmailConfirmation().catch(console.error);

