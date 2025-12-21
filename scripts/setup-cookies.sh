#!/bin/bash

# Setup script to add cookies command to PATH

SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
PROJECT_ROOT="$( cd "$SCRIPT_DIR/.." && pwd )"
SCRIPTS_DIR="$PROJECT_ROOT/scripts"

echo "🍪 Setting up cookies command..."

# Determine which profile file to use
if [ -f "$HOME/.bash_profile" ]; then
    PROFILE_FILE="$HOME/.bash_profile"
elif [ -f "$HOME/.bashrc" ]; then
    PROFILE_FILE="$HOME/.bashrc"
else
    PROFILE_FILE="$HOME/.bash_profile"
    touch "$PROFILE_FILE"
fi

echo "   Using profile: $PROFILE_FILE"

# Convert Windows path to Git Bash format if needed
if [[ "$SCRIPTS_DIR" == *"\\"* ]] || [[ "$SCRIPTS_DIR" == *":"* ]]; then
    # Convert C:\path\to\scripts to /c/path/to/scripts
    SCRIPTS_DIR=$(echo "$SCRIPTS_DIR" | sed 's|^\([A-Z]\):|/\1|' | tr '\\' '/' | tr '[:upper:]' '[:lower:]')
fi

# Check if already in PATH
if echo "$PATH" | grep -q "$SCRIPTS_DIR"; then
    echo "   ✅ Scripts directory already in PATH"
else
    echo "" >> "$PROFILE_FILE"
    echo "# Cookie Voting - cookies command" >> "$PROFILE_FILE"
    echo "export PATH=\"\$PATH:$SCRIPTS_DIR\"" >> "$PROFILE_FILE"
    echo "   ✅ Added to PATH in $PROFILE_FILE"
fi

# Make script executable
chmod +x "$SCRIPTS_DIR/cookies.sh"

# Create a symlink or alias for easier use
if [ ! -f "$SCRIPTS_DIR/cookies" ] && [ ! -L "$SCRIPTS_DIR/cookies" ]; then
    ln -s "$SCRIPTS_DIR/cookies.sh" "$SCRIPTS_DIR/cookies" 2>/dev/null || cp "$SCRIPTS_DIR/cookies.sh" "$SCRIPTS_DIR/cookies"
    chmod +x "$SCRIPTS_DIR/cookies"
    echo "   ✅ Created cookies command"
fi

echo ""
echo "✅ Setup complete!"
echo ""
echo "To use the cookies command:"
echo "  1. Reload your shell profile:"
echo "     source $PROFILE_FILE"
echo "     (or just close and reopen your terminal)"
echo ""
echo "  2. Then run:"
echo "     cookies"
echo ""

