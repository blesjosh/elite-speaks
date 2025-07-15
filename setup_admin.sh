#!/bin/bash

# Function to display usage help
show_help() {
  echo "Usage: ./setup_admin.sh <admin_email>"
  echo ""
  echo "This script sets up an admin user in Elite Speaks."
  echo ""
  echo "Arguments:"
  echo "  <admin_email>   The email address of the user to make an admin"
}

# Check if an email was provided
if [ -z "$1" ]; then
  echo "Error: Admin email is required"
  show_help
  exit 1
fi

ADMIN_EMAIL=$1

# Export to environment variable for the SQL command
export ADMIN_EMAIL

echo "Checking and setting up admin user: $ADMIN_EMAIL"

# Check if we have the Supabase URL and key in .env.local
if [ ! -f .env.local ]; then
  echo "Error: .env.local file not found"
  echo "Please create a .env.local file with your Supabase credentials"
  exit 1
fi

# Source the environment variables
source .env.local

# Check if NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are set
if [ -z "$NEXT_PUBLIC_SUPABASE_URL" ] || [ -z "$SUPABASE_SERVICE_ROLE_KEY" ]; then
  echo "Error: NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY not found in .env.local"
  exit 1
fi

# Extract just the URL without the protocol
SUPABASE_HOST=$(echo $NEXT_PUBLIC_SUPABASE_URL | sed -e 's|^[^/]*//||' -e 's|/.*$||')

# Run the SQL command using the service role key
echo "Running SQL to set up admin user..."
echo "SELECT * FROM check_and_set_admin('$ADMIN_EMAIL');" | \
PGPASSWORD=$SUPABASE_SERVICE_ROLE_KEY psql -h $SUPABASE_HOST -U postgres -d postgres

echo ""
echo "Setup complete. Please check the output above for the status."
echo "If successful, the user should now have admin privileges."
