import readline from 'readline';
import { executeSQL, listTables, getTableInfo } from './engine/index.js';
import { analyzeQuery, generateExecutionPlan } from './engine/executor/queryPlanner.js';
import { parse } from './engine/parser/parser.js';
import storageManager from './engine/storage/storageManager.js';

const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});

function updatePrompt() {
    const db = storageManager.getCurrentDatabase();
    rl.setPrompt(`NexaDB [${db}]> `);
}

console.log('╔════════════════════════════════════════════════════════════╗');
console.log('║                    Welcome to NexaDB                       ║');
console.log('║              Your Custom SQL Database Engine               ║');
console.log('╚════════════════════════════════════════════════════════════╝');
console.log('');
console.log('Database Operations:');
console.log('  CREATE DATABASE <name> - Create a new database');
console.log('  DROP DATABASE <name>   - Delete a database');
console.log('  USE <name>             - Switch to a database');
console.log('  SHOW DATABASES         - List all databases');
console.log('  SHOW TABLES            - List all tables in current DB');
console.log('');
console.log('SQL queries:');
console.log('  SELECT, INSERT, UPDATE, DELETE, CREATE TABLE');
console.log('');
console.log('Special Commands:');
console.log('  .tables         - List all tables');
console.log('  .schema <table> - Show table schema');
console.log('  .analyze <sql>  - Analyze query');
console.log('  .plan <sql>     - Show execution plan');
console.log('  .help           - Show full help');
console.log('  .exit           - Exit NexaDB');
console.log('');

updatePrompt();
rl.prompt();

rl.on('line', (line) => {
    const input = line.trim();

    if (!input) {
        rl.prompt();
        return;
    }

    try {
        // Special commands
        if (input === '.exit') {
            console.log('Goodbye!');
            process.exit(0);
        }

        if (input === '.help') {
            showHelp();
            updatePrompt();
            rl.prompt();
            return;
        }

        if (input === '.tables') {
            const tables = listTables();
            if (tables.length === 0) {
                console.log('No tables found in current database.');
            } else {
                console.log('\nTables:');
                tables.forEach(table => console.log(`  - ${table}`));
            }
            updatePrompt();
            rl.prompt();
            return;
        }

        if (input.startsWith('.schema ')) {
            const tableName = input.substring(8).trim();
            try {
                const info = getTableInfo(tableName);
                console.log('\nTable:', info.table);
                console.log('Database:', info.stats.database);
                console.log('\nColumns:');
                info.schema.columns.forEach(col => {
                    console.log(`  ${col.name.padEnd(20)} ${col.type}`);
                });
                console.log('\nStats:');
                console.log(`  Rows: ${info.stats.rowCount}`);
                console.log(`  Size: ${info.stats.fileSizeKB} KB`);
                console.log(`  Created: ${new Date(info.stats.createdAt).toLocaleString()}`);
            } catch (error) {
                console.error('Error:', error.message);
            }
            updatePrompt();
            rl.prompt();
            return;
        }

        if (input.startsWith('.analyze ')) {
            const sql = input.substring(9).trim();
            try {
                const ast = parse(sql);
                const analysis = analyzeQuery(ast);
                console.log('\nQuery Analysis:');
                console.log(JSON.stringify(analysis, null, 2));
            } catch (error) {
                console.error('Error:', error.message);
            }
            updatePrompt();
            rl.prompt();
            return;
        }

        if (input.startsWith('.plan ')) {
            const sql = input.substring(6).trim();
            try {
                const ast = parse(sql);
                const plan = generateExecutionPlan(ast);
                console.log('\nExecution Plan:');
                console.log('─'.repeat(60));
                plan.steps.forEach(step => {
                    console.log(`${step.order}. ${step.operation.padEnd(15)} ${step.description}`);
                });
                console.log('─'.repeat(60));
                console.log(`Estimated time: ${plan.estimatedTime}ms`);
            } catch (error) {
                console.error('Error:', error.message);
            }
            updatePrompt();
            rl.prompt();
            return;
        }

        // Execute SQL
        const startTime = Date.now();
        const result = executeSQL(input);
        const executionTime = Date.now() - startTime;

        if (result.success) {
            console.log('');
            
            if (result.data && Array.isArray(result.data)) {
                // Determine if we should show headers (for SELECT queries)
                const isQuery = result.columns && Array.isArray(result.columns);
                
                if (result.data.length > 0) {
                    if (typeof result.data[0] === 'string') {
                        result.data.forEach(item => console.log(`  - ${item}`));
                    } else {
                        displayTable(result.data, result.columns);
                    }
                    console.log(`\n${result.data.length} item(s) in result`);
                } else if (isQuery) {
                    // Show empty table with headers
                    displayTable([], result.columns);
                    console.log('\n0 row(s) returned (Empty table)');
                } else {
                    console.log('No results.');
                }
            } else {
                console.log('✓', result.message);
                if (result.rowCount !== undefined) {
                    console.log(`  Rows affected: ${result.rowCount}`);
                }
            }
            
            console.log(`\nExecution time: ${executionTime}ms`);
        } else {
            console.error('\n✗ Error:', result.error);
        }

    } catch (error) {
        console.error('\n✗ Error:', error.message);
    }

    console.log('');
    updatePrompt();
    rl.prompt();
});

rl.on('close', () => {
    console.log('\nGoodbye!');
    process.exit(0);
});

function displayTable(rows, explicitColumns = null) {
    const columns = explicitColumns || (rows.length > 0 ? Object.keys(rows[0]) : []);
    if (columns.length === 0) return;

    const columnWidths = {};

    // Calculate column widths
    columns.forEach(col => {
        columnWidths[col] = Math.max(
            col.length,
            ...rows.map(row => String(row[col] ?? 'NULL').length)
        );
    });

    // Print header
    console.log('┌' + columns.map(col => '─'.repeat(columnWidths[col] + 2)).join('┬') + '┐');
    console.log('│ ' + columns.map(col => col.padEnd(columnWidths[col])).join(' │ ') + ' │');
    console.log('├' + columns.map(col => '─'.repeat(columnWidths[col] + 2)).join('┼') + '┤');

    // Print rows (if any)
    rows.forEach(row => {
        console.log('│ ' + columns.map(col => {
            const value = row[col] ?? 'NULL';
            return String(value).padEnd(columnWidths[col]);
        }).join(' │ ') + ' │');
    });

    console.log('└' + columns.map(col => '─'.repeat(columnWidths[col] + 2)).join('┴') + '┘');
}

function showHelp() {
    console.log('\nNexaDB Full Help:');
    console.log('\nDatabase Statements:');
    console.log('  CREATE DATABASE <name>');
    console.log('  DROP DATABASE <name>');
    console.log('  USE <name>');
    console.log('  SHOW DATABASES');
    console.log('  SHOW TABLES');
    console.log('\nTable Statements:');
    console.log('  CREATE TABLE users (id NUMBER, name STRING, age NUMBER)');
    console.log('  DROP TABLE users');
    console.log('  INSERT INTO users VALUES (1, \'Alice\', 30)');
    console.log('  SELECT * FROM users');
    console.log('  UPDATE users SET age = 31 WHERE name = \'Alice\'');
    console.log('  DELETE FROM users WHERE age < 18');
    console.log('\nSpecial Commands:');
    console.log('  .tables              - List all tables');
    console.log('  .schema <table>      - Show table schema and stats');
    console.log('  .analyze <sql>       - Analyze query');
    console.log('  .plan <sql>          - Show execution plan');
    console.log('  .exit                - Exit NexaDB');
    console.log('');
}
