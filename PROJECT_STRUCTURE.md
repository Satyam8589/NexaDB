# 🗂️ NexaDB - Project Structure

## 📋 Complete Folder Structure

```
NexaDB/
│
├── backend/                          # Backend database engine
│   │
│   ├── engine/                       # Core database engine components
│   │   │
│   │   ├── storage/                  # Storage layer (disk I/O)
│   │   │   ├── fileStorage.js        # File-based storage operations
│   │   │   └── storageManager.js     # Storage abstraction layer
│   │   │
│   │   ├── parser/                   # SQL parsing layer
│   │   │   ├── tokenizer.js          # Lexical analysis (SQL → tokens)
│   │   │   ├── parser.js             # Syntax analysis (tokens → AST)
│   │   │   └── astBuilder.js         # AST construction utilities
│   │   │
│   │   ├── executor/                 # Query execution layer
│   │   │   ├── selectExecutor.js     # SELECT query execution
│   │   │   ├── insertExecutor.js     # INSERT query execution
│   │   │   ├── createExecutor.js     # CREATE TABLE execution
│   │   │   ├── updateExecutor.js     # UPDATE query execution (future)
│   │   │   ├── deleteExecutor.js     # DELETE query execution (future)
│   │   │   └── queryPlanner.js       # Query optimization (future)
│   │   │
│   │   ├── schema/                   # Schema management
│   │   │   ├── tableManager.js       # Table schema operations
│   │   │   ├── typeValidator.js      # Data type validation
│   │   │   └── schemaRegistry.js     # Schema metadata registry
│   │   │
│   │   └── index.js                  # Engine entry point
│   │
│   ├── server/                       # HTTP API layer
│   │   ├── index.js                  # Express server setup ✅
│   │   ├── routes/                   # API routes
│   │   │   └── query.routes.js       # /query endpoint
│   │   ├── middleware/               # Express middleware
│   │   │   ├── errorHandler.js       # Global error handling
│   │   │   └── validator.js          # Request validation
│   │   └── controllers/              # Route controllers
│   │       └── query.controller.js   # Query execution controller
│   │
│   ├── data/                         # Database files (disk storage)
│   │   ├── .gitkeep                  # Keep folder in git
│   │   ├── users.json                # Example: users table
│   │   ├── orders.json               # Example: orders table
│   │   └── products.json             # Example: products table
│   │
│   ├── tests/                        # Test suite
│   │   ├── unit/                     # Unit tests
│   │   │   ├── tokenizer.test.js     # Tokenizer tests
│   │   │   ├── parser.test.js        # Parser tests
│   │   │   ├── executor.test.js      # Executor tests
│   │   │   └── storage.test.js       # Storage tests
│   │   │
│   │   ├── integration/              # Integration tests
│   │   │   ├── query.test.js         # End-to-end query tests
│   │   │   └── api.test.js           # API endpoint tests
│   │   │
│   │   └── fixtures/                 # Test data
│   │       └── sample-tables.json    # Sample table data
│   │
│   ├── utils/                        # Utility functions
│   │   ├── logger.js                 # Logging utility
│   │   ├── constants.js              # Constants (SQL keywords, types)
│   │   └── helpers.js                # Helper functions
│   │
│   ├── config/                       # Configuration files
│   │   └── database.config.js        # Database configuration
│   │
│   ├── .env                          # Environment variables ✅
│   ├── .gitignore                    # Git ignore rules
│   ├── package.json                  # Node.js dependencies ✅
│   ├── package-lock.json             # Dependency lock file
│   └── README.md                     # Backend documentation
│
├── frontend/                         # Next.js UI (Phase 7)
│   │
│   ├── app/                          # Next.js App Router
│   │   ├── page.js                   # Home page (query editor)
│   │   ├── layout.js                 # Root layout
│   │   └── api/                      # API routes (proxy to backend)
│   │       └── query/
│   │           └── route.js          # Query API route
│   │
│   ├── components/                   # React components
│   │   ├── QueryEditor.jsx           # SQL query input
│   │   ├── ResultsTable.jsx          # Query results display
│   │   ├── SchemaViewer.jsx          # Table schema viewer
│   │   └── QueryHistory.jsx          # Query history
│   │
│   ├── styles/                       # CSS styles
│   │   └── globals.css               # Global styles
│   │
│   ├── public/                       # Static assets
│   │   └── logo.png                  # NexaDB logo
│   │
│   ├── .env.local                    # Frontend environment variables
│   ├── package.json                  # Frontend dependencies
│   ├── next.config.js                # Next.js configuration
│   └── README.md                     # Frontend documentation
│
├── docs/                             # Documentation
│   ├── ARCHITECTURE.md               # System architecture
│   ├── SQL_SYNTAX.md                 # Supported SQL syntax
│   ├── API_REFERENCE.md              # API documentation
│   ├── DEVELOPMENT.md                # Development guide
│   └── INTERNALS.md                  # Database internals explanation
│
├── scripts/                          # Utility scripts
│   ├── seed-data.js                  # Seed sample data
│   ├── benchmark.js                  # Performance benchmarks
│   └── cleanup.js                    # Clean data directory
│
├── .gitignore                        # Root git ignore
├── PROJECT_STRUCTURE.md              # This file ✅
└── README.md                         # Project overview
```

