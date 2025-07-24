# Private Repository Setup Guide

This guide explains how to use the Supabase Starter template when it's hosted in a private GitHub repository.

## Overview

When the repository is private, the simple `curl | bash` approach doesn't work because GitHub requires authentication. This guide provides several methods to work with private repositories.

## Method 1: GitHub Personal Access Token (Recommended)

### Step 1: Create a Personal Access Token

1. Go to [GitHub Settings > Tokens](https://github.com/settings/tokens)
2. Click "Generate new token" → "Generate new token (classic)"
3. Give it a descriptive name (e.g., "Supabase Starter Setup")
4. Select the `repo` scope (Full control of private repositories)
5. Set an expiration (90 days recommended)
6. Click "Generate token"
7. **Copy the token immediately** (you won't see it again!)

### Step 2: Use the Private Setup Script

```bash
# Download the setup script
curl -fsSL https://your-domain.com/start-private.sh -o start-private.sh

# Make it executable
chmod +x start-private.sh

# Run with your token
./start-private.sh --token ghp_YourTokenHere
```

### Security Notes

- The token is only used during cloning
- The script removes the token from git config after cloning
- Never commit your token to version control
- Tokens should have minimal required permissions

## Method 2: SSH Authentication

If you have SSH keys set up with GitHub:

```bash
# Download the setup script
curl -fsSL https://your-domain.com/start-private.sh -o start-private.sh

# Make it executable
chmod +x start-private.sh

# Run with SSH option
./start-private.sh --ssh
```

### SSH Setup (if needed)

1. [Generate an SSH key](https://docs.github.com/en/authentication/connecting-to-github-with-ssh/generating-a-new-ssh-key-and-adding-it-to-the-ssh-agent)
2. [Add it to your GitHub account](https://docs.github.com/en/authentication/connecting-to-github-with-ssh/adding-a-new-ssh-key-to-your-github-account)

## Method 3: Manual Clone

For maximum control, clone manually:

```bash
# Using HTTPS with token
git clone https://YOUR_TOKEN@github.com/clusterahq/_supabase-starter.git my-project

# Or using SSH
git clone git@github.com:clusterahq/_supabase-starter.git my-project

# Then run setup
cd my-project
rm -rf .git
git init
pnpm install
pnpm init-project
pnpm cleanup-starter
```

## Method 4: GitHub Template (If Available)

If the repository is set up as a GitHub template:

1. Go to the repository on GitHub
2. Click "Use this template" → "Create a new repository"
3. Choose your account and name
4. Clone your new repository
5. Run the setup scripts

## Method 5: Deploy Script Hosting

For teams, host the setup script on your own infrastructure:

### Option A: GitHub Pages (Public Script, Private Repo)

1. Create a separate public repository for the setup script
2. Enable GitHub Pages
3. Users can then:
   ```bash
   curl -fsSL https://yourorg.github.io/setup-scripts/start-private.sh | bash -s -- --token TOKEN
   ```

### Option B: Internal Server

Host the script on your internal server:

```bash
# On your server
cp start-private.sh /var/www/scripts/

# Users can then
curl -fsSL https://internal.company.com/scripts/start-private.sh | bash -s -- --token TOKEN
```

### Option C: CDN/S3

Upload to a CDN or S3 bucket:

```bash
# Upload to S3
aws s3 cp start-private.sh s3://your-bucket/scripts/

# Users can then
curl -fsSL https://your-cdn.com/scripts/start-private.sh | bash -s -- --token TOKEN
```

## Automated CI/CD Setup

For automated deployments, use repository secrets:

### GitHub Actions

```yaml
# .github/workflows/deploy.yml
name: Deploy from Private Template

on:
  workflow_dispatch:
    inputs:
      project_name:
        description: 'New project name'
        required: true

jobs:
  setup:
    runs-on: ubuntu-latest
    steps:
      - name: Setup new project
        env:
          GITHUB_TOKEN: ${{ secrets.PERSONAL_ACCESS_TOKEN }}
        run: |
          git clone https://${GITHUB_TOKEN}@github.com/clusterahq/_supabase-starter.git ${{ github.event.inputs.project_name }}
          cd ${{ github.event.inputs.project_name }}
          rm -rf .git
          # Continue with setup...
```

## Security Best Practices

### 1. Token Management

- Use fine-grained personal access tokens when possible
- Set appropriate expiration dates
- Regularly rotate tokens
- Use read-only permissions when possible

### 2. Script Verification

Always verify scripts before running:

```bash
# Download first
curl -fsSL https://url/to/script.sh -o script.sh

# Inspect the content
cat script.sh

# Then run if safe
chmod +x script.sh
./script.sh
```

### 3. Environment Variables

For CI/CD, use environment variables:

```bash
export GITHUB_TOKEN="your-token"
./start-private.sh --token "$GITHUB_TOKEN"
```

## Troubleshooting

### Authentication Failed

- Verify your token has the correct permissions
- Check if the token has expired
- Ensure you have access to the repository

### SSH Issues

```bash
# Test SSH connection
ssh -T git@github.com

# Add SSH key to agent
ssh-add ~/.ssh/id_rsa
```

### Rate Limiting

If you hit GitHub's rate limits:
- Use authenticated requests (they have higher limits)
- Implement caching for repeated setups
- Consider using GitHub Apps for higher limits

## Alternative Approaches

### 1. Submodules

For projects that need to stay connected to the template:

```bash
git submodule add https://TOKEN@github.com/clusterahq/_supabase-starter.git template
```

### 2. GitHub Apps

For organizations, create a GitHub App with repository access:
- Better security than personal tokens
- Higher rate limits
- Granular permissions

### 3. Template Synchronization

Use tools like [Copier](https://copier.readthedocs.io/) or [Cookiecutter](https://cookiecutter.readthedocs.io/) for template management:

```yaml
# copier.yml
_templates_suffix: .jinja
_envops:
  block_start_string: "{%"
  block_end_string: "%}"
  variable_start_string: "{{"
  variable_end_string: "}}"

project_name:
  type: str
  help: What is your project name?

supabase_url:
  type: str
  help: What is your Supabase URL?
  default: ""
```

## Summary

For private repositories, we recommend:

1. **Individual developers**: Use Personal Access Tokens or SSH
2. **Teams**: Host the setup script internally and use tokens
3. **CI/CD**: Use GitHub Actions with repository secrets
4. **Large organizations**: Consider GitHub Apps

Choose the method that best fits your security requirements and workflow.