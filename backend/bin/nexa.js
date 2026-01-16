#!/usr/bin/env node

import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { spawn } from 'child_process';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const args = process.argv.slice(2);
const command = args[0];

if (!command) {
    console.log('Usage: nexa <command>');
    console.log('');
    console.log('Commands:');
    console.log('  start    - Start NexaDB interactive CLI');
    console.log('  help     - Show this help message');
    console.log('');
    process.exit(0);
}

switch (command) {
    case 'start':
        console.log('Starting NexaDB CLI...\n');
        const cliPath = join(__dirname, '..', 'cli.js');
        const child = spawn('node', [cliPath], {
            stdio: 'inherit',
            shell: true
        });
        
        child.on('error', (error) => {
            console.error('Failed to start NexaDB:', error.message);
            process.exit(1);
        });
        
        child.on('exit', (code) => {
            process.exit(code);
        });
        break;

    case 'help':
        console.log('NexaDB - Your Custom SQL Database Engine');
        console.log('');
        console.log('Commands:');
        console.log('  nexa start    - Start interactive CLI');
        console.log('  nexa help     - Show this help');
        console.log('');
        console.log('Once in the CLI, you can:');
        console.log('  - Execute SQL queries (CREATE, INSERT, SELECT, UPDATE, DELETE)');
        console.log('  - Use .tables to list all tables');
        console.log('  - Use .schema <table> to view table structure');
        console.log('  - Use .analyze <sql> to analyze queries');
        console.log('  - Use .plan <sql> to see execution plans');
        console.log('  - Use .help for more commands');
        console.log('  - Use .exit to quit');
        console.log('');
        break;

    default:
        console.error(`Unknown command: ${command}`);
        console.log('Run "nexa help" for available commands');
        process.exit(1);
}
