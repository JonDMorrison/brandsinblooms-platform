#!/bin/bash

# Railway deployment script with health checks and rollback support
# Usage: ./scripts/railway-deploy.sh [production|staging]

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
ENVIRONMENT=${1:-staging}
DOCKERFILE="Dockerfile"
HEALTH_CHECK_RETRIES=10
HEALTH_CHECK_DELAY=10

echo -e "${BLUE}🚂 Railway Deployment Script${NC}"
echo -e "${BLUE}Environment: ${ENVIRONMENT}${NC}\n"

# Function to check prerequisites
check_prerequisites() {
    echo -e "${YELLOW}Checking prerequisites...${NC}"
    
    # Check Railway CLI
    if ! command -v railway &> /dev/null; then
        echo -e "${RED}❌ Railway CLI not found. Install it first.${NC}"
        exit 1
    fi
    
    # Check if logged in
    if ! railway whoami &> /dev/null; then
        echo -e "${RED}❌ Not logged in to Railway. Run 'railway login'${NC}"
        exit 1
    fi
    
    # Check if project is linked
    if ! railway status &> /dev/null; then
        echo -e "${RED}❌ No Railway project linked. Run 'railway link'${NC}"
        exit 1
    fi
    
    echo -e "${GREEN}✅ Prerequisites check passed${NC}\n"
}

