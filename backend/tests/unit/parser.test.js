import { parse } from '../../engine/parser/parser.js';

console.log('Testing SQL Parser...\n');

const testCases = [
    {
        name: 'Simple SELECT *',
        sql: 'SELECT * FROM users',
        expected: {
            type: 'SELECT',
            columns: ['*'],
            table: 'users',
            where: null
        }
    },
    {
        name: 'SELECT specific columns',
        sql: 'SELECT id, name, age FROM users',
        expected: {
            type: 'SELECT',
            columns: ['id', 'name', 'age'],
            table: 'users',
            where: null
        }
    },
    {
        name: 'SELECT with WHERE',
        sql: 'SELECT name FROM users WHERE age > 25',
        expected: {
            type: 'SELECT',
            columns: ['name'],
            table: 'users',
            where: {
                column: 'age',
                operator: '>',
                value: 25
            }
        }
    },
    {
        name: 'SELECT with compound WHERE',
        sql: "SELECT * FROM users WHERE age >= 18 AND status = 'active'",
        expected: {
            type: 'SELECT',
            columns: ['*'],
            table: 'users',
            where: {
                type: 'COMPOUND',
                conditions: [
                    { column: 'age', operator: '>=', value: 18 },
                    {
                        logicalOperator: 'AND',
                        condition: { column: 'status', operator: '=', value: 'active' }
                    }
                ]
            }
        }
    },
    {
        name: 'INSERT statement',
        sql: "INSERT INTO users VALUES (1, 'Alice', 30)",
        expected: {
            type: 'INSERT',
            table: 'users',
            values: [1, 'Alice', 30]
        }
    },
    {
        name: 'INSERT with boolean',
        sql: "INSERT INTO users VALUES (1, 'Bob', TRUE)",
        expected: {
            type: 'INSERT',
            table: 'users',
            values: [1, 'Bob', true]
        }
    },
    {
        name: 'CREATE TABLE',
        sql: 'CREATE TABLE users (id NUMBER, name STRING, age NUMBER)',
        expected: {
            type: 'CREATE',
            table: 'users',
            columns: [
                { name: 'id', type: 'NUMBER' },
                { name: 'name', type: 'STRING' },
                { name: 'age', type: 'NUMBER' }
            ]
        }
    },
    {
        name: 'DELETE without WHERE',
        sql: 'DELETE FROM users',
        expected: {
            type: 'DELETE',
            table: 'users',
            where: null
        }
    },
    {
        name: 'DELETE with WHERE',
        sql: 'DELETE FROM users WHERE age < 18',
        expected: {
            type: 'DELETE',
            table: 'users',
            where: {
                column: 'age',
                operator: '<',
                value: 18
            }
        }
    },
    {
        name: 'UPDATE statement',
        sql: "UPDATE users SET status = 'inactive' WHERE age > 65",
        expected: {
            type: 'UPDATE',
            table: 'users',
            updates: [
                { column: 'status', value: 'inactive' }
            ],
            where: {
                column: 'age',
                operator: '>',
                value: 65
            }
        }
    },
    {
        name: 'UPDATE multiple columns',
        sql: "UPDATE users SET name = 'John', age = 30 WHERE id = 1",
        expected: {
            type: 'UPDATE',
            table: 'users',
            updates: [
                { column: 'name', value: 'John' },
                { column: 'age', value: 30 }
            ],
            where: {
                column: 'id',
                operator: '=',
                value: 1
            }
        }
    }
];

let passedTests = 0;
let failedTests = 0;

testCases.forEach((testCase, index) => {
    try {
        console.log(`\nTest ${index + 1}: ${testCase.name}`);
        console.log(`SQL: ${testCase.sql}`);
        
        const ast = parse(testCase.sql);
        
        console.log('Generated AST:');
        console.log(JSON.stringify(ast, null, 2));
        
        const matches = JSON.stringify(ast) === JSON.stringify(testCase.expected);
        
        if (matches) {
            console.log('✓ Passed - AST matches expected structure');
            passedTests++;
        } else {
            console.log('✗ Failed - AST does not match expected');
            console.log('Expected:');
            console.log(JSON.stringify(testCase.expected, null, 2));
            failedTests++;
        }
        
    } catch (error) {
        console.error(`✗ Failed: ${error.message}`);
        failedTests++;
    }
});

console.log('\n' + '='.repeat(60));
console.log(`Test Summary: ${passedTests} passed, ${failedTests} failed`);
console.log('='.repeat(60));

if (failedTests === 0) {
    console.log('\n🎉 All parser tests passed!');
} else {
    console.log(`\n⚠️  ${failedTests} test(s) failed`);
}
