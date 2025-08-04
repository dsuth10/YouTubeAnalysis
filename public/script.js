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

// Editable Prompt Interface Elements
const promptTemplateSelect = document.getElementById('promptTemplateSelect');
const promptEditorContainer = document.getElementById('promptEditorContainer');
const editedPromptTextarea = document.getElementById('editedPromptTextarea');
const useEditedPromptCheckbox = document.getElementById('useEditedPromptCheckbox');
const resetPromptBtn = document.getElementById('resetPromptBtn');
const promptIndicator = document.getElementById('promptIndicator');
const promptStatusText = document.getElementById('promptStatusText');
const promptLength = document.getElementById('promptLength');

// Result elements
const videoTitle = document.getElementById('videoTitle');
const videoChannel = document.getElementById('videoChannel');
const videoViews = document.getElementById('videoViews');
const videoLikes = document.getElementById('videoLikes');
const videoDate = document.getElementById('videoDate');
const videoThumbnail = document.getElementById('videoThumbnail');

// Action buttons
const downloadBtn = document.getElementById('downloadBtn');
const downloadPromptBtn = document.getElementById('downloadPromptBtn');
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

// Editable Prompt Interface Variables
let availablePrompts = []; // Store all available prompts
let currentPromptTemplate = null; // Store the currently selected template
let originalPromptContent = ''; // Store the original template content

// Initialize the app
document.addEventListener('DOMContentLoaded', function() {
    loadSettings();
    loadFavorites(); // Load favorites before models
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
    
    // Favorite toggle functionality
    favoriteToggleBtn.addEventListener('click', handleFavoriteToggle);
    favoritesOnlyCheckbox.addEventListener('change', filterModels);
    favoritesFilterBtn.addEventListener('click', toggleFavoritesFilter);
    
    // Model refresh functionality
    document.getElementById('refreshModelsBtn').addEventListener('click', handleRefreshModels);
    
    // Editable Prompt Interface Event Listeners
    promptTemplateSelect.addEventListener('change', handlePromptTemplateChange);
    editedPromptTextarea.addEventListener('input', handlePromptTextareaInput);
    useEditedPromptCheckbox.addEventListener('change', handleUseEditedPromptChange);
    resetPromptBtn.addEventListener('click', handleResetPrompt);
    
    // Action buttons
    downloadBtn.addEventListener('click', handleDownload);
    downloadPromptBtn.addEventListener('click', handleDownloadPrompt);
    document.getElementById('downloadTranscriptBtn').addEventListener('click', handleDownloadTranscript);
    document.getElementById('downloadDescriptionBtn').addEventListener('click', handleDownloadDescription);
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
    
    // Favorites management
    clearFavoritesBtn.addEventListener('click', clearAllFavorites);
    exportFavoritesBtn.addEventListener('click', exportFavorites);
    importFavoritesBtn.addEventListener('click', () => importFavoritesInput.click());
    importFavoritesInput.addEventListener('change', handleImportFavorites);
    
    // Close modals on outside click
    window.addEventListener('click', function(event) {
        if (event.target === settingsModal) closeSettings();
        if (event.target === helpModal) closeHelp();
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
        
        // Ctrl/Cmd + R to refresh models
        if ((event.ctrlKey || event.metaKey) && event.key === 'r') {
            event.preventDefault();
            handleRefreshModels();
        }
    });
}

// Handle form submission
async function handleFormSubmit(e) {
    e.preventDefault();
    
    const url = youtubeUrlInput.value.trim();
    const model = modelSelect.value;
    const promptId = promptSelect.value;
    const tokenLimit = parseInt(document.getElementById('tokenLimitSelect').value) || 10000;
    const manualTranscript = document.getElementById('manualTranscriptInput') ? document.getElementById('manualTranscriptInput').value.trim() : '';
    
    // Get edited prompt if enabled
    let editedPrompt = null;
    if (useEditedPromptCheckbox.checked && editedPromptTextarea.value.trim() !== '') {
        editedPrompt = editedPromptTextarea.value.trim();
        
        // Validate prompt length
        if (editedPrompt.length > 5000) {
            showError('Edited prompt is too long. Please keep it under 5000 characters.');
            return;
        }
    }
    
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
    await analyzeVideo(url, model, promptId, tokenLimit, manualTranscript, editedPrompt);
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
async function analyzeVideo(url, model, promptId, tokenLimit, manualTranscript, editedPrompt = null) {
    try {
        showLoading();
        updateLoadingMessage('Fetching video information...');
        
        const requestBody = { url, model, promptId, tokenLimit, manualTranscript };
        
        // Add edited prompt if provided
        if (editedPrompt) {
            requestBody.editedPrompt = editedPrompt;
        }
        
        const response = await fetch('/api/process', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(requestBody)
        });
        
        const data = await response.json();
        
        if (!response.ok) {
            throw new Error(data.error || 'Failed to analyze video');
        }
        
        console.log('Received analysis result:', data);
        console.log('Transcript available:', !!data.transcript);
        console.log('Transcript length:', data.transcript ? data.transcript.length : 'null');
        console.log('Raw description available:', !!data.rawDescription);
        
        currentResult = data;
        showResult(data);
        
        // Show notification based on transcript status
        if (data.transcriptStatus === 'available') {
            showNotification('Analysis completed successfully with transcript!', 'success');
        } else if (data.transcriptStatus === 'api_available_but_extraction_failed') {
            showNotification('Analysis completed. Captions exist but could not be extracted. Analysis based on video description.', 'warning');
        } else if (data.transcriptStatus === 'failed') {
            showNotification('Analysis completed, but no transcript was available for this video. The analysis was based on the video description.', 'info');
        } else {
            showNotification('Analysis completed, but no transcript was available for this video. The analysis was based on the video description.', 'info');
        }
        
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

// Handle download prompt
async function handleDownloadPrompt() {
    if (!currentResult) {
        alert('No analysis result available. Please analyze a video first.');
        return;
    }

    try {
        downloadPromptBtn.disabled = true;
        downloadPromptBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Getting Prompt...';
        
        const url = youtubeUrlInput.value.trim();
        const promptId = promptSelect.value;
        const model = modelSelect.value;
        
        const response = await fetch('/api/getPrompt', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ url, promptId, model })
        });
        
        const data = await response.json();
        
        if (!response.ok) {
            throw new Error(data.error || 'Failed to get prompt');
        }
        
        // Create filename based on video title
        const videoTitle = currentResult.videoInfo.title || 'youtube-video';
        const sanitizedTitle = videoTitle.replace(/[^a-z0-9]/gi, '_').toLowerCase();
        const filename = `prompt_${sanitizedTitle}.json`;
        
        // Create and download the JSON file
        const blob = new Blob([JSON.stringify(data.prompt, null, 2)], { type: 'application/json' });
        const downloadUrl = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = downloadUrl;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(downloadUrl);
        
        showNotification('Prompt downloaded successfully!', 'success');
        
    } catch (error) {
        console.error('Download prompt error:', error);
        showNotification(`Failed to download prompt: ${error.message}`, 'error');
    } finally {
        downloadPromptBtn.disabled = false;
        downloadPromptBtn.innerHTML = '<i class="fas fa-file-code"></i> Download Prompt';
    }
}

