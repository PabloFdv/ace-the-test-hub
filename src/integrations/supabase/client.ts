import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = "https://juxdfkzaxhunvekjfybp.supabase.co";
const SUPABASE_PUBLISHABLE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imp1eGRma3pheGh1bnZla2pmeWJwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzI1MjQ2OTUsImV4cCI6MjA4ODEwMDY5NX0._zDAV0eFxm1blLo2JBVa2SlE72mzbG_P8X4baHjLdqo";

export const supabase = createClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, {
  auth: {
    storage: localStorage,
    persistSession: true,
    autoRefreshToken: true,
  }
});
