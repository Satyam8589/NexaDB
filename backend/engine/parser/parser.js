import { tokenize } from './tokenizer.js';

class Parser {
    constructor(tokens) {
        this.tokens = tokens;
        this.position = 0;
    }

    currentToken() {
        return this.tokens[this.position];
    }

    peek(offset = 1) {
        return this.tokens[this.position + offset];
    }

    advance() {
        this.position++;
    }

    expect(type, value = null) {
        const token = this.currentToken();
        
        if (!token) {
            throw new Error(`Expected ${type}${value ? ` '${value}'` : ''} but reached end of input`);
        }

        if (token.type !== type) {
            throw new Error(`Expected ${type} but got ${token.type} at position ${token.position}`);
        }

        if (value !== null && token.value !== value) {
            throw new Error(`Expected '${value}' but got '${token.value}' at position ${token.position}`);
        }

        const result = token;
        this.advance();
        return result;
    }

    match(type, value = null) {
        const token = this.currentToken();
        if (!token) return false;
        if (token.type !== type) return false;
        if (value !== null && token.value !== value) return false;
        return true;
    }

    parseStatement() {
        const token = this.currentToken();

        if (!token) {
            throw new Error('Empty SQL statement');
        }

        switch (token.value) {
            case 'SELECT':
                return this.parseSelect();
            case 'INSERT':
                return this.parseInsert();
            case 'CREATE':
                return this.parseCreate();
            case 'DROP':
                return this.parseDrop();
            case 'USE':
                return this.parseUse();
            case 'SHOW':
                return this.parseShow();
            case 'DELETE':
                return this.parseDelete();
            case 'UPDATE':
                return this.parseUpdate();
            default:
                throw new Error(`Unsupported statement: ${token.value}`);
        }
    }

    parseUse() {
        this.expect('KEYWORD', 'USE');
        const dbName = this.expect('IDENTIFIER').value;
        return {
            type: 'USE',
            database: dbName
        };
    }

    parseShow() {
        this.expect('KEYWORD', 'SHOW');
        const target = this.expect('KEYWORD').value;
        
        if (target === 'DATABASES') {
            return { type: 'SHOW_DATABASES' };
        } else if (target === 'TABLES') {
            return { type: 'SHOW_TABLES' };
        } else {
            throw new Error(`Unsupported SHOW target: ${target}`);
        }
    }

    parseDrop() {
        this.expect('KEYWORD', 'DROP');
        const target = this.expect('KEYWORD').value;
        
        if (target === 'DATABASE') {
            const dbName = this.expect('IDENTIFIER').value;
            return { type: 'DROP_DATABASE', database: dbName };
        } else if (target === 'TABLE') {
            const tableName = this.expect('IDENTIFIER').value;
            return { type: 'DROP_TABLE', table: tableName };
        } else {
            throw new Error(`Unsupported DROP target: ${target}`);
        }
    }

    parseSelect() {
        this.expect('KEYWORD', 'SELECT');

        const columns = this.parseColumnList();

        this.expect('KEYWORD', 'FROM');
        const table = this.expect('IDENTIFIER').value;

        let where = null;
        if (this.match('KEYWORD', 'WHERE')) {
            this.advance();
            where = this.parseWhereClause();
        }

        return {
            type: 'SELECT',
            columns,
            table,
            where
        };
    }

    parseInsert() {
        this.expect('KEYWORD', 'INSERT');
        this.expect('KEYWORD', 'INTO');

        const table = this.expect('IDENTIFIER').value;

        this.expect('KEYWORD', 'VALUES');
        this.expect('OPERATOR', '(');

        const values = this.parseValueList();

        this.expect('OPERATOR', ')');

        return {
            type: 'INSERT',
            table,
            values
        };
    }

    parseCreate() {
        this.expect('KEYWORD', 'CREATE');
        const target = this.expect('KEYWORD').value;

        if (target === 'DATABASE') {
            const dbName = this.expect('IDENTIFIER').value;
            return {
                type: 'CREATE_DATABASE',
                database: dbName
            };
        } else if (target === 'TABLE') {
            const table = this.expect('IDENTIFIER').value;
            this.expect('OPERATOR', '(');
            const columns = this.parseColumnDefinitions();
            this.expect('OPERATOR', ')');
            return {
                type: 'CREATE',
                table,
                columns
            };
        } else {
            throw new Error(`Unsupported CREATE target: ${target}`);
        }
    }

