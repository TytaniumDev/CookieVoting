#!/bin/bash

# Quick fix to add cookies to PATH for current session and permanently

SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"

echo "🔧 Quick fix for cookies command..."
echo ""

# Make scripts executable
chmod +x "$SCRIPT_DIR/cookies.sh"
chmod +x "$SCRIPT_DIR/cookies"
echo "✅ Made scripts executable"
echo ""

# Add to PATH for current session
export PATH="$PATH:$SCRIPT_DIR"
echo "✅ Added to PATH for current session"
echo ""

# Add to profile permanently
if [ -f "$HOME/.bash_profile" ]; then
    PROFILE_FILE="$HOME/.bash_profile"
elif [ -f "$HOME/.bashrc" ]; then
    PROFILE_FILE="$HOME/.bashrc"
else
    PROFILE_FILE="$HOME/.bash_profile"
    touch "$PROFILE_FILE"
fi

# Check if already added
if grep -q "$SCRIPT_DIR" "$PROFILE_FILE" 2>/dev/null; then
    echo "✅ Already in $PROFILE_FILE"
else
    echo "" >> "$PROFILE_FILE"
    echo "# Cookie Voting - cookies command" >> "$PROFILE_FILE"
    echo "export PATH=\"\$PATH:$SCRIPT_DIR\"" >> "$PROFILE_FILE"
    echo "✅ Added to $PROFILE_FILE"
fi

echo ""
echo "🎉 Done! Try running: cookies"
echo ""

