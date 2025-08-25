// DOM Elements
const analysisForm = document.getElementById('analysisForm');
const youtubeUrlInput = document.getElementById('youtubeUrl');
const modelSelect = document.getElementById('modelSelect');
const modelSearch = document.getElementById('modelSearch');
const modelInfo = document.getElementById('modelInfo');
const favoriteToggleBtn = document.getElementById('favoriteToggleBtn');
const favoriteCount = document.getElementById('favoriteCount');
const favoritesOnlyCheckbox = document.getElementById('favoritesOnlyCheckbox');
const favoritesFilterBtn = document.getElementById('favoritesFilterBtn');
const modelStats = document.getElementById('modelStats');
const promptSelect = document.getElementById('promptSelect');
const analyzeBtn = document.getElementById('analyzeBtn');
const loadingSection = document.getElementById('loadingSection');
const resultSection = document.getElementById('resultSection');
const errorSection = document.getElementById('errorSection');
const loadingMessage = document.getElementById('loadingMessage');
const errorMessage = document.getElementById('errorMessage');

// Result elements
const videoTitle = document.getElementById('videoTitle');
const videoChannel = document.getElementById('videoChannel');
const videoViews = document.getElementById('videoViews');
const videoLikes = document.getElementById('videoLikes');
const videoDate = document.getElementById('videoDate');
const videoThumbnail = document.getElementById('videoThumbnail');

// Action buttons
const downloadBtn = document.getElementById('downloadBtn');
const previewBtn = document.getElementById('previewBtn');
const exportBtn = document.getElementById('exportBtn');
const newAnalysisBtn = document.getElementById('newAnalysisBtn');
const retryBtn = document.getElementById('retryBtn');

// Preview elements
const previewSection = document.getElementById('previewSection');
const markdownPreview = document.getElementById('markdownPreview');
const closePreviewBtn = document.getElementById('closePreviewBtn');

// Modal elements
const settingsBtn = document.getElementById('settingsBtn');
const helpBtn = document.getElementById('helpBtn');
const settingsModal = document.getElementById('settingsModal');
const helpModal = document.getElementById('helpModal');
const closeSettingsBtn = document.getElementById('closeSettingsBtn');
const closeHelpBtn = document.getElementById('closeHelpBtn');
const saveSettingsBtn = document.getElementById('saveSettingsBtn');
const cancelSettingsBtn = document.getElementById('cancelSettingsBtn');
const closeHelpModalBtn = document.getElementById('closeHelpModalBtn');

// Download modal elements
const downloadModal = document.getElementById('downloadModal');
const closeDownloadBtn = document.getElementById('closeDownloadBtn');
const cancelDownloadBtn = document.getElementById('cancelDownloadBtn');
const downloadFilename = document.getElementById('downloadFilename');
const downloadFolderPath = document.getElementById('downloadFolderPath');
const browseFolderBtn = document.getElementById('browseFolderBtn');
const folderInput = document.getElementById('folderInput');
const favoriteFoldersList = document.getElementById('favoriteFoldersList');
const addCurrentToFavoritesBtn = document.getElementById('addCurrentToFavoritesBtn');
const commonDirectoriesList = document.getElementById('commonDirectoriesList');
const saveMarkdownBtn = document.getElementById('saveMarkdownBtn');
const folderHelpText = document.getElementById('folderHelpText');
const fileSystemAccessStatus = document.getElementById('fileSystemAccessStatus');

// File System Access API support check
let isFileSystemAccessSupported = false;
let currentDirectoryHandle = null;

// Check File System Access API support
function checkFileSystemAccessSupport() {
    isFileSystemAccessSupported = 'showDirectoryPicker' in window;
    console.log('File System Access API supported:', isFileSystemAccessSupported);
}

// Browse for folder using File System Access API
async function browseForFolder() {
    try {
        if (!isFileSystemAccessSupported) {
            showNotification('Folder browsing is not supported in your browser. Please type the folder path manually.', 'warning');
            return;
        }

        const directoryHandle = await window.showDirectoryPicker({
            mode: 'readwrite',
            startIn: 'downloads'
        });

        if (directoryHandle) {
            currentDirectoryHandle = directoryHandle;
            const folderPath = directoryHandle.name;
            downloadFolderPath.value = folderPath;
            
            // Enable the add to favorites button
            addCurrentToFavoritesBtn.disabled = false;
            
            // Update the folder path display
            updateFolderPathDisplay(folderPath);
            
            showNotification(`Selected folder: ${folderPath}`, 'success');
        }
    } catch (error) {
        if (error.name === 'AbortError') {
            // User cancelled the folder picker
            console.log('Folder selection cancelled by user');
        } else {
            console.error('Error browsing for folder:', error);
            showNotification('Error selecting folder. Please try again or type the path manually.', 'error');
        }
    }
}

// Update folder path display with better formatting
function updateFolderPathDisplay(path) {
    if (path) {
        downloadFolderPath.value = path;
        downloadFolderPath.classList.add('folder-selected');
    } else {
        downloadFolderPath.classList.remove('folder-selected');
    }
}

// Save file using File System Access API if available
async function saveFileWithFileSystemAccess(content, filename, mimeType = 'text/markdown') {
    try {
        if (currentDirectoryHandle && isFileSystemAccessSupported) {
            // Create a new file in the selected directory
            const fileHandle = await currentDirectoryHandle.getFileHandle(filename, { create: true });
            const writable = await fileHandle.createWritable();
            await writable.write(content);
            await writable.close();
            
            showNotification(`File saved successfully to: ${currentDirectoryHandle.name}/${filename}`, 'success');
            return true;
        }
        return false;
    } catch (error) {
        console.error('Error saving file with File System Access API:', error);
        showNotification('Error saving file. Falling back to download method.', 'warning');
        return false;
    }
}