    parseDelete() {
        this.expect('KEYWORD', 'DELETE');
        this.expect('KEYWORD', 'FROM');

        const table = this.expect('IDENTIFIER').value;

        let where = null;
        if (this.match('KEYWORD', 'WHERE')) {
            this.advance();
            where = this.parseWhereClause();
        }

        return {
            type: 'DELETE',
            table,
            where
        };
    }

    parseUpdate() {
        this.expect('KEYWORD', 'UPDATE');

        const table = this.expect('IDENTIFIER').value;

        this.expect('KEYWORD', 'SET');

        const updates = this.parseUpdateList();

        let where = null;
        if (this.match('KEYWORD', 'WHERE')) {
            this.advance();
            where = this.parseWhereClause();
        }

        return {
            type: 'UPDATE',
            table,
            updates,
            where
        };
    }

    parseColumnList() {
        const columns = [];

        if (this.match('OPERATOR', '*') || this.match('WILDCARD', '*')) {
            this.advance();
            return ['*'];
        }

        columns.push(this.expect('IDENTIFIER').value);

        while (this.match('OPERATOR', ',')) {
            this.advance();
            columns.push(this.expect('IDENTIFIER').value);
        }

        return columns;
    }

    parseValueList() {
        const values = [];

        values.push(this.parseValue());

        while (this.match('OPERATOR', ',')) {
            this.advance();
            values.push(this.parseValue());
        }

        return values;
    }

    parseValue() {
        const token = this.currentToken();

        if (token.type === 'STRING') {
            this.advance();
            return token.value;
        }

        if (token.type === 'NUMBER') {
            this.advance();
            return token.value;
        }

        if (token.type === 'KEYWORD') {
            if (token.value === 'TRUE') {
                this.advance();
                return true;
            }
            if (token.value === 'FALSE') {
                this.advance();
                return false;
            }
            if (token.value === 'NULL') {
                this.advance();
                return null;
            }
        }

        throw new Error(`Expected value but got ${token.type} at position ${token.position}`);
    }

    parseColumnDefinitions() {
        const columns = [];

        columns.push(this.parseColumnDefinition());

        while (this.match('OPERATOR', ',')) {
            this.advance();
            columns.push(this.parseColumnDefinition());
        }

        return columns;
    }

    parseColumnDefinition() {
        const name = this.expect('IDENTIFIER').value;
        const type = this.expect('TYPE').value;

        return { name, type };
    }

    parseWhereClause() {
        const conditions = [];

        conditions.push(this.parseCondition());

        while (this.match('KEYWORD', 'AND') || this.match('KEYWORD', 'OR')) {
            const operator = this.currentToken().value;
            this.advance();
            conditions.push({
                logicalOperator: operator,
                condition: this.parseCondition()
            });
        }

        if (conditions.length === 1) {
            return conditions[0];
        }

        return {
            type: 'COMPOUND',
            conditions
        };
    }

    parseCondition() {
        const column = this.expect('IDENTIFIER').value;
        const operator = this.expect('OPERATOR').value;
        const value = this.parseValue();

        return {
            column,
            operator,
            value
        };
    }

    parseUpdateList() {
        const updates = [];

        updates.push(this.parseUpdateAssignment());

        while (this.match('OPERATOR', ',')) {
            this.advance();
            updates.push(this.parseUpdateAssignment());
        }

        return updates;
    }

    parseUpdateAssignment() {
        const column = this.expect('IDENTIFIER').value;
        this.expect('OPERATOR', '=');
        const value = this.parseValue();

        return { column, value };
    }
}

export function parse(sql) {
    const tokens = tokenize(sql);
    const parser = new Parser(tokens);
    return parser.parseStatement();
}

export function parseTokens(tokens) {
    const parser = new Parser(tokens);
    return parser.parseStatement();
}

export default { parse, parseTokens };
