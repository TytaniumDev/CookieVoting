import { spawnSync } from 'child_process';
import process from 'process';

const skipBuild = process.argv.includes('--skip-build');

const steps = [
  { name: 'Lint', command: 'npm', args: ['run', 'lint'] },
  { name: 'Integration Tests', command: 'npm', args: ['run', 'test:integration'] },
  { name: 'Storybook Tests', command: 'npm', args: ['run', 'test-storybook'] },
];

if (!skipBuild) {
  steps.push({ name: 'Build', command: 'npm', args: ['run', 'build'] });
}

console.log('🚀 Starting Presubmit Verification...');
if (skipBuild) {
  console.log('ℹ️  Skipping build step.');
}
console.log('=====================================');

for (const step of steps) {
  console.log(`\n📦 Running ${step.name}...`);
  const start = Date.now();
  // On Windows, npm needs shell: true or to be npm.cmd, but shell: true is safer generally for scripts
  const result = spawnSync(step.command, step.args, { stdio: 'inherit', shell: true });
  const duration = ((Date.now() - start) / 1000).toFixed(2);

  if (result.status !== 0) {
    if (step.continueOnError) {
      console.warn(
        `⚠️  ${step.name} failed (exit code ${result.status}) but marked as non-fatal. Continuing...`,
      );
    } else {
      console.error(`❌ ${step.name} failed (exit code ${result.status}) in ${duration}s.`);
      process.exit(result.status);
    }
  } else {
    console.log(`✅ ${step.name} passed in ${duration}s.`);
  }
}

console.log('\n=====================================');
console.log('🎉 All verifies passed!');
process.exit(0);