// Enhanced download function with folder support
async function downloadMarkdown(content, filename) {
    try {
        // First try to save using File System Access API
        if (await saveFileWithFileSystemAccess(content, filename)) {
            return; // File was saved successfully
        }

        // Fallback to traditional download method
        const blob = new Blob([content], { type: 'text/markdown' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        
        showNotification('File downloaded successfully!', 'success');
    } catch (error) {
        console.error('Error downloading file:', error);
        showNotification('Error downloading file. Please try again.', 'error');
    }
}

// Notification system
function showNotification(message, type = 'info') {
    // Remove existing notifications
    const existingNotifications = document.querySelectorAll('.notification');
    existingNotifications.forEach(notification => notification.remove());
    
    // Create notification element
    const notification = document.createElement('div');
    notification.className = `notification notification-${type}`;
    notification.innerHTML = `
        <div class="notification-content">
            <i class="fas fa-${getNotificationIcon(type)}"></i>
            <span>${message}</span>
            <button class="notification-close" onclick="this.parentElement.parentElement.remove()">
                <i class="fas fa-times"></i>
            </button>
        </div>
    `;
    
    // Add to page
    document.body.appendChild(notification);
    
    // Auto-remove after 5 seconds
    setTimeout(() => {
        if (notification.parentElement) {
            notification.remove();
        }
    }, 5000);
}

// Get notification icon based on type
function getNotificationIcon(type) {
    switch (type) {
        case 'success': return 'check-circle';
        case 'error': return 'exclamation-triangle';
        case 'warning': return 'exclamation-circle';
        default: return 'info-circle';
    }
}

// Update save button state based on form inputs
function updateSaveButtonState() {
    const filename = downloadFilename.value.trim();
    const folderPath = downloadFolderPath.value.trim();
    const hasValidInputs = filename && (folderPath || currentDirectoryHandle);
    
    saveMarkdownBtn.disabled = !hasValidInputs;
}

// Check if folder is already in favorites
function isFolderInFavorites(folderPath) {
    const favorites = JSON.parse(localStorage.getItem('favoriteFolders') || '[]');
    return favorites.some(fav => fav.path === folderPath);
}

// Add folder to favorites
function addFolderToFavorites(folderPath) {
    const favorites = JSON.parse(localStorage.getItem('favoriteFolders') || '[]');
    const folderName = folderPath.split(/[\\/]/).pop() || folderPath;
    
    if (!isFolderInFavorites(folderPath)) {
        favorites.push({
            name: folderName,
            path: folderPath,
            added: new Date().toISOString()
        });
        localStorage.setItem('favoriteFolders', JSON.stringify(favorites));
        loadFavoriteFolders(); // Refresh the display
    }
}

// Load favorite folders
function loadFavoriteFolders() {
    const favorites = JSON.parse(localStorage.getItem('favoriteFolders') || '[]');
    const container = document.getElementById('favoriteFoldersList');
    
    if (favorites.length === 0) {
        container.innerHTML = '<p class="no-favorites">No favorite folders yet. Add some to get started!</p>';
        return;
    }
    
    container.innerHTML = favorites.map(fav => `
        <div class="favorite-folder" data-path="${fav.path}">
            <span class="folder-name">${fav.name}</span>
            <span class="folder-path">${fav.path}</span>
            <button class="use-folder-btn" onclick="useFavoriteFolder('${fav.path}')" title="Use this folder">
                <i class="fas fa-folder-open"></i>
            </button>
            <button class="remove-favorite-btn" onclick="removeFavoriteFolder('${fav.path}')" title="Remove from favorites">
                <i class="fas fa-trash"></i>
            </button>
        </div>
    `).join('');
}

// Use a favorite folder
function useFavoriteFolder(folderPath) {
    downloadFolderPath.value = folderPath;
    updateFolderPathDisplay(folderPath);
    addCurrentToFavoritesBtn.disabled = false;
}

// Remove folder from favorites
function removeFavoriteFolder(folderPath) {
    const favorites = JSON.parse(localStorage.getItem('favoriteFolders') || '[]');
    const updatedFavorites = favorites.filter(fav => fav.path !== folderPath);
    localStorage.setItem('favoriteFolders', JSON.stringify(updatedFavorites));
    loadFavoriteFolders();
}

// Load common directories
function loadCommonDirectories() {
    const commonDirs = [
        { name: 'Desktop', path: '~/Desktop' },
        { name: 'Documents', path: '~/Documents' },
        { name: 'Downloads', path: '~/Downloads' },
        { name: 'Pictures', path: '~/Pictures' }
    ];
    
    const container = document.getElementById('commonDirectoriesList');
    container.innerHTML = commonDirs.map(dir => `
        <button class="common-directory-btn" onclick="useCommonDirectory('${dir.path}')" title="${dir.path}">
            <i class="fas fa-folder"></i>
            <span>${dir.name}</span>
        </button>
    `).join('');
}

// Use a common directory
function useCommonDirectory(dirPath) {
    // For now, just show a message about manual entry
    showNotification(`Please manually enter the full path to ${dirPath}`, 'info');
    downloadFolderPath.focus();
}

// API Keys
const youtubeApiKeyInput = document.getElementById('youtubeApiKey');
const openrouterApiKeyInput = document.getElementById('openrouterApiKey');
const notionTokenInput = document.getElementById('notionToken');

// Favorites Management Elements
const favoritesCount = document.getElementById('favoritesCount');
const clearFavoritesBtn = document.getElementById('clearFavoritesBtn');
const exportFavoritesBtn = document.getElementById('exportFavoritesBtn');
const importFavoritesBtn = document.getElementById('importFavoritesBtn');
const importFavoritesInput = document.getElementById('importFavoritesInput');

// Global variables
let currentResult = null;
let allModels = []; // Store all available models
let favoriteModels = []; // Store favorite model IDs

// Initialize the app
document.addEventListener('DOMContentLoaded', function() {
    clearApiWarnings(); // Clear any existing API warnings on page load
    loadSettings();
    loadFavorites(); // Load favorites before models
    loadModels();
    loadPrompts();
    setupEventListeners();
    checkHealth();
    initializeNotion();
    checkFileSystemAccessSupport(); // Check for File System Access API support
});

// Setup event listeners
function setupEventListeners() {
    // Form submission
    analysisForm.addEventListener('submit', handleFormSubmit);
    
    // Model search functionality
    modelSearch.addEventListener('input', filterModels);
    modelSelect.addEventListener('change', updateModelInfo);
    
    // Favorite toggle functionality
    favoriteToggleBtn.addEventListener('click', handleFavoriteToggle);
    favoritesOnlyCheckbox.addEventListener('change', filterModels);
    favoritesFilterBtn.addEventListener('click', toggleFavoritesFilter);
    
    // Action buttons
    downloadBtn.addEventListener('click', showDownloadModal);
    previewBtn.addEventListener('click', handlePreview);
    exportBtn.addEventListener('click', handleExportToNotion);
    newAnalysisBtn.addEventListener('click', handleNewAnalysis);
    retryBtn.addEventListener('click', handleRetry);
    
    // Preview controls
    closePreviewBtn.addEventListener('click', closePreview);
    
    // Modal controls
    settingsBtn.addEventListener('click', openSettings);
    helpBtn.addEventListener('click', openHelp);
    closeSettingsBtn.addEventListener('click', closeSettings);
    closeHelpBtn.addEventListener('click', closeHelp);
    saveSettingsBtn.addEventListener('click', saveSettings);
    cancelSettingsBtn.addEventListener('click', closeSettings);
    closeHelpModalBtn.addEventListener('click', closeHelp);
    
    // Download modal controls
    closeDownloadBtn.addEventListener('click', hideDownloadModal);
    cancelDownloadBtn.addEventListener('click', hideDownloadModal);
    // Browse folder button
    browseFolderBtn.addEventListener('click', browseForFolder);
    
    // Download modal form validation
    downloadFilename.addEventListener('input', updateSaveButtonState);
    downloadFolderPath.addEventListener('input', updateSaveButtonState);
    
    // Add current folder to favorites
    addCurrentToFavoritesBtn.addEventListener('click', () => {
        const folderPath = downloadFolderPath.value.trim();
        if (folderPath) {
            addFolderToFavorites(folderPath);
            showNotification('Folder added to favorites!', 'success');
        }
    });
    
    // Save markdown button
    saveMarkdownBtn.addEventListener('click', async () => {
        const filename = downloadFilename.value.trim();
        const folderPath = downloadFolderPath.value.trim();
        
        if (!filename) {
            showNotification('Please enter a filename.', 'error');
            return;
        }
        
        if (!folderPath && !currentDirectoryHandle) {
            showNotification('Please select a folder or enter a folder path.', 'error');
            return;
        }
        
        // Add .md extension if not present
        const finalFilename = filename.endsWith('.md') ? filename : `${filename}.md`;
        
        try {
            // Use the enhanced download function
            await downloadMarkdown(currentResult.markdown, finalFilename);
            
            // Save to favorites if this is a new folder path
            if (folderPath && !isFolderInFavorites(folderPath)) {
                addFolderToFavorites(folderPath);
            }
            
            // Store last used folder
            localStorage.setItem('lastUsedFolder', folderPath);
            
            // Hide modal after successful save
            hideDownloadModal();
            
        } catch (error) {
            console.error('Error saving markdown:', error);
            showNotification('Error saving file. Please try again.', 'error');
        }
    });
    
    // Close modals on outside click
    window.addEventListener('click', function(event) {
        if (event.target === settingsModal) closeSettings();
        if (event.target === helpModal) closeHelp();
        if (event.target === downloadModal) hideDownloadModal();
    });
    
    // Keyboard shortcuts
    document.addEventListener('keydown', function(event) {
        // Ctrl/Cmd + F to focus on model search
        if ((event.ctrlKey || event.metaKey) && event.key === 'f') {
            event.preventDefault();
            modelSearch.focus();
        }
        
        // Ctrl/Cmd + S to toggle favorite for selected model
        if ((event.ctrlKey || event.metaKey) && event.key === 's') {
            event.preventDefault();
            handleFavoriteToggle();
        }
    });
}

// Handle form submission
async function handleFormSubmit(e) {
    e.preventDefault();
    
    const url = youtubeUrlInput.value.trim();
    const model = modelSelect.value;
    const promptId = promptSelect.value;
    
    if (!url) {
        showError('Please enter a YouTube URL');
        return;
    }
    
    // Validate YouTube URL
    if (!isValidYouTubeUrl(url)) {
        showError('Please enter a valid YouTube URL');
        return;
    }
    
    // Start analysis
    await analyzeVideo(url, model, promptId);
}

// Validate YouTube URL
function isValidYouTubeUrl(url) {
    const patterns = [
        /^(https?:\/\/)?(www\.)?(youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)/,
        /^(https?:\/\/)?(www\.)?youtube\.com\/v\//,
        /^(https?:\/\/)?(www\.)?youtube\.com\/watch\?.*v=/
    ];
    
    return patterns.some(pattern => pattern.test(url));
}

// Analyze video
async function analyzeVideo(url, model, promptId) {
    try {
        showLoading();
        updateLoadingMessage('Fetching video information...');
        
        const response = await fetch('/api/process', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ url, model, promptId })
        });
        
        const data = await response.json();
        
        if (!response.ok) {
            throw new Error(data.error || 'Failed to analyze video');
        }
        
        currentResult = data;
        showResult(data);
        
    } catch (error) {
        console.error('Analysis error:', error);
        showError(error.message);
    }
}

