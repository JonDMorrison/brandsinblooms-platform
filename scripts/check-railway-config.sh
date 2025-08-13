#!/bin/bash

# Railway Configuration Checker
# This script helps diagnose port configuration issues on Railway

set -e

echo "🔍 Railway Configuration Diagnostic"
echo "==================================="
echo ""

# Check if Railway CLI is installed
if ! command -v railway &> /dev/null; then
    echo "❌ Railway CLI not found. Please install it first."
    echo "   Run: npm install -g @railway/cli"
    exit 1
fi

# Check if logged in
if ! railway whoami &> /dev/null; then
    echo "❌ Not logged in to Railway. Please run: railway login"
    exit 1
fi

# Get current project info
echo "📊 Current Railway Project:"
railway status || echo "No project linked"
echo ""

# Check environment variables
echo "🔧 Environment Variables (PORT-related):"
railway variables get PORT 2>/dev/null || echo "PORT: Not set (will use Railway default)"
railway variables get RAILWAY_PUBLIC_DOMAIN 2>/dev/null || echo "RAILWAY_PUBLIC_DOMAIN: Not set"
echo ""

# Check service configuration
echo "📦 Service Configuration:"
railway service || echo "No service selected"
echo ""

# Get deployment info
echo "🚀 Latest Deployment:"
railway deployments list --limit 1 || echo "No deployments found"
echo ""

# Check logs for port binding
echo "📜 Recent Logs (checking for port binding):"
railway logs --tail 20 | grep -i "port\|listen\|server" || echo "No port-related logs found"
echo ""

echo "==================================="
echo "✅ Diagnostic complete"
echo ""
echo "Common fixes:"
echo "1. Ensure PORT env var is NOT manually set in Railway"
echo "2. Railway automatically provides PORT - don't override it"
echo "3. Check that your app uses process.env.PORT || 3000"
echo "4. Verify domain settings in Railway dashboard"
echo "5. Check for any proxy/CDN settings on alpha.blooms.cc"