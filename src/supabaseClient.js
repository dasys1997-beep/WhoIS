import { createClient } from '@supabase/supabase-js';

// URL і anon key НЕ секретні — Supabase спеціально розрахований на те,
// що ці значення видно у фронтенд-коді браузера. Захист даних відбувається
// через Row Level Security policies на стороні бази (див. supabase-schema.sql),
// а не через приховування цих двох значень.
//
// Беремо їх зі змінних середовища Vercel (VITE_SUPABASE_URL, VITE_SUPABASE_ANON_KEY).
// Vite вимагає префікс VITE_ щоб змінна потрапила у фронтенд-бандл.

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export function isSupabaseConfigured() {
  return Boolean(supabaseUrl && supabaseAnonKey);
}