// Show loading state
function showLoading() {
    hideAllSections();
    loadingSection.classList.remove('hidden');
    analyzeBtn.disabled = true;
}

// Update loading message
function updateLoadingMessage(message) {
    loadingMessage.textContent = message;
}

// Show result
function showResult(data) {
    hideAllSections();
    
    // Use generated title if available
    const displayTitle = data.videoInfo.generatedTitle || data.videoInfo.title;
    videoTitle.textContent = displayTitle;
    videoChannel.textContent = data.videoInfo.channelTitle;
    videoViews.textContent = formatNumber(data.videoInfo.viewCount) + ' views';
    videoLikes.textContent = formatNumber(data.videoInfo.likeCount) + ' likes';
    videoDate.textContent = formatDate(data.videoInfo.publishedAt);
    
    // Set thumbnail
    videoThumbnail.src = `https://img.youtube.com/vi/${data.videoInfo.videoId}/mqdefault.jpg`;
    videoThumbnail.alt = displayTitle;
    
    // Show AI badge if generatedTitle is present and different
    const aiBadgeId = 'ai-title-badge';
    let aiBadge = document.getElementById(aiBadgeId);
    if (data.videoInfo.generatedTitle && data.videoInfo.generatedTitle !== data.videoInfo.title) {
        if (!aiBadge) {
            aiBadge = document.createElement('span');
            aiBadge.id = aiBadgeId;
            aiBadge.style.fontStyle = 'italic';
            aiBadge.style.fontSize = '0.9em';
            aiBadge.style.marginLeft = '8px';
            aiBadge.style.color = '#4b8df8';
            aiBadge.textContent = '(AI-generated title)';
            videoTitle.parentNode.appendChild(aiBadge);
        } else {
            aiBadge.style.display = '';
        }
    } else if (aiBadge) {
        aiBadge.style.display = 'none';
    }
    
    resultSection.classList.remove('hidden');
    analyzeBtn.disabled = false;
}

// Show error
function showError(message) {
    hideAllSections();
    errorMessage.textContent = message;
    errorSection.classList.remove('hidden');
    analyzeBtn.disabled = false;
}

// Hide all sections
function hideAllSections() {
    loadingSection.classList.add('hidden');
    resultSection.classList.add('hidden');
    errorSection.classList.add('hidden');
    previewSection.classList.add('hidden');
}

// Handle download - show modal instead of direct download
function handleDownload() {
    if (!currentResult) return;
    
    // Set default filename
    downloadFilename.value = currentResult.filename.replace('.md', '');
    
    // Clear previous selections
    downloadFolderPath.value = '';
    clearFolderSelections();
    
    // Load favorites and common directories
    loadDownloadModalData();
    
    // Show modal
    showDownloadModal();
}

// Handle preview
function handlePreview() {
    if (!currentResult) return;
    
    markdownPreview.textContent = currentResult.markdown;
    previewSection.classList.remove('hidden');
}

// Close preview
function closePreview() {
    previewSection.classList.add('hidden');
}

// Handle new analysis
function handleNewAnalysis() {
    hideAllSections();
    analysisForm.classList.remove('hidden');
    
    // Clear all form inputs
    youtubeUrlInput.value = '';
    
    // Clear manual transcript input
    const manualTranscriptInput = document.getElementById('manualTranscriptInput');
    if (manualTranscriptInput) {
        manualTranscriptInput.value = '';
    }
    
    // Reset prompt template selection
    const promptTemplateSelect = document.getElementById('promptTemplateSelect');
    if (promptTemplateSelect) {
        promptTemplateSelect.value = '';
    }
    
    // Clear edited prompt textarea
    const editedPromptTextarea = document.getElementById('editedPromptTextarea');
    if (editedPromptTextarea) {
        editedPromptTextarea.value = '';
    }
    
    // Uncheck "use edited prompt" checkbox
    const useEditedPromptCheckbox = document.getElementById('useEditedPromptCheckbox');
    if (useEditedPromptCheckbox) {
        useEditedPromptCheckbox.checked = false;
    }
    
    // Hide prompt editor container
    const promptEditorContainer = document.getElementById('promptEditorContainer');
    if (promptEditorContainer) {
        promptEditorContainer.style.display = 'none';
    }
    
    // Reset prompt status indicators
    const promptStatusText = document.getElementById('promptStatusText');
    if (promptStatusText) {
        promptStatusText.textContent = 'Original template will be used';
    }
    
    const promptLength = document.getElementById('promptLength');
    if (promptLength) {
        promptLength.textContent = '0 / 5000 characters';
    }
    
    currentResult = null;
}

// Handle retry
function handleRetry() {
    if (currentResult) {
        analyzeVideo(youtubeUrlInput.value, modelSelect.value);
    } else {
        handleNewAnalysis();
    }
}

