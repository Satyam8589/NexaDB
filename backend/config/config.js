import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import os from 'os';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * Get the data directory path
 * Priority:
 * 1. Environment variable DATA_DIRECTORY
 * 2. Default: backend/data
 */
function getDataDirectory() {
    // Check environment variable
    if (process.env.DATA_DIRECTORY) {
        const customPath = process.env.DATA_DIRECTORY;
        
        // Expand ~ to home directory
        if (customPath.startsWith('~')) {
            return path.join(os.homedir(), customPath.slice(1));
        }
        
        // Return absolute path
        if (path.isAbsolute(customPath)) {
            return customPath;
        }
        
        // Resolve relative path from project root
        return path.resolve(process.cwd(), customPath);
    }
    
    // Default: backend/data
    return path.join(__dirname, '../data');
}

/**
 * Configuration object
 */
const config = {
    // Data Storage
    dataDirectory: getDataDirectory(),
    
    // Server
    port: process.env.PORT || 3000,
    nodeEnv: process.env.NODE_ENV || 'development',
    
    // Performance
    cache: {
        enabled: process.env.CACHE_ENABLED !== 'false',
        maxSize: parseInt(process.env.CACHE_MAX_SIZE || '100', 10)
    },
    
    // Logging
    logging: {
        level: process.env.LOG_LEVEL || 'info',
        file: process.env.LOG_FILE || 'nexadb.log'
    }
};

// Log configuration on startup
console.log('NexaDB Configuration:');
console.log(`  Data Directory: ${config.dataDirectory}`);
console.log(`  Port: ${config.port}`);
console.log(`  Environment: ${config.nodeEnv}`);
console.log(`  Cache: ${config.cache.enabled ? 'Enabled' : 'Disabled'}`);
console.log('');

export default config;
