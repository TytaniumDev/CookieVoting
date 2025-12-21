#!/bin/bash

# Debug script to check cookies setup

echo "🔍 Debugging cookies command setup..."
echo ""

# Check current directory
echo "Current directory:"
pwd
echo ""

# Check if scripts exist
echo "Checking for cookie scripts:"
ls -la scripts/cookies* 2>/dev/null || echo "  ❌ No cookies scripts found in scripts/"
echo ""

# Check PATH
echo "Current PATH:"
echo "$PATH" | tr ':' '\n' | grep -i cookie || echo "  (no cookie-related paths found)"
echo ""

# Check bash profile files
echo "Checking bash profile files:"
if [ -f "$HOME/.bash_profile" ]; then
    echo "  ✅ ~/.bash_profile exists"
    echo "  Contents related to cookies:"
    grep -i cookie "$HOME/.bash_profile" || echo "    (no cookie-related entries)"
elif [ -f "$HOME/.bashrc" ]; then
    echo "  ✅ ~/.bashrc exists"
    echo "  Contents related to cookies:"
    grep -i cookie "$HOME/.bashrc" || echo "    (no cookie-related entries)"
else
    echo "  ❌ No bash profile found (~/.bash_profile or ~/.bashrc)"
fi
echo ""

# Get the actual scripts directory path
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
echo "Scripts directory (absolute path):"
echo "  $SCRIPT_DIR"
echo ""

# Convert to Git Bash format if on Windows
if [[ "$SCRIPT_DIR" == *"\\"* ]] || [[ "$SCRIPT_DIR" == *":"* ]]; then
    GIT_BASH_PATH=$(echo "$SCRIPT_DIR" | sed 's|^\([A-Z]\):|/\1|' | tr '\\' '/' | tr '[:upper:]' '[:lower:]')
    echo "Scripts directory (Git Bash format):"
    echo "  $GIT_BASH_PATH"
    echo ""
fi

# Test if we can run the script directly
echo "Testing direct script execution:"
if [ -f "scripts/cookies.sh" ]; then
    if [ -x "scripts/cookies.sh" ]; then
        echo "  ✅ scripts/cookies.sh is executable"
    else
        echo "  ⚠️  scripts/cookies.sh is not executable (run: chmod +x scripts/cookies.sh)"
    fi
else
    echo "  ❌ scripts/cookies.sh not found"
fi
echo ""

# Suggest fix
echo "💡 To fix, run one of these:"
echo ""
echo "Option 1 - Quick fix (add to current session):"
echo "  export PATH=\"\$PATH:$SCRIPT_DIR\""
echo ""
echo "Option 2 - Permanent fix (add to profile):"
if [ -f "$HOME/.bash_profile" ]; then
    echo "  echo 'export PATH=\"\$PATH:$SCRIPT_DIR\"' >> ~/.bash_profile"
    echo "  source ~/.bash_profile"
elif [ -f "$HOME/.bashrc" ]; then
    echo "  echo 'export PATH=\"\$PATH:$SCRIPT_DIR\"' >> ~/.bashrc"
    echo "  source ~/.bashrc"
else
    echo "  echo 'export PATH=\"\$PATH:$SCRIPT_DIR\"' >> ~/.bash_profile"
    echo "  source ~/.bash_profile"
fi
echo ""

