import { createClient } from '@supabase/supabase-js';

// Config Supabase (Project Settings → API). Publishable/anon key AN TOÀN để công khai
// — bảo mật do Auth + Row Level Security quyết định.
const SUPABASE_URL = 'https://jatkobqsxvpwodmfznuq.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_1LFwKBSgJEAbp2RWPEeQbA_X_G2y_9O';

// Mặc định lưu session ở localStorage + tự refresh -> giữ đăng nhập sau khi mở lại app.
export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
