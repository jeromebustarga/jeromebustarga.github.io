// main.js - Main application controller

// Global instances
let dataProcessor;
let metricsCalculator;
let visualizations;
let aiInsights;
let currentTimePeriod = 'all';

// Initialize application
document.addEventListener('DOMContentLoaded', () => {
    console.log('Initializing Algorithm Mirror...');
    
    // Initialize modules
    dataProcessor = new DataProcessor();
    metricsCalculator = new MetricsCalculator();
    visualizations = new Visualizations(dataProcessor);
    aiInsights = new AIInsights();
    
    // Gemini API key is already configured in aiInsights.js
    console.log('Using Gemini AI for analysis');
    
    // Setup event listeners
    setupEventListeners();
    
    // Setup drag and drop
    setupDragAndDrop();
    
    // Setup AI settings
    setupAISettings();
});

// Setup event listeners
function setupEventListeners() {
    // File input
    const fileInput = document.getElementById('file-input');
    fileInput.addEventListener('change', handleFileUpload);
    
    // Upload box click
    const uploadBox = document.getElementById('upload-box');
    uploadBox.addEventListener('click', () => {
        fileInput.click();
    });
    
    // Sample data button
    const sampleBtn = document.getElementById('sample-data-btn');
    sampleBtn.addEventListener('click', loadSampleData);
    
    // View tabs
    document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            switchView(e.target.dataset.view);
            
            // Update active state
            document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
            e.target.classList.add('active');
        });
    });
    
    // Time period buttons
    document.querySelectorAll('.time-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            changeTimePeriod(e.target.dataset.period);
            
            // Update active state
            document.querySelectorAll('.time-btn').forEach(b => b.classList.remove('active'));
            e.target.classList.add('active');
        });
    });
    
    // Download button
    const downloadBtn = document.getElementById('download-btn');
    downloadBtn.addEventListener('click', downloadVisualization);
    
    // Reset button
    const resetBtn = document.getElementById('reset-btn');
    resetBtn.addEventListener('click', () => {
        if (confirm('This will clear all data and start over. Continue?')) {
            location.reload();
        }
    });
    
    // Metric explanation toggle
    const explanationToggle = document.getElementById('explanation-toggle');
    explanationToggle.addEventListener('click', toggleExplanations);
    
    // Algorithm explanation toggle
    const algorithmToggle = document.getElementById('algorithm-explanation-toggle');
    algorithmToggle.addEventListener('click', toggleAlgorithmExplanation);
}

// Setup drag and drop
function setupDragAndDrop() {
    const uploadBox = document.getElementById('upload-box');
    
    uploadBox.addEventListener('dragover', (e) => {
        e.preventDefault();
        uploadBox.classList.add('dragover');
    });
    
    uploadBox.addEventListener('dragleave', () => {
        uploadBox.classList.remove('dragover');
    });
    
    uploadBox.addEventListener('drop', (e) => {
        e.preventDefault();
        uploadBox.classList.remove('dragover');
        
        const files = e.dataTransfer.files;
        if (files.length > 0) {
            handleFile(files[0]);
        }
    });
}

// Handle file upload
function handleFileUpload(event) {
    const file = event.target.files[0];
    if (file) {
        handleFile(file);
    }
}

// Process uploaded file
function handleFile(file) {
    if (!file.name.endsWith('.json')) {
        alert('Please upload a JSON file from YouTube Takeout');
        return;
    }
    
    const reader = new FileReader();
    
    reader.onload = function(e) {
        try {
            const data = JSON.parse(e.target.result);
            processData(data);
        } catch (error) {
            console.error('Error parsing JSON:', error);
            alert('Error reading file. Please ensure it\'s a valid YouTube history JSON file.');
        }
    };
    
    reader.onerror = function() {
        alert('Error reading file. Please try again.');
    };
    
    reader.readAsText(file);
}

// Process YouTube data
async function processData(rawData) {
    try {
        // Show loading state for AI categorization
        const uploadScreen = document.getElementById('upload-screen');
        if (uploadScreen.style.display !== 'none') {
            const uploadContainer = uploadScreen.querySelector('.upload-container');
            if (uploadContainer) {
                uploadContainer.innerHTML += `
                    <div class="loading" style="margin-top: 20px;">
                        <div class="loading-spinner"></div>
                        <span>Processing and categorizing videos with AI...</span>
                    </div>
                `;
            }
        }
        
        // Process data with AI categorization
        const processedData = await dataProcessor.processYouTubeData(rawData);
        
        // Calculate metrics
        const videoData = dataProcessor.getFilteredData();
        const metrics = metricsCalculator.calculateAllMetrics(processedData, videoData);
        
        // Show application
        showApp();
        addExportButtons();

        
        // Initialize visualizations
        visualizations.initialize();
        
        // Update UI
        updateMetricsDisplay(metrics, processedData);
        
        // Generate AI insights (async)
        generateAndDisplayAIInsights(metrics, processedData, videoData);
        
        // Show yearly comparison if we have multiple years
        showYearlyComparison();
        
        // Show categorization stats
        showCategorizationStats(processedData);
        
        console.log('Data processed successfully:', {
            videos: processedData.totalVideos,
            channels: processedData.uniqueChannels,
            metrics: metrics,
            dateRange: `${formatDate(processedData.dateRange.first)} to ${formatDate(processedData.dateRange.last)}`
        });
        
    } catch (error) {
        console.error('Error processing data:', error);
        alert('Error processing data: ' + error.message);
    }
}