// Handle export to Notion
async function handleExportToNotion() {
    if (!currentResult) {
        alert('No analysis result to export. Please analyze a video first.');
        return;
    }

    try {
        exportBtn.disabled = true;
        exportBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Exporting...';
        
        const videoInfoToSend = { ...currentResult.videoInfo };
        if (currentResult.videoInfo.generatedTitle) {
            videoInfoToSend.generatedTitle = currentResult.videoInfo.generatedTitle;
        }
        const response = await fetch('/api/saveToNotion', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                videoInfo: videoInfoToSend,
                markdown: currentResult.markdown,
                databaseId: selectedDatabaseId || null
            })
        });
        
        const data = await response.json();
        
        if (!response.ok) {
            throw new Error(data.error || 'Failed to export to Notion');
        }
        
        // Success
        alert(`✅ ${data.message}\n\nMain Page: ${data.pageUrl}\nAnalysis Page: ${data.childPageUrl}`);
        
    } catch (error) {
        console.error('Export error:', error);
        alert(`Export failed: ${error.message}`);
    } finally {
        exportBtn.disabled = false;
        exportBtn.innerHTML = '<i class="fas fa-database"></i> Export to Notion';
    }
}

// Load available models
async function loadModels() {
    try {
        const response = await fetch('/api/models');
        const data = await response.json();
        
        // Store all models globally and add favorite status
        allModels = data.models.map(model => ({
            ...model,
            isFavorite: isFavorite(model.id)
        }));
        
        // Sort models: favorites first, then alphabetically
        allModels.sort((a, b) => {
            if (a.isFavorite && !b.isFavorite) return -1;
            if (!a.isFavorite && b.isFavorite) return 1;
            return a.name.localeCompare(b.name);
        });
        
        // Populate the select with all models
        populateModelSelect(allModels);
        
        // Set default selection and update info
        if (allModels.length > 0) {
            modelSelect.value = allModels[0].id;
            updateModelInfo();
        }
        
        // Update model statistics
        updateModelStats();
        
    } catch (error) {
        console.error('Error loading models:', error);
    }
}

// Load available prompts
async function loadPrompts() {
    try {
        const response = await fetch('/api/prompts');
        const data = await response.json();
        
        if (response.ok) {
            populatePromptSelect(data.prompts);
        } else {
            console.error('Failed to load prompts:', data.error);
            populatePromptSelect([]);
        }
    } catch (error) {
        console.error('Error loading prompts:', error);
        populatePromptSelect([]);
    }
}

// Populate model select dropdown
function populateModelSelect(models) {
    modelSelect.innerHTML = '';
    
    // Add favorites section if there are favorites
    const favoriteModels = models.filter(model => model.isFavorite);
    const nonFavoriteModels = models.filter(model => !model.isFavorite);
    
    if (favoriteModels.length > 0) {
        // Add favorites section header
        const favoritesHeader = document.createElement('option');
        favoritesHeader.disabled = true;
        favoritesHeader.textContent = '★ Favorites';
        favoritesHeader.style.fontWeight = 'bold';
        favoritesHeader.style.backgroundColor = '#f8f9fa';
        modelSelect.appendChild(favoritesHeader);
        
        // Add favorite models
        favoriteModels.forEach(model => {
            const option = document.createElement('option');
            option.value = model.id;
            option.textContent = `★ ${model.name} (${model.provider})`;
            option.dataset.model = JSON.stringify(model);
            option.style.backgroundColor = '#fff3cd';
            option.style.fontWeight = '500';
            modelSelect.appendChild(option);
        });
        
        // Add separator if there are non-favorites
        if (nonFavoriteModels.length > 0) {
            const separator = document.createElement('option');
            separator.disabled = true;
            separator.textContent = '──────────';
            separator.style.backgroundColor = '#f8f9fa';
            modelSelect.appendChild(separator);
        }
    }
    
    // Add non-favorite models
    nonFavoriteModels.forEach(model => {
        const option = document.createElement('option');
        option.value = model.id;
        option.textContent = `☆ ${model.name} (${model.provider})`;
        option.dataset.model = JSON.stringify(model);
        modelSelect.appendChild(option);
    });
}

// Populate prompt select dropdown
function populatePromptSelect(prompts) {
    promptSelect.innerHTML = '';
    
    // Add default option
    const defaultOption = document.createElement('option');
    defaultOption.value = '';
    defaultOption.textContent = 'Default Analysis (General)';
    promptSelect.appendChild(defaultOption);
    
    // Add all prompts
    prompts.forEach(prompt => {
        const option = document.createElement('option');
        option.value = prompt.id;
        option.textContent = prompt.name;
        promptSelect.appendChild(option);
    });
}

// Filter models based on search input
function filterModels() {
    const searchTerm = modelSearch.value.toLowerCase();
    const showFavoritesOnly = favoritesOnlyCheckbox.checked;
    
    // Update filter button state
    favoritesFilterBtn.classList.toggle('active', showFavoritesOnly);
    
    let filteredModels = allModels.filter(model => {
        // First filter by favorites only if checkbox is checked
        if (showFavoritesOnly && !model.isFavorite) {
            return false;
        }
        
        // Then filter by search term
        return model.name.toLowerCase().includes(searchTerm) ||
               model.id.toLowerCase().includes(searchTerm) ||
               model.provider.toLowerCase().includes(searchTerm);
    });
    
    // Sort filtered models: favorites first, then alphabetically
    filteredModels.sort((a, b) => {
        if (a.isFavorite && !b.isFavorite) return -1;
        if (!a.isFavorite && b.isFavorite) return 1;
        return a.name.localeCompare(b.name);
    });
    
    populateModelSelect(filteredModels);
    
    // Update model info if current selection is still valid
    if (filteredModels.some(model => model.id === modelSelect.value)) {
        updateModelInfo();
    } else if (filteredModels.length > 0) {
        modelSelect.value = filteredModels[0].id;
        updateModelInfo();
    }
}

// Update model info display
function updateModelInfo() {
    const selectedModel = allModels.find(model => model.id === modelSelect.value);
    
    if (selectedModel) {
        const providerSpan = modelInfo.querySelector('.model-provider');
        const pricingSpan = modelInfo.querySelector('.model-pricing');
        const contextSpan = modelInfo.querySelector('.model-context');
        
        providerSpan.textContent = selectedModel.provider;
        
        if (selectedModel.pricing && selectedModel.pricing.input > 0) {
            const inputCost = (selectedModel.pricing.input * 1000).toFixed(2);
            const outputCost = (selectedModel.pricing.output * 1000).toFixed(2);
            pricingSpan.textContent = `$${inputCost}/1K input, $${outputCost}/1K output`;
        } else {
            pricingSpan.textContent = 'Pricing not available';
        }
        
        if (selectedModel.context_length) {
            const contextK = Math.round(selectedModel.context_length / 1000);
            contextSpan.textContent = `${contextK}K context`;
        } else {
            contextSpan.textContent = 'Context length unknown';
        }
        
        // Update favorite toggle button
        updateFavoriteToggle(selectedModel);
        
        // Update favorite count
        updateFavoriteCount();
    } else {
        modelInfo.innerHTML = '<span class="model-provider">No model selected</span>';
        favoriteToggleBtn.classList.remove('favorited');
        favoriteToggleBtn.innerHTML = '<i class="far fa-star"></i>';
        favoriteCount.textContent = '';
    }
}

// Check server health
async function checkHealth() {
    try {
        const response = await fetch('/api/health');
        const data = await response.json();
        
        // Check if any required API keys are missing from environment configuration
        if (!data.apiKeysConfigured?.youtube || !data.apiKeysConfigured?.openrouter) {
            showApiWarning(data);
        }
    } catch (error) {
        console.error('Health check failed:', error);
    }
}

