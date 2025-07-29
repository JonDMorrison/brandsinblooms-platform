# Quick Start Guide

## One-Command Setup

> **Note**: If this is a private repository, see the [Private Repository Setup Guide](./private-repo-setup.md) for authentication options.

The fastest way to start a new project with this template is using our automated setup script:

### For Public Repositories:
```bash
curl -fsSL https://raw.githubusercontent.com/clusterahq/_supabase-starter/main/start.sh | bash
```

### For Private Repositories:
```bash
# Download the private setup script
curl -fsSL https://your-domain.com/start-private.sh -o start-private.sh
chmod +x start-private.sh

# Run with GitHub token
./start-private.sh --token YOUR_GITHUB_TOKEN

# Or use SSH
./start-private.sh --ssh
```

### What the script does:

1. **System Requirements Check**
   - Verifies Node.js (v18+), Git, and Docker are installed
   - Installs pnpm if not present
   - Checks Docker is running for local development

2. **Interactive Project Setup**
   - Prompts for project name and description
   - Gets author information
   - Asks if you want to initialize a Git repository

3. **Template Installation**
   - Clones the starter template
   - Runs project initialization
   - Removes template-specific files
   - Installs all dependencies

4. **Environment Configuration**
   - Creates .env.local from template
   - Sets up initial configuration

## Manual Setup

If you prefer to set up manually or the script doesn't work for your system:

1. **Clone the repository**
   ```bash
   git clone https://github.com/clusterahq/_supabase-starter.git my-project
   cd my-project
   ```

2. **Remove git history (optional)**
   ```bash
   rm -rf .git
   git init
   ```

3. **Install dependencies**
   ```bash
   pnpm install
   ```

4. **Run initialization**
   ```bash
   pnpm init-project
   ```

5. **Clean up starter files**
   ```bash
   pnpm cleanup-starter
   ```

## System Requirements

Before running the setup:

- **Node.js**: v18.0.0 or higher
- **pnpm**: v8.0.0 or higher (will be installed if missing)
- **Git**: For cloning and version control
- **Docker**: For local Supabase development (automatically managed by Supabase CLI)
- **Supabase CLI**: For local development environment

## Troubleshooting

### Permission Denied
If you get a permission error with curl/wget:
```bash
# Download and run separately
curl -fsSL https://raw.githubusercontent.com/clusterahq/_supabase-starter/main/start.sh -o start.sh
chmod +x start.sh
./start.sh
```

### Behind a Proxy
If you're behind a corporate proxy:
```bash
# Set proxy before running
export http_proxy=http://proxy.company.com:8080
export https_proxy=http://proxy.company.com:8080
curl -fsSL https://raw.githubusercontent.com/clusterahq/_supabase-starter/main/start.sh | bash
```

### Supabase CLI Not Installed
The script will check for Supabase CLI. If not installed, you can install it:
```bash
npm install -g supabase
# or
supabase start
```

### Port Conflicts
If you have port conflicts:

**Supabase CLI ports** (default for local development):
- API Gateway: 54321
- PostgreSQL: 54322
- Studio: 54323
- Inbucket (Email): 54324

**Vite dev server**:
- Default: 5173

You can customize Supabase ports in `supabase/config.toml` or change the Vite port with `--port` flag.

## What's Next?

After successful setup:

1. **Configure Supabase**
   - Create a project at [app.supabase.com](https://app.supabase.com)
   - Copy your project URL and anon key to `.env.local`
   - **Important**: Use `NEXT_PUBLIC_` prefix for client-side environment variables:
     ```
     NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
     NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
     ```

2. **Start Development**
   ```bash
   supabase start      # Start local Supabase
   pnpm dev           # Start Vite dev server
   ```

3. **Build for Production**
   ```bash
   pnpm build          # Build for production
   pnpm preview        # Preview production build
   ```

4. **Run Tests**
   ```bash
   pnpm test           # Run all tests
   pnpm test:coverage  # Run with coverage
   ```

## Advanced Options

### Non-Interactive Setup

For CI/CD or automated environments, you can provide answers via a JSON file:

```bash
# Create answers file
cat > project-config.json << EOF
{
  "projectName": "my-app",
  "projectDescription": "My awesome app",
  "authorName": "John Doe",
  "authorEmail": "john@example.com",
  "initializeGit": true
}
EOF

# Run with answers
node scripts/init-project.js --answers project-config.json
```

### Custom Repository

To use a fork or custom repository:

```bash
# Edit start.sh and change REPO_URL
REPO_URL="https://github.com/yourusername/your-fork.git"
```

## Getting Help

- Check the [README](../README.md) for detailed documentation
- Browse the [docs](.) folder for specific guides
- Report issues at the [GitHub repository](https://github.com/clusterahq/_supabase-starter/issues)