// Show categorization statistics
function showCategorizationStats(processedData) {
    const categoryCounts = processedData.categoryCounts || {};
    const otherCount = categoryCounts['Other'] || 0;
    const entertainmentCount = categoryCounts['Entertainment'] || 0;
    const totalCategorized = processedData.totalVideos - otherCount;
    const categorizationRate = ((totalCategorized / processedData.totalVideos) * 100).toFixed(1);
    
    // Display stats in console
    console.log('Categorization Statistics:', {
        totalVideos: processedData.totalVideos,
        categorized: totalCategorized,
        uncategorized: otherCount,
        rate: categorizationRate + '%',
        categories: Object.keys(categoryCounts).length
    });
    
    // Add categorization info to metrics panel if significantly improved
    if (categorizationRate > 85) {
        const metricsPanel = document.querySelector('.metrics-panel');
        const existingStats = document.getElementById('categorization-stats');
        
        if (!existingStats && metricsPanel) {
            const statsHtml = `
                <div id="categorization-stats" style="
                    margin: 15px 0;
                    padding: 12px;
                    background: linear-gradient(135deg, rgba(16, 185, 129, 0.1) 0%, rgba(6, 182, 212, 0.1) 100%);
                    border: 1px solid rgba(16, 185, 129, 0.2);
                    border-radius: 8px;
                    font-size: 12px;
                    color: #34d399;
                ">
                    <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 5px;">
                        <strong>AI-Enhanced Categorization</strong>
                    </div>
                    <div style="color: #10b981; opacity: 0.9;">
                        ${categorizationRate}% of videos accurately categorized
                        (${totalCategorized} out of ${processedData.totalVideos})
                    </div>
                </div>
            `;
            
            const firstSection = metricsPanel.querySelector('.metrics-section');
            if (firstSection) {
                firstSection.insertAdjacentHTML('beforebegin', statsHtml);
            }
        }
    }
}

// Generate and display AI insights
async function generateAndDisplayAIInsights(metrics, processedData, videoData) {
    const narrativeElement = document.getElementById('ai-narrative');
    
    // Show loading state
    if (narrativeElement) {
        narrativeElement.innerHTML = '<div class="loading"><div class="loading-spinner"></div>Generating AI analysis...</div>';
    }
    
    try {
        // Generate insights (will use AI if API key available, otherwise fallback)
        const insights = await aiInsights.generateInsights(metrics, processedData, videoData);
        
        // Display the insights
        aiInsights.displayInsights();
        
        // Check if using fallback
        if (!aiInsights.getApiKey() && narrativeElement) {
            const currentText = narrativeElement.textContent;
            narrativeElement.innerHTML = `
                <div style="margin-bottom: 10px; padding: 8px; background: rgba(255,200,0,0.1); border-radius: 6px; font-size: 11px; color: #fbbf24;">
                    ðŸ“ Using basic analysis. Add OpenAI API key for AI-powered insights.
                </div>
                ${currentText}
            `;
        }
    } catch (error) {
        console.error('Error generating AI insights:', error);
        
        // Show error state
        if (narrativeElement) {
            narrativeElement.innerHTML = `
                <div style="color: #f87171;">
                    Failed to generate AI analysis. Using basic analysis instead.
                </div>
            `;
        }
        
        // Use fallback
        const fallbackInsights = aiInsights.generateFallbackInsights(metrics, processedData, videoData);
        aiInsights.insights = fallbackInsights;
        aiInsights.displayInsights();
    }
}

