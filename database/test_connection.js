/**
 * This script tests the connection to Supabase.
 * 
 * Usage:
 * 1. Run the script with Node.js:
 *    node database/test_connection.js
 * 2. Check the output to see if the connection is successful
 */

// Load environment variables from .env file
require('dotenv').config();

// Import the Supabase client
const { createClient } = require('@supabase/supabase-js');

// Get Supabase URL and anon key from environment variables or use default values
const supabaseUrl = process.env.REACT_APP_SUPABASE_URL || 'https://jyzoyfozkxukomylwrjd.supabase.co';
const supabaseAnonKey = process.env.REACT_APP_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imp5em95Zm96a3h1a29teWx3cmpkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDA0NTMyNTUsImV4cCI6MjA1NjAyOTI1NX0.netEOlq_UaPcvwgB9HoxqNLMPri8iPetkfQ8FcMp-kY';

// Create Supabase client
const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Test the connection
async function testConnection() {
  console.log('Testing connection to Supabase...');
  console.log('Supabase URL:', supabaseUrl);
  console.log('Supabase Anon Key:', supabaseAnonKey ? '***' + supabaseAnonKey.slice(-5) : 'Not set');

  try {
    // Try to get the current user (this should work even if not logged in)
    const { data, error } = await supabase.auth.getSession();

    if (error) {
      console.error('Error connecting to Supabase:', error);
      return;
    }

    console.log('Connection successful!');
    console.log('Session data:', data);

    // Try to query the customers table
    console.log('\nTesting query to customers table...');
    const { data: customers, error: customersError } = await supabase
      .from('customers')
      .select('*')
      .limit(1);

    if (customersError) {
      console.error('Error querying customers table:', customersError);
      return;
    }

    console.log('Query successful!');
    console.log('Number of customers:', customers.length);

    // Try to query the user_roles table
    console.log('\nTesting query to user_roles table...');
    const { data: userRoles, error: userRolesError } = await supabase
      .from('user_roles')
      .select('*')
      .limit(1);

    if (userRolesError) {
      console.error('Error querying user_roles table:', userRolesError);
      return;
    }

    console.log('Query successful!');
    console.log('Number of user roles:', userRoles.length);

  } catch (error) {
    console.error('Unexpected error:', error);
  }
}

// Run the test
testConnection();
