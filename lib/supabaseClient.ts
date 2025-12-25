import { createClient } from '@supabase/supabase-js';

// Dashboard C (Design) - Supabase credentials
const SUPABASE_URL = "https://yvnshlomzgcynphkqoaj.supabase.co";
const SUPABASE_ANON_KEY = "sb_publishable_Cl9ukdETem9EWh2p0wkmpg_7Tdz-_4F";

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
