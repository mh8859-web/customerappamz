import { createClient } from '@supabase/supabase-js';

// --- LIVE SUPERBASE CONFIGURATION ---
// The application is now connected to your live Supabase project.

const supabaseUrl = 'https://tqttuawbjhpsmvcibich.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRxdHR1YXdiamhwc212Y2liaWNoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjAzNjMzMDAsImV4cCI6MjA3NTkzOTMwMH0.BWVK7CejJ4pvPWgyWgVqBgAJH-FQpWt0iFsTPH-PwaQ';

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
