#!/usr/bin/env node

/**
 * Fetch Firebase Config Script
 * 
 * Automatically fetches the Firebase Web App configuration from the project
 * and updates the local .env file.
 * 
 * Usage: node scripts/fetch-config.js [project-id]
 */

import { execSync } from 'child_process';
import { writeFileSync, readFileSync, existsSync } from 'fs';
import { join } from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const projectRoot = join(__dirname, '..');

const GREEN = '\x1b[32m';
const RED = '\x1b[31m';
const YELLOW = '\x1b[33m';
const NC = '\x1b[0m';

function getProjectId() {
    // Try to get from command line arg
    if (process.argv[2]) return process.argv[2];

    // Try to get from .firebaserc
    try {
        const firebasercPath = join(projectRoot, '.firebaserc');
        if (existsSync(firebasercPath)) {
            const firebaserc = JSON.parse(readFileSync(firebasercPath, 'utf8'));
            return firebaserc.projects?.default;
        }
    } catch (e) {
        // ignore
    }
    return null;
}

function parseSdkConfig(output) {
    // The output might contain "✔ Downloading..." lines, so we look for the JSON object
    const jsonStart = output.indexOf('{');
    const jsonEnd = output.lastIndexOf('}');

    if (jsonStart === -1 || jsonEnd === -1) {
        throw new Error('Could not find JSON object in output');
    }

    const jsonStr = output.substring(jsonStart, jsonEnd + 1);
    return JSON.parse(jsonStr);
}

async function main() {
    console.log(`${YELLOW}🔄 Fetching Firebase configuration...${NC}`);

    // 1. Determine Project ID
    const projectId = getProjectId();
    if (!projectId) {
        console.error(`${RED}❌ Could not determine Firebase Project ID.${NC}`);
        console.log(`Usage: node scripts/fetch-config.js [project-id]`);
        console.log(`Or ensure .firebaserc exists with a default project.`);
        process.exit(1);
    }
    console.log(`   Project ID: ${projectId}`);

    try {
        // 2. Find Web App ID
        console.log(`   Looking for Web App in project...`);
        const appsJson = execSync(`firebase apps:list --project ${projectId} --json`, { encoding: 'utf8', stdio: ['pipe', 'pipe', 'pipe'] });
        const apps = JSON.parse(appsJson).result;

        const webApp = apps.find(app => app.platform === 'WEB');
        if (!webApp) {
            console.error(`${RED}❌ No Web App found in project ${projectId}.${NC}`);
            console.log('   Please create a Web App in the Firebase Console first.');
            process.exit(1);
        }
        console.log(`   Found Web App: ${webApp.displayName} (${webApp.appId})`);

        // 3. Get SDK Config
        console.log(`   Downloading SDK config...`);
        // Note: providing "WEB" as platform argument as discovered
        const sdkConfigOutput = execSync(`firebase apps:sdkconfig WEB ${webApp.appId} --project ${projectId}`, { encoding: 'utf8', stdio: ['pipe', 'pipe', 'pipe'] });
        const config = parseSdkConfig(sdkConfigOutput);

        // 4. Map to Environment Variables
        const envVars = {
            'VITE_API_KEY': config.apiKey,
            'VITE_AUTH_DOMAIN': config.authDomain,
            'VITE_PROJECT_ID': config.projectId,
            'VITE_STORAGE_BUCKET': config.storageBucket,
            'VITE_MESSAGING_SENDER_ID': config.messagingSenderId,
            'VITE_APP_ID': config.appId
        };

        // 5. Update .env
        const envPath = join(projectRoot, '.env');
        let envContent = '';
        let existingEnv = {};

        // Read existing .env if it exists
        if (existsSync(envPath)) {
            const current = readFileSync(envPath, 'utf8');
            current.split('\n').forEach(line => {
                const match = line.match(/^([^=]+)=(.*)$/);
                if (match) {
                    const key = match[1].trim();
                    // Don't keep existing values if they are placeholders or we are overwriting them
                    if (!envVars[key]) {
                        existingEnv[key] = match[2].trim();
                    }
                } else if (line.trim() !== '' && !line.startsWith('#')) {
                    // preserve other lines? hard to do perfectly, simple merge approach
                }
            });
        }

        // Merge: New values take precedence
        const finalEnv = { ...existingEnv, ...envVars };

        // Generate content
        const content = Object.entries(finalEnv)
            .map(([k, v]) => `${k}=${v}`)
            .join('\n');

        // Add header
        const fileContent = `# Auto-updated by scripts/fetch-config.js on ${new Date().toISOString()}\n${content}\n`;

        writeFileSync(envPath, fileContent);
        console.log(`${GREEN}✅ Successfully updated .env with remote configuration!${NC}`);

    } catch (error) {
        if (error.stderr) {
            console.error(`${RED}❌ Firebase CLI Error:${NC}\n${error.stderr}`);
        } else {
            console.error(`${RED}❌ Failed to fetch configuration:${NC}`, error.message);
        }
        process.exit(1);
    }
}

main();
