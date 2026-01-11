import { spawnSync } from 'child_process';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const PROJECT_ROOT = join(__dirname, '../..');

// Read input from stdin
let input = '';
process.stdin.setEncoding('utf8');
process.stdin.on('data', (chunk) => {
  input += chunk;
});

process.stdin.on('end', () => {
  try {
    const hookInput = JSON.parse(input);
    runGrind(hookInput);
  } catch (error) {
    console.error('Error parsing input:', error);
    process.exit(1);
  }
});

/**
 * Interface matching Cursor's stop hook input
 * @typedef {Object} StopHookInput
 * @property {string} conversation_id
 * @property {'completed' | 'aborted' | 'error'} status
 * @property {number} loop_count
 */

/**
 * Main grind logic
 * @param {StopHookInput} input
 */
function runGrind(input) {
  const MAX_ITERATIONS = 10;

  // If agent was aborted or errored, or we've hit max iterations, stop
  if (input.status !== 'completed' || input.loop_count >= MAX_ITERATIONS) {
    if (input.loop_count >= MAX_ITERATIONS) {
      process.stderr.write(`❌ Reached maximum iterations (${MAX_ITERATIONS}). Stopping.\n`);
    }
    console.log(JSON.stringify({}));
    process.exit(0);
  }

  // Check if tests pass
  const testsPass = checkTests();

  // If tests pass, stop
  if (testsPass) {
    process.stderr.write('✅ All tests pass! Stopping.\n');
    console.log(JSON.stringify({}));
    process.exit(0);
  }

  // Tests are failing, continue iterating
  const followupMessage = `Continue iterating. Tests are failing. ` +
    `Please fix the test failures and try again. This is iteration ${input.loop_count + 1} of ${MAX_ITERATIONS}.`;

  console.log(JSON.stringify({ followup_message: followupMessage }));
  process.exit(0);
}

/**
 * Check if tests pass by running the verify script
 * @returns {boolean}
 */
function checkTests() {
  process.stderr.write('🧪 Checking if tests pass...\n');
  
  // Run verify script (which runs lint, integration tests, storybook tests, and build)
  const result = spawnSync('npm', ['run', 'verify'], {
    cwd: PROJECT_ROOT,
    stdio: 'pipe',
    shell: true,
  });

  if (result.status === 0) {
    process.stderr.write('✅ All tests pass\n');
    return true;
  } else {
    process.stderr.write('❌ Tests are failing\n');
    // Print stderr for debugging
    if (result.stderr) {
      process.stderr.write(result.stderr.toString() + '\n');
    }
    return false;
  }
}