// Robust export buttons helper
function addExportButtons() {
    const navActions = document.querySelector('.nav-actions');

    if (!navActions) {
        console.warn('addExportButtons: .nav-actions not found. Buttons will be retried when UI is ready.');
        // Retry once after short delay in case the UI hasn't rendered yet
        setTimeout(() => {
            const retry = document.querySelector('.nav-actions');
            if (retry) addExportButtons();
        }, 300);
        return;
    }

    // Avoid adding duplicates
    if (document.getElementById('export-json-btn')) return;

    const exportButtonsHTML = `
        <button class="action-btn" id="export-json-btn" style="margin-right: 10px;">
            Export JSON
        </button>
        <button class="action-btn" id="export-csv-btn" style="margin-right: 10px;">
            Export CSV
        </button>
        <button class="action-btn" id="show-stats-btn" style="margin-right: 10px;">
            Show Stats
        </button>
    `;

    navActions.insertAdjacentHTML('afterbegin', exportButtonsHTML);

    // small helper to safely attach listeners
    function safeEl(id) {
        const el = document.getElementById(id);
        if (!el) console.warn(`addExportButtons: element #${id} not found`);
        return el;
    }

    const jsonBtn = safeEl('export-json-btn');
    const csvBtn = safeEl('export-csv-btn');
    const statsBtn = safeEl('show-stats-btn');

    if (jsonBtn) {
        jsonBtn.addEventListener('click', (e) => {
            try {
                if (dataProcessor && typeof dataProcessor.downloadCategorizedData === 'function') {
                    dataProcessor.downloadCategorizedData('json');
                } else {
                    console.error('Export JSON: dataProcessor or method not available.');
                    alert('Export failed: data processor not initialized.');
                }
            } catch (err) {
                console.error('Export JSON error:', err);
                alert('Export failed. See console for details.');
            }
        });
    }

    if (csvBtn) {
        csvBtn.addEventListener('click', (e) => {
            try {
                if (dataProcessor && typeof dataProcessor.downloadCategorizedData === 'function') {
                    dataProcessor.downloadCategorizedData('csv');
                } else {
                    console.error('Export CSV: dataProcessor or method not available.');
                    alert('Export failed: data processor not initialized.');
                }
            } catch (err) {
                console.error('Export CSV error:', err);
                alert('Export failed. See console for details.');
            }
        });
    }

    if (statsBtn) {
        statsBtn.addEventListener('click', (e) => {
            try {
                // Use FILTERED data based on current time period
                if (dataProcessor && typeof dataProcessor.getCategoryStatistics === 'function') {
                    // Get the CURRENT filtered data
                    const videoData = dataProcessor.getFilteredData();
                    const processedData = dataProcessor.analyzeData(videoData);
                    const stats = dataProcessor.getCategoryStatistics();
                    
                    console.log('Category Statistics:', stats);
                    console.log('Current period data:', {
                        period: currentTimePeriod,
                        videos: videoData.length,
                        dateRange: processedData.dateRange
                    });
                    
                    // Build HTML content for modal
                    let htmlContent = '<div style="font-family: monospace; color: #333;">';
                    htmlContent += '<h2 style="color: #667eea; margin-top: 0;">YOUR VIEWING STATISTICS</h2>';
                    htmlContent += '<hr style="border: 1px solid #ddd; margin: 15px 0;">';
                    htmlContent += '<h3 style="color: #f59e0b; margin-bottom: 10px;">TOP 5 CHANNELS (Filter Bubble Analysis):</h3>';
                    htmlContent += '<hr style="border: 1px solid #ddd; margin: 10px 0 15px 0;">';
                    
                    if (processedData && processedData.topChannels) {
                        let totalFromTop5 = 0;
                        
                        // Show top 5 channels (including Unknown Channel)
                        processedData.topChannels.slice(0, 5).forEach(([channel, count], index) => {
                            const percentage = ((count / processedData.totalVideos) * 100).toFixed(1);
                            totalFromTop5 += count;
                            htmlContent += `<div style="margin-bottom: 12px;">`;
                            htmlContent += `<strong>${index + 1}. ${channel}</strong><br>`;
                            htmlContent += `<span style="color: #666; margin-left: 20px;">${count} videos (${percentage}%)</span>`;
                            htmlContent += `</div>`;
                        });
                        
                        const concentrationPct = ((totalFromTop5 / processedData.totalVideos) * 100).toFixed(1);
                        htmlContent += '<hr style="border: 1px solid #ddd; margin: 15px 0;">';
                        htmlContent += `<div style="background: #f0f0f0; padding: 12px; border-radius: 6px; margin: 15px 0;">`;
                        htmlContent += `<strong style="color: #667eea;">CHANNEL CONCENTRATION: ${concentrationPct}%</strong><br>`;
                        htmlContent += `<span style="color: #666; font-size: 14px;">(${totalFromTop5} out of ${processedData.totalVideos} videos)</span>`;
                        htmlContent += `</div>`;
                        
                        if (concentrationPct > 70) {
                            htmlContent += `<div style="background: #fee; padding: 12px; border-left: 4px solid #ef4444; margin: 15px 0;">`;
                            htmlContent += `<strong style="color: #ef4444;">WARNING: STRONG FILTER BUBBLE</strong><br>`;
                            htmlContent += `<span style="color: #666;">Your viewing is highly concentrated.</span>`;
                            htmlContent += `</div>`;
                        } else if (concentrationPct > 50) {
                            htmlContent += `<div style="background: #fef3c7; padding: 12px; border-left: 4px solid #f59e0b; margin: 15px 0;">`;
                            htmlContent += `<strong style="color: #f59e0b;">MODERATE FILTER BUBBLE</strong><br>`;
                            htmlContent += `<span style="color: #666;">Your viewing shows some concentration.</span>`;
                            htmlContent += `</div>`;
                        } else {
                            htmlContent += `<div style="background: #d1fae5; padding: 12px; border-left: 4px solid #10b981; margin: 15px 0;">`;
                            htmlContent += `<strong style="color: #10b981;">HEALTHY DIVERSITY</strong><br>`;
                            htmlContent += `<span style="color: #666;">Well-distributed viewing!</span>`;
                            htmlContent += `</div>`;
                        }
                    }
                    
                    // Add category breakdown
                    htmlContent += '<hr style="border: 1px solid #ddd; margin: 20px 0;">';
                    htmlContent += '<h3 style="color: #f59e0b; margin-bottom: 10px;">CATEGORY BREAKDOWN:</h3>';
                    htmlContent += '<hr style="border: 1px solid #ddd; margin: 10px 0 15px 0;">';
                    
                    Object.entries(stats).slice(0, 10).forEach(([category, data]) => {
                        const topChannel = data.topChannels?.[0]?.channel || 'N/A';
                        htmlContent += `<div style="margin-bottom: 10px;">`;
                        htmlContent += `<strong>${category}:</strong> ${data.count} videos (${data.percentage}%)<br>`;
                        htmlContent += `<span style="color: #666; margin-left: 20px; font-size: 13px;">Top channel: ${topChannel}</span>`;
                        htmlContent += `</div>`;
                    });
                    
                    htmlContent += '</div>';
                    
                    // Create and show custom modal
                    showStatsModal(htmlContent);
                } else {
                    console.error('Show Stats: dataProcessor or method not available.');
                    alert('Stats not available: data processor not initialized.');
                }
            } catch (err) {
                console.error('Show Stats error:', err);
                alert('Failed to show stats. See console for details.');
            }
        });
    }
}


