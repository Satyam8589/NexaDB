import readline from 'readline';
import { executeSQL, listTables, getTableInfo } from './engine/index.js';
import { analyzeQuery, generateExecutionPlan } from './engine/executor/queryPlanner.js';
import { parse } from './engine/parser/parser.js';

const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
    prompt: 'NexaDB> '
});

console.log('╔════════════════════════════════════════════════════════════╗');
console.log('║                    Welcome to NexaDB                       ║');
console.log('║              Your Custom SQL Database Engine               ║');
console.log('╚════════════════════════════════════════════════════════════╝');
console.log('');
console.log('Commands:');
console.log('  SQL queries     - Execute any SQL statement');
console.log('  .tables         - List all tables');
console.log('  .schema <table> - Show table schema');
console.log('  .analyze <sql>  - Analyze query without executing');
console.log('  .plan <sql>     - Show execution plan');
console.log('  .help           - Show this help');
console.log('  .exit           - Exit NexaDB');
console.log('');

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
            rl.prompt();
            return;
        }

        if (input === '.tables') {
            const tables = listTables();
            if (tables.length === 0) {
                console.log('No tables found.');
            } else {
                console.log('\nTables:');
                tables.forEach(table => console.log(`  - ${table}`));
            }
            rl.prompt();
            return;
        }

        if (input.startsWith('.schema ')) {
            const tableName = input.substring(8).trim();
            try {
                const info = getTableInfo(tableName);
                console.log('\nTable:', info.table);
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
                // Display results in table format
                if (result.data.length > 0) {
                    displayTable(result.data);
                    console.log(`\n${result.rowCount} row(s) returned`);
                } else {
                    console.log('No rows returned');
                }
            } else {
                console.log('✓', result.message);
                if (result.rowCount !== undefined) {
                    console.log(`  Rows affected: ${result.rowCount}`);
                }
                if (result.updatedCount !== undefined) {
                    console.log(`  Rows updated: ${result.updatedCount}`);
                }
                if (result.deletedCount !== undefined) {
                    console.log(`  Rows deleted: ${result.deletedCount}`);
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
    rl.prompt();
});

rl.on('close', () => {
    console.log('\nGoodbye!');
    process.exit(0);
});

function displayTable(rows) {
    if (rows.length === 0) return;

    const columns = Object.keys(rows[0]);
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

    // Print rows
    rows.forEach(row => {
        console.log('│ ' + columns.map(col => {
            const value = row[col] ?? 'NULL';
            return String(value).padEnd(columnWidths[col]);
        }).join(' │ ') + ' │');
    });

    console.log('└' + columns.map(col => '─'.repeat(columnWidths[col] + 2)).join('┴') + '┘');
}

function showHelp() {
    console.log('\nNexaDB Commands:');
    console.log('');
    console.log('SQL Statements:');
    console.log('  CREATE TABLE users (id NUMBER, name STRING, age NUMBER)');
    console.log('  INSERT INTO users VALUES (1, \'Alice\', 30)');
    console.log('  SELECT * FROM users');
    console.log('  SELECT name, age FROM users WHERE age > 25');
    console.log('  UPDATE users SET age = 31 WHERE name = \'Alice\'');
    console.log('  DELETE FROM users WHERE age < 18');
    console.log('');
    console.log('Special Commands:');
    console.log('  .tables              - List all tables');
    console.log('  .schema <table>      - Show table schema and stats');
    console.log('  .analyze <sql>       - Analyze query (cost, complexity, recommendations)');
    console.log('  .plan <sql>          - Show execution plan');
    console.log('  .help                - Show this help');
    console.log('  .exit                - Exit NexaDB');
    console.log('');
}
