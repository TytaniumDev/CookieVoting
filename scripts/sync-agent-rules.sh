#!/bin/bash
#
# sync-agent-rules.sh
# 
# Generates IDE/agent-specific instruction files from the unified .ai/ source.
# This creates a single source of truth for agent instructions that works across:
#   - Claude Code (CLAUDE.md)
#   - Gemini (GEMINI.md)
#   - Cursor (.cursor/rules/*.mdc)
#   - Antigravity (.antigravity/rules.md)
#   - Cline (.clinerules)
#   - Windsurf (.windsurfrules)
#   - GitHub Copilot (.github/copilot-instructions.md)
#
# Usage: ./scripts/sync-agent-rules.sh [--clean]
#
# Options:
#   --clean    Remove all generated files before regenerating

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"
AI_DIR="$PROJECT_ROOT/.ai"
RULES_DIR="$AI_DIR/rules"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

log_info() { echo -e "${BLUE}ℹ${NC} $1"; }
log_success() { echo -e "${GREEN}✓${NC} $1"; }
log_warn() { echo -e "${YELLOW}⚠${NC} $1"; }
log_error() { echo -e "${RED}✗${NC} $1"; }

# Check if .ai directory exists
if [ ! -d "$AI_DIR" ]; then
    log_error ".ai directory not found. Please create it first."
    exit 1
fi

# Clean option
if [ "$1" = "--clean" ]; then
    log_info "Cleaning generated files..."
    rm -f "$PROJECT_ROOT/CLAUDE.md"
    rm -f "$PROJECT_ROOT/GEMINI.md"
    rm -f "$PROJECT_ROOT/.clinerules"
    rm -f "$PROJECT_ROOT/.windsurfrules"
    rm -rf "$PROJECT_ROOT/.antigravity"
    rm -f "$PROJECT_ROOT/.github/copilot-instructions.md"
    # Note: We don't clean .cursor/rules as it may have user-specific rules
    log_success "Cleaned generated files."
fi

# Function to concatenate all rule files
concatenate_rules() {
    local header="$1"
    local include_frontmatter="$2"
    
    if [ -n "$header" ]; then
        echo "$header"
        echo ""
    fi
    
    # Sort files by name to ensure consistent order
    for file in $(find "$RULES_DIR" -name "*.md" -type f | sort); do
        if [ -f "$file" ]; then
            cat "$file"
            echo ""
            echo "---"
            echo ""
        fi
    done
}

# Function to create MDC file (Cursor format with frontmatter)
create_mdc_file() {
    local source="$1"
    local dest="$2"
    local description="$3"
    local always_apply="${4:-false}"
    
    cat > "$dest" << EOF
---
description: $description
alwaysApply: $always_apply
---

EOF
    cat "$source" >> "$dest"
}

log_info "Syncing agent rules from .ai/ to IDE-specific locations..."

# ============================================
# 1. CLAUDE.md (Claude Code)
# ============================================
log_info "Generating CLAUDE.md..."
{
    echo "# CLAUDE.md - Project Instructions for Claude"
    echo ""
    echo "> This file is auto-generated from .ai/rules/. Edit files there instead."
    echo "> Run \`./scripts/sync-agent-rules.sh\` to regenerate."
    echo ""
    concatenate_rules "" "false"
} > "$PROJECT_ROOT/CLAUDE.md"
log_success "Generated CLAUDE.md"

# ============================================
# 2. GEMINI.md (Gemini / Google AI)
# ============================================
log_info "Generating GEMINI.md..."
{
    echo "# GEMINI.md - Project Instructions for Gemini"
    echo ""
    echo "> This file is auto-generated from .ai/rules/. Edit files there instead."
    echo "> Run \`./scripts/sync-agent-rules.sh\` to regenerate."
    echo ""
    concatenate_rules "" "false"
} > "$PROJECT_ROOT/GEMINI.md"
log_success "Generated GEMINI.md"

# ============================================
# 3. .cursor/rules/*.mdc (Cursor IDE)
# ============================================
log_info "Generating .cursor/rules/*.mdc files..."
mkdir -p "$PROJECT_ROOT/.cursor/rules"

# Generate individual .mdc files for each rule
for file in $(find "$RULES_DIR" -name "*.md" -type f | sort); do
    filename=$(basename "$file" .md)
    dest="$PROJECT_ROOT/.cursor/rules/${filename}.mdc"
    
    # Extract first heading as description
    first_heading=$(grep -m 1 "^# " "$file" | sed 's/^# //')
    description="${first_heading:-Agent instructions}"
    
    create_mdc_file "$file" "$dest" "$description" "false"
done
log_success "Generated .cursor/rules/*.mdc files"

# ============================================
# 4. .antigravity/rules.md (Antigravity IDE)
# ============================================
log_info "Generating .antigravity/rules.md..."
mkdir -p "$PROJECT_ROOT/.antigravity"
{
    echo "# Antigravity Rules"
    echo ""
    echo "> This file is auto-generated from .ai/rules/. Edit files there instead."
    echo "> Run \`./scripts/sync-agent-rules.sh\` to regenerate."
    echo ""
    concatenate_rules "" "false"
} > "$PROJECT_ROOT/.antigravity/rules.md"
log_success "Generated .antigravity/rules.md"

# ============================================
# 5. .clinerules (Cline VS Code extension)
# ============================================
log_info "Generating .clinerules..."
{
    echo "# Cline Rules"
    echo ""
    echo "> This file is auto-generated from .ai/rules/. Edit files there instead."
    echo "> Run \`./scripts/sync-agent-rules.sh\` to regenerate."
    echo ""
    concatenate_rules "" "false"
} > "$PROJECT_ROOT/.clinerules"
log_success "Generated .clinerules"

# ============================================
# 6. .windsurfrules (Windsurf IDE)
# ============================================
log_info "Generating .windsurfrules..."
{
    echo "# Windsurf Rules"
    echo ""
    echo "> This file is auto-generated from .ai/rules/. Edit files there instead."
    echo "> Run \`./scripts/sync-agent-rules.sh\` to regenerate."
    echo ""
    concatenate_rules "" "false"
} > "$PROJECT_ROOT/.windsurfrules"
log_success "Generated .windsurfrules"

# ============================================
# 7. .github/copilot-instructions.md (GitHub Copilot)
# ============================================
log_info "Generating .github/copilot-instructions.md..."
mkdir -p "$PROJECT_ROOT/.github"
{
    echo "# GitHub Copilot Instructions"
    echo ""
    echo "> This file is auto-generated from .ai/rules/. Edit files there instead."
    echo "> Run \`./scripts/sync-agent-rules.sh\` to regenerate."
    echo ""
    concatenate_rules "" "false"
} > "$PROJECT_ROOT/.github/copilot-instructions.md"
log_success "Generated .github/copilot-instructions.md"

# ============================================
# Summary
# ============================================
echo ""
log_success "All agent rule files have been synced!"
echo ""
echo "Generated files:"
echo "  - CLAUDE.md              (Claude Code)"
echo "  - GEMINI.md              (Gemini / Google AI)"
echo "  - .cursor/rules/*.mdc    (Cursor IDE)"
echo "  - .antigravity/rules.md  (Antigravity IDE)"
echo "  - .clinerules            (Cline)"
echo "  - .windsurfrules         (Windsurf)"
echo "  - .github/copilot-instructions.md (GitHub Copilot)"
echo ""
echo "Source of truth: .ai/rules/"
echo ""
log_info "Tip: Add a pre-commit hook to run this script automatically!"