// Setup AI settings
function setupAISettings() {
    const settingsBtn = document.getElementById('ai-settings-btn');
    const apiKeySection = document.getElementById('api-key-section');
    const apiKeyInput = document.getElementById('api-key-input');
    const saveBtn = document.getElementById('save-api-key');
    const testBtn = document.getElementById('test-api-key');
    const statusDiv = document.getElementById('api-key-status');
    
    if (!settingsBtn || !apiKeySection) return;
    
    // Toggle API key section
    settingsBtn.addEventListener('click', () => {
        const isHidden = apiKeySection.style.display === 'none';
        apiKeySection.style.display = isHidden ? 'block' : 'none';
        
        // Load existing key if available
        if (isHidden && aiInsights.getApiKey()) {
            apiKeyInput.value = aiInsights.getApiKey();
            statusDiv.innerHTML = '<span style="color: #10b981;">[OK] API key loaded</span>';
        }
    });
    
    // Save API key
    saveBtn.addEventListener('click', () => {
        const apiKey = apiKeyInput.value.trim();
        
        if (!apiKey) {
            statusDiv.innerHTML = '<span style="color: #f87171;">Please enter an API key</span>';
            return;
        }
        
        if (!apiKey.startsWith('AIza')) {
            statusDiv.innerHTML = '<span style="color: #f87171;">Invalid key format (should start with AIza)</span>';
            return;
        }
        
        aiInsights.setApiKey(apiKey);
        statusDiv.innerHTML = '<span style="color: #10b981;">[OK] API key saved</span>';
        
        // Re-generate insights with AI if we have data
        if (dataProcessor.processedData) {
            const videoData = dataProcessor.getFilteredData();
            const metrics = metricsCalculator.calculateAllMetrics(
                dataProcessor.processedData, 
                videoData
            );
            generateAndDisplayAIInsights(metrics, dataProcessor.processedData, videoData);
        }
    });
    
    // Test API key
    testBtn.addEventListener('click', async () => {
        const apiKey = apiKeyInput.value.trim();
        
        if (!apiKey) {
            statusDiv.innerHTML = '<span style="color: #f87171;">Please enter an API key</span>';
            return;
        }
        
        statusDiv.innerHTML = '<span style="color: #667eea;">Testing Gemini API key...</span>';
        
        // Test the API key with a simple request
        try {
            const url = `https://generativelanguage.googleapis.com/v1/models/gemini-pro:generateContent?key=${apiKey}`;
            const response = await fetch(url, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    contents: [{
                        parts: [{
                            text: 'Test'
                        }]
                    }]
                })
            });
            
            if (response.ok) {
                statusDiv.innerHTML = '<span style="color: #10b981;">[OK] Gemini API key is valid</span>';
                aiInsights.setApiKey(apiKey);
            } else {
                const error = await response.json();
                statusDiv.innerHTML = `<span style="color: #f87171;">[X] ${error.error?.message || 'Invalid API key'}</span>`;
            }
        } catch (error) {
            statusDiv.innerHTML = '<span style="color: #f87171;">[X] Failed to test API key</span>';
        }
    });
}

// Change time period (updated to regenerate AI insights)
function changeTimePeriod(period) {
    currentTimePeriod = period;
    
    // Re-filter data
    const processedData = dataProcessor.filterByTimePeriod(period);
    const videoData = dataProcessor.getFilteredData();
    
    // Check if we have data for this period
    if (videoData.length === 0) {
        alert(`No data available for ${period}. Showing all data instead.`);
        period = 'all';
        currentTimePeriod = 'all';
    }
    
    // Recalculate metrics
    const metrics = metricsCalculator.calculateAllMetrics(processedData, videoData);
    
    // Update displays
    updateMetricsDisplay(metrics, processedData);
    
    // Regenerate AI insights for new time period
    generateAndDisplayAIInsights(metrics, processedData, videoData);
    
    // Update visualizations
    visualizations.update();
    
    // Show comparison if not "all time"
    if (period !== 'all') {
        showPeriodComparison(period);
    } else {
        hidePeriodComparison();
    }
    
    console.log(`Time period changed to: ${period}`, {
        videos: videoData.length,
        dateRange: processedData.dateRange
    });
}

// Show yearly comparison
function showYearlyComparison() {
    const yearlyData = dataProcessor.getYearlyComparison();
    const years = Object.keys(yearlyData).sort();
    
    if (years.length > 1) {
        const comparisonDiv = document.getElementById('year-comparison');
        const statsDiv = document.getElementById('yearly-stats');
        
        if (comparisonDiv && statsDiv) {
            comparisonDiv.style.display = 'block';
            
            let html = '<div style="margin-top: 10px;">';
            years.forEach(year => {
                const data = yearlyData[year];
                const diversityPercent = (data.diversity * 100).toFixed(0);
                
                // Color code based on diversity
                let color = '#10b981'; // green
                if (data.diversity < 0.3) color = '#ef4444'; // red
                else if (data.diversity < 0.6) color = '#f59e0b'; // orange
                
                html += `
                    <div style="margin-bottom: 8px; padding: 8px; background: rgba(255,255,255,0.02); border-radius: 4px;">
                        <div style="display: flex; justify-content: space-between; align-items: center;">
                            <strong>${year}</strong>
                            <span style="color: ${color}; font-size: 11px;">
                                ${diversityPercent}% diverse
                            </span>
                        </div>
                        <div style="font-size: 11px; color: #666; margin-top: 4px;">
                            ${data.count} videos | ${data.uniqueChannels} channels | ${data.dominantCategory}
                        </div>
                    </div>
                `;
            });
            html += '</div>';
            
            // Add trend indicator
            const firstYear = yearlyData[years[0]];
            const lastYear = yearlyData[years[years.length - 1]];
            const diversityChange = lastYear.diversity - firstYear.diversity;
            
            if (Math.abs(diversityChange) > 0.1) {
                html += '<div style="margin-top: 10px; padding: 10px; background: rgba(102,126,234,0.1); border-radius: 6px; font-size: 12px;">';
                if (diversityChange < 0) {
                    html += `TREND: Your viewing diversity decreased ${Math.abs(diversityChange * 100).toFixed(0)}% from ${years[0]} to ${years[years.length - 1]}`;
                } else {
                    html += `TREND: Your viewing diversity increased ${(diversityChange * 100).toFixed(0)}% from ${years[0]} to ${years[years.length - 1]}`;
                }
                html += '</div>';
            }
            
            statsDiv.innerHTML = html;
        }
    }
}

