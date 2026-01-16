# 🚀 NexaDB CLI Quick Start Guide

## How to Use the Interactive Terminal

### 1. Start the CLI

```bash
cd backend
npm run cli
```

You'll see:
```
╔════════════════════════════════════════════════════════════╗
║                    Welcome to NexaDB                       ║
║              Your Custom SQL Database Engine               ║
╚════════════════════════════════════════════════════════════╝

NexaDB>
```

---

## 2. Try These Example Commands

### Create a Table
```sql
NexaDB> CREATE TABLE users (id NUMBER, name STRING, age NUMBER, email STRING)
```

### Insert Data
```sql
NexaDB> INSERT INTO users VALUES (1, 'Alice', 30, 'alice@example.com')
NexaDB> INSERT INTO users VALUES (2, 'Bob', 25, 'bob@example.com')
NexaDB> INSERT INTO users VALUES (3, 'Charlie', 35, 'charlie@example.com')
```

### Query Data
```sql
NexaDB> SELECT * FROM users
```

Output:
```
┌──────┬───────────┬───────┬─────────────────────┐
│ id   │ name      │ age   │ email               │
├──────┼───────────┼───────┼─────────────────────┤
│ 1    │ Alice     │ 30    │ alice@example.com   │
│ 2    │ Bob       │ 25    │ bob@example.com     │
│ 3    │ Charlie   │ 35    │ charlie@example.com │
└──────┴───────────┴───────┴─────────────────────┘

3 row(s) returned
```

### Filter with WHERE
```sql
NexaDB> SELECT name, age FROM users WHERE age > 25
```

### Update Data
```sql
NexaDB> UPDATE users SET age = 31 WHERE name = 'Alice'
```

### Delete Data
```sql
NexaDB> DELETE FROM users WHERE age < 26
```

---

## 3. Special Commands

### List All Tables
```
NexaDB> .tables
```

### Show Table Schema
```
NexaDB> .schema users
```

Output:
```
Table: users

Columns:
  id                   NUMBER
  name                 STRING
  age                  NUMBER
  email                STRING

Stats:
  Rows: 3
  Size: 0.85 KB
  Created: 1/16/2026, 12:30:00 PM
```

### Analyze Query (without executing)
```
NexaDB> .analyze SELECT * FROM users WHERE age > 25
```

Output:
```json
{
  "queryType": "SELECT",
  "complexity": "MODERATE",
  "estimatedCost": 13,
  "estimatedRows": 0,
  "recommendations": [
    "Consider selecting only needed columns instead of *"
  ],
  "warnings": []
}
```

### Show Execution Plan
```
NexaDB> .plan SELECT name, age FROM users WHERE age > 25
```

Output:
```
Execution Plan:
────────────────────────────────────────────────────────────
1. TABLE_SCAN      Scan table 'users'
2. FILTER          Filter: age > 25
3. PROJECT         Select columns: name, age
────────────────────────────────────────────────────────────
Estimated time: 30ms
```

### Get Help
```
NexaDB> .help
```

### Exit
```
NexaDB> .exit
```

---

## 4. Complete Example Session

```sql
-- Create a products table
NexaDB> CREATE TABLE products (id NUMBER, name STRING, price NUMBER, inStock BOOLEAN)

-- Insert some products
NexaDB> INSERT INTO products VALUES (1, 'Laptop', 999.99, TRUE)
NexaDB> INSERT INTO products VALUES (2, 'Mouse', 29.99, TRUE)
NexaDB> INSERT INTO products VALUES (3, 'Keyboard', 79.99, FALSE)
NexaDB> INSERT INTO products VALUES (4, 'Monitor', 299.99, TRUE)

-- Query all products
NexaDB> SELECT * FROM products

-- Find expensive products
NexaDB> SELECT name, price FROM products WHERE price > 100

-- Update a product
NexaDB> UPDATE products SET inStock = TRUE WHERE name = 'Keyboard'

-- Delete cheap products
NexaDB> DELETE FROM products WHERE price < 50

-- Check what's left
NexaDB> SELECT * FROM products

-- See table info
NexaDB> .schema products

-- List all tables
NexaDB> .tables

-- Exit
NexaDB> .exit
```

---

## 5. Supported SQL Syntax

### CREATE TABLE
```sql
CREATE TABLE table_name (
    column1 TYPE,
    column2 TYPE,
    ...
)
```

**Supported Types:** NUMBER, STRING, BOOLEAN, DATE, TEXT, INTEGER, FLOAT

### INSERT
```sql
INSERT INTO table_name VALUES (value1, value2, ...)
```

### SELECT
```sql
SELECT * FROM table_name
SELECT column1, column2 FROM table_name
SELECT * FROM table_name WHERE condition
SELECT * FROM table_name WHERE condition1 AND condition2
SELECT * FROM table_name WHERE condition1 OR condition2
```

**Supported Operators:** =, !=, <>, <, >, <=, >=

### UPDATE
```sql
UPDATE table_name SET column1 = value1
UPDATE table_name SET column1 = value1 WHERE condition
UPDATE table_name SET column1 = value1, column2 = value2 WHERE condition
```

### DELETE
```sql
DELETE FROM table_name
DELETE FROM table_name WHERE condition
```

---

## 6. Tips & Tricks

1. **Use `.analyze`** before running complex queries to see cost estimates
2. **Use `.plan`** to understand how your query will be executed
3. **Avoid `SELECT *`** - select only the columns you need
4. **Always use WHERE** in UPDATE and DELETE to avoid modifying all rows
5. **Check `.schema`** to see table structure and stats

---

## 7. Troubleshooting

**Error: Table does not exist**
- Use `.tables` to see available tables
- Check spelling of table name

**Error: Column does not exist**
- Use `.schema table_name` to see available columns
- Check spelling of column name

**Error: Type mismatch**
- Check that your values match the column types
- Use `.schema table_name` to see column types

---

Enjoy using NexaDB! 🎉