// Show API warning
function showApiWarning(healthData) {
    // Clear any existing API warnings first
    clearApiWarnings();
    
    const warnings = [];
    const missingKeys = [];
    
    // Check if API keys are configured in the environment (.env file)
    if (!healthData.apiKeysConfigured?.youtube) {
        warnings.push('YouTube API key not configured');
        missingKeys.push('youtube');
    }
    
    if (!healthData.apiKeysConfigured?.openrouter) {
        warnings.push('OpenRouter API key not configured');
        missingKeys.push('openrouter');
    }
    
    if (warnings.length > 0) {
        const warningDiv = document.createElement('div');
        warningDiv.className = 'api-warning';
        warningDiv.innerHTML = `
            <div style="background: #fff3cd; border: 1px solid #ffeaa7; border-radius: 8px; padding: 15px; margin-bottom: 20px; color: #856404;">
                <strong>⚠️ Configuration Required:</strong> ${warnings.join(', ')}. 
                <a href="#" id="configureNowBtn" style="color: #667eea; text-decoration: underline;">Configure now</a>
            </div>
        `;
        
        const mainContent = document.querySelector('.main-content');
        mainContent.insertBefore(warningDiv, mainContent.firstChild);
        
        document.getElementById('configureNowBtn').addEventListener('click', (e) => {
            e.preventDefault();
            openSettings();
        });
    }
    
    // Store missing keys for use in settings modal
    window.missingApiKeys = missingKeys;
}

// Clear existing API warnings
function clearApiWarnings() {
    const existingWarnings = document.querySelectorAll('.api-warning');
    existingWarnings.forEach(warning => warning.remove());
}

// Settings functions
function openSettings() {
    settingsModal.classList.remove('hidden');
    loadSettings();
    updateFavoriteCount(); // Update favorites count in settings
    updateApiKeyFields(); // Show/hide API key fields based on configuration
}

function closeSettings() {
    settingsModal.classList.add('hidden');
}

function saveSettings() {
    const missingKeys = window.missingApiKeys || [];
    const settings = {
        notionToken: notionTokenInput.value // Always save Notion token as it's optional
    };
    
    // Only save API keys that are not configured in the environment
    if (missingKeys.includes('youtube')) {
        settings.youtubeApiKey = youtubeApiKeyInput.value;
    }
    
    if (missingKeys.includes('openrouter')) {
        settings.openrouterApiKey = openrouterApiKeyInput.value;
    }
    
    localStorage.setItem('youtubeAnalysisSettings', JSON.stringify(settings));
    closeSettings();
    
    // Reload models and check health
    loadModels();
    checkHealth();
    
    // Recheck Notion connection
    setTimeout(checkNotionConnection, 1000);
}

function loadSettings() {
    const settings = JSON.parse(localStorage.getItem('youtubeAnalysisSettings') || '{}');
    const missingKeys = window.missingApiKeys || [];
    
    // Only load API keys that are not configured in the environment
    if (missingKeys.includes('youtube')) {
        youtubeApiKeyInput.value = settings.youtubeApiKey || '';
    } else {
        youtubeApiKeyInput.value = '';
    }
    
    if (missingKeys.includes('openrouter')) {
        openrouterApiKeyInput.value = settings.openrouterApiKey || '';
    } else {
        openrouterApiKeyInput.value = '';
    }
    
    // Always load Notion token as it's optional
    notionTokenInput.value = settings.notionToken || '';
}

// Update API key input fields visibility based on environment configuration
function updateApiKeyFields() {
    const missingKeys = window.missingApiKeys || [];
    
    // Get the parent containers for each API key field
    const youtubeContainer = document.getElementById('youtubeApiKeyGroup');
    const openrouterContainer = document.getElementById('openrouterApiKeyGroup');
    const notionContainer = notionTokenInput.closest('.form-group');
    const apiKeysInfo = document.getElementById('apiKeysConfiguredInfo');
    
    // Show/hide YouTube API key field
    if (missingKeys.includes('youtube')) {
        youtubeContainer.style.display = 'block';
        youtubeApiKeyInput.placeholder = 'Enter your YouTube API key';
    } else {
        youtubeContainer.style.display = 'none';
        youtubeApiKeyInput.value = ''; // Clear the field when hidden
    }
    
    // Show/hide OpenRouter API key field
    if (missingKeys.includes('openrouter')) {
        openrouterContainer.style.display = 'block';
        openrouterApiKeyInput.placeholder = 'Enter your OpenRouter API key';
    } else {
        openrouterContainer.style.display = 'none';
        openrouterApiKeyInput.value = ''; // Clear the field when hidden
    }
    
    // Always show Notion token field (it's optional)
    notionContainer.style.display = 'block';
    
    // Show/hide the "API Keys Configured" info message
    if (missingKeys.length === 0) {
        apiKeysInfo.style.display = 'block';
    } else {
        apiKeysInfo.style.display = 'none';
    }
    
    // Update the settings modal title to reflect the configuration status
    const settingsTitle = document.querySelector('#settingsModal .modal-header h3');
    if (settingsTitle) {
        if (missingKeys.length === 0) {
            settingsTitle.innerHTML = '<i class="fas fa-cog"></i> Settings (API Keys Configured)';
        } else {
            settingsTitle.innerHTML = '<i class="fas fa-cog"></i> Settings (Configuration Required)';
        }
    }
}

// Help functions
function openHelp() {
    helpModal.classList.remove('hidden');
}

function closeHelp() {
    helpModal.classList.add('hidden');
}

// Utility functions
function formatNumber(num) {
    if (num >= 1000000) {
        return (num / 1000000).toFixed(1) + 'M';
    } else if (num >= 1000) {
        return (num / 1000).toFixed(1) + 'K';
    }
    return num.toString();
}

function formatDate(dateString) {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
    });
}

// Add some nice animations
function addAnimations() {
    // Add fade-in animation to sections
    const sections = [loadingSection, resultSection, errorSection];
    sections.forEach(section => {
        section.style.opacity = '0';
        section.style.transform = 'translateY(20px)';
        section.style.transition = 'opacity 0.3s ease, transform 0.3s ease';
    });
    
    // Show sections with animation
    function showSectionWithAnimation(section) {
        section.style.opacity = '1';
        section.style.transform = 'translateY(0)';
    }
    
    // Override show functions to include animation
    const originalShowLoading = showLoading;
    const originalShowResult = showResult;
    const originalShowError = showError;
    
    showLoading = function() {
        originalShowLoading();
        setTimeout(() => showSectionWithAnimation(loadingSection), 10);
    };
    
    showResult = function(data) {
        originalShowResult(data);
        setTimeout(() => showSectionWithAnimation(resultSection), 10);
    };
    
    showError = function(message) {
        originalShowError(message);
        setTimeout(() => showSectionWithAnimation(errorSection), 10);
    };
}

// Initialize animations
addAnimations();

// Notion Integration
// DOM Elements for Notion
const notionStatus = document.getElementById('notionStatus');
const notionSetup = document.getElementById('notionSetup');
const notionConnected = document.getElementById('notionConnected');
const connectNotionBtn = document.getElementById('connectNotionBtn');
const databaseSelect = document.getElementById('databaseSelect');
const refreshDatabasesBtn = document.getElementById('refreshDatabasesBtn');
const saveToNotionBtn = document.getElementById('saveToNotionBtn');
const saveStatus = document.getElementById('saveStatus');

// Global variables for Notion
let notionDatabases = [];
let selectedDatabaseId = null;

// Initialize Notion integration
function initializeNotion() {
    // Add event listeners for Notion elements
    connectNotionBtn.addEventListener('click', handleConnectNotion);
    refreshDatabasesBtn.addEventListener('click', loadNotionDatabases);
    databaseSelect.addEventListener('change', handleDatabaseSelect);
    saveToNotionBtn.addEventListener('click', handleSaveToNotion);
    
    // Check if Notion token exists
    checkNotionConnection();
}

