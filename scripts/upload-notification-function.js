const fs = require('fs');
const { createClient } = require('@supabase/supabase-js');
const dotenv = require('dotenv');

// Load environment variables
dotenv.config();

// Initialize Supabase client
const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_PUBLIC_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function uploadFunction() {
  try {
    // Read the SQL file
    const sql = fs.readFileSync('./supabase/functions/notification-table.sql', 'utf8');
    
    // Execute the SQL
    const { error } = await supabase.rpc('execute_sql', { sql });
    
    if (error) {
      console.error('Error uploading function:', error);
      return;
    }
    
    console.log('Function uploaded successfully!');
  } catch (err) {
    console.error('Error:', err);
  }
}

uploadFunction(); 