// Load sample data
function loadSampleData() {
    console.log('Generating sample data...');
    
    // Show loading state
    const btn = document.getElementById('sample-data-btn');
    btn.textContent = 'Generating...';
    btn.disabled = true;
    
    setTimeout(() => {
        const sampleData = dataProcessor.generateSampleData();
        processData(sampleData);
    }, 100);
}

// Show main application
function showApp() {
    const uploadScreen = document.getElementById('upload-screen');
    const app = document.getElementById('app');
    
    uploadScreen.classList.add('hidden');
    setTimeout(() => {
        uploadScreen.style.display = 'none';
        app.style.display = 'block';
    }, 500);
}

// Update metrics display
function updateMetricsDisplay(metrics, processedData) {
    // Basic metrics
    document.getElementById('total-videos').textContent = processedData.totalVideos;
    document.getElementById('unique-channels').textContent = processedData.uniqueChannels;
    document.getElementById('time-span').textContent = `${processedData.dateRange.days} days`;
    
    const dailyAverage = (processedData.totalVideos / Math.max(1, processedData.dateRange.days)).toFixed(1);
    document.getElementById('daily-average').textContent = dailyAverage;
    
    // AI Literacy metrics
    document.getElementById('echo-strength').textContent = metrics.echoStrength.toFixed(1) + '%';
    document.getElementById('echo-bar').style.width = metrics.echoStrength + '%';
    
    document.getElementById('diversity-score').textContent = metrics.diversityScore.toFixed(2);
    document.getElementById('diversity-bar').style.width = (metrics.diversityScore * 100) + '%';
    
    document.getElementById('binge-score').textContent = metrics.bingeScore.toFixed(2);
    document.getElementById('binge-bar').style.width = (metrics.bingeScore * 100) + '%';
    
    const peakHour = metrics.peakHour;
    document.getElementById('peak-hour').textContent = 
        `${peakHour}:00 - ${(peakHour + 1) % 24}:00`;
    
    document.getElementById('night-owl').textContent = metrics.nightOwlScore.toFixed(1) + '%';
    
    //  NEW: Display top 5 channels breakdown in console
    if (processedData.topChannels && processedData.topChannels.length > 0) {
        console.log('\n[TOP 5 CHANNELS - Filter Bubble Analysis]');
        console.log('='.repeat(50));
        
        let totalFromTop5 = 0;
        processedData.topChannels.slice(0, 5).forEach(([channel, count], index) => {
            const percentage = ((count / processedData.totalVideos) * 100).toFixed(1);
            totalFromTop5 += count;
            console.log(`${index + 1}. ${channel}`);
            console.log(`   ${count} videos (${percentage}% of all viewing)`);
        });
        
        const concentrationPct = ((totalFromTop5 / processedData.totalVideos) * 100).toFixed(1);
        console.log('='.repeat(50));
        console.log(`CHANNEL CONCENTRATION: ${concentrationPct}%`);
        console.log(`   (${totalFromTop5} out of ${processedData.totalVideos} videos from just 5 channels)`);
        console.log('='.repeat(50));
        
        if (concentrationPct > 70) {
            console.log('WARNING: STRONG FILTER BUBBLE DETECTED');
            console.log('   Your viewing is highly concentrated in a small set of channels.');
        } else if (concentrationPct > 50) {
            console.log('MODERATE FILTER BUBBLE');
            console.log('   Your viewing shows moderate channel concentration.');
        } else {
            console.log('HEALTHY DIVERSITY');
            console.log('   Your viewing is well-distributed across many channels.');
        }
        console.log('\n');
    }
    
    // Color code metrics based on severity
    colorCodeMetrics(metrics);
}

// Color code metrics based on values
function colorCodeMetrics(metrics) {
    // Echo strength
    const echoBar = document.getElementById('echo-bar');
    if (metrics.echoStrength > 80) {
        echoBar.style.background = 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)';
    } else if (metrics.echoStrength > 60) {
        echoBar.style.background = 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)';
    }
    
    // Diversity score
    const diversityBar = document.getElementById('diversity-bar');
    if (metrics.diversityScore < 0.3) {
        diversityBar.style.background = 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)';
    } else if (metrics.diversityScore < 0.6) {
        diversityBar.style.background = 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)';
    } else {
        diversityBar.style.background = 'linear-gradient(135deg, #10b981 0%, #059669 100%)';
    }
}

// Switch visualization view
function switchView(view) {
    visualizations.switchView(view);
}

// Change time period

// Show period comparison
function showPeriodComparison(currentPeriod) {
    // Get metrics for all time to compare
    const allTimeData = dataProcessor.analyzeData(dataProcessor.getAllData());
    const allTimeMetrics = metricsCalculator.calculateAllMetrics(
        allTimeData, 
        dataProcessor.getAllData()
    );
    
    // Get current period metrics
    const currentData = dataProcessor.processedData;
    const currentMetrics = metricsCalculator.calculateAllMetrics(
        currentData,
        dataProcessor.getFilteredData()
    );
    
    // Calculate changes
    const diversityChange = currentMetrics.diversityScore - allTimeMetrics.diversityScore;
    const echoChange = currentMetrics.echoStrength - allTimeMetrics.echoStrength;
    
    // Display comparison in AI insights area
    const narrativeElement = document.getElementById('ai-narrative');
    if (narrativeElement) {
        let comparisonText = narrativeElement.textContent + '\n\n';
        
        if (Math.abs(diversityChange) > 0.1) {
            if (diversityChange > 0) {
                comparisonText += `ðŸ“ˆ Your recent viewing is ${(diversityChange * 100).toFixed(0)}% MORE diverse than your all-time average. `;
            } else {
                comparisonText += `ðŸ“‰ Your recent viewing is ${Math.abs(diversityChange * 100).toFixed(0)}% LESS diverse than your all-time average. `;
            }
        }
        
        if (Math.abs(echoChange) > 10) {
            if (echoChange > 0) {
                comparisonText += `Your echo chamber has strengthened by ${echoChange.toFixed(0)}% recently.`;
            } else {
                comparisonText += `Your echo chamber has weakened by ${Math.abs(echoChange).toFixed(0)}% recently.`;
            }
        }
        
        narrativeElement.textContent = comparisonText;
    }
}

