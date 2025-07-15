# Supabase Google OAuth Setup

## 1. Go to your Supabase Dashboard
Navigate to: https://supabase.com/dashboard/project/njbreobyezzylpafgbyg

## 2. Configure Google OAuth Provider
1. Go to Authentication → Providers
2. Find "Google" and click the toggle to enable it
3. You'll need to configure:
   - Client ID (from Google Cloud Console)
   - Client Secret (from Google Cloud Console)

## 3. Google Cloud Console Setup
1. Go to: https://console.cloud.google.com/
2. Create a new project or select existing one
3. Go to APIs & Services → Credentials
4. Click "Create Credentials" → "OAuth 2.0 Client IDs"
5. Configure OAuth consent screen first if needed
6. For Application type, select "Web application"
7. Add these authorized redirect URIs:
   - https://njbreobyezzylpafgbyg.supabase.co/auth/v1/callback
   - http://localhost:3000/auth/callback (for development)

## 4. Copy the credentials
Copy the Client ID and Client Secret from Google Cloud Console and paste them into your Supabase Google provider settings.

## 5. URL Configuration
Make sure your site URL in Supabase is set to:
- Production: your-domain.com
- Development: http://localhost:3000

## 6. Test the authentication
Your Google authentication should now work with the buttons in your login and signup forms.

## Current Setup Status:
✅ AuthProvider configured in layout
✅ Auth context with Google OAuth method
✅ Login component with Google button
✅ Signup component with Google button  
✅ Auth callback route created
✅ Middleware for protected routes
✅ Dashboard page with auth protection
✅ Hero section with conditional auth buttons

🔄 NEXT STEP: Configure Google OAuth in Supabase dashboard
