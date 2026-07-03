import { createClient } from '@supabase/supabase-js';

// We get the config from window.PINGPING_CONFIG which is defined in config.js
const { supabaseUrl, supabaseKey } = window.PINGPING_CONFIG;

export const supabase = createClient(supabaseUrl, supabaseKey);