// Check Notion connection status
async function checkNotionConnection() {
    try {
        const response = await fetch('/api/health');
        const data = await response.json();
        
        if (data.notionApi) {
            updateNotionStatus('connected', 'Connected');
            await loadNotionDatabases();
        } else {
            updateNotionStatus('disconnected', 'Not connected');
        }
    } catch (error) {
        console.error('Error checking Notion connection:', error);
        updateNotionStatus('disconnected', 'Connection error');
    }
}

// Update Notion status display
function updateNotionStatus(status, text) {
    const indicator = notionStatus.querySelector('.status-indicator');
    const statusText = notionStatus.querySelector('.status-text');
    
    indicator.className = `status-indicator ${status}`;
    statusText.textContent = text;
    
    if (status === 'connected') {
        notionSetup.classList.add('hidden');
        notionConnected.classList.remove('hidden');
    } else {
        notionSetup.classList.remove('hidden');
        notionConnected.classList.add('hidden');
    }
}

// Handle Notion connection
async function handleConnectNotion() {
    try {
        updateNotionStatus('loading', 'Connecting...');
        connectNotionBtn.disabled = true;
        
        // Check if token is provided in settings
        const settings = JSON.parse(localStorage.getItem('youtubeAnalysisSettings') || '{}');
        if (!settings.notionToken) {
            // Prompt user to enter token in settings
            openSettings();
            updateNotionStatus('disconnected', 'Token required');
            connectNotionBtn.disabled = false;
            return;
        }
        
        // Test connection by fetching databases
        await loadNotionDatabases();
        
    } catch (error) {
        console.error('Error connecting to Notion:', error);
        updateNotionStatus('disconnected', 'Connection failed');
        connectNotionBtn.disabled = false;
    }
}

// Load Notion databases
async function loadNotionDatabases() {
    try {
        updateNotionStatus('loading', 'Loading databases...');
        refreshDatabasesBtn.disabled = true;
        
        const response = await fetch('/api/notion/databases');
        const data = await response.json();
        
        if (!response.ok) {
            throw new Error(data.error || 'Failed to load databases');
        }
        
        notionDatabases = data.databases;
        populateDatabaseSelect();
        
        if (notionDatabases.length > 0) {
            updateNotionStatus('connected', `Connected (${notionDatabases.length} databases)`);
        } else {
            updateNotionStatus('connected', 'Connected (no databases found)');
        }
        
    } catch (error) {
        console.error('Error loading Notion databases:', error);
        
        if (error.message.includes('Invalid Notion API token')) {
            updateNotionStatus('disconnected', 'Invalid token');
            openSettings();
        } else if (error.message.includes('lacks required permissions')) {
            updateNotionStatus('disconnected', 'Insufficient permissions');
        } else {
            updateNotionStatus('disconnected', 'Failed to load databases');
        }
    } finally {
        refreshDatabasesBtn.disabled = false;
    }
}

// Populate database select dropdown
function populateDatabaseSelect() {
    databaseSelect.innerHTML = '';
    
    if (notionDatabases.length === 0) {
        const option = document.createElement('option');
        option.value = '';
        option.textContent = 'No databases found';
        databaseSelect.appendChild(option);
        return;
    }
    
    // Add default option
    const defaultOption = document.createElement('option');
    defaultOption.value = '';
    defaultOption.textContent = 'Select a database...';
    databaseSelect.appendChild(defaultOption);
    
    // Add database options
    notionDatabases.forEach(db => {
        const option = document.createElement('option');
        option.value = db.id;
        option.textContent = db.title;
        databaseSelect.appendChild(option);
    });
}

// Handle database selection
function handleDatabaseSelect() {
    selectedDatabaseId = databaseSelect.value;
    saveToNotionBtn.disabled = !selectedDatabaseId;
    
    if (selectedDatabaseId) {
        saveStatus.textContent = `Ready to save to: ${databaseSelect.options[databaseSelect.selectedIndex].text}`;
        saveStatus.className = 'save-status';
    } else {
        saveStatus.textContent = '';
        saveStatus.className = 'save-status';
    }
}

// Handle save to Notion
async function handleSaveToNotion() {
    if (!currentResult || !selectedDatabaseId) {
        return;
    }
    
    try {
        saveToNotionBtn.disabled = true;
        saveStatus.textContent = 'Saving to Notion...';
        saveStatus.className = 'save-status loading';
        
        const response = await fetch('/api/notion/saveNote', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                databaseId: selectedDatabaseId,
                videoInfo: currentResult.videoInfo,
                markdown: currentResult.markdown
            })
        });
        
        const data = await response.json();
        
        if (!response.ok) {
            throw new Error(data.error || 'Failed to save to Notion');
        }
        
        // Success
        saveStatus.innerHTML = `
            <span class="success">✅ ${data.message}</span>
            <br><a href="${data.pageUrl}" target="_blank" style="color: #667eea; text-decoration: underline;">Open Main Page</a>
            <br><a href="${data.childPageUrl}" target="_blank" style="color: #667eea; text-decoration: underline;">Open Analysis Page</a>
        `;
        saveStatus.className = 'save-status success';
        
    } catch (error) {
        console.error('Error saving to Notion:', error);
        saveStatus.textContent = `Error: ${error.message}`;
        saveStatus.className = 'save-status error';
    } finally {
        saveToNotionBtn.disabled = false;
    }
}

// ===== FAVORITES MANAGEMENT FUNCTIONS =====

// Load favorites from localStorage
function loadFavorites() {
    try {
        const stored = localStorage.getItem('youtubeAnalysisFavorites');
        if (stored) {
            const parsed = JSON.parse(stored);
            if (Array.isArray(parsed)) {
                favoriteModels = parsed;
            } else {
                favoriteModels = [];
            }
        } else {
            favoriteModels = [];
        }
    } catch (error) {
        console.error('Error loading favorites:', error);
        favoriteModels = [];
    }
}

// Save favorites to localStorage
function saveFavorites() {
    try {
        localStorage.setItem('youtubeAnalysisFavorites', JSON.stringify(favoriteModels));
    } catch (error) {
        console.error('Error saving favorites:', error);
        // Handle localStorage quota exceeded
        if (error.name === 'QuotaExceededError') {
            showError('Storage limit exceeded. Please remove some favorites.');
        }
    }
}

// Toggle favorite status for a model
function toggleFavorite(modelId) {
    const index = favoriteModels.indexOf(modelId);
    const model = allModels.find(m => m.id === modelId);
    
    if (index > -1) {
        // Remove from favorites
        favoriteModels.splice(index, 1);
        showNotification(`${model.name} removed from favorites`, 'info');
    } else {
        // Add to favorites
        favoriteModels.push(modelId);
        showNotification(`${model.name} added to favorites`, 'success');
    }
    
    saveFavorites();
    updateModelDisplay();
}

// Check if a model is favorited
function isFavorite(modelId) {
    return favoriteModels.includes(modelId);
}

// Update model display with favorites
function updateModelDisplay() {
    if (allModels.length > 0) {
        // Update favorite status for all models
        allModels.forEach(model => {
            model.isFavorite = isFavorite(model.id);
        });
        
        // Sort models: favorites first, then alphabetically
        allModels.sort((a, b) => {
            if (a.isFavorite && !b.isFavorite) return -1;
            if (!a.isFavorite && b.isFavorite) return 1;
            return a.name.localeCompare(b.name);
        });
        
        populateModelSelect(allModels);
        
        // Restore current selection if it exists
        if (modelSelect.value && allModels.some(model => model.id === modelSelect.value)) {
            updateModelInfo();
        } else if (allModels.length > 0) {
            modelSelect.value = allModels[0].id;
            updateModelInfo();
        }
    }
}