// Hide period comparison
function hidePeriodComparison() {
    // Re-display original insights when showing all time
    aiInsights.displayInsights();
}

// Update time period buttons based on available data
function updateTimePeriodButtons() {
    const availablePeriods = dataProcessor.getAvailableTimePeriods();
    
    document.querySelectorAll('.time-btn').forEach(btn => {
        const period = btn.dataset.period;
        const periodInfo = availablePeriods.find(p => p.id === period);
        
        if (!periodInfo && period !== 'all') {
            // Disable button if not enough data
            btn.disabled = true;
            btn.style.opacity = '0.3';
            btn.title = 'Not enough data for this period';
        } else if (periodInfo) {
            // Update button text with description
            btn.title = periodInfo.description;
        }
    });
}

// Enhanced metrics display with period info
function updateMetricsDisplay(metrics, processedData) {
    // Basic metrics
    document.getElementById('total-videos').textContent = processedData.totalVideos;
    document.getElementById('unique-channels').textContent = processedData.uniqueChannels;
    
    // Enhanced time span display
    const timeSpanElement = document.getElementById('time-span');
    if (processedData.dateRange) {
        const days = processedData.dateRange.days;
        let timeSpanText = `${days} days`;
        
        if (days > 365) {
            const years = (days / 365).toFixed(1);
            timeSpanText = `${years} years (${days} days)`;
        } else if (days > 30) {
            const months = (days / 30).toFixed(1);
            timeSpanText = `${months} months (${days} days)`;
        }
        
        timeSpanElement.textContent = timeSpanText;
        
        // Add date range as tooltip
        if (processedData.dateRange.first && processedData.dateRange.last) {
            timeSpanElement.title = `${formatDate(processedData.dateRange.first)} - ${formatDate(processedData.dateRange.last)}`;
        }
    } else {
        timeSpanElement.textContent = '0 days';
    }
    
    const dailyAverage = (processedData.totalVideos / Math.max(1, processedData.dateRange.days)).toFixed(1);
    document.getElementById('daily-average').textContent = dailyAverage;
    
    // AI Literacy metrics
    document.getElementById('echo-strength').textContent = metrics.echoStrength.toFixed(1) + '%';
    document.getElementById('echo-bar').style.width = metrics.echoStrength + '%';
    
    document.getElementById('diversity-score').textContent = metrics.diversityScore.toFixed(2);
    document.getElementById('diversity-bar').style.width = (metrics.diversityScore * 100) + '%';
    
    document.getElementById('binge-score').textContent = metrics.bingeScore.toFixed(2);
    document.getElementById('binge-bar').style.width = (metrics.bingeScore * 100) + '%';
    
    const peakHour = metrics.peakHour;
    document.getElementById('peak-hour').textContent = 
        `${peakHour}:00 - ${(peakHour + 1) % 24}:00`;
    
    document.getElementById('night-owl').textContent = metrics.nightOwlScore.toFixed(1) + '%';
    
    // Color code metrics based on severity
    colorCodeMetrics(metrics);
    
    // Update button states
    updateTimePeriodButtons();
}

// Download visualization
function downloadVisualization() {
    visualizations.download();
}

// Toggle metric explanations
function toggleExplanations() {
    const explanationsDiv = document.getElementById('metric-explanations');
    const isHidden = explanationsDiv.style.display === 'none';
    
    if (isHidden) {
        // Show explanations
        const explanations = metricsCalculator.getExplanations();
        let html = '';
        
        Object.values(explanations).forEach(exp => {
            html += `
                <div class="explanation-item">
                    <div class="explanation-term">${exp.term}</div>
                    <div class="explanation-text">${exp.text}</div>
                    <div class="explanation-formula">Formula: ${exp.formula}</div>
                </div>
            `;
        });
        
        explanationsDiv.innerHTML = html;
        explanationsDiv.style.display = 'block';
        
        document.getElementById('explanation-toggle').textContent = 'Hide explanations';
    } else {
        // Hide explanations
        explanationsDiv.style.display = 'none';
        document.getElementById('explanation-toggle').textContent = 'What do these metrics mean?';
    }
}

// Utility functions
function formatDate(date) {
    return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
    });
}

function formatTime(date) {
    return date.toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit'
    });
}

// Error handling
window.addEventListener('error', (e) => {
    console.error('Global error:', e.error);
});

// Toggle algorithm explanation
function toggleAlgorithmExplanation() {
    const explanationDiv = document.getElementById('algorithm-explanation');
    const isHidden = explanationDiv.style.display === 'none';
    
    if (isHidden) {
        // Get current user data for personalized examples
        const processedData = dataProcessor.processedData;
        const hasData = processedData && processedData.totalVideos > 0;
        
        // Generate personalized explanation
        const html = generateAlgorithmExplanation(hasData ? processedData : null);
        
        explanationDiv.innerHTML = html;
        explanationDiv.style.display = 'block';
        
        document.getElementById('algorithm-explanation-toggle').innerHTML = 'ðŸŽ“ Hide Algorithm Explanation';
    } else {
        explanationDiv.style.display = 'none';
        document.getElementById('algorithm-explanation-toggle').innerHTML = 'ðŸŽ“ How YouTube\'s Algorithm Shapes You';
    }
}

