import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();
const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function run() {
    const email = `test.head_${Date.now()}@example.com`;
    console.log('Registering', email);
    const { data, error } = await supabase.auth.signUp({
        email,
        password: 'Password123!',
        options: {
            data: {
                nome: 'Test',
                sobrenome: 'Head',
                login: `testhead${Date.now()}`,
                registration_type: 'business',
                sponsor_code: null,
                organization_id: '5111af72-27a5-41fd-8ed9-8c51b78b4fdd'
            }
        }
    });
    console.log('Result:', JSON.stringify({ data, error }, null, 2));
    if (data.user) {
        console.log('Now logging in via password to see if it exists...');
        const loginRes = await supabase.auth.signInWithPassword({
            email,
            password: 'Password123!'
        });
        console.log('Login result:', loginRes.error ? loginRes.error.message : 'Success');
    }
}
run().catch(console.error);
