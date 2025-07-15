// Simple script to test if environment variables are loaded properly
require('dotenv').config({ path: '.env.local' });

console.log('GEMINI_API_KEY:', process.env.GEMINI_API_KEY ? 
  `Set correctly (starts with: ${process.env.GEMINI_API_KEY.substring(0, 5)}...)` : 'Not set');
console.log('DEEPGRAM_API_KEY:', process.env.DEEPGRAM_API_KEY ? 
  `Set correctly (starts with: ${process.env.DEEPGRAM_API_KEY.substring(0, 5)}...)` : 'Not set');

console.log('\nNext.js public env vars:');
console.log('NEXT_PUBLIC_SUPABASE_URL:', process.env.NEXT_PUBLIC_SUPABASE_URL || 'Not set');
console.log('NEXT_PUBLIC_SUPABASE_ANON_KEY:', process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ? 
  `Set (starts with: ${(process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '').substring(0, 10)}...)` : 'Not set');