---

## 📦 File Descriptions

### **Backend Engine Components**

#### **Storage Layer** (`engine/storage/`)
- **`fileStorage.js`**: Core file I/O operations (read/write table files)
- **`storageManager.js`**: Abstraction layer for storage operations

#### **Parser Layer** (`engine/parser/`)
- **`tokenizer.js`**: Converts SQL strings into tokens
- **`parser.js`**: Converts tokens into Abstract Syntax Tree (AST)
- **`astBuilder.js`**: Helper utilities for building AST nodes

#### **Executor Layer** (`engine/executor/`)
- **`selectExecutor.js`**: Executes SELECT queries (scan, filter, project)
- **`insertExecutor.js`**: Executes INSERT queries (validate, append)
- **`createExecutor.js`**: Executes CREATE TABLE queries
- **`queryPlanner.js`**: Query optimization (future: indexes, join strategies)

#### **Schema Layer** (`engine/schema/`)
- **`tableManager.js`**: Manages table schemas (create, read, validate)
- **`typeValidator.js`**: Validates data types (NUMBER, STRING, BOOLEAN)
- **`schemaRegistry.js`**: In-memory cache of table schemas

---

### **Server Layer** (`server/`)
- **`index.js`**: Express server setup, middleware, routes
- **`routes/query.routes.js`**: Defines `/query` endpoint
- **`controllers/query.controller.js`**: Handles query execution logic
- **`middleware/errorHandler.js`**: Global error handling
- **`middleware/validator.js`**: Request validation

---

### **Data Directory** (`data/`)
- **Purpose**: Stores all table files (one JSON file per table)
- **Format**: `{ schema: {...}, rows: [...] }`
- **Example**: `users.json`, `orders.json`

---

### **Tests** (`tests/`)
- **`unit/`**: Test individual components in isolation
- **`integration/`**: Test complete query flows
- **`fixtures/`**: Sample data for testing

---

### **Frontend** (`frontend/`)
- **`QueryEditor.jsx`**: Monaco editor or textarea for SQL input
- **`ResultsTable.jsx`**: Display query results in table format
- **`SchemaViewer.jsx`**: Show available tables and columns
- **`QueryHistory.jsx`**: Track executed queries

---

## 🚀 Implementation Phases

### **Phase 1: Storage Engine** ✅ (Next)
```
backend/engine/storage/
├── fileStorage.js
└── storageManager.js
```

### **Phase 2: Schema Manager**
```
backend/engine/schema/
├── tableManager.js
└── typeValidator.js
```

### **Phase 3: Tokenizer**
```
backend/engine/parser/
└── tokenizer.js
```

### **Phase 4: Parser**
```
backend/engine/parser/
├── parser.js
└── astBuilder.js
```

### **Phase 5: Executor**
```
backend/engine/executor/
├── createExecutor.js
├── insertExecutor.js
└── selectExecutor.js
```

### **Phase 6: API Integration**
```
backend/server/
├── routes/query.routes.js
└── controllers/query.controller.js
```

### **Phase 7: Frontend UI**
```
frontend/
├── app/page.js
└── components/QueryEditor.jsx
```

---

## 📊 Data Flow

```
HTTP Request
    ↓
Express Server (server/index.js)
    ↓
Query Controller (controllers/query.controller.js)
    ↓
Tokenizer (parser/tokenizer.js)
    ↓
Parser (parser/parser.js)
    ↓
Executor (executor/*.js)
    ↓
Storage Engine (storage/fileStorage.js)
    ↓
Disk (data/*.json)
```

---

## 🎯 Current Status

✅ **Completed:**
- Backend server setup (`server/index.js`)
- Package configuration (`package.json`)
- Environment setup (`.env`)

🔄 **Next Steps:**
1. Create `engine/storage/fileStorage.js`
2. Create `engine/schema/tableManager.js`
3. Create `data/` directory with `.gitkeep`
4. Implement CREATE TABLE functionality

---

## 📝 Notes

- **Modular Design**: Each component is independent and testable
- **Clear Separation**: Storage, parsing, execution are separate layers
- **Scalable**: Easy to add new features (indexes, transactions, joins)
- **Educational**: Structure mirrors real database systems (MySQL, PostgreSQL)

---

**Last Updated**: 2026-01-15  
**Version**: 1.0.0  
**Author**: Satyam Kumar Singh