# Function to validate environment
validate_environment() {
    echo -e "${YELLOW}Validating environment variables...${NC}"
    
    # Check required environment variables
    REQUIRED_VARS=(
        "NEXT_PUBLIC_SUPABASE_URL"
        "NEXT_PUBLIC_SUPABASE_ANON_KEY"
        "NEXT_PUBLIC_APP_DOMAIN"
    )
    
    MISSING_VARS=()
    for var in "${REQUIRED_VARS[@]}"; do
        if ! railway variables get "$var" &> /dev/null; then
            MISSING_VARS+=("$var")
        fi
    done
    
    if [ ${#MISSING_VARS[@]} -gt 0 ]; then
        echo -e "${RED}❌ Missing required variables:${NC}"
        printf '%s\n' "${MISSING_VARS[@]}"
        echo -e "${YELLOW}Set them using: railway variables set KEY=value${NC}"
        exit 1
    fi
    
    echo -e "${GREEN}✅ Environment variables validated${NC}\n"
}

# Function to build Docker image
build_image() {
    echo -e "${YELLOW}Building Docker image...${NC}"
    
    # Get build args from Railway
    SUPABASE_URL=$(railway variables get NEXT_PUBLIC_SUPABASE_URL)
    SUPABASE_ANON_KEY=$(railway variables get NEXT_PUBLIC_SUPABASE_ANON_KEY)
    APP_DOMAIN=$(railway variables get NEXT_PUBLIC_APP_DOMAIN)
    
    # Build with cache
    docker build \
        --cache-from registry.railway.app/${RAILWAY_PROJECT_ID}/${ENVIRONMENT}:latest \
        --build-arg NEXT_PUBLIC_SUPABASE_URL="$SUPABASE_URL" \
        --build-arg NEXT_PUBLIC_SUPABASE_ANON_KEY="$SUPABASE_ANON_KEY" \
        --build-arg NEXT_PUBLIC_APP_DOMAIN="$APP_DOMAIN" \
        -f "$DOCKERFILE" \
        -t "railway-deploy:${ENVIRONMENT}" \
        .
    
    if [ $? -eq 0 ]; then
        echo -e "${GREEN}✅ Docker image built successfully${NC}\n"
    else
        echo -e "${RED}❌ Docker build failed${NC}"
        exit 1
    fi
}

# Function to run pre-deployment checks
pre_deployment_checks() {
    echo -e "${YELLOW}Running pre-deployment checks...${NC}"
    
    # Test the image locally
    echo "Testing Docker image..."
    docker run -d \
        --name railway-test \
        -p 3000:3000 \
        -e NODE_ENV=production \
        -e PORT=3000 \
        "railway-deploy:${ENVIRONMENT}"
    
    sleep 5
    
    # Check health endpoint
    if curl -f http://localhost:3000/api/health &> /dev/null; then
        echo -e "${GREEN}✅ Health check passed${NC}"
    else
        echo -e "${RED}❌ Health check failed${NC}"
        docker stop railway-test && docker rm railway-test
        exit 1
    fi
    
    docker stop railway-test && docker rm railway-test
    echo -e "${GREEN}✅ Pre-deployment checks passed${NC}\n"
}

# Function to deploy to Railway
deploy_to_railway() {
    echo -e "${YELLOW}Deploying to Railway...${NC}"
    
    # Set environment
    railway environment "$ENVIRONMENT"
    
    # Deploy
    railway up --detach
    
    if [ $? -eq 0 ]; then
        echo -e "${GREEN}✅ Deployment initiated${NC}\n"
    else
        echo -e "${RED}❌ Deployment failed${NC}"
        exit 1
    fi
}

# Function to monitor deployment
monitor_deployment() {
    echo -e "${YELLOW}Monitoring deployment...${NC}"
    
    # Get deployment URL
    DEPLOYMENT_URL=$(railway status --json | jq -r '.url')
    
    if [ -z "$DEPLOYMENT_URL" ]; then
        echo -e "${RED}❌ Could not get deployment URL${NC}"
        exit 1
    fi
    
    echo "Deployment URL: $DEPLOYMENT_URL"
    echo "Waiting for service to be ready..."
    
    # Health check loop
    for i in $(seq 1 $HEALTH_CHECK_RETRIES); do
        echo -n "Attempt $i/$HEALTH_CHECK_RETRIES: "
        
        if curl -f "${DEPLOYMENT_URL}/api/health" &> /dev/null; then
            echo -e "${GREEN}Success${NC}"
            echo -e "${GREEN}✅ Deployment successful!${NC}\n"
            return 0
        else
            echo -e "${YELLOW}Service not ready yet...${NC}"
            sleep $HEALTH_CHECK_DELAY
        fi
    done
    
    echo -e "${RED}❌ Deployment health check failed${NC}"
    return 1
}

# Function to rollback deployment
rollback_deployment() {
    echo -e "${RED}Rolling back deployment...${NC}"
    
    # Get previous deployment
    PREVIOUS_DEPLOYMENT=$(railway deployments list --json | jq -r '.[1].id')
    
    if [ -n "$PREVIOUS_DEPLOYMENT" ]; then
        railway deployments rollback "$PREVIOUS_DEPLOYMENT"
        echo -e "${YELLOW}Rolled back to deployment: $PREVIOUS_DEPLOYMENT${NC}"
    else
        echo -e "${RED}No previous deployment found for rollback${NC}"
    fi
}

# Function to run post-deployment tasks
post_deployment() {
    echo -e "${YELLOW}Running post-deployment tasks...${NC}"
    
    # Run database migrations if needed
    if [ "$ENVIRONMENT" = "production" ]; then
        echo "Checking database migrations..."
        # railway run --service=web -- npm run supabase:migrate
    fi
    
    # Warm up cache
    echo "Warming up cache..."
    DEPLOYMENT_URL=$(railway status --json | jq -r '.url')
    curl -s "${DEPLOYMENT_URL}/api/health" > /dev/null
    
    # Send deployment notification (optional)
    # You can add Slack/Discord webhook here
    
    echo -e "${GREEN}✅ Post-deployment tasks completed${NC}\n"
}

# Function to show deployment summary
show_summary() {
    echo -e "${BLUE}📊 Deployment Summary${NC}"
    echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    
    DEPLOYMENT_INFO=$(railway status --json)
    
    echo -e "Environment: ${GREEN}${ENVIRONMENT}${NC}"
    echo -e "Project: $(echo $DEPLOYMENT_INFO | jq -r '.projectName')"
    echo -e "URL: $(echo $DEPLOYMENT_INFO | jq -r '.url')"
    echo -e "Status: ${GREEN}Active${NC}"
    echo -e "Region: $(railway variables get RAILWAY_REGION || echo 'us-west1')"
    
    echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}\n"
    
    echo -e "${GREEN}🎉 Deployment complete!${NC}"
    echo -e "${YELLOW}Commands:${NC}"
    echo -e "  View logs: railway logs"
    echo -e "  Check status: railway status"
    echo -e "  Rollback: railway deployments rollback"
}

# Main deployment flow
main() {
    check_prerequisites
    validate_environment
    
    # Optional: Build and test locally
    if [ "$2" = "--build" ]; then
        build_image
        pre_deployment_checks
    fi
    
    deploy_to_railway
    
    if monitor_deployment; then
        post_deployment
        show_summary
    else
        rollback_deployment
        exit 1
    fi
}

# Run main function
main "$@"