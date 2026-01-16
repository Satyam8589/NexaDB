const SQL_KEYWORDS = new Set([
    'SELECT', 'FROM', 'WHERE', 'INSERT', 'INTO', 'VALUES',
    'CREATE', 'TABLE', 'DELETE', 'UPDATE', 'SET',
    'AND', 'OR', 'NOT', 'NULL', 'TRUE', 'FALSE',
    'ORDER', 'BY', 'ASC', 'DESC', 'LIMIT', 'OFFSET',
    'JOIN', 'LEFT', 'RIGHT', 'INNER', 'OUTER', 'ON',
    'GROUP', 'HAVING', 'DISTINCT', 'AS', 'IN', 'LIKE',
    'BETWEEN', 'IS', 'EXISTS', 'ALL', 'ANY', 'SOME'
]);

const DATA_TYPES = new Set([
    'NUMBER', 'STRING', 'BOOLEAN', 'DATE', 'TEXT', 'INTEGER', 'FLOAT'
]);

const OPERATORS = new Set([
    '=', '!=', '<>', '<', '>', '<=', '>=',
    '+', '-', '*', '/', '%',
    '(', ')', ',', ';', '.'
]);

class Token {
    constructor(type, value, position) {
        this.type = type;
        this.value = value;
        this.position = position;
    }
}

export function tokenize(sql) {
    const tokens = [];
    let position = 0;
    const input = sql.trim();

    while (position < input.length) {
        const char = input[position];

        if (/\s/.test(char)) {
            position++;
            continue;
        }

        if (char === "'" || char === '"') {
            const stringToken = readString(input, position, char);
            tokens.push(stringToken);
            position = stringToken.endPosition;
            continue;
        }

        if (/[0-9]/.test(char) || (char === '-' && /[0-9]/.test(input[position + 1]))) {
            const numberToken = readNumber(input, position);
            tokens.push(numberToken);
            position = numberToken.endPosition;
            continue;
        }

        if (/[a-zA-Z_]/.test(char)) {
            const wordToken = readWord(input, position);
            const upperValue = wordToken.value.toUpperCase();

            if (SQL_KEYWORDS.has(upperValue)) {
                tokens.push(new Token('KEYWORD', upperValue, position));
            } else if (DATA_TYPES.has(upperValue)) {
                tokens.push(new Token('TYPE', upperValue, position));
            } else {
                tokens.push(new Token('IDENTIFIER', wordToken.value, position));
            }

            position = wordToken.endPosition;
            continue;
        }

        const twoCharOp = input.substring(position, position + 2);
        if (OPERATORS.has(twoCharOp)) {
            tokens.push(new Token('OPERATOR', twoCharOp, position));
            position += 2;
            continue;
        }

        if (OPERATORS.has(char)) {
            tokens.push(new Token('OPERATOR', char, position));
            position++;
            continue;
        }

        if (char === '*') {
            tokens.push(new Token('WILDCARD', '*', position));
            position++;
            continue;
        }

        throw new Error(`Unexpected character '${char}' at position ${position}`);
    }

    return tokens;
}

function readString(input, startPos, quoteChar) {
    let position = startPos + 1;
    let value = '';

    while (position < input.length) {
        const char = input[position];

        if (char === quoteChar) {
            if (input[position + 1] === quoteChar) {
                value += quoteChar;
                position += 2;
            } else {
                return {
                    type: 'STRING',
                    value: value,
                    position: startPos,
                    endPosition: position + 1
                };
            }
        } else if (char === '\\' && position + 1 < input.length) {
            const nextChar = input[position + 1];
            if (nextChar === 'n') value += '\n';
            else if (nextChar === 't') value += '\t';
            else if (nextChar === 'r') value += '\r';
            else if (nextChar === '\\') value += '\\';
            else value += nextChar;
            position += 2;
        } else {
            value += char;
            position++;
        }
    }

    throw new Error(`Unterminated string starting at position ${startPos}`);
}

function readNumber(input, startPos) {
    let position = startPos;
    let value = '';
    let hasDecimal = false;

    if (input[position] === '-') {
        value += '-';
        position++;
    }

    while (position < input.length) {
        const char = input[position];

        if (/[0-9]/.test(char)) {
            value += char;
            position++;
        } else if (char === '.' && !hasDecimal) {
            hasDecimal = true;
            value += char;
            position++;
        } else {
            break;
        }
    }

    return {
        type: 'NUMBER',
        value: hasDecimal ? parseFloat(value) : parseInt(value),
        position: startPos,
        endPosition: position
    };
}

function readWord(input, startPos) {
    let position = startPos;
    let value = '';

    while (position < input.length) {
        const char = input[position];

        if (/[a-zA-Z0-9_]/.test(char)) {
            value += char;
            position++;
        } else {
            break;
        }
    }

    return {
        value: value,
        endPosition: position
    };
}

export function printTokens(tokens) {
    console.log('\nTokens:');
    console.log('─'.repeat(60));
    tokens.forEach((token, index) => {
        console.log(`${index.toString().padStart(3)}. ${token.type.padEnd(12)} | ${token.value}`);
    });
    console.log('─'.repeat(60));
}

export default { tokenize, printTokens };
