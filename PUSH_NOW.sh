#!/bin/bash

# SafeSphere - GitHub Push Script
# This script will push your project to GitHub

echo "=========================================="
echo "  SafeSphere - GitHub Push Script"
echo "=========================================="
echo ""

# Check if we're in the right directory
if [ ! -f "manage.py" ]; then
    echo "❌ Error: Not in the correct directory!"
    echo "Please run this script from: safespera-old/safespera/"
    exit 1
fi

echo "✅ Correct directory confirmed"
echo ""

# Check git status
echo "📋 Checking git status..."
git status
echo ""

# Add all files
echo "📦 Adding all files to git..."
git add .
echo "✅ Files added"
echo ""

# Commit
echo "💾 Creating commit..."
git commit -m "Production ready: SafeSphere disaster preparedness platform

Features:
- AI chatbot with Gemini API and location awareness
- Emergency map with heatwave zones for Madhya Pradesh  
- Google Maps integration for hospital navigation
- 15+ hospitals and 8+ community centers
- Certificate generation system
- Mobile-responsive design
- User authentication and gamification
- Comprehensive learning modules"

echo "✅ Commit created"
echo ""

# Ask for GitHub username
echo "=========================================="
echo "  GitHub Repository Setup"
echo "=========================================="
echo ""
read -p "Enter your GitHub username: " github_username

if [ -z "$github_username" ]; then
    echo "❌ Error: GitHub username cannot be empty"
    exit 1
fi

# Set remote
echo ""
echo "🔗 Connecting to GitHub..."
git remote remove origin 2>/dev/null
git remote add origin "https://github.com/$github_username/safesphere.git"
echo "✅ Connected to: https://github.com/$github_username/safesphere"
echo ""

# Push to GitHub
echo "🚀 Pushing to GitHub..."
echo ""
git branch -M main
git push -u origin main

# Check if push was successful
if [ $? -eq 0 ]; then
    echo ""
    echo "=========================================="
    echo "  ✅ SUCCESS! Project pushed to GitHub!"
    echo "=========================================="
    echo ""
    echo "🎉 Your repository is now live at:"
    echo "   https://github.com/$github_username/safesphere"
    echo ""
    echo "📝 Next steps:"
    echo "   1. Visit your repository"
    echo "   2. Add description and topics"
    echo "   3. Share with investors and team"
    echo ""
else
    echo ""
    echo "=========================================="
    echo "  ❌ Push Failed"
    echo "=========================================="
    echo ""
    echo "Possible reasons:"
    echo "1. Repository doesn't exist on GitHub"
    echo "   → Create it at: https://github.com/new"
    echo "2. Authentication failed"
    echo "   → Check your GitHub credentials"
    echo "3. Network issues"
    echo "   → Check your internet connection"
    echo ""
    echo "See DEPLOY_TO_GITHUB.md for detailed instructions"
    echo ""
fi
