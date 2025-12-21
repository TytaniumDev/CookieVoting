/**
 * Clear emulator data directory (cross-platform)
 */

import { rmSync, existsSync } from 'fs';
import { join } from 'path';

const emulatorDataDir = join(process.cwd(), 'emulator-data');

if (existsSync(emulatorDataDir)) {
    try {
        rmSync(emulatorDataDir, { recursive: true, force: true });
        console.log('✅ Cleared emulator data directory');
    } catch (error) {
        console.error('❌ Error clearing emulator data:', error);
        process.exit(1);
    }
} else {
    console.log('ℹ️  Emulator data directory does not exist');
}