// Generate algorithm explanation content
function generateAlgorithmExplanation(userData) {
    const topChannel = userData?.topChannels?.[0]?.[0] || 'PewDiePie';
    const videoCount = userData?.totalVideos || 1000;
    
    return `
        <div style="color: #ddd;">
            <h4 style="color: #667eea; margin-bottom: 15px;">ðŸ¤– How YouTube's Recommendation Algorithm Actually Works</h4>
            
            <div class="algorithm-section" style="margin-bottom: 20px;">
                <h5 style="color: #f59e0b; margin-bottom: 10px;">1. The Two-Stage Funnel</h5>
                <p style="margin-bottom: 10px;">YouTube's algorithm works in two stages:</p>
                <ul style="margin-left: 20px; color: #aaa;">
                    <li><strong style="color: #ddd;">Candidate Generation:</strong> From billions of videos, the algorithm selects ~500 candidates based on your history</li>
                    <li><strong style="color: #ddd;">Ranking:</strong> These 500 are scored and ranked using a neural network, showing you the top 10-20</li>
                </ul>
                ${userData ? `<p style="color: #667eea; margin-top: 10px;">ðŸ“Š Your data shows the algorithm has narrowed billions of videos down to primarily content from ${userData.topChannels.slice(0, 3).map(c => c[0]).join(', ')}.</p>` : ''}
            </div>
            
            <div class="algorithm-section" style="margin-bottom: 20px;">
                <h5 style="color: #f59e0b; margin-bottom: 10px;">2. Key Signals YouTube Tracks</h5>
                <div style="background: rgba(255,255,255,0.05); padding: 10px; border-radius: 6px; margin-bottom: 10px;">
                    <strong style="color: #10b981;">Watch Time (Most Important):</strong>
                    <p style="color: #aaa; margin: 5px 0;">Not just clicks, but how long you watch. Watching 90% of a video signals strong interest.</p>
                    ${userData ? `<p style="color: #667eea;">ðŸ’¡ Your peak viewing at ${new Date().setHours(userData.peakHour || 20)} is when the algorithm learns you most.</p>` : ''}
                </div>
                
                <div style="background: rgba(255,255,255,0.05); padding: 10px; border-radius: 6px; margin-bottom: 10px;">
                    <strong style="color: #10b981;">Session Duration:</strong>
                    <p style="color: #aaa; margin: 5px 0;">How long you stay on YouTube. The algorithm optimizes to keep you watching.</p>
                    ${userData && userData.bingeScore ? `<p style="color: #667eea;">ðŸ’¡ Your binge score of ${(userData.bingeScore * 100).toFixed(0)}% shows how effectively it keeps you engaged.</p>` : ''}
                </div>
                
                <div style="background: rgba(255,255,255,0.05); padding: 10px; border-radius: 6px; margin-bottom: 10px;">
                    <strong style="color: #10b981;">Engagement Signals:</strong>
                    <ul style="margin: 5px 0 0 20px; color: #aaa;">
                        <li>Likes/dislikes (minor impact)</li>
                        <li>Comments (signals deep engagement)</li>
                        <li>Shares (very strong signal)</li>
                        <li>"Not interested" feedback (strong negative signal)</li>
                    </ul>
                </div>
            </div>
            
            <div class="algorithm-section" style="margin-bottom: 20px;">
                <h5 style="color: #f59e0b; margin-bottom: 10px;">3. The Collaborative Filtering Effect</h5>
                <p style="margin-bottom: 10px; color: #aaa;">
                    YouTube uses "collaborative filtering" - if users who watch Channel A also watch Channel B, 
                    the algorithm will recommend Channel B to you after you watch Channel A.
                </p>
                ${userData ? `
                <div style="background: rgba(102,126,234,0.1); padding: 10px; border-radius: 6px;">
                    <p style="color: #ddd;">ðŸ” <strong>Your Pattern:</strong></p>
                    <p style="color: #aaa;">Because you watch <strong>${topChannel}</strong>, YouTube likely recommends similar gaming/tech/entertainment channels, creating your filter bubble.</p>
                </div>` : ''}
            </div>
            
            <div class="algorithm-section" style="margin-bottom: 20px;">
                <h5 style="color: #f59e0b; margin-bottom: 10px;">4. The Freshness vs. Exploitation Balance</h5>
                <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 10px;">
                    <div style="background: rgba(16,185,129,0.1); padding: 10px; border-radius: 6px;">
                        <strong style="color: #10b981;">70% Exploitation</strong>
                        <p style="color: #aaa; font-size: 12px; margin-top: 5px;">Videos similar to what you've watched before</p>
                    </div>
                    <div style="background: rgba(239,68,68,0.1); padding: 10px; border-radius: 6px;">
                        <strong style="color: #ef4444;">30% Exploration</strong>
                        <p style="color: #aaa; font-size: 12px; margin-top: 5px;">New content to test your interests</p>
                    </div>
                </div>
                ${userData && userData.echoStrength ? `
                <p style="color: #667eea; margin-top: 10px;">
                    WARNING: Your echo chamber strength of ${userData.echoStrength.toFixed(0)}% suggests YouTube is showing you mostly "exploitation" content - 
                    videos it knows you'll watch based on past behavior.
                </p>` : ''}
            </div>
            
            <div class="algorithm-section" style="margin-bottom: 20px;">
                <h5 style="color: #f59e0b; margin-bottom: 10px;">5. The Rabbit Hole Mechanism</h5>
                <p style="color: #aaa; margin-bottom: 10px;">
                    The algorithm creates "rabbit holes" through autoplay and the "Up Next" section:
                </p>
                <ol style="margin-left: 20px; color: #aaa;">
                    <li>Starts with content you searched for</li>
                    <li>Gradually shifts to content with higher "engagement metrics"</li>
                    <li>Often leads to more extreme or sensational content</li>
                    <li>Uses your late-night vulnerability (decision fatigue)</li>
                </ol>
            </div>
            
            <div class="algorithm-section" style="margin-bottom: 20px; background: linear-gradient(135deg, rgba(239,68,68,0.1) 0%, rgba(245,158,11,0.1) 100%); padding: 15px; border-radius: 8px;">
                <h5 style="color: #f59e0b; margin-bottom: 10px;">WARNING: Hidden Factors You Should Know</h5>
                <ul style="margin-left: 20px; color: #ddd;">
                    <li><strong>Creator Revenue:</strong> YouTube prioritizes videos that make more ad money</li>
                    <li><strong>Channel Authority:</strong> Established channels get preference over new ones</li>
                    <li><strong>Corporate Partnerships:</strong> Premium content partners get algorithmic boosts</li>
                    <li><strong>Regional Trends:</strong> Your location affects what's recommended</li>
                    <li><strong>Device Context:</strong> TV recommendations differ from mobile</li>
                </ul>
            </div>
            
            <div class="algorithm-section" style="background: linear-gradient(135deg, rgba(16,185,129,0.1) 0%, rgba(6,182,212,0.1) 100%); padding: 15px; border-radius: 8px;">
                <h5 style="color: #10b981; margin-bottom: 10px;">ðŸ’¡ How to Break Free</h5>
                <ul style="margin-left: 20px; color: #ddd;">
                    <li><strong>Pause Watch History:</strong> Settings â†’ History & Privacy â†’ Pause watch history</li>
                    <li><strong>Clear Past Data:</strong> Delete watch history periodically</li>
                    <li><strong>Use Incognito:</strong> Search for diverse content in incognito mode</li>
                    <li><strong>Actively Dislike:</strong> Use "Not Interested" on unwanted recommendations</li>
                    <li><strong>Search Deliberately:</strong> Don't rely on homepage, search for specific content</li>
                    <li><strong>Multiple Accounts:</strong> Use different accounts for different interests</li>
                </ul>
            </div>
            
            ${userData ? `
            <div class="algorithm-section" style="margin-top: 20px; padding: 15px; background: rgba(102,126,234,0.1); border-radius: 8px;">
                <h5 style="color: #667eea; margin-bottom: 10px;">ðŸŽ¯ Personalized Insight for You</h5>
                <p style="color: #ddd;">
                    Based on your ${videoCount} videos watched, the algorithm has identified you as someone who primarily watches 
                    ${userData.topCategories ? Object.keys(userData.categoryCounts).slice(0, 3).join(', ') : 'specific content types'}. 
                    This creates a feedback loop: you watch more of what's recommended, which strengthens the algorithm's confidence, 
                    which narrows your recommendations further.
                </p>
                <p style="color: #aaa; margin-top: 10px; font-style: italic;">
                    Remember: You're not just watching YouTube - YouTube is watching you, learning from every click, pause, and scroll.
                </p>
            </div>
            ` : ''}
        </div>
    `;
}

