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
# Usage: ./scripts/sync-agent-rules.sh [--clean] [--check] [--auto]
#
# Options:
#   --clean    Remove all generated files before regenerating
#   --check    Check if files are out of date (for CI, exits with error if outdated)
#   --auto     Only sync if files have changed (fast, for use in pre-hooks)

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"
AI_DIR="$PROJECT_ROOT/.ai"
RULES_DIR="$AI_DIR/rules"
CHECKSUM_FILE="$AI_DIR/.rules-checksum"

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

# Check if .ai directory exists - silently skip if not (for fresh clones)
if [ ! -d "$AI_DIR" ] || [ ! -d "$RULES_DIR" ]; then
    if [ "$1" != "--auto" ]; then
        log_error ".ai/rules directory not found. Please create it first."
        exit 1
    fi
    # In auto mode, silently exit if no rules directory
    exit 0
fi

# Check if there are any rule files
RULE_COUNT=$(find "$RULES_DIR" -name "*.md" -type f 2>/dev/null | wc -l)
if [ "$RULE_COUNT" -eq 0 ]; then
    if [ "$1" != "--auto" ]; then
        log_warn "No rule files found in .ai/rules/"
    fi
    exit 0
fi

# Calculate checksum of all source files
calculate_checksum() {
    find "$RULES_DIR" -name "*.md" -type f -exec cat {} \; 2>/dev/null | sha256sum | cut -d' ' -f1
}

# Get current checksum
CURRENT_CHECKSUM=$(calculate_checksum)
GENERATION_TIME=$(date -u +"%Y-%m-%dT%H:%M:%SZ")
GENERATION_TIME_HUMAN=$(date "+%B %d, %Y at %H:%M:%S %Z")

# Auto mode - only sync if checksum has changed (fast path for pre-hooks)
if [ "$1" = "--auto" ]; then
    if [ -f "$CHECKSUM_FILE" ]; then
        STORED_CHECKSUM=$(cat "$CHECKSUM_FILE")
        if [ "$CURRENT_CHECKSUM" = "$STORED_CHECKSUM" ]; then
            # Files are up to date, nothing to do
            exit 0
        fi
    fi
    # Checksum changed or doesn't exist - do a full sync
    log_info "Agent rules changed, syncing..."
fi

# Check mode - just verify if files are up to date
if [ "$1" = "--check" ]; then
    if [ -f "$CHECKSUM_FILE" ]; then
        STORED_CHECKSUM=$(cat "$CHECKSUM_FILE")
        if [ "$CURRENT_CHECKSUM" = "$STORED_CHECKSUM" ]; then
            log_success "Agent rule files are up to date."
            exit 0
        else
            log_error "Agent rule files are OUT OF DATE!"
            log_info "Run 'npm run sync-agent-rules' to update."
            exit 1
        fi
    else
        log_error "No checksum file found. Run 'npm run sync-agent-rules' first."
        exit 1
    fi
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
    rm -f "$CHECKSUM_FILE"
    # Note: We don't clean .cursor/rules as it may have user-specific rules
    log_success "Cleaned generated files."
fi

# Generate the sync status header
generate_header() {
    local agent_name="$1"
    cat << EOF
# ${agent_name} - Project Instructions

> **⚠️ AUTO-GENERATED FILE - DO NOT EDIT DIRECTLY**
>
> **Source:** \`.ai/rules/\` — Edit files there, then run \`npm run dev\` or \`npm run sync-agent-rules\`
>
> **Last synced:** ${GENERATION_TIME_HUMAN} · Checksum: \`${CURRENT_CHECKSUM:0:12}\`

EOF
}

# Function to concatenate all rule files
concatenate_rules() {
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
description: ${description}
alwaysApply: ${always_apply}
generatedAt: "${GENERATION_TIME}"
sourceChecksum: "${CURRENT_CHECKSUM:0:12}"
---

> ⚠️ Auto-generated from \`.ai/rules/\` — Syncs automatically on \`npm run dev\`

EOF
    cat "$source" >> "$dest"
}

log_info "Syncing agent rules from .ai/ to IDE-specific locations..."
log_info "Source checksum: ${CURRENT_CHECKSUM:0:12}..."

# ============================================
# 1. CLAUDE.md (Claude Code)
# ============================================
log_info "Generating CLAUDE.md..."
{
    generate_header "CLAUDE.md"
    concatenate_rules
} > "$PROJECT_ROOT/CLAUDE.md"
log_success "Generated CLAUDE.md"

# ============================================
# 2. GEMINI.md (Gemini / Google AI)
# ============================================
log_info "Generating GEMINI.md..."
{
    generate_header "GEMINI.md"
    concatenate_rules
} > "$PROJECT_ROOT/GEMINI.md"
log_success "Generated GEMINI.md"

# ============================================
# 3. .cursor/rules/*.mdc (Cursor IDE)
# ============================================
log_info "Generating .cursor/rules/*.mdc files..."
mkdir -p "$PROJECT_ROOT/.cursor/rules"

# Remove old generated files (those starting with numbers)
rm -f "$PROJECT_ROOT/.cursor/rules/"[0-9]*.mdc

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
    generate_header "Antigravity Rules"
    concatenate_rules
} > "$PROJECT_ROOT/.antigravity/rules.md"
log_success "Generated .antigravity/rules.md"

# ============================================
# 5. .clinerules (Cline VS Code extension)
# ============================================
log_info "Generating .clinerules..."
{
    generate_header "Cline Rules"
    concatenate_rules
} > "$PROJECT_ROOT/.clinerules"
log_success "Generated .clinerules"

# ============================================
# 6. .windsurfrules (Windsurf IDE)
# ============================================
log_info "Generating .windsurfrules..."
{
    generate_header "Windsurf Rules"
    concatenate_rules
} > "$PROJECT_ROOT/.windsurfrules"
log_success "Generated .windsurfrules"

# ============================================
# 7. .github/copilot-instructions.md (GitHub Copilot)
# ============================================
log_info "Generating .github/copilot-instructions.md..."
mkdir -p "$PROJECT_ROOT/.github"
{
    generate_header "GitHub Copilot Instructions"
    concatenate_rules
} > "$PROJECT_ROOT/.github/copilot-instructions.md"
log_success "Generated .github/copilot-instructions.md"

# ============================================
# Save checksum for future comparison
# ============================================
echo "$CURRENT_CHECKSUM" > "$CHECKSUM_FILE"
log_success "Saved checksum to .ai/.rules-checksum"

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
echo "Generated at:    $GENERATION_TIME_HUMAN"
echo "Checksum:        ${CURRENT_CHECKSUM:0:12}..."
echo ""
log_info "Tip: Run 'npm run sync-agent-rules -- --check' in CI to verify files are up to date."
