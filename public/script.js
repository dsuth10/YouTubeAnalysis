// DOM Elements
const analysisForm = document.getElementById('analysisForm');
const youtubeUrlInput = document.getElementById('youtubeUrl');
const modelSelect = document.getElementById('modelSelect');
const modelSearch = document.getElementById('modelSearch');
const modelInfo = document.getElementById('modelInfo');
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

// API Keys
const youtubeApiKeyInput = document.getElementById('youtubeApiKey');
const openrouterApiKeyInput = document.getElementById('openrouterApiKey');
const notionTokenInput = document.getElementById('notionToken');

// Global variables
let currentResult = null;

// Initialize the app
document.addEventListener('DOMContentLoaded', function() {
    loadSettings();
    loadModels();
    loadPrompts();
    setupEventListeners();
    checkHealth();
    initializeNotion();
});

// Setup event listeners
function setupEventListeners() {
    // Form submission
    analysisForm.addEventListener('submit', handleFormSubmit);
    
    // Model search functionality
    modelSearch.addEventListener('input', filterModels);
    modelSelect.addEventListener('change', updateModelInfo);
    
    // Action buttons
    downloadBtn.addEventListener('click', handleDownload);
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
    
    // Close modals on outside click
    window.addEventListener('click', function(event) {
        if (event.target === settingsModal) closeSettings();
        if (event.target === helpModal) closeHelp();
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

// Handle download
function handleDownload() {
    if (!currentResult) return;
    
    const blob = new Blob([currentResult.markdown], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = currentResult.filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
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
    youtubeUrlInput.value = '';
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

// Global variable to store all models
let allModels = [];

// Load available models
async function loadModels() {
    try {
        const response = await fetch('/api/models');
        const data = await response.json();
        
        // Store all models globally
        allModels = data.models;
        
        // Populate the select with all models
        populateModelSelect(allModels);
        
        // Set default selection and update info
        if (allModels.length > 0) {
            modelSelect.value = allModels[0].id;
            updateModelInfo();
        }
        
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
    
    models.forEach(model => {
        const option = document.createElement('option');
        option.value = model.id;
        option.textContent = `${model.name} (${model.provider})`;
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
    const filteredModels = allModels.filter(model => 
        model.name.toLowerCase().includes(searchTerm) ||
        model.id.toLowerCase().includes(searchTerm) ||
        model.provider.toLowerCase().includes(searchTerm)
    );
    
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
    } else {
        modelInfo.innerHTML = '<span class="model-provider">No model selected</span>';
    }
}

// Check server health
async function checkHealth() {
    try {
        const response = await fetch('/api/health');
        const data = await response.json();
        
        if (!data.youtubeApi || !data.openrouterApi) {
            showApiWarning(data);
        }
    } catch (error) {
        console.error('Health check failed:', error);
    }
}

// Show API warning
function showApiWarning(healthData) {
    const warnings = [];
    
    if (!healthData.youtubeApi) {
        warnings.push('YouTube API key not configured');
    }
    
    if (!healthData.openrouterApi) {
        warnings.push('OpenRouter API key not configured');
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
}

// Settings functions
function openSettings() {
    settingsModal.classList.remove('hidden');
    loadSettings();
}

function closeSettings() {
    settingsModal.classList.add('hidden');
}

function saveSettings() {
    const settings = {
        youtubeApiKey: youtubeApiKeyInput.value,
        openrouterApiKey: openrouterApiKeyInput.value,
        notionToken: notionTokenInput.value
    };
    
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
    youtubeApiKeyInput.value = settings.youtubeApiKey || '';
    openrouterApiKeyInput.value = settings.openrouterApiKey || '';
    notionTokenInput.value = settings.notionToken || '';
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