const fs = require('fs').promises;
const path = require('path');
const os = require('os');

// Path to favorites data file
const FAVORITES_FILE = path.join(__dirname, '..', 'data', 'favorites.json');

// Ensure data directory exists
async function ensureDataDirectory() {
    const dataDir = path.dirname(FAVORITES_FILE);
    try {
        await fs.access(dataDir);
    } catch (error) {
        await fs.mkdir(dataDir, { recursive: true });
    }
}

// Robust, Windows-friendly path validation
function validateFolderPath(folderPath) {
    if (!folderPath || typeof folderPath !== 'string') {
        throw new Error('Invalid path: Path must be a non-empty string');
    }
    // Allow both backslashes and forward slashes
    let normalizedPath = folderPath.replace(/\\/g, '/');
    // Remove trailing slashes
    normalizedPath = normalizedPath.replace(/[\/]+$/, '');
    // Convert to platform-specific path
    normalizedPath = path.normalize(normalizedPath);
    // On Windows, ensure drive letter is uppercase and colon is present
    if (process.platform === 'win32') {
        normalizedPath = normalizedPath.replace(/^([a-z]):/, (m, p1) => p1.toUpperCase() + ':');
    }
    // Prevent directory traversal
    if (normalizedPath.includes('..')) {
        throw new Error('Invalid path: Directory traversal not allowed');
    }
    // Only allow paths within the user's home directory
    const homeDir = os.homedir();
    if (!normalizedPath.toLowerCase().startsWith(homeDir.toLowerCase())) {
        throw new Error('Invalid path: Only paths within your home directory are allowed');
    }
    // Allow spaces, Unicode, and common Windows characters
    // Disallow only truly dangerous characters
    const invalidChars = /[<>"|?*]/;
    if (invalidChars.test(normalizedPath)) {
        throw new Error('Invalid path: Contains invalid characters');
    }
    // Extra logging for debugging
    console.log('[validateFolderPath] Input:', folderPath, '| Normalized:', normalizedPath);
    return normalizedPath;
}

// Get favorite folders
async function getFavoriteFolders() {
    try {
        await ensureDataDirectory();
        const data = await fs.readFile(FAVORITES_FILE, 'utf8');
        return JSON.parse(data);
    } catch (error) {
        if (error.code === 'ENOENT') {
            // File doesn't exist, return empty array
            return [];
        }
        throw error;
    }
}

// Add favorite folder
async function addFavoriteFolder(folderPath) {
    try {
        const normalizedPath = validateFolderPath(folderPath);
        
        // Check if folder exists and is accessible
        try {
            const stats = await fs.stat(normalizedPath);
            if (!stats.isDirectory()) {
                throw new Error('Path is not a directory');
            }
        } catch (error) {
            if (error.code === 'ENOENT') {
                throw new Error('Directory does not exist');
            }
            throw new Error('Cannot access directory');
        }
        
        const favorites = await getFavoriteFolders();
        
        // Check if already exists
        if (favorites.includes(normalizedPath)) {
            throw new Error('Folder is already in favorites');
        }
        
        // Add to favorites
        favorites.push(normalizedPath);
        
        // Save to file
        await ensureDataDirectory();
        await fs.writeFile(FAVORITES_FILE, JSON.stringify(favorites, null, 2));
        
        return favorites;
    } catch (error) {
        throw error;
    }
}

// Remove favorite folder
async function removeFavoriteFolder(folderPath) {
    try {
        const normalizedPath = validateFolderPath(folderPath);
        const favorites = await getFavoriteFolders();
        
        const index = favorites.indexOf(normalizedPath);
        if (index === -1) {
            throw new Error('Folder not found in favorites');
        }
        
        favorites.splice(index, 1);
        
        await ensureDataDirectory();
        await fs.writeFile(FAVORITES_FILE, JSON.stringify(favorites, null, 2));
        
        return favorites;
    } catch (error) {
        throw error;
    }
}

// Save markdown to folder
async function saveMarkdownToFolder(content, filename, folderPath, overwrite = false) {
    try {
        const normalizedPath = validateFolderPath(folderPath);
        
        // Ensure filename is safe
        const safeFilename = path.basename(filename).replace(/[^a-zA-Z0-9._-]/g, '_');
        if (!safeFilename.endsWith('.md')) {
            throw new Error('Filename must end with .md extension');
        }
        
        // Check if folder exists and is writable
        try {
            const stats = await fs.stat(normalizedPath);
            if (!stats.isDirectory()) {
                throw new Error('Path is not a directory');
            }
        } catch (error) {
            if (error.code === 'ENOENT') {
                throw new Error('Directory does not exist');
            }
            throw new Error('Cannot access directory');
        }
        
        const filePath = path.join(normalizedPath, safeFilename);
        
        // Check if file exists
        let fileExists = false;
        try {
            await fs.access(filePath);
            fileExists = true;
        } catch (error) {
            // File doesn't exist, which is fine
        }
        
        // File size check (max 2MB)
        const maxSize = 2 * 1024 * 1024; // 2MB
        if (Buffer.byteLength(content, 'utf8') > maxSize) {
            throw new Error('File is too large (max 2MB)');
        }
        
        // If file exists and not overwriting, return info
        if (fileExists && !overwrite) {
            return {
                success: false,
                fileExists: true,
                filePath: filePath,
                filename: safeFilename,
                message: 'File already exists',
                needsConfirmation: true
            };
        }
        
        // Write the file
        await fs.writeFile(filePath, content, 'utf8');
        
        return {
            success: true,
            filePath: filePath,
            filename: safeFilename,
            fileExists: fileExists,
            message: fileExists ? 'File overwritten successfully' : 'File saved successfully',
            needsConfirmation: false
        };
    } catch (error) {
        throw error;
    }
}

// Browse available directories (get common directories)
function getCommonDirectories() {
    const homeDir = os.homedir();
    const commonDirs = [
        homeDir,
        path.join(homeDir, 'Documents'),
        path.join(homeDir, 'Desktop'),
        path.join(homeDir, 'Downloads'),
        path.join(homeDir, 'Pictures'),
        path.join(homeDir, 'Videos'),
        path.join(homeDir, 'Music')
    ];
    
    return commonDirs.filter(dir => {
        try {
            const stats = fs.statSync(dir);
            return stats.isDirectory();
        } catch (error) {
            return false;
        }
    });
}

// Check if path is accessible
async function isPathAccessible(pathToCheck) {
    try {
        const stats = await fs.stat(pathToCheck);
        return stats.isDirectory();
    } catch (error) {
        return false;
    }
}

module.exports = {
    getFavoriteFolders,
    addFavoriteFolder,
    removeFavoriteFolder,
    saveMarkdownToFolder,
    validateFolderPath,
    getCommonDirectories,
    isPathAccessible
}; 