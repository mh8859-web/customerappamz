import { createClient } from '@supabase/supabase-js';

// --- LIVE SUPERBASE CONFIGURATION ---
const supabaseUrl = 'https://lkpgsdtriqqotovaxytx.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxrcGdzZHRyaXFxb3RvdmF4eXR4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjY5MjQ0NzYsImV4cCI6MjA4MjUwMDQ3Nn0.FkdU4m-7cQI6mkluKy1HDlM_O5fd0AXxgP8gUFBGMQo';

// --- AUTH PERSISTENCE FIXED ---
// Using browser default persistence (localStorage) so users stay logged in 
// even after closing the tab or refreshing. This prevents the "stuck" 
// transition between login and dashboard.
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
  },
});