// Cleanup on page unload
window.addEventListener('beforeunload', () => {
    if (visualizations) {
        visualizations.destroy();
    }
});

console.log('Algorithm Mirror initialized successfully');
// Custom modal for stats display
function showStatsModal(htmlContent) {
    // Remove existing modal if any
    const existingModal = document.getElementById('stats-modal');
    if (existingModal) {
        existingModal.remove();
    }
    
    // Create modal overlay
    const modal = document.createElement('div');
    modal.id = 'stats-modal';
    modal.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: rgba(0, 0, 0, 0.7);
        display: flex;
        justify-content: center;
        align-items: center;
        z-index: 10000;
    `;
    
    // Create modal content
    const modalContent = document.createElement('div');
    modalContent.style.cssText = `
        background: white;
        border-radius: 12px;
        padding: 30px;
        max-width: 600px;
        max-height: 80vh;
        overflow-y: auto;
        box-shadow: 0 10px 40px rgba(0, 0, 0, 0.3);
        position: relative;
    `;
    
    // Add close button
    const closeBtn = document.createElement('button');
    closeBtn.innerHTML = '&times;';
    closeBtn.style.cssText = `
        position: absolute;
        top: 15px;
        right: 15px;
        background: none;
        border: none;
        font-size: 32px;
        cursor: pointer;
        color: #999;
        line-height: 1;
        padding: 0;
        width: 30px;
        height: 30px;
    `;
    closeBtn.onmouseover = () => closeBtn.style.color = '#333';
    closeBtn.onmouseout = () => closeBtn.style.color = '#999';
    closeBtn.onclick = () => modal.remove();
    
    // Add content
    modalContent.innerHTML = htmlContent;
    modalContent.insertBefore(closeBtn, modalContent.firstChild);
    
    modal.appendChild(modalContent);
    document.body.appendChild(modal);
    
    // Close on outside click
    modal.onclick = (e) => {
        if (e.target === modal) {
            modal.remove();
        }
    };
    
    // Close on ESC key
    const escHandler = (e) => {
        if (e.key === 'Escape') {
            modal.remove();
            document.removeEventListener('keydown', escHandler);
        }
    };
    document.addEventListener('keydown', escHandler);
}