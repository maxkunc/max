import { createClient } from '@supabase/supabase-js';
import { SB_URL, SB_KEY } from '../supabase-config.js';

export const supabase = createClient(SB_URL, SB_KEY, {
  auth: { persistSession: true, storageKey: 'mk-admin-auth' },
});