// Handle download transcript
function handleDownloadTranscript() {
    console.log('Download transcript clicked');
    console.log('Current result:', currentResult);
    console.log('Transcript available:', !!currentResult?.transcript);
    console.log('Transcript length:', currentResult?.transcript ? currentResult.transcript.length : 'null');
    
    if (!currentResult || !currentResult.transcript) {
        alert('No transcript available. Please analyze a video first.');
        return;
    }
    
    // Create filename based on video title
    const videoTitle = currentResult.videoInfo.title || 'youtube-video';
    const sanitizedTitle = videoTitle.replace(/[^a-z0-9]/gi, '_').toLowerCase();
    const filename = `transcript_${sanitizedTitle}.md`;
    
    // Create markdown content with metadata
    const markdownContent = `# Transcript: ${currentResult.videoInfo.title}

**Channel:** ${currentResult.videoInfo.channelTitle}  
**Video ID:** ${currentResult.videoInfo.videoId}  
**URL:** https://youtu.be/${currentResult.videoInfo.videoId}  
**Published:** ${new Date(currentResult.videoInfo.publishedAt).toLocaleDateString('en-AU', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
})}

---

${currentResult.transcript}

---

*This transcript was extracted directly from YouTube using the YouTube Data API.*
`;
    
    // Create and download the file
    const blob = new Blob([markdownContent], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    showNotification('Transcript downloaded successfully!', 'success');
}

// Handle download description
function handleDownloadDescription() {
    console.log('Download description clicked');
    console.log('Current result:', currentResult);
    console.log('Raw description available:', !!currentResult?.rawDescription);
    console.log('Raw description length:', currentResult?.rawDescription ? currentResult.rawDescription.length : 'null');
    
    if (!currentResult || !currentResult.rawDescription) {
        alert('No video description available. Please analyze a video first.');
        return;
    }
    
    // Create filename based on video title
    const videoTitle = currentResult.videoInfo.title || 'youtube-video';
    const sanitizedTitle = videoTitle.replace(/[^a-z0-9]/gi, '_').toLowerCase();
    const filename = `description_${sanitizedTitle}.md`;
    
    // Create markdown content with metadata
    const markdownContent = `# Video Description: ${currentResult.videoInfo.title}

**Channel:** ${currentResult.videoInfo.channelTitle}  
**Video ID:** ${currentResult.videoInfo.videoId}  
**URL:** https://youtu.be/${currentResult.videoInfo.videoId}  
**Published:** ${new Date(currentResult.videoInfo.publishedAt).toLocaleDateString('en-AU', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
})}

---

${currentResult.rawDescription}

---

*This description was extracted directly from YouTube using the YouTube Data API.*
`;
    
    // Create and download the file
    const blob = new Blob([markdownContent], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    showNotification('Video description downloaded successfully!', 'success');
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
    if (document.getElementById('manualTranscriptInput')) {
        document.getElementById('manualTranscriptInput').value = '';
    }
    currentResult = null;
    
    // Reset Notion state
    selectedDatabaseId = null;
    if (databaseSelect) {
        databaseSelect.value = '';
    }
    if (saveToNotionBtn) {
        saveToNotionBtn.disabled = true;
    }
    if (saveStatus) {
        saveStatus.textContent = '';
        saveStatus.className = 'save-status';
    }
}

// Handle retry
function handleRetry() {
    if (currentResult) {
        const tokenLimit = parseInt(document.getElementById('tokenLimitSelect').value) || 10000;
        analyzeVideo(youtubeUrlInput.value, modelSelect.value, promptSelect.value, tokenLimit);
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
        
        if (!response.ok) {
            const errorText = await response.text();
            let errorMessage;
            try {
                const errorData = JSON.parse(errorText);
                errorMessage = errorData.error || 'Failed to export to Notion';
            } catch {
                errorMessage = `HTTP ${response.status}: ${response.statusText}`;
            }
            throw new Error(errorMessage);
        }
        
        const data = await response.json();
        
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
        
        if (!response.ok) {
            const errorText = await response.text();
            let errorMessage;
            try {
                const errorData = JSON.parse(errorText);
                errorMessage = errorData.error || 'Failed to load models';
            } catch {
                errorMessage = `HTTP ${response.status}: ${response.statusText}`;
            }
            throw new Error(errorMessage);
        }
        
        const data = await response.json();

        // Store models globally
        allModels = Array.isArray(data.models) ? data.models : [];

        // Update model display with favorites applied
        updateModelDisplay();
        
        // Update model statistics
        updateModelStats();
        
    } catch (error) {
        console.error('Error loading models:', error);
    }
}

// Handle refresh models button click
async function handleRefreshModels() {
    const refreshBtn = document.getElementById('refreshModelsBtn');
    const originalIcon = refreshBtn.innerHTML;
    
    try {
        // Show loading state
        refreshBtn.disabled = true;
        refreshBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i>';
        
        // Reload models
        await loadModels();
        
        // Show success notification
        showNotification('Models refreshed successfully!', 'success');
        
    } catch (error) {
        console.error('Error refreshing models:', error);
        showNotification('Failed to refresh models. Please try again.', 'error');
    } finally {
        // Restore button state
        refreshBtn.disabled = false;
        refreshBtn.innerHTML = originalIcon;
    }
}

// Load available prompts
async function loadPrompts() {
    try {
        const response = await fetch('/api/prompts');
        
        if (!response.ok) {
            const errorText = await response.text();
            let errorMessage;
            try {
                const errorData = JSON.parse(errorText);
                errorMessage = errorData.error || 'Failed to load prompts';
            } catch {
                errorMessage = `HTTP ${response.status}: ${response.statusText}`;
            }
            console.error('Failed to load prompts:', errorMessage);
            availablePrompts = [];
            populatePromptSelect([]);
            populatePromptTemplateSelect([]);
            return;
        }
        
        const data = await response.json();
        availablePrompts = data.prompts; // Store prompts globally
        populatePromptSelect(data.prompts);
        populatePromptTemplateSelect(data.prompts);
        
    } catch (error) {
        console.error('Error loading prompts:', error);
        availablePrompts = [];
        populatePromptSelect([]);
        populatePromptTemplateSelect([]);
    }
}

// Populate model select dropdown
function populateModelSelect(models) {
    modelSelect.innerHTML = '';
    
    // Add favorites section if there are favorites
    const favoriteList = models.filter(model => model.isFavorite);
    const nonFavoriteModels = models.filter(model => !model.isFavorite);

    if (favoriteList.length > 0) {
        // Add favorites section header
        const favoritesHeader = document.createElement('option');
        favoritesHeader.disabled = true;
        favoritesHeader.textContent = '★ Favorites';
        favoritesHeader.style.fontWeight = 'bold';
        favoritesHeader.style.backgroundColor = '#f8f9fa';
        modelSelect.appendChild(favoritesHeader);

        // Add favorite models
        favoriteList.forEach(model => {
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

// Populate prompt template select dropdown
function populatePromptTemplateSelect(prompts) {
    promptTemplateSelect.innerHTML = '';
    
    // Add default option
    const defaultOption = document.createElement('option');
    defaultOption.value = '';
    defaultOption.textContent = 'Select a template to edit...';
    promptTemplateSelect.appendChild(defaultOption);
    
    // Add all prompts
    prompts.forEach(prompt => {
        const option = document.createElement('option');
        option.value = prompt.id;
        option.textContent = prompt.name;
        promptTemplateSelect.appendChild(option);
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
    updateFavoriteCount(); // Update favorites count in settings
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
    
    if (!model) {
        console.error('Model not found:', modelId);
        return;
    }
    
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
        const favoritesTotal = favoriteModels.length;
        modelStats.textContent = `(${totalModels} models, ${favoritesTotal} favorite${favoritesTotal !== 1 ? 's' : ''})`;
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
            <i class="fas fa-${type === 'success' ? 'check-circle' : 'info-circle'}"></i>
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

// Editable Prompt Interface Event Handlers
async function handlePromptTemplateChange() {
    const selectedTemplateId = promptTemplateSelect.value;
    
    if (!selectedTemplateId) {
        // Hide editor if no template selected
        promptEditorContainer.style.display = 'none';
        currentPromptTemplate = null;
        originalPromptContent = '';
        editedPromptTextarea.value = '';
        useEditedPromptCheckbox.checked = false;
        updatePromptStatus();
        return;
    }
    
    try {
        // Fetch the prompt content
        const response = await fetch(`/api/prompts/${selectedTemplateId}`);
        
        // Check response status before parsing JSON
        if (!response.ok) {
            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }
        
        const data = await response.json();
        
        // Store the template and original content
        currentPromptTemplate = selectedTemplateId;
        originalPromptContent = data.content;
        
        // Load the content into the textarea
        editedPromptTextarea.value = originalPromptContent;
        
        // Show the editor
        promptEditorContainer.style.display = 'block';
        promptEditorContainer.classList.add('active');
        
        // Reset the checkbox
        useEditedPromptCheckbox.checked = false;
        
        // Update status
        updatePromptStatus();
        updatePromptLength();
        
        showNotification('Template loaded successfully. You can now edit the prompt.', 'success');
    } catch (error) {
        console.error('Error loading template content:', error);
        showNotification(`Failed to load template content: ${error.message}`, 'error');
    }
}

function handlePromptTextareaInput() {
    updatePromptLength();
    
    // Check if content has been modified
    const currentContent = editedPromptTextarea.value;
    const isModified = currentContent !== originalPromptContent;
    
    // Update the checkbox state based on modification
    if (isModified && !useEditedPromptCheckbox.checked) {
        useEditedPromptCheckbox.checked = true;
    } else if (!isModified && useEditedPromptCheckbox.checked) {
        useEditedPromptCheckbox.checked = false;
    }
    
    updatePromptStatus();
}

function handleUseEditedPromptChange() {
    updatePromptStatus();
    
    if (useEditedPromptCheckbox.checked) {
        showNotification('Edited prompt will be used for analysis.', 'info');
    } else {
        showNotification('Original template will be used for analysis.', 'info');
    }
}

function handleResetPrompt() {
    if (currentPromptTemplate && originalPromptContent) {
        editedPromptTextarea.value = originalPromptContent;
        useEditedPromptCheckbox.checked = false;
        updatePromptStatus();
        updatePromptLength();
        showNotification('Prompt reset to original template.', 'info');
    }
}

function updatePromptStatus() {
    const isUsingEdited = useEditedPromptCheckbox.checked && editedPromptTextarea.value.trim() !== '';
    
    if (isUsingEdited) {
        promptIndicator.className = 'prompt-indicator using-edited';
        promptStatusText.textContent = 'Edited prompt will be used';
    } else {
        promptIndicator.className = 'prompt-indicator using-original';
        promptStatusText.textContent = 'Original template will be used';
    }
}

function updatePromptLength() {
    const length = editedPromptTextarea.value.length;
    const maxLength = 5000;
    
    promptLength.textContent = `${length} / ${maxLength} characters`;
    
    // Update color based on length
    promptLength.className = 'prompt-length';
    if (length > maxLength * 0.8) {
        promptLength.classList.add('warning');
    }
    if (length > maxLength * 0.95) {
        promptLength.classList.add('danger');
    }
} 