#!/usr/bin/env node

/**
 * Wrapper script to start Firebase emulators while filtering out
 * Java deprecation warnings about sun.misc.Unsafe
 */

import { spawn } from 'child_process';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const projectRoot = join(__dirname, '..');

// Get command line arguments (everything after the script name)
const args = process.argv.slice(2);

// Determine if we should use 'start' or 'exec'
// We use 'exec' if:
// 1. There is a '--' separator followed by a command
// 2. OR if there's an argument that clearly isn't a flag or a flag value (this is tricky)
// 3. OR if the user explicitly wants to exec something.
// For now, let's look for positional arguments that aren't preceded by a flag.
const doubleDashIndex = args.indexOf('--');
let command = 'emulators:start';
let firebaseArgs = [...args];

if (doubleDashIndex !== -1) {
  command = 'emulators:exec';
  // If we have a double dash, everything after it is the command for exec
  // Firebase expect: firebase emulators:exec "cmd" --firebase-flags
  const cmd = args.slice(doubleDashIndex + 1).join(' ');
  const flags = args.slice(0, doubleDashIndex);
  firebaseArgs = [cmd, ...flags];
}
const finalArgs = [command, ...firebaseArgs];

console.log('🔥 Starting Firebase emulators...');
console.log('   (Filtering Java deprecation warnings)\n');

// Spawn the firebase process
const firebaseProcess = spawn('firebase', finalArgs, {
  cwd: projectRoot,
  stdio: ['inherit', 'pipe', 'pipe'],
  shell: true,
});

// Buffer for incomplete lines
let stdoutBuffer = '';
let stderrBuffer = '';

// Filter stdout to remove Java deprecation warnings
firebaseProcess.stdout.on('data', (data) => {
  stdoutBuffer += data.toString();
  const lines = stdoutBuffer.split('\n');
  // Keep the last incomplete line in buffer
  stdoutBuffer = lines.pop() || '';

  for (const line of lines) {
    // Skip lines containing the Java deprecation warnings
    if (
      line.includes('WARNING: A terminally deprecated method') ||
      line.includes('WARNING: sun.misc.Unsafe') ||
      line.includes('WARNING: Please consider reporting this to the maintainers')
    ) {
      continue;
    }

    // Print all other lines immediately
    process.stdout.write(line + '\n');
  }
});

// Filter stderr similarly
firebaseProcess.stderr.on('data', (data) => {
  stderrBuffer += data.toString();
  const lines = stderrBuffer.split('\n');
  // Keep the last incomplete line in buffer
  stderrBuffer = lines.pop() || '';

  for (const line of lines) {
    // Skip lines containing the Java deprecation warnings
    if (
      line.includes('WARNING: A terminally deprecated method') ||
      line.includes('WARNING: sun.misc.Unsafe') ||
      line.includes('WARNING: Please consider reporting this to the maintainers')
    ) {
      continue;
    }

    // Print all other lines to stderr immediately
    process.stderr.write(line + '\n');
  }
});

// Flush any remaining buffered output on exit
firebaseProcess.on('exit', (code) => {
  if (stdoutBuffer.trim()) {
    if (
      !stdoutBuffer.includes('WARNING: A terminally deprecated method') &&
      !stdoutBuffer.includes('WARNING: sun.misc.Unsafe') &&
      !stdoutBuffer.includes('WARNING: Please consider reporting this to the maintainers')
    ) {
      process.stdout.write(stdoutBuffer);
    }
  }
  if (stderrBuffer.trim()) {
    if (
      !stderrBuffer.includes('WARNING: A terminally deprecated method') &&
      !stderrBuffer.includes('WARNING: sun.misc.Unsafe') &&
      !stderrBuffer.includes('WARNING: Please consider reporting this to the maintainers')
    ) {
      process.stderr.write(stderrBuffer);
    }
  }
  process.exit(code || 0);
});

// Handle errors
firebaseProcess.on('error', (error) => {
  console.error('Failed to start Firebase emulators:', error);
  process.exit(1);
});

// Forward signals (Ctrl+C, etc.)
process.on('SIGINT', () => {
  firebaseProcess.kill('SIGINT');
});

process.on('SIGTERM', () => {
  firebaseProcess.kill('SIGTERM');
});
