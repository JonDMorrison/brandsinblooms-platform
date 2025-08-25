#!/bin/bash

# MinIO Setup Script for Brands in Blooms Platform
# This script helps developers set up local MinIO storage for S3-compatible development

set -e

echo "🗂️  Setting up MinIO for local S3-compatible storage..."

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check if Docker is running
if ! docker info > /dev/null 2>&1; then
    echo -e "${RED}❌ Docker is not running. Please start Docker first.${NC}"
    exit 1
fi

echo -e "${GREEN}✅ Docker is running${NC}"

# Check if docker-compose is available
if ! command -v docker-compose > /dev/null 2>&1; then
    echo -e "${RED}❌ docker-compose is not installed or not in PATH${NC}"
    exit 1
fi

echo -e "${GREEN}✅ docker-compose is available${NC}"

# Start MinIO with docker-compose
echo -e "${YELLOW}📦 Starting MinIO services...${NC}"

if docker-compose -f docker-compose.minio.yml up -d; then
    echo -e "${GREEN}✅ MinIO services started successfully${NC}"
else
    echo -e "${RED}❌ Failed to start MinIO services${NC}"
    exit 1
fi

# Wait for MinIO to be healthy
echo -e "${YELLOW}⏳ Waiting for MinIO to be ready...${NC}"
sleep 15

# Check if MinIO is responding
if curl -f -s http://localhost:9000/minio/health/live > /dev/null; then
    echo -e "${GREEN}✅ MinIO is healthy and ready${NC}"
else
    echo -e "${YELLOW}⚠️  MinIO health check failed, but continuing...${NC}"
fi

# Check if .env.local exists
if [ ! -f ".env.local" ]; then
    echo -e "${YELLOW}⚠️  .env.local not found. Creating from .env.example...${NC}"
    if [ -f ".env.example" ]; then
        cp .env.example .env.local
        echo -e "${GREEN}✅ Created .env.local from .env.example${NC}"
    else
        echo -e "${RED}❌ .env.example not found${NC}"
        exit 1
    fi
fi

# Check if MinIO variables are configured in .env.local
echo -e "${YELLOW}🔍 Checking MinIO configuration in .env.local...${NC}"

# Function to check and add environment variable
check_and_add_env_var() {
    local var_name="$1"
    local var_value="$2"
    local file=".env.local"
    
    if grep -q "^${var_name}=" "$file"; then
        echo -e "${GREEN}✅ ${var_name} is already configured${NC}"
    else
        echo -e "${YELLOW}➕ Adding ${var_name} to .env.local${NC}"
        echo "${var_name}=${var_value}" >> "$file"
    fi
}

# Add MinIO configuration if not present
check_and_add_env_var "MINIO_ACCESS_KEY" "minioadmin"
check_and_add_env_var "MINIO_SECRET_KEY" "minioadmin"
check_and_add_env_var "MINIO_ENDPOINT" "http://localhost:9000"
check_and_add_env_var "MINIO_REGION" "us-east-1"
check_and_add_env_var "MINIO_BUCKET_NAME" "local-images"
check_and_add_env_var "NEXT_PUBLIC_CDN_URL" "http://localhost:9000"

echo ""
echo -e "${GREEN}🎉 MinIO setup completed successfully!${NC}"
echo ""
echo -e "${YELLOW}📋 MinIO Information:${NC}"
echo -e "   🌐 MinIO Console: ${GREEN}http://localhost:9001${NC}"
echo -e "   🔗 API Endpoint:  ${GREEN}http://localhost:9000${NC}"
echo -e "   👤 Username:      ${GREEN}minioadmin${NC}"
echo -e "   🔑 Password:      ${GREEN}minioadmin${NC}"
echo -e "   🗂️  Default Bucket: ${GREEN}local-images${NC}"
echo ""
echo -e "${YELLOW}🚀 Next Steps:${NC}"
echo -e "   1. Visit the MinIO console: ${GREEN}http://localhost:9001${NC}"
echo -e "   2. Verify the 'local-images' bucket exists"
echo -e "   3. Start your Next.js application: ${GREEN}pnpm dev${NC}"
echo -e "   4. Test file uploads in your application"
echo ""
echo -e "${YELLOW}🛠️  Useful Commands:${NC}"
echo -e "   Stop MinIO:     ${GREEN}docker-compose -f docker-compose.minio.yml down${NC}"
echo -e "   View logs:      ${GREEN}docker-compose -f docker-compose.minio.yml logs -f${NC}"
echo -e "   Reset storage:  ${GREEN}docker-compose -f docker-compose.minio.yml down -v${NC}"
echo ""