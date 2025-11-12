"use client";

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseApiKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
let supabase = global.supabase || null;

export function getSupabase() {
    if (supabase) return supabase;

    supabase = createClient(
        supabaseUrl,
        supabaseApiKey,
        {
            auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: true }
        }
    );
    global.supabase = supabase;

    const originalFetch = supabase.rest.fetch.bind(supabase.rest);

    supabase.rest.fetch = async (...args) => {
        try {
            return await originalFetch(...args);
        } catch (err) {
            console.warn("[Supabase Fetch Error, retrying with refresh]", err.message);
            try {
                await supabase.auth.refreshSession();
                return await originalFetch(...args);
            } catch (refreshErr) {
                console.error("[Supabase Retry Failed]", refreshErr);
                throw refreshErr;
            }
        }
    };

    return supabase;
}
