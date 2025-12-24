#!/bin/bash

# ==============================================================================
# CookieVoting - New Machine Setup Script
# ==============================================================================
# This script sets up a fresh development environment for the CookieVoting project.
# Run this after cloning the repository on a new machine.
#
# Usage: ./scripts/setup.sh
# ==============================================================================

set -e  # Exit on error

SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
PROJECT_ROOT="$( cd "$SCRIPT_DIR/.." && pwd )"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo ""
echo -e "${BLUE}🍪 CookieVoting - Development Environment Setup${NC}"
echo "=================================================="
echo ""

# ------------------------------------------------------------------------------
# Helper functions
# ------------------------------------------------------------------------------

check_command() {
    if command -v "$1" &> /dev/null; then
        return 0
    else
        return 1
    fi
}

print_step() {
    echo -e "${BLUE}▶ $1${NC}"
}

print_success() {
    echo -e "${GREEN}✅ $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

print_error() {
    echo -e "${RED}❌ $1${NC}"
}

# ------------------------------------------------------------------------------
# Step 1: Check prerequisites (Node.js + npm)
# ------------------------------------------------------------------------------

install_node_with_homebrew() {
    echo ""
    print_step "Installing Node.js via Homebrew..."
    
    # Check if Homebrew is installed
    if ! check_command brew; then
        print_step "Installing Homebrew first..."
        /bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"
        
        # Add Homebrew to PATH for this session
        if [ -f "/opt/homebrew/bin/brew" ]; then
            eval "$(/opt/homebrew/bin/brew shellenv)"
            # Also add to shell profile
            echo >> "$HOME/.zprofile"
            echo 'eval "$(/opt/homebrew/bin/brew shellenv)"' >> "$HOME/.zprofile"
        elif [ -f "/usr/local/bin/brew" ]; then
            eval "$(/usr/local/bin/brew shellenv)"
        fi
        
        if check_command brew; then
            print_success "Homebrew installed"
        else
            print_error "Failed to install Homebrew"
            exit 1
        fi
    else
        print_success "Homebrew already installed"
    fi
    
    # Install Node.js 20
    print_step "Installing Node.js 20..."
    brew install node@20
    
    # Add Node.js to PATH for this session and permanently
    if [ -d "/opt/homebrew/opt/node@20/bin" ]; then
        export PATH="/opt/homebrew/opt/node@20/bin:$PATH"
        echo 'export PATH="/opt/homebrew/opt/node@20/bin:$PATH"' >> "$HOME/.zshrc"
    elif [ -d "/usr/local/opt/node@20/bin" ]; then
        export PATH="/usr/local/opt/node@20/bin:$PATH"
        echo 'export PATH="/usr/local/opt/node@20/bin:$PATH"' >> "$HOME/.zshrc"
    fi
    
    if check_command node; then
        print_success "Node.js $(node --version) installed"
    else
        print_error "Failed to install Node.js"
        exit 1
    fi
}

print_step "Checking prerequisites..."

# Check Node.js
if check_command node; then
    NODE_VERSION=$(node --version)
    NODE_MAJOR=$(echo "$NODE_VERSION" | cut -d'.' -f1 | sed 's/v//')
    if [ "$NODE_MAJOR" -ge 20 ]; then
        print_success "Node.js $NODE_VERSION found"
    else
        print_error "Node.js 20+ required, found $NODE_VERSION"
        echo "   Your current version is too old."
        echo ""
        
        # Offer to install via Homebrew on macOS
        if [[ "$OSTYPE" == "darwin"* ]]; then
            echo -e "${YELLOW}Would you like to install Node.js 20 via Homebrew? [Y/n]${NC}"
            read -r response
            if [[ "$response" =~ ^[Nn]$ ]]; then
                echo "   Please manually install Node.js 20+: https://nodejs.org/"
                exit 1
            else
                install_node_with_homebrew
            fi
        else
            echo "   Please install Node.js 20 or higher: https://nodejs.org/"
            exit 1
        fi
    fi
else
    print_warning "Node.js not found"
    
    # Offer to install via Homebrew on macOS
    if [[ "$OSTYPE" == "darwin"* ]]; then
        echo ""
        echo -e "${YELLOW}Would you like to install Node.js 20 via Homebrew? [Y/n]${NC}"
        read -r response
        if [[ "$response" =~ ^[Nn]$ ]]; then
            echo "   Please manually install Node.js 20+: https://nodejs.org/"
            exit 1
        else
            install_node_with_homebrew
        fi
    else
        print_error "Node.js not found"
        echo "   Please install Node.js 20+: https://nodejs.org/"
        exit 1
    fi
fi

# Check npm
if check_command npm; then
    NPM_VERSION=$(npm --version)
    print_success "npm $NPM_VERSION found"
else
    print_error "npm not found (should come with Node.js)"
    exit 1
fi

echo ""

# ------------------------------------------------------------------------------
# Step 2: Install root dependencies
# ------------------------------------------------------------------------------

print_step "Installing root npm dependencies..."
cd "$PROJECT_ROOT"

if npm install; then
    print_success "Root dependencies installed"
else
    print_error "Failed to install root dependencies"
    exit 1
fi

echo ""

# ------------------------------------------------------------------------------
# Step 3: Install functions dependencies
# ------------------------------------------------------------------------------

print_step "Installing Firebase Functions dependencies..."

if [ -d "$PROJECT_ROOT/functions" ]; then
    cd "$PROJECT_ROOT/functions"
    if npm install; then
        print_success "Functions dependencies installed"
    else
        print_warning "Failed to install functions dependencies (optional)"
    fi
    cd "$PROJECT_ROOT"
else
    print_warning "Functions directory not found, skipping..."
fi

echo ""

# ------------------------------------------------------------------------------
# Step 4: Set up environment file
# ------------------------------------------------------------------------------

print_step "Setting up environment file..."

if [ -f "$PROJECT_ROOT/.env" ]; then
    print_success ".env file already exists"
else
    if [ -f "$PROJECT_ROOT/.env.example" ]; then
        cp "$PROJECT_ROOT/.env.example" "$PROJECT_ROOT/.env"
        print_success "Created .env from .env.example"
        print_warning "Remember to update .env with your Firebase credentials!"
    else
        # Create a minimal .env for emulator mode
        echo "VITE_USE_EMULATOR=true" > "$PROJECT_ROOT/.env"
        print_success "Created minimal .env (emulator mode)"
    fi
fi

echo ""

# ------------------------------------------------------------------------------
# Step 5: Install Playwright browsers (optional)
# ------------------------------------------------------------------------------

print_step "Installing Playwright browsers (for E2E tests)..."

if npx playwright install --with-deps 2>/dev/null; then
    print_success "Playwright browsers installed"
else
    print_warning "Playwright installation failed (E2E tests may not work)"
    echo "   You can install later with: npm run playwright:install"
fi

echo ""

# ------------------------------------------------------------------------------
# Step 6: Set up cookies command shortcut
# ------------------------------------------------------------------------------

print_step "Setting up 'cookies' command shortcut..."

if [ -f "$SCRIPT_DIR/setup-cookies.sh" ]; then
    bash "$SCRIPT_DIR/setup-cookies.sh"
else
    print_warning "setup-cookies.sh not found, skipping shortcut setup"
fi

echo ""

# ------------------------------------------------------------------------------
# Step 7: Check Firebase CLI (optional)
# ------------------------------------------------------------------------------

print_step "Checking Firebase CLI..."

if check_command firebase; then
    FIREBASE_VERSION=$(firebase --version)
    print_success "Firebase CLI $FIREBASE_VERSION found"
else
    print_warning "Firebase CLI not installed"
    echo "   For deployments, install with: npm install -g firebase-tools"
    echo "   Then authenticate with: firebase login"
fi

echo ""

# ------------------------------------------------------------------------------
# Summary
# ------------------------------------------------------------------------------

echo "=================================================="
echo -e "${GREEN}🎉 Setup complete!${NC}"
echo "=================================================="
echo ""
echo "Next steps:"
echo ""
echo "  1. Update your .env file with Firebase credentials (if using production)"
echo "     Or keep VITE_USE_EMULATOR=true for local development"
echo ""
echo "  2. Start the development server:"
echo "     ${BLUE}npm run dev${NC}"
echo ""
echo "  3. Or start with emulators:"
echo "     ${BLUE}npm run emulators:start:seed${NC}  (in one terminal)"
echo "     ${BLUE}npm run dev${NC}                   (in another terminal)"
echo ""
echo "  4. View Storybook component library:"
echo "     ${BLUE}npm run storybook${NC}"
echo ""
echo "  5. Run verification before committing:"
echo "     ${BLUE}npm run verify${NC}"
echo ""

# Offer to reload shell for cookies command
if [ -n "$BASH_VERSION" ]; then
    echo "To use the 'cookies' command, reload your shell or run:"
    echo "  source ~/.bash_profile  (or ~/.bashrc)"
    echo ""
fi
