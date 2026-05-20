const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://clnuievcdnbwqbyqhwys.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNsbnVpZXZjZG5id3FieXFod3lzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzIxMTQ5MzAsImV4cCI6MjA4NzY5MDkzMH0.ACpA-x-7OMjom6lEe0FeVc8oXWkNrOukup7YuUnFqAE';
const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function run() {
    const email = `test.fiel_${Date.now()}@example.com`;
    const password = 'Password123!';
    const organization_id = '5111af72-27a5-41fd-8ed9-8c51b78b4fdd';
    
    console.log('--- STEP 1: SIGN UP ---');
    console.log('Registering:', email);
    const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
            data: {
                nome: 'Test',
                sobrenome: 'Issue',
                login: `tfiel${Date.now()}`,
                registration_type: 'business',
                organization_id
            }
        }
    });

    if (error) {
        console.error('Sign up error:', error.message);
        return;
    }
    console.log('Sign up success. User ID:', data.user.id);

    console.log('\n--- STEP 2: CHECK PROFILE ---');
    // Wait a bit for the trigger
    await new Promise(r => setTimeout(r, 2000));
    
    const { data: profile, error: profileError } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('id', data.user.id)
        .single();
    
    if (profileError) {
        console.error('Profile not found! Error:', profileError.message);
    } else {
        console.log('Profile found:', JSON.stringify(profile, null, 2));
    }

    console.log('\n--- STEP 3: LOGIN ---');
    const { data: loginData, error: loginError } = await supabase.auth.signInWithPassword({
        email,
        password
    });

    if (loginError) {
        console.error('Login error:', loginError.message);
    } else {
        console.log('Login success');
        const userId = loginData.user.id;
        
        // Emulate LoginPage.tsx check
        const { data: p, error: pe } = await supabase
            .from('user_profiles')
            .select('organization_id')
            .eq('id', userId)
            .single();
        
        if (pe || !p || p.organization_id !== organization_id) {
            console.log('LOGIN WOULD FAIL in app with message: Acesso negado: Esta conta pertence a outro sistema.');
        } else {
            console.log('App login check passed');
        }
    }
}

run().catch(console.error);
