import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import os from 'os';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

function getDataDirectory() {
    if (process.env.DATA_DIRECTORY) {
        const customPath = process.env.DATA_DIRECTORY;
        
        if (customPath.startsWith('~')) {
            return path.join(os.homedir(), customPath.slice(1));
        }
        
        if (path.isAbsolute(customPath)) {
            return customPath;
        }
        
        return path.resolve(process.cwd(), customPath);
    }
    
    return path.join(__dirname, '../data');
}

const config = {
    dataDirectory: getDataDirectory(),
    
    port: process.env.PORT || 3000,
    nodeEnv: process.env.NODE_ENV || 'development',
    
    cache: {
        enabled: process.env.CACHE_ENABLED !== 'false',
        maxSize: parseInt(process.env.CACHE_MAX_SIZE || '100', 10)
    },
    
    logging: {
        level: process.env.LOG_LEVEL || 'info',
        file: process.env.LOG_FILE || 'nexadb.log'
    }
};

console.log('NexaDB Configuration:');
console.log(`  Data Directory: ${config.dataDirectory}`);
console.log(`  Port: ${config.port}`);
console.log(`  Environment: ${config.nodeEnv}`);
console.log(`  Cache: ${config.cache.enabled ? 'Enabled' : 'Disabled'}`);
console.log('');

export default config;
