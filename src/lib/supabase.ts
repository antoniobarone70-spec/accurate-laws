import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://loylzkyreazgtkwwljpe.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxveWx6a3lyZWF6Z3Rrd3dsanBlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjkwMzE2MTUsImV4cCI6MjA4NDYwNzYxNX0.L2NHY-mXPJYUN5a9-ZSltzIe0YhbeS2ykIm46Ai7vaA';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);