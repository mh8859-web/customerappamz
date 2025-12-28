
import { createClient } from '@supabase/supabase-js';

// --- LIVE SUPERBASE CONFIGURATION ---
// The application is now connected to your live Supabase project.

const supabaseUrl = 'https://lkpgsdtriqqotovaxytx.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxrcGdzZHRyaXFxb3RvdmF4eXR4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjY5MjQ0NzYsImV4cCI6MjA4MjUwMDQ3Nn0.FkdU4m-7cQI6mkluKy1HDlM_O5fd0AXxgP8gUFBGMQo';

// --- MODIFIED: USE SESSION STORAGE FOR AUTH ---
// By using window.sessionStorage, the user's session is automatically cleared
// when the browser tab is closed. This ensures that every time the user
// reopens the app, they are treated as logged out and are shown the login page,
// permanently fixing the "stuck dashboard" issue.
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: window.sessionStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true,
  },
});