// Handle favorite star click
function handleFavoriteClick(event, modelId) {
    event.preventDefault();
    event.stopPropagation();
    
    toggleFavorite(modelId);
    
    // Add visual feedback
    const star = event.target;
    star.style.transform = 'scale(1.2)';
    setTimeout(() => {
        star.style.transform = 'scale(1)';
    }, 150);
}

// Clear all favorites
function clearAllFavorites() {
    if (confirm('Are you sure you want to clear all favorites?')) {
        favoriteModels = [];
        saveFavorites();
        updateModelDisplay();
    }
}

// Handle favorite toggle button click
function handleFavoriteToggle() {
    const selectedModelId = modelSelect.value;
    if (selectedModelId) {
        toggleFavorite(selectedModelId);
    }
}

// Update favorite toggle button appearance
function updateFavoriteToggle(model) {
    if (model.isFavorite) {
        favoriteToggleBtn.classList.add('favorited');
        favoriteToggleBtn.innerHTML = '<i class="fas fa-star"></i>';
        favoriteToggleBtn.title = 'Remove from favorites';
    } else {
        favoriteToggleBtn.classList.remove('favorited');
        favoriteToggleBtn.innerHTML = '<i class="far fa-star"></i>';
        favoriteToggleBtn.title = 'Add to favorites';
    }
}

// Update favorite count display
function updateFavoriteCount() {
    if (favoriteModels.length > 0) {
        favoriteCount.textContent = `${favoriteModels.length} favorite${favoriteModels.length !== 1 ? 's' : ''}`;
    } else {
        favoriteCount.textContent = '';
    }
    
    // Update settings modal count
    if (favoritesCount) {
        favoritesCount.textContent = `${favoriteModels.length} favorite${favoriteModels.length !== 1 ? 's' : ''}`;
    }
    
    // Update model stats
    updateModelStats();
}

// Update model statistics
function updateModelStats() {
    if (modelStats && allModels.length > 0) {
        const totalModels = allModels.length;
        const favoriteCount = favoriteModels.length;
        modelStats.textContent = `(${totalModels} models, ${favoriteCount} favorite${favoriteCount !== 1 ? 's' : ''})`;
    }
}

// Export favorites to JSON file
function exportFavorites() {
    try {
        const favoritesData = {
            favorites: favoriteModels,
            exportDate: new Date().toISOString(),
            version: '1.0'
        };
        
        const dataStr = JSON.stringify(favoritesData, null, 2);
        const dataBlob = new Blob([dataStr], { type: 'application/json' });
        
        const link = document.createElement('a');
        link.href = URL.createObjectURL(dataBlob);
        link.download = `youtube-analysis-favorites-${new Date().toISOString().split('T')[0]}.json`;
        link.click();
        
        URL.revokeObjectURL(link.href);
    } catch (error) {
        console.error('Error exporting favorites:', error);
        showError('Failed to export favorites');
    }
}

// Handle import favorites from file
function handleImportFavorites(event) {
    const file = event.target.files[0];
    if (!file) return;
    
    const reader = new FileReader();
    reader.onload = function(e) {
        try {
            const data = JSON.parse(e.target.result);
            
            if (data.favorites && Array.isArray(data.favorites)) {
                // Validate that all favorites are valid model IDs
                const validModels = allModels.map(model => model.id);
                const validFavorites = data.favorites.filter(id => validModels.includes(id));
                
                if (validFavorites.length !== data.favorites.length) {
                    const invalidCount = data.favorites.length - validFavorites.length;
                    alert(`Warning: ${invalidCount} favorite(s) were not found in the current model list and will be skipped.`);
                }
                
                favoriteModels = validFavorites;
                saveFavorites();
                updateModelDisplay();
                
                alert(`Successfully imported ${validFavorites.length} favorite(s)!`);
            } else {
                throw new Error('Invalid favorites file format');
            }
        } catch (error) {
            console.error('Error importing favorites:', error);
            alert('Error importing favorites. Please check the file format.');
        }
    };
    
    reader.readAsText(file);
    event.target.value = ''; // Reset file input
}

// Toggle favorites filter
function toggleFavoritesFilter() {
    favoritesOnlyCheckbox.checked = !favoritesOnlyCheckbox.checked;
    favoritesFilterBtn.classList.toggle('active', favoritesOnlyCheckbox.checked);
    filterModels();
}

// Show notification toast
function showNotification(message, type = 'info') {
    // Create notification element
    const notification = document.createElement('div');
    notification.className = `notification notification-${type}`;
    notification.innerHTML = `
        <div class="notification-content">
            <i class="fas fa-${type === 'success' ? 'check-circle' : type === 'error' ? 'exclamation-triangle' : 'info-circle'}"></i>
            <span>${message}</span>
        </div>
    `;
    
    // Add to page
    document.body.appendChild(notification);
    
    // Show notification
    setTimeout(() => {
        notification.classList.add('show');
    }, 100);
    
    // Remove notification after 3 seconds
    setTimeout(() => {
        notification.classList.remove('show');
        setTimeout(() => {
            if (notification.parentNode) {
                notification.parentNode.removeChild(notification);
            }
        }, 300);
    }, 3000);
}

// Download Modal Functions

