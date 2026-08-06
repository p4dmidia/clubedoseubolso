import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import postgres from "https://deno.land/x/postgresjs@v3.4.4/mod.js"

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
    if (req.method === 'OPTIONS') {
        return new Response('ok', { headers: corsHeaders })
    }

    try {
        const { query } = await req.json();
        if (!query) {
            throw new Error("No query provided");
        }

        const dbUrl = Deno.env.get('SUPABASE_DB_URL');
        if (!dbUrl) {
            throw new Error("SUPABASE_DB_URL not found in env");
        }

        const sql = postgres(dbUrl, { ssl: 'require' });
        const result = await sql.unsafe(query);

        return new Response(JSON.stringify({ 
            success: true, 
            result: result
        }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });

    } catch (error) {
        return new Response(JSON.stringify({ error: error.message }), {
            status: 400,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
    }
});
