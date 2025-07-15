// load-env.js
// A script to load environment variables from .env.local before starting the application

const { resolve } = require('path');
const { config } = require('dotenv');

// Load environment variables from .env.local
const envResult = config({ path: resolve(process.cwd(), '.env.local') });

if (envResult.error) {
  console.error('❌ Error loading environment variables from .env.local:', envResult.error);
} else {
  console.log('✅ Environment variables loaded from .env.local');
  
  // Check for critical variables
  const criticalVars = ['GEMINI_API_KEY', 'DEEPGRAM_API_KEY'];
  
  for (const varName of criticalVars) {
    if (!process.env[varName]) {
      console.warn(`⚠️  Missing ${varName} - some features may not work properly`);
    } else {
      const masked = process.env[varName].substring(0, 5) + '...' + 
                    process.env[varName].substring(process.env[varName].length - 3);
      console.log(`✅ ${varName} is set (${masked})`);
    }
  }
}
