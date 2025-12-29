import { createClient } from '@supabase/supabase-js';

// --- LIVE SUPERBASE CONFIGURATION ---
// The application is now connected to the latest verified database project.

const supabaseUrl = 'https://lkpgsdtriqqotovaxytx.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxrcGdzZHRyaXFxb3RvdmF4eXR4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjY5MjQ0NzYsImV4cCI6MjA4MjUwMDQ3Nn0.FkdU4m-7cQI6mkluKy1HDlM_O5fd0AXxgP8gUFBGMQo';

// --- SESSION STORAGE FOR AUTH ---
// window.sessionStorage ensures the session clears when the tab is closed,
// preventing security leaks on shared devices and fixing "stuck" state issues.
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: window.sessionStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true,
  },
});