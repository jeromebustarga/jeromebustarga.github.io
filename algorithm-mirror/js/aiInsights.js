// aiInsights.js - AI-powered analysis using Google Gemini API

class AIInsights {
    constructor() {
        // Gemini API configuration
        this.apiKey = 'AIzaSyBFX8bHJKW5oCMzFRT5OV5Eq8W8pLej_AQ'; // Your Gemini API key
        // Using v1beta with gemini-pro model
        this.apiEndpoint = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent';
        
        this.insights = {
            narrative: '',
            warning: '',
            suggestion: '',
            prediction: '',
            archetype: ''
        };
        
        // Fallback rule-based analysis if API fails
        this.fallbackMode = false;
    }

    // Set API key (if user wants to change it)
    setApiKey(key) {
        this.apiKey = key;
        localStorage.setItem('gemini_api_key', key);
    }

    // Get API key from storage or use default
    getApiKey() {
        // Check localStorage first, otherwise use the hardcoded key
        const storedKey = localStorage.getItem('gemini_api_key');
        if (storedKey) {
            this.apiKey = storedKey;
        }
        return this.apiKey;
    }

    // Generate insights using Gemini AI (consolidated to reduce API calls)
    async generateInsights(metrics, processedData, videoData) {
        const apiKey = this.getApiKey();
        
        if (!apiKey) {
            console.log('No API key found, using fallback analysis');
            return this.generateFallbackInsights(metrics, processedData, videoData);
        }

        try {
            // Prepare context for AI
            const context = this.prepareContext(metrics, processedData, videoData);
            
            // Make a SINGLE API call with all analysis needs
            const allInsights = await this.generateAllInsights(context);
            
            // Parse the response into different insight types
            this.insights = this.parseInsights(allInsights, metrics);

            return this.insights;

        } catch (error) {
            console.error('Gemini API error, using fallback analysis:', error);
            return this.generateFallbackInsights(metrics, processedData, videoData);
        }
    }

    // Generate ALL insights in a single API call to avoid quota issues
    async generateAllInsights(context) {
        const prompt = `Analyze this YouTube viewing data and provide insights in the following format:

NARRATIVE: [2-3 paragraphs about their viewing patterns]
WARNING: [One line warning if concerning pattern found, or "none"]
SUGGESTION: [One actionable suggestion starting with  ]
PREDICTION: [2-3 sentences about future trajectory]

Data to analyze:
- Total videos: ${context.totalVideos} over ${context.daysSpanned} days
- Unique channels: ${context.uniqueChannels}
- Echo chamber: ${context.echoStrength}% from top 5 channels
- Diversity: ${context.diversityScore} (0=narrow, 1=diverse)
- Night viewing: ${context.nightOwlScore}% between 11pm-5am
- Peak hour: ${context.peakHour}:00
- Top channels: ${context.topChannels.slice(0,3).join(', ')}
- Categories: ${context.topCategories.slice(0,3).join(', ')}

Write in second person ("You..."). Be specific and insightful.`;

        try {
            const response = await this.callGemini(prompt);
            return response || this.getFallbackAllInsights(context);
        } catch (error) {
            console.error('Error generating insights:', error);
            return this.getFallbackAllInsights(context);
        }
    }

    // Parse the single response into different insight types
    parseInsights(response, metrics) {
        const insights = {
            narrative: '',
            warning: '',
            suggestion: '',
            prediction: '',
            archetype: this.identifyArchetype(metrics)
        };

        if (!response) return insights;

        // Parse sections from response
        const sections = response.split(/\n(?=NARRATIVE:|WARNING:|SUGGESTION:|PREDICTION:)/);
        
        sections.forEach(section => {
            if (section.startsWith('NARRATIVE:')) {
                insights.narrative = section.replace('NARRATIVE:', '').trim();
            } else if (section.startsWith('WARNING:')) {
                const warning = section.replace('WARNING:', '').trim();
                insights.warning = warning === 'none' ? '' : warning;
            } else if (section.startsWith('SUGGESTION:')) {
                insights.suggestion = section.replace('SUGGESTION:', '').trim();
            } else if (section.startsWith('PREDICTION:')) {
                insights.prediction = section.replace('PREDICTION:', '').trim();
            }
        });

        // Fallback if parsing fails
        if (!insights.narrative) {
            insights.narrative = response; // Use entire response as narrative
        }

        return insights;
    }

    // Provide fallback response format
    getFallbackAllInsights(context) {
        return `NARRATIVE: Your viewing shows ${context.echoStrength}% concentration in your top channels with a diversity score of ${context.diversityScore}.
WARNING: ${parseFloat(context.echoStrength) > 70 ? '  Strong echo chamber detected' : 'none'}
SUGGESTION:   Try exploring different content categories to increase diversity
PREDICTION: Your viewing patterns will likely continue in current direction.`;
    }

    // Prepare context for AI analysis
    prepareContext(metrics, processedData, videoData) {
        // Get yearly comparison if available
        const yearlyData = {};
        videoData.forEach(video => {
            const year = video.time.getFullYear();
            if (!yearlyData[year]) {
                yearlyData[year] = { count: 0, channels: new Set() };
            }
            yearlyData[year].count++;
            yearlyData[year].channels.add(video.channel);
        });

        // Get top categories
        const topCategories = Object.entries(processedData.categoryCounts || {})
            .sort((a, b) => b[1] - a[1])
            .slice(0, 5)
            .map(([cat, count]) => `${cat} (${((count/processedData.totalVideos)*100).toFixed(1)}%)`);

        return {
            // Basic stats
            totalVideos: processedData.totalVideos,
            uniqueChannels: processedData.uniqueChannels,
            dateRange: `${processedData.dateRange.first.toLocaleDateString()} to ${processedData.dateRange.last.toLocaleDateString()}`,
            daysSpanned: processedData.dateRange.days,
            
            // Key metrics
            echoStrength: metrics.echoStrength.toFixed(1),
            diversityScore: metrics.diversityScore.toFixed(2),
            bingeScore: metrics.bingeScore.toFixed(2),
            peakHour: metrics.peakHour,
            nightOwlScore: metrics.nightOwlScore.toFixed(1),
            
            // Patterns
            topChannels: processedData.topChannels.slice(0, 5).map(([name, count]) => 
                `${name} (${count} videos, ${((count/processedData.totalVideos)*100).toFixed(1)}%)`
            ),
            topCategories: topCategories,
            
            // Evolution
            yearlyBreakdown: Object.entries(yearlyData).map(([year, data]) => 
                `${year}: ${data.count} videos, ${data.channels.size} channels`
            ),
            diversityTrend: metrics.diversityTrend,
            algorithmicDrift: metrics.algorithmicDrift
        };
    }

    // Generate narrative using Gemini
    async generateAINarrative(context) {
        const prompt = `You are analyzing someone's YouTube viewing history to help them understand how algorithms shape their content consumption. Based on the following data, write a personalized, insightful narrative (2-3 paragraphs) about their viewing patterns and algorithmic influence. Be specific, mention actual numbers, and make it feel personal and revealing.

Data:
- Total videos watched: ${context.totalVideos} over ${context.daysSpanned} days
- Channel diversity: ${context.uniqueChannels} unique channels
- Echo chamber strength: ${context.echoStrength}% (videos from top 5 channels)
- Content diversity score: ${context.diversityScore} (0=narrow, 1=diverse)
- Night viewing: ${context.nightOwlScore}% between 11pm-5am
- Peak viewing hour: ${context.peakHour}:00
- Top channels: ${context.topChannels.join(', ')}
- Main categories: ${context.topCategories.join(', ')}
- Yearly pattern: ${context.yearlyBreakdown.join('; ')}

Write in second person ("You..."), be conversational but insightful, and help them see patterns they might not have noticed. Focus on what this reveals about how the algorithm has learned and shaped their preferences. Keep it engaging and educational.`;

        try {
            const response = await this.callGemini(prompt);
            return response || this.generateFallbackNarrative(context);
        } catch (error) {
            console.error('Error generating narrative:', error);
            return this.generateFallbackNarrative(context);
        }
    }

    // Generate warnings using Gemini
    async generateAIWarnings(context) {
        const prompt = `Based on this YouTube viewing data, identify the most concerning pattern that needs a warning:

Echo chamber: ${context.echoStrength}% from top 5 channels
Diversity: ${context.diversityScore}
Night viewing: ${context.nightOwlScore}%
Binge score: ${context.bingeScore}

If there's a concerning pattern (echo chamber >70%, diversity <0.3, night viewing >50%, etc.), write ONE short warning message (1 sentence) starting with an emoji. If patterns are healthy, return empty string.

Examples of good warnings:
- "  Critical echo chamber detected - you're seeing less than 20% of YouTube's content ecosystem"
- "  Over half your viewing happens during sleep hours, increasing vulnerability to algorithmic manipulation"

Return only the warning or empty string, nothing else.`;

        try {
            const response = await this.callGemini(prompt);
            return response.trim();
        } catch (error) {
            return this.generateFallbackWarning(context);
        }
    }

    // Generate suggestions using Gemini
    async generateAISuggestions(context) {
        const prompt = `Based on this viewing pattern, provide ONE specific, actionable suggestion to help break algorithmic patterns or improve viewing habits:

Current state:
- Top channels: ${context.topChannels[0]}, ${context.topChannels[1] || 'N/A'}
- Diversity: ${context.diversityScore}
- Categories: ${context.topCategories.join(', ')}
- Night viewing: ${context.nightOwlScore}%

Write a single suggestion starting with   that is specific and actionable. Reference their actual viewing patterns. Examples:
- "  You watch a lot of [specific channel]. Try a one-week break from this channel to reset recommendations"
- "  Search for 'documentary' or 'philosophy' content - categories you've stopped watching - to confuse the algorithm"

Return only the suggestion, nothing else.`;

        try {
            const response = await this.callGemini(prompt);
            return response.trim();
        } catch (error) {
            return this.generateFallbackSuggestion(context);
        }
    }

    // Generate prediction using Gemini
    async generateAIPrediction(context) {
        const prompt = `Based on this viewing trajectory, predict what will happen in the next 6 months if current patterns continue:

Current metrics:
- Diversity: ${context.diversityScore} (trend: ${context.diversityTrend})
- Echo chamber: ${context.echoStrength}%
- Drift: ${context.algorithmicDrift}
- Yearly evolution: ${context.yearlyBreakdown.join('; ')}

Write a brief (2-3 sentences) prediction about their future viewing patterns. Be specific about likely outcomes. Focus on what will happen to their content diversity and algorithmic influence.`;

        try {
            const response = await this.callGemini(prompt);
            return response.trim();
        } catch (error) {
            return this.generateFallbackPrediction(context);
        }
    }

    // Call Gemini API (with better error handling)
    async callGemini(prompt) {
        const url = `${this.apiEndpoint}?key=${this.apiKey}`;
        
        const requestBody = {
            contents: [{
                parts: [{
                    text: prompt
                }]
            }],
            generationConfig: {
                temperature: 0.7,
                maxOutputTokens: 400,  // Increased for single comprehensive response
                topP: 0.8,
                topK: 40
            }
        };

        try {
            const response = await fetch(url, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(requestBody)
            });

            const data = await response.json();

            if (!response.ok) {
                console.error('Gemini API error:', data);
                
                // Check for specific errors
                if (data.error?.message?.includes('quota')) {
                    console.warn('Quota exceeded, using fallback analysis');
                } else if (data.error?.message?.includes('not found')) {
                    console.warn('Model not found, using fallback analysis');
                }
                
                throw new Error(data.error?.message || 'API request failed');
            }
            
            // Extract text from Gemini response
            if (data.candidates && data.candidates[0] && data.candidates[0].content) {
                const text = data.candidates[0].content.parts[0].text;
                return text;
            }
            
            return '';
        } catch (error) {
            console.error('Error calling Gemini:', error.message);
            throw error;
        }
    }

    // Fallback methods (simplified from original)
    generateFallbackInsights(metrics, processedData, videoData) {
        this.insights = {
            narrative: this.generateFallbackNarrative({
                echoStrength: metrics.echoStrength,
                diversityScore: metrics.diversityScore,
                nightOwlScore: metrics.nightOwlScore,
                totalVideos: processedData.totalVideos,
                uniqueChannels: processedData.uniqueChannels
            }),
            warning: this.generateFallbackWarning({
                echoStrength: metrics.echoStrength,
                diversityScore: metrics.diversityScore,
                nightOwlScore: metrics.nightOwlScore
            }),
            suggestion: this.generateFallbackSuggestion({
                diversityScore: metrics.diversityScore,
                echoStrength: metrics.echoStrength
            }),
            prediction: this.generateFallbackPrediction({
                diversityTrend: metrics.diversityTrend,
                diversityScore: metrics.diversityScore
            }),
            archetype: this.identifyArchetype(metrics)
        };
        return this.insights;
    }

    generateFallbackNarrative(context) {
        let narrative = '';
        
        if (context.diversityScore < 0.3) {
            narrative = `Your viewing has become highly concentrated. With ${context.echoStrength.toFixed(0)}% of videos from your top 5 channels, the algorithm has successfully mapped your preferences. `;
        } else if (context.diversityScore < 0.6) {
            narrative = `You maintain moderate diversity with ${context.uniqueChannels} channels in your viewing history. `;
        } else {
            narrative = `You're a diverse viewer! With ${(context.diversityScore * 100).toFixed(0)}% content diversity across ${context.uniqueChannels} channels, you resist algorithmic pigeonholing. `;
        }
        
        if (context.nightOwlScore > 40) {
            narrative += `Notable: ${context.nightOwlScore.toFixed(0)}% of your viewing happens late at night, when you're most susceptible to rabbit holes.`;
        }
        
        return narrative;
    }

    generateFallbackWarning(context) {
        if (context.echoStrength > 80) {
            return '  Critical echo chamber detected - your content diversity is extremely limited';
        }
        if (context.nightOwlScore > 50) {
            return '  Over half your viewing happens during sleep hours';
        }
        if (context.diversityScore < 0.2) {
            return '  Severe filter bubble detected';
        }
        return '';
    }

    generateFallbackSuggestion(context) {
        if (context.diversityScore < 0.5) {
            return '  Try searching for educational or documentary content to increase diversity';
        }
        if (context.echoStrength > 70) {
            return '  Take a break from your top channel for a week to reset recommendations';
        }
        return '  Keep exploring diverse content to maintain algorithmic resistance';
    }

    generateFallbackPrediction(context) {
        if (context.diversityTrend === 'narrowing') {
            return `Based on current patterns, your content diversity will likely continue decreasing. You may reach complete echo chamber status within 6 months.`;
        } else if (context.diversityScore < 0.3) {
            return `Your viewing patterns have stabilized in a narrow range. Without intervention, the algorithm will continue reinforcing these preferences.`;
        }
        return `Your viewing patterns suggest stable content consumption. The algorithm has a moderate influence on your choices.`;
    }

    // Keep archetype identification rule-based for consistency
    identifyArchetype(metrics) {
        if (metrics.diversityScore > 0.7 && metrics.echoStrength < 40) {
            return {
                type: 'The Explorer',
                description: 'You actively seek diverse content and resist algorithmic influence.',
                emoji: ' '
            };
        }

        if (metrics.diversityScore < 0.3 && metrics.echoStrength > 70) {
            return {
                type: 'The Specialist',
                description: 'You\'ve found your niche and dive deep into specific content areas.',
                emoji: ' '
            };
        }

        if (metrics.nightOwlScore > 60) {
            return {
                type: 'The Night Watcher',
                description: 'Your viewing happens in the algorithm\'s favorite hours - late at night.',
                emoji: ' '
            };
        }

        if (metrics.bingeScore > 0.7) {
            return {
                type: 'The Binge Viewer',
                description: 'You tend to watch multiple videos in single sessions.',
                emoji: ' '
            };
        }

        return {
            type: 'The Balanced Viewer',
            description: 'You maintain a healthy relationship with the algorithm.',
            emoji: ' '
        };
    }

    // Display insights in UI
    displayInsights() {
        // Narrative
        const narrativeElement = document.getElementById('ai-narrative');
        if (narrativeElement) {
            narrativeElement.textContent = this.insights.narrative;
        }

        // Warning
        const warningElement = document.getElementById('ai-warning');
        if (warningElement) {
            if (this.insights.warning) {
                warningElement.style.display = 'block';
                warningElement.textContent = this.insights.warning;
            } else {
                warningElement.style.display = 'none';
            }
        }

        // Suggestion
        const suggestionElement = document.getElementById('ai-suggestion');
        if (suggestionElement) {
            if (this.insights.suggestion) {
                suggestionElement.style.display = 'block';
                suggestionElement.textContent = this.insights.suggestion;
            } else {
                suggestionElement.style.display = 'none';
            }
        }

        // Add archetype if space available
        if (this.insights.archetype && narrativeElement) {
            const archetypeText = `\n\n${this.insights.archetype.emoji} You fit the "${this.insights.archetype.type}" archetype: ${this.insights.archetype.description}`;
            narrativeElement.textContent += archetypeText;
        }
    }
}

// Export for use in other modules
window.AIInsights = AIInsights;