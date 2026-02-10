import { createClient } from '@supabase/supabase-js';

// Replace with your Supabase URL and anon key
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Authentication functions
export const signIn = async (email: string, password: string) => {
  return await supabase.auth.signInWithPassword({ email, password });
};

export const signOut = async () => {
  return await supabase.auth.signOut();
};

// User functions
export const getCurrentUser = async () => {
  return await supabase.auth.getUser();
};

export const getUserRole = async () => {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;
  
  console.log('Getting role for user:', user.email);
  console.log('User ID:', user.id);
  
  // Hardcoded admin role for specific email
  if (user.email === 'knoop@x-filedist.de') {
    console.log('Hardcoded admin role for:', user.email);
    return 'admin';
  }
  
  // Get user role from user_roles table with detailed logging
  const { data, error } = await supabase
    .from('user_roles')
    .select('*')
    .eq('user_id', user.id);
  
  console.log('Raw user_roles query result:', data);
  
  if (error) {
    console.error('Error fetching user role:', error);
    return null;
  }
  
  if (!data || data.length === 0) {
    console.error('No role found for user:', user.email);
    return null;
  }
  
  // Get the first role (there should only be one)
  const role = data[0].role;
  
  console.log('User role from database (exact value):', role);
  console.log('Role type:', typeof role);
  console.log('Role lowercase comparison:', role.toLowerCase() === 'admin');
  
  // Ensure we return the role in lowercase for consistent comparison
  return role ? role.toLowerCase() : null;
};
