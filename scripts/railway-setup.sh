#!/bin/bash

# Railway deployment setup script
# This script sets up your Railway project with the necessary configuration

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}🚂 Railway Setup for Brands in Blooms Platform${NC}\n"

# Check if Railway CLI is installed
if ! command -v railway &> /dev/null; then
    echo -e "${RED}❌ Railway CLI not found.${NC}"
    echo -e "${YELLOW}Installing Railway CLI...${NC}"
    curl -fsSL https://railway.app/install.sh | sh
    echo -e "${GREEN}✅ Railway CLI installed${NC}"
fi

# Check if logged in
if ! railway whoami &> /dev/null; then
    echo -e "${YELLOW}🔐 Please login to Railway:${NC}"
    railway login
    echo -e "${GREEN}✅ Logged in to Railway${NC}"
fi

# Create new project or link existing
echo -e "${YELLOW}📋 Choose deployment option:${NC}"
echo "1) Create new Railway project"
echo "2) Link to existing project"
read -p "Enter your choice (1 or 2): " choice

case $choice in
    1)
        echo -e "${YELLOW}Creating new Railway project...${NC}"
        railway project create brands-in-blooms-platform
        ;;
    2)
        echo -e "${YELLOW}Linking to existing project...${NC}"
        railway link
        ;;
    *)
        echo -e "${RED}Invalid choice. Exiting.${NC}"
        exit 1
        ;;
esac

# Set up environments
echo -e "${YELLOW}🌍 Setting up environments...${NC}"
railway environment create staging || echo "Staging environment already exists"
railway environment create production || echo "Production environment already exists"

# Add Redis addon
echo -e "${YELLOW}🔴 Adding Redis addon for caching...${NC}"
railway add redis || echo "Redis addon already exists"

# Set basic environment variables
echo -e "${YELLOW}⚙️ Setting up basic environment variables...${NC}"

railway environment staging
railway variables set NODE_ENV=staging
railway variables set NEXT_TELEMETRY_DISABLED=1
railway variables set RAILWAY_ENVIRONMENT=staging

railway environment production
railway variables set NODE_ENV=production
railway variables set NEXT_TELEMETRY_DISABLED=1
railway variables set RAILWAY_ENVIRONMENT=production

echo -e "${GREEN}✅ Basic Railway setup complete!${NC}\n"

echo -e "${BLUE}📝 Next Steps:${NC}"
echo -e "${YELLOW}1. Set up your Supabase project and get the environment variables${NC}"
echo -e "${YELLOW}2. Run: ${GREEN}pnpm railway:env setup${NC} ${YELLOW}to configure environment variables${NC}"
echo -e "${YELLOW}3. Configure your domain in Railway dashboard${NC}"
echo -e "${YELLOW}4. Deploy with: ${GREEN}pnpm railway:deploy:staging${NC}"
echo -e "${YELLOW}5. Test deployment and then deploy to production${NC}\n"

echo -e "${BLUE}🔧 Configuration Files:${NC}"
echo -e "- ${GREEN}railway.json${NC}: Railway deployment configuration"
echo -e "- ${GREEN}Dockerfile.standalone${NC}: Production Docker image"
echo -e "- ${GREEN}.env.production.example${NC}: Example environment variables"
echo -e "- ${GREEN}scripts/railway-deploy.sh${NC}: Deployment script with health checks"

echo -e "\n${GREEN}🎉 Railway setup complete! You can now configure your environment variables and deploy.${NC}"