#!/bin/bash
# SessionStart hook for Claude Code on the web: installs workspace dependencies
# so lint, typecheck, unit, story and E2E tests work as soon as a session starts.
set -euo pipefail

# Local sessions manage their own environment.
if [ "${CLAUDE_CODE_REMOTE:-}" != "true" ]; then
  exit 0
fi

cd "$CLAUDE_PROJECT_DIR"

# `npm install` (not `npm ci`) so the cached container's node_modules is reused
# and only changes are fetched. Idempotent when nothing changed.
npm install --no-audit --no-fund

# Cloud containers ship a preinstalled Chromium and may block browser downloads.
# Storybook story tests and Playwright E2E read CHROMIUM_PATH (see CLAUDE.md).
if [ -x /opt/pw-browsers/chromium ] && [ -n "${CLAUDE_ENV_FILE:-}" ]; then
  echo 'export CHROMIUM_PATH=/opt/pw-browsers/chromium' >> "$CLAUDE_ENV_FILE"
fi
