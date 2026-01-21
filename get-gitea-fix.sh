#!/bin/bash

echo "🔧 Gitea.raptio.us Fix Generator"
echo "=================================="
echo

# Get the host ID for gitea.raptio.us
echo "📋 Finding your Gitea host configuration..."
HOST_ID=$(npm-cli hosts list --json 2>/dev/null | jq -r '.[] | select(.domain_names[] | contains("gitea.raptio.us")) | .id')

if [ -z "$HOST_ID" ]; then
    echo "❌ No proxy host found for gitea.raptio.us"
    echo "💡 You may need to create one first:"
    echo "   npm-cli hosts create -d gitea.raptio.us -h localhost -p 3000"
    exit 1
fi

echo "✅ Found Gitea proxy host (ID: $HOST_ID)"
echo

# Get current configuration
echo "📊 Current configuration:"
npm-cli hosts get $HOST_ID --json 2>/dev/null | jq -r '
  "Domain: " + (.domain_names | join(", ")),
  "Forward: " + .forward_scheme + "://" + .forward_host + ":" + (.forward_port|tostring),
  "SSL Forced: " + (.ssl_forced|tostring),
  "Certificate: " + (if .certificate_id then "Yes (ID: " + (.certificate_id|tostring) + ")" else "No" end),
  "Enabled: " + (.enabled|tostring)
'
echo

# Generate the fix commands
echo "🛠️  Here are the commands to fix your Gitea 500 error:"
echo "======================================================"
echo

echo "# Option 1: Basic HTTP setup (if SSL is causing issues)"
echo "npm-cli hosts update $HOST_ID \\"
echo "  --forward-scheme http \\"
echo "  --forward-host localhost \\"
echo "  --forward-port 3000 \\"
echo "  --ssl-forced false \\"
echo "  --advanced \"proxy_set_header Host \\\$host; proxy_set_header X-Real-IP \\\$remote_addr; proxy_set_header X-Forwarded-For \\\$proxy_add_x_forwarded_for; proxy_set_header X-Forwarded-Proto \\\$scheme;\""
echo

echo "# Option 2: If Gitea is in Docker network"
echo "npm-cli hosts update $HOST_ID \\"
echo "  --forward-scheme http \\"
echo "  --forward-host gitea \\"
echo "  --forward-port 3000 \\"
echo "  --ssl-forced false \\"
echo "  --advanced \"proxy_set_header Host \\\$host; proxy_set_header X-Real-IP \\\$remote_addr; proxy_set_header X-Forwarded-For \\\$proxy_add_x_forwarded_for; proxy_set_header X-Forwarded-Proto \\\$scheme;\""
echo

echo "# Option 3: Apply the fix and restart"
echo "npm-cli hosts disable $HOST_ID"
echo "npm-cli hosts enable $HOST_ID"
echo

echo "# Test the fix"
echo "curl -I https://gitea.raptio.us"
echo

echo "📝 Notes:"
echo "- Replace 'localhost' with your Gitea IP/hostname if it's on a different machine"
echo "- Replace '3000' with your actual Gitea port if different"
echo "- If using SSL, make sure you have a valid certificate configured"
echo

# Check if Gitea is accessible
echo "🔍 Quick connectivity test:"
if curl -s -I http://localhost:3000 >/dev/null 2>&1; then
    echo "✅ Gitea is accessible at http://localhost:3000"
else
    echo "❌ Gitea is NOT accessible at http://localhost:3000"
    echo "💡 Check if Gitea is running on a different host/port"
fi