import { tokenize, printTokens } from '../../engine/parser/tokenizer.js';

console.log('Testing SQL Tokenizer...\n');

const testCases = [
    {
        name: 'Simple SELECT',
        sql: 'SELECT * FROM users'
    },
    {
        name: 'SELECT with WHERE',
        sql: 'SELECT name, age FROM users WHERE age > 25'
    },
    {
        name: 'SELECT with multiple conditions',
        sql: "SELECT id, name FROM users WHERE age >= 18 AND status = 'active'"
    },
    {
        name: 'INSERT statement',
        sql: "INSERT INTO users VALUES (1, 'Alice', 30)"
    },
    {
        name: 'CREATE TABLE',
        sql: 'CREATE TABLE users (id NUMBER, name STRING, age NUMBER)'
    },
    {
        name: 'Complex WHERE with operators',
        sql: 'SELECT * FROM products WHERE price <= 100 AND inStock != FALSE'
    },
    {
        name: 'String with quotes',
        sql: "SELECT * FROM users WHERE name = 'O''Brien'"
    },
    {
        name: 'Negative numbers',
        sql: 'SELECT * FROM transactions WHERE amount < -50.5'
    },
    {
        name: 'Multiple columns',
        sql: 'SELECT id, name, email, age, city FROM users WHERE age > 21'
    },
    {
        name: 'Boolean values',
        sql: 'SELECT * FROM users WHERE isActive = TRUE AND isDeleted = FALSE'
    }
];

let passedTests = 0;
let failedTests = 0;

testCases.forEach((testCase, index) => {
    try {
        console.log(`\nTest ${index + 1}: ${testCase.name}`);
        console.log(`SQL: ${testCase.sql}`);
        
        const tokens = tokenize(testCase.sql);
        printTokens(tokens);
        
        console.log(`✓ Passed (${tokens.length} tokens)`);
        passedTests++;
        
    } catch (error) {
        console.error(`✗ Failed: ${error.message}`);
        failedTests++;
    }
});

console.log('\n' + '='.repeat(60));
console.log(`Test Summary: ${passedTests} passed, ${failedTests} failed`);
console.log('='.repeat(60));

if (failedTests === 0) {
    console.log('\n🎉 All tokenizer tests passed!');
} else {
    console.log(`\n⚠️  ${failedTests} test(s) failed`);
}
