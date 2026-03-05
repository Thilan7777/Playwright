#!/bin/bash
# Clean credentials.json from entire git history
# This script removes the sensitive file and force pushes the cleaned history

set -e

echo "🧹 Cleaning git history of credentials.json..."
echo "=============================================="

# Create a temporary backup branch
git branch backup-before-clean

# Remove credentials.json from all commits in history
git filter-branch -f --tree-filter 'rm -f credentials.json' -- --all

# Remove refs from backup to prevent push
git update-ref -d refs/original/refs/heads/main
git update-ref -d refs/original/refs/heads/thilan-kavinda
git gc --aggressive --prune=all

echo "✅ History cleaned successfully"
echo ""
echo "🚀 Force pushing cleaned history..."
git push origin --force-with-lease thilan-kavinda

echo "✅ Push successful!"
echo ""
echo "⚠️  Note: If other developers have cloned this repo, they'll need to:"
echo "   git pull --rebase origin thilan-kavinda"
