# 🤖 Unified AI Agent Instructions

This directory is the **single source of truth** for all AI agent/IDE instruction files in this project.

## Quick Start

**Files sync automatically!** Just edit files in `.ai/rules/` and run `npm run dev` — the sync happens automatically via a pre-hook.

```bash
# Manual sync (if needed):
npm run sync-agent-rules

# Check if files are up to date (for CI):
npm run sync-agent-rules:check
```

## Why This Exists

Different AI coding assistants expect their instructions in different locations:

| Agent/IDE | Expected Location |
|-----------|------------------|
| **Claude Code** | `CLAUDE.md` |
| **Gemini** | `GEMINI.md` |
| **Cursor** | `.cursor/rules/*.mdc` |
| **Antigravity** | `.antigravity/rules.md` |
| **Cline** | `.clinerules` |
| **Windsurf** | `.windsurfrules` |
| **GitHub Copilot** | `.github/copilot-instructions.md` |

Instead of maintaining 7+ duplicate files, we maintain one source and generate the rest.

## Directory Structure

```
.ai/
├── README.md           # This file
├── .rules-checksum     # SHA256 of source files (for change detection)
├── rules/              # Source instruction files
│   ├── 01-project-guidelines.md
│   ├── 02-ui-components.md
│   ├── 03-firebase-deployment.md
│   └── 04-testing-strategy.md
└── context/            # Additional context files (optional)
```

## Change Detection

Each generated file includes:
- **Timestamp**: When the file was generated
- **Checksum**: SHA256 hash of all source files (first 12 chars)
- **Agent Instructions**: Tells the AI to re-run sync if sources change

The `.rules-checksum` file stores the full checksum for the `--check` option.

## Usage

### Adding/Editing Rules

1. Edit files in `.ai/rules/`
2. Run `npm run dev` (sync happens automatically) or `npm run sync-agent-rules`
3. Commit all generated files

The sync is hooked into `npm run dev` and `npm run build`, so you don't need to remember to run it manually!

### File Naming Convention

Files in `.ai/rules/` are processed in alphabetical order. Use numeric prefixes to control order:
- `01-project-guidelines.md`
- `02-ui-components.md`
- etc.

### Creating New Rule Files

1. Create a new `.md` file in `.ai/rules/`
2. Start with a `# Heading` - this becomes the description in Cursor's `.mdc` files
3. Run `npm run sync-agent-rules`

## Generated Files

The sync script generates these files (all auto-generated, do not edit directly):

| File | Agent/IDE | Notes |
|------|-----------|-------|
| `CLAUDE.md` | Claude Code | Concatenated rules |
| `GEMINI.md` | Gemini | Concatenated rules |
| `.cursor/rules/*.mdc` | Cursor | Individual files with frontmatter |
| `.antigravity/rules.md` | Antigravity | Concatenated rules |
| `.clinerules` | Cline | Concatenated rules |
| `.windsurfrules` | Windsurf | Concatenated rules |
| `.github/copilot-instructions.md` | GitHub Copilot | Concatenated rules |

## Best Practices

### For Rule Content

1. **Keep rules modular** - Each file should cover one topic
2. **Be specific** - Vague rules are ignored; specific ones are followed
3. **Include examples** - Show don't just tell
4. **Test with each agent** - Different agents interpret rules differently

### For File Organization

1. **Use clear prefixes** - `01-`, `02-` for ordering
2. **One topic per file** - Makes it easier to enable/disable specific rules
3. **Keep files focused** - Under 200 lines ideally

## Automation

### Built-in Hooks (Already Configured!)

The sync script runs automatically before:
- `npm run dev` (via `predev` hook)
- `npm run build` (via `prebuild` hook)

It uses `--auto` mode which only syncs if the source checksum has changed, so it's fast!

### Pre-commit Hook (Optional)

Add to `.husky/pre-commit` (if using Husky):
```bash
npm run sync-agent-rules
git add CLAUDE.md GEMINI.md .clinerules .windsurfrules .antigravity/ .cursor/rules/ .github/copilot-instructions.md .ai/.rules-checksum
```

### CI/CD Check

Add to your CI pipeline to ensure generated files are up-to-date:
```yaml
- name: Check agent rules are synced
  run: npm run sync-agent-rules:check
```

## Supported Agents

### Fully Supported (Priority)

- ✅ **Claude Code** - `CLAUDE.md` at project root
- ✅ **Gemini** - `GEMINI.md` at project root  
- ✅ **Cursor** - `.cursor/rules/*.mdc` with frontmatter
- ✅ **Antigravity** - `.antigravity/rules.md`

### Also Supported

- ✅ **Cline** - `.clinerules` at project root
- ✅ **Windsurf** - `.windsurfrules` at project root
- ✅ **GitHub Copilot** - `.github/copilot-instructions.md`

### Adding New Agents

To add support for a new agent:

1. Research where the agent expects its instruction file
2. Edit `scripts/sync-agent-rules.sh`
3. Add generation logic following the existing patterns
4. Update this README

## Migrating Existing Rules

If you have existing rules scattered across the repo:

1. Copy content from existing files to `.ai/rules/`
2. Organize into logical files
3. Run `npm run sync-agent-rules`
4. Verify generated files match original intent
5. Delete old source files (keep generated ones)

## Troubleshooting

### Generated files not updating
```bash
# Clean and regenerate
npm run sync-agent-rules -- --clean
npm run sync-agent-rules
```

### Agent not reading rules
- Verify the file exists in the expected location
- Check file permissions
- Restart your IDE/agent
- Some agents cache rules - may need to start a new session

### Cursor not loading .mdc files
- Ensure files have proper frontmatter with `description` and `alwaysApply`
- Check `.cursor/rules/` directory exists
- Restart Cursor