// Show download modal
function showDownloadModal() {
    downloadModal.classList.remove('hidden');
    
    // Set default filename
    const videoTitle = document.getElementById('videoTitle').textContent;
    const sanitizedTitle = videoTitle.replace(/[<>:"/\\|?*]/g, '_').substring(0, 50);
    downloadFilename.value = sanitizedTitle || 'youtube-analysis';
    
    // Update folder help text and status
    updateFolderHelpText();
    
    // Load favorite folders and common directories
    loadFavoriteFolders();
    loadCommonDirectories();
    
    // Enable/disable save button based on input
    updateSaveButtonState();
}

// Update folder help text based on browser support
function updateFolderHelpText() {
    const folderHelpText = document.getElementById('folderHelpText');
    const fileSystemAccessStatus = document.getElementById('fileSystemAccessStatus');
    
    if (isFileSystemAccessSupported) {
        folderHelpText.textContent = 'Click "Browse" to select a folder, or type/paste the full path manually.';
        fileSystemAccessStatus.textContent = 'Folder browsing supported';
        fileSystemAccessStatus.className = 'status-indicator supported';
        browseFolderBtn.disabled = false;
    } else {
        folderHelpText.textContent = 'Folder browsing not supported in your browser. Please type or paste the full path manually.';
        fileSystemAccessStatus.textContent = 'Folder browsing not supported';
        fileSystemAccessStatus.className = 'status-indicator not-supported';
        browseFolderBtn.disabled = true;
    }
}

// Hide download modal
function hideDownloadModal() {
    downloadModal.classList.add('hidden');
    clearFolderSelections();
}

// Load download modal data (favorites and common directories)
async function loadDownloadModalData() {
    try {
        const response = await fetch('/api/folders/browse');
        const data = await response.json();
        
        if (data.success) {
            populateFavoriteFolders(data.favoriteFolders);
            populateCommonDirectories(data.commonDirectories);
        }
    } catch (error) {
        console.error('Error loading download modal data:', error);
        showNotification('Failed to load folder data', 'error');
    }
}

// Populate favorite folders list
function populateFavoriteFolders(favorites) {
    favoriteFoldersList.innerHTML = '';
    
    if (favorites.length === 0) {
        favoriteFoldersList.innerHTML = `
            <div class="empty-favorites">
                <i class="fas fa-star"></i>
                <p>No favorite folders yet</p>
                <small>Add folders to favorites for quick access</small>
            </div>
        `;
        return;
    }
    
    favorites.forEach(folderPath => {
        const folderName = folderPath.split(/[/\\]/).pop() || folderPath;
        const item = document.createElement('div');
        item.className = 'favorite-folder-item';
        item.dataset.path = folderPath;
        item.innerHTML = `
            <div class="folder-info" onclick="selectFavoriteFolder('${folderPath}')">
                <i class="fas fa-folder"></i>
                <div>
                    <div class="folder-name">${folderName}</div>
                    <div class="folder-path">${folderPath}</div>
                </div>
            </div>
            <button class="remove-favorite" onclick="removeFavoriteFolder('${folderPath}')" title="Remove from favorites">
                <i class="fas fa-times"></i>
            </button>
        `;
        favoriteFoldersList.appendChild(item);
    });
}

// Populate common directories list
function populateCommonDirectories(directories) {
    commonDirectoriesList.innerHTML = '';
    
    directories.forEach(dirPath => {
        const dirName = dirPath.split(/[/\\]/).pop() || dirPath;
        const item = document.createElement('div');
        item.className = 'common-directory-item';
        item.dataset.path = dirPath;
        item.innerHTML = `
            <i class="fas fa-folder"></i>
            <div>
                <div class="folder-name">${dirName}</div>
                <div class="folder-path">${dirPath}</div>
            </div>
        `;
        item.addEventListener('click', () => selectCommonDirectory(dirPath));
        commonDirectoriesList.appendChild(item);
    });
}

// Select favorite folder
function selectFavoriteFolder(folderPath) {
    downloadFolderPath.value = folderPath;
    clearFolderSelections();
    
    // Highlight selected favorite
    const items = favoriteFoldersList.querySelectorAll('.favorite-folder-item');
    items.forEach(item => {
        if (item.dataset.path === folderPath) {
            item.classList.add('selected');
        }
    });
    
    validateDownloadForm();
}

// Select common directory
function selectCommonDirectory(dirPath) {
    downloadFolderPath.value = dirPath;
    clearFolderSelections();
    
    // Highlight selected common directory
    const items = commonDirectoriesList.querySelectorAll('.common-directory-item');
    items.forEach(item => {
        if (item.dataset.path === dirPath) {
            item.classList.add('selected');
        }
    });
    
    validateDownloadForm();
}

// Clear folder selections
function clearFolderSelections() {
    favoriteFoldersList.querySelectorAll('.favorite-folder-item').forEach(item => {
        item.classList.remove('selected');
    });
    commonDirectoriesList.querySelectorAll('.common-directory-item').forEach(item => {
        item.classList.remove('selected');
    });
}

// Remove favorite folder
async function removeFavoriteFolder(folderPath) {
    try {
        const response = await fetch('/api/folders/favorites', {
            method: 'DELETE',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ folderPath })
        });
        
        const data = await response.json();
        
        if (data.success) {
            showNotification('Folder removed from favorites', 'success');
            // Reload favorites list
            loadDownloadModalData();
        } else {
            showNotification(data.error || 'Failed to remove folder from favorites', 'error');
        }
    } catch (error) {
        console.error('Error removing favorite folder:', error);
        showNotification('Failed to remove folder from favorites', 'error');
    }
}

// Add current folder to favorites
async function addCurrentFolderToFavorites() {
    const folderPath = downloadFolderPath.value.trim();
    if (!folderPath) return;
    // Validate folder accessibility before adding
    try {
        const checkResponse = await fetch('/api/folders/browse');
        const checkData = await checkResponse.json();
        const allDirs = [...(checkData.commonDirectories || []), ...(checkData.favoriteFolders || [])];
        if (!allDirs.includes(folderPath)) {
            showNotification('Folder does not exist or is not accessible', 'error');
            return;
        }
    } catch (error) {
        showNotification('Failed to validate folder', 'error');
        return;
    }
    try {
        const response = await fetch('/api/folders/favorites', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ folderPath })
        });
        let data;
        try {
            data = await response.json();
        } catch (jsonError) {
            showNotification('Unexpected server response. Please check the server logs.', 'error');
            return;
        }
        if (!response.ok) {
            showNotification(data.error || 'Failed to add folder to favorites (server error)', 'error');
            return;
        }
        if (data.success) {
            showNotification('Folder added to favorites', 'success');
            // Reload favorites list
            loadDownloadModalData();
        } else {
            showNotification(data.error || 'Failed to add folder to favorites', 'error');
        }
    } catch (error) {
        console.error('Error adding favorite folder:', error);
        showNotification('Failed to add folder to favorites: ' + (error.message || error), 'error');
    }
}

// Save markdown to folder
async function saveMarkdownToFolder(overwrite = false) {
    if (!currentResult) {
        showNotification('No analysis result to save', 'error');
        return;
    }
    
    const filename = downloadFilename.value.trim();
    const folderPath = downloadFolderPath.value.trim();
    
    if (!filename || !folderPath) {
        showNotification('Please enter both filename and folder path', 'error');
        return;
    }
    // Save last used folder
    localStorage.setItem('lastUsedFolder', folderPath);
    
    try {
        saveMarkdownBtn.disabled = true;
        saveMarkdownBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Saving...';
        
        const response = await fetch('/api/download/save', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                content: currentResult.markdown,
                filename: filename.endsWith('.md') ? filename : `${filename}.md`,
                folderPath: folderPath,
                overwrite: overwrite
            })
        });
        
        let data;
        try {
            data = await response.json();
        } catch (jsonError) {
            showNotification('Unexpected server response. Please check the server logs.', 'error');
            return;
        }
        
        if (!response.ok) {
            showNotification(data.error || 'Failed to save file (server error)', 'error');
            return;
        }
        
        if (response.status === 409 && data.needsConfirmation) {
            if (confirm('A file with this name already exists. Overwrite?')) {
                await saveMarkdownToFolder(true);
                return;
            } else {
                showNotification('File not saved (overwrite cancelled)', 'info');
                return;
            }
        }
        
        if (data.success) {
            showNotification(data.message, 'success');
            hideDownloadModal();
        } else {
            showNotification(data.error || 'Failed to save file', 'error');
        }
    } catch (error) {
        console.error('Error saving markdown:', error);
        showNotification('Failed to save file: ' + (error.message || error), 'error');
    } finally {
        saveMarkdownBtn.disabled = false;
        saveMarkdownBtn.innerHTML = '<i class="fas fa-save"></i> Save File';
    }
} 

// Keyboard navigation for download modal
if (downloadModal) {
    downloadModal.addEventListener('keydown', function(event) {
        if (event.key === 'Escape') {
            hideDownloadModal();
        } else if (event.key === 'Enter') {
            if (!saveMarkdownBtn.disabled) {
                saveMarkdownToFolder();
            }
        }
    });
} 

function validateDownloadForm() {
    const filename = downloadFilename.value ? downloadFilename.value.trim() : '';
    const folderPath = downloadFolderPath.value ? downloadFolderPath.value.trim() : '';
    const isValid = filename.length > 0 && folderPath.length > 0;
    if (typeof saveMarkdownBtn !== 'undefined') saveMarkdownBtn.disabled = !isValid;
    if (typeof addCurrentToFavoritesBtn !== 'undefined') addCurrentToFavoritesBtn.disabled = !folderPath.length > 0;
} 