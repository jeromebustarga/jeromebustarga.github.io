// dataProcessor.js - Enhanced AI categorization with improved accuracy

class DataProcessor {
    constructor() {
        this.allData = [];
        this.filteredData = [];
        this.processedData = null;
        this.categoryColors = {
            'Gaming': '#9333ea',
            'Music': '#3b82f6',
            'Education': '#10b981',
            'Tech': '#06b6d4',
            'Comedy': '#f59e0b',
            'News': '#ef4444',
            'Cooking': '#ec4899',
            'Sports': '#84cc16',
            'Science': '#6366f1',
            'Travel': '#14b8a6',
            'Entertainment': '#f97316',
            'Documentary': '#8b5cf6',
            'Podcast': '#64748b',
            'Tutorial': '#a855f7',
            'Vlog': '#fb923c',
            'Art': '#f472b6',
            'Fitness': '#22c55e',
            'Fashion': '#c084fc',
            'Beauty': '#f9a8d4',
            'Finance': '#fbbf24',
            'Business': '#059669',
            'Health': '#7dd3c0',
            'DIY': '#c2410c',
            'Politics': '#dc2626',
            'Lifestyle': '#e879f9',
            'Review': '#0ea5e9',
            'Reaction': '#8b5cf6',
            'Animation': '#f59e0b',
            'History': '#92400e',
            'Nature': '#16a34a',
            'Language': '#7c3aed',
            'Religion': '#be123c',
            'ASMR': '#db2777',
            'Kids': '#fde047',
            'Automotive': '#475569',
            'Photography': '#0891b2',
            'Other': '#6b7280',
            'Uncategorized': '#6b7280'
        };
        this.categorizationStats = {
            total: 0,
            aiCategorized: 0,
            keywordCategorized: 0,
            contextCategorized: 0,
            uncategorized: []
        };
        
        // Enhanced channel patterns database
        this.channelPatterns = this.buildChannelPatterns();
    }

    // Build comprehensive MULTI-LANGUAGE channel patterns database
    buildChannelPatterns() {
        return {
            Gaming: [
                // English
                'gaming', 'games', 'gameplay', 'twitch', 'streamer', 'plays', 'speedrun',
                'ign', 'gamespot', 'polygon', 'kotaku', 'game theory', 'dunkey',
                'markiplier', 'jacksepticeye', 'pewdiepie', 'ninja', 'pokimane',
                'esports', 'competitive', 'walkthrough', 'let\'s play',
                // Multi-language
                'laro', 'naglalaro', // Filipino
                'juego', 'jugando', // Spanish
                'jeu', 'joueur', // French
                'spiel', 'spielen' // German
            ],
            Music: [
                // English
                'music', 'vevo', 'records', 'audio', 'official video', 'official audio',
                'rapper', 'singer', 'band', 'artist', 'musician', 'dj',
                'spotify', 'soundcloud', 'mv', 'lyrics', 'topic', '-topic', 'official music',
                // Multi-language
                'musika', 'kanta', 'awit', // Filipino
                'música', 'canción', // Spanish
                'musique', 'chanson', // French
                'musik', 'lied' // German
            ],
            Education: [
                'academy', 'university', 'college', 'school', 'edu', 'course',
                'lecture', 'lesson', 'class', 'tutorial', 'learn', 'teach',
                'khan', 'crash course', 'ted-ed', 'professor',
                // Multi-language
                'paaralan', 'eskwela', // Filipino
                'escuela', 'universidad', // Spanish
                'école', 'université', // French
                'schule', 'universität' // German
            ],
            Tech: [
                'tech', 'technology', 'review', 'unbox', 'gadget', 'device',
                'mkbhd', 'linus', 'verge', 'cnet', 'engadget', 'wired',
                'phone', 'laptop', 'computer', 'android', 'apple', 'samsung',
                'teknolohiya', 'cellphone' // Filipino
            ],
            News: [
                // English
                'news', 'network', 'press', 'media', 'journalism', 'reporter',
                'cnn', 'bbc', 'fox', 'nbc', 'abc', 'cbs', 'msnbc',
                'breaking', 'live', 'today', 'tonight', 'headlines',
                // Multi-language
                'balita', 'ulat', // Filipino
                'noticias', 'informes', // Spanish
                'nouvelles', 'actualités', // French
                'nachrichten', 'aktuell', // German
                'berita', // Indonesian/Malay
                'خبر', 'أخبار' // Arabic
            ],
            Science: [
                'science', 'vsauce', 'veritasium', 'kurzgesagt', 'asap',
                'physics', 'chemistry', 'biology', 'space', 'nasa',
                'research', 'lab', 'experiment', 'scientific',
                'agham', 'siyensya', // Filipino
                'ciencia', // Spanish
                'wissenschaft' // German
            ],
            Documentary: [
                'documentary', 'national geographic', 'discovery', 'nature',
                'history channel', 'bbc earth', 'smithsonian', 'vice',
                'frontline', 'nova', 'planet earth',
                'dokumentaryo', 'docu' // Filipino
            ],
            Sports: [
                // English
                'sport', 'espn', 'nfl', 'nba', 'mlb', 'nhl', 'fifa',
                'football', 'basketball', 'soccer', 'baseball', 'hockey',
                'athlete', 'olympics', 'championship', 'tournament',
                // Multi-language
                'palakasan', // Filipino
                'deporte', 'fútbol', // Spanish
                'sport', 'football' // French/German overlap
            ],
            Cooking: [
                // English
                'cooking', 'recipe', 'food', 'chef', 'kitchen', 'tasty',
                'binging', 'babish', 'gordon ramsay', 'bon appetit',
                'cuisine', 'baking', 'meal prep',
                // Multi-language
                'lutuin', 'kusina', 'pagluluto', 'ulam', // Filipino
                'cocina', 'receta', // Spanish
                'cuisine', 'recette', // French
                'kochen', 'rezept' // German
            ],
            Fitness: [
                'fitness', 'workout', 'gym', 'training', 'exercise',
                'yoga', 'crossfit', 'bodybuilding', 'cardio', 'hiit',
                'athlete', 'nutrition', 'muscle',
                'ehersisyo' // Filipino
            ],
            Vlog: [
                // English
                'vlog', 'daily', 'day in', 'life', 'routine', 'diary',
                'casey neistat', 'david dobrik', 'emma chamberlain',
                // Multi-language
                'araw ko', 'buhay ko', 'kwentuhan', 'chika', // Filipino
                'mi vida', 'mi día', // Spanish
                'ma vie', 'mon jour', // French
                'mein leben' // German
            ],
            Podcast: [
                'podcast', 'joe rogan', 'interview', 'talk show', 'discussion',
                'conversation', 'episode', 'h3', 'tiny meat gang',
                'usapan', 'panayam' // Filipino
            ]
        };
    }

    // Process raw YouTube data
    async processYouTubeData(rawData) {
        console.log('Processing YouTube data...', rawData.length, 'entries');
        
        // Extract and clean video entries
        this.allData = rawData
            .filter(item => item.title && item.time)
            .map((item, index) => ({
                title: this.cleanTitle(item.title),
                channel: this.extractChannel(item),
                time: new Date(item.time),
                category: 'Uncategorized',
                url: item.titleUrl || '',
                index: index
            }))
            .filter(item => item.time instanceof Date && !isNaN(item.time))
            .sort((a, b) => a.time - b.time);

        console.log('Processed', this.allData.length, 'valid videos');
        
        if (this.allData.length === 0) {
            throw new Error('No valid video data found in the file');
        }

        // Check if we have Gemini API key
        const apiKey = localStorage.getItem('gemini_api_key') || 'AIzaSyBFX8bHJKW5oCMzFRT5OV5Eq8W8pLej_AQ';
        
        if (apiKey) {
            console.log('Using enhanced AI categorization...');
            await this.enhancedAICategorization(this.allData, apiKey);
        } else {
            console.log('No API key found. Using enhanced keyword categorization.');
            this.allData.forEach(video => {
                video.category = this.enhancedKeywordCategorization(video);
            });
        }

        // Set filtered data to all data initially
        this.filteredData = [...this.allData];
        
        return this.analyzeData(this.filteredData);
    }

    // Enhanced AI categorization system
    async enhancedAICategorization(videos, apiKey) {
        this.categorizationStats.total = videos.length;
        
        // PHASE 1: Pre-filter with enhanced keyword matching
        console.log('Phase 1: Enhanced keyword pre-filtering...');
        videos.forEach(video => {
            video.category = this.enhancedKeywordCategorization(video);
            if (video.category !== 'Entertainment' && video.category !== 'Uncategorized') {
                this.categorizationStats.keywordCategorized++;
            }
        });
        
        // PHASE 2: Channel pattern analysis
        console.log('Phase 2: Channel pattern analysis...');
        this.advancedChannelAnalysis(videos);
        
        // PHASE 3: AI categorization for remaining videos
        const uncategorizedVideos = videos.filter(v => 
            v.category === 'Entertainment' || v.category === 'Uncategorized'
        );
        
        if (uncategorizedVideos.length > 0) {
            console.log(`Phase 3: AI categorizing ${uncategorizedVideos.length} remaining videos...`);
            await this.aiCategorizeWithContext(uncategorizedVideos, apiKey);
        }
        
        // PHASE 4: Context-based refinement
        console.log('Phase 4: Context-based refinement...');
        this.contextualRefinement(videos);
        
        // PHASE 5: Final validation
        console.log('Phase 5: Final validation...');
        this.finalCategoryValidation(videos);
        
        // Log statistics
        const categoryDistribution = {};
        videos.forEach(v => {
            categoryDistribution[v.category] = (categoryDistribution[v.category] || 0) + 1;
        });
        
        console.log('Categorization Complete:', {
            total: this.categorizationStats.total,
            aiCategorized: this.categorizationStats.aiCategorized,
            keywordCategorized: this.categorizationStats.keywordCategorized,
            contextCategorized: this.categorizationStats.contextCategorized,
            distribution: categoryDistribution
        });
    }

    // Enhanced keyword categorization with priority scoring
    enhancedKeywordCategorization(video) {
        const title = (video.title || '').toLowerCase();
        const channel = (video.channel || '').toLowerCase();
        const combined = title + ' | ' + channel;
        
        // PRIORITY RULES: High-confidence universal patterns
        
        // YouTube Music "- Topic" channels are ALWAYS Music
        if (channel.includes('- topic') || channel.endsWith(' - topic')) {
            return 'Music';
        }
        
        // Common vlog indicators (universal)
        if (title.includes('mukbang') || title.includes('vlog') || title.includes('day in my life')) {
            return 'Vlog';
        }
        
        // Tutorial indicators (stronger than keyword matching)
        if (title.includes('how to') || title.includes('tutorial') || title.includes('learn')) {
            // Check for software tutorials specifically
            if (title.includes('photoshop') || title.includes('illustrator') || title.includes('after effects') ||
                title.includes('excel') || title.includes('coding') || title.includes('programming')) {
                return 'Tutorial';
            }
        }
        
        // Score-based categorization to avoid Entertainment fallback
        const scores = {};
        
        // Check each category with weighted scoring
        Object.entries(this.channelPatterns).forEach(([category, patterns]) => {
            scores[category] = 0;
            
            patterns.forEach(pattern => {
                const regex = new RegExp('\\b' + pattern.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + '\\b', 'i');
                
                // Channel name match (high weight)
                if (regex.test(channel)) {
                    scores[category] += 10;
                }
                
                // Title match (medium weight)
                if (regex.test(title)) {
                    scores[category] += 5;
                }
                
                // Exact phrase match (bonus)
                if (combined.includes(pattern)) {
                    scores[category] += 3;
                }
            });
        });
        
        // Additional specific pattern detection
        
        // Gaming patterns
        if (/\b(ep|episode|part)\s*\d+/i.test(title) && /game|play|stream/i.test(combined)) {
            scores['Gaming'] = (scores['Gaming'] || 0) + 15;
        }
        
        // Music patterns
        if (/\(official\s+(video|audio|music\s+video|lyric\s+video)\)/i.test(title)) {
            scores['Music'] = (scores['Music'] || 0) + 20;
        }
        if (/\bft\.|feat\.|featuring|prod\.|produced\sby/i.test(title)) {
            scores['Music'] = (scores['Music'] || 0) + 10;
        }
        
        // Tutorial/Education patterns
        if (/\bhow\s+to\b|\btutorial\b|\bguide\b|\blearn\b/i.test(title)) {
            scores['Tutorial'] = (scores['Tutorial'] || 0) + 15;
        }
        if (/\bexplained\b|\bunderstanding\b|\blesson\b/i.test(title)) {
            scores['Education'] = (scores['Education'] || 0) + 15;
        }
        
        // Tech/Review patterns
        if (/\breview\b|\bunboxing\b|\bvs\b|\bcomparison\b/i.test(title)) {
            scores['Tech'] = (scores['Tech'] || 0) + 10;
        }
        
        // News patterns
        if (/\bbreaking\b|\blive\b|\btoday\b|\bupdate\b|\blive\s+stream\b/i.test(title) && 
            /news|report|press/i.test(combined)) {
            scores['News'] = (scores['News'] || 0) + 15;
        }
        
        // Podcast patterns
        if (/#\d+|ep\s*\d+|\bepisode\s+\d+/i.test(title) && 
            /podcast|interview|talk|discussion/i.test(combined)) {
            scores['Podcast'] = (scores['Podcast'] || 0) + 15;
        }
        
        // Comedy patterns
        if (/\bfunny\b|\bcomedy\b|\bstandup\b|\bsketch\b|\bparody\b|\broast\b/i.test(combined)) {
            scores['Comedy'] = (scores['Comedy'] || 0) + 12;
        }
        
        // Vlog patterns
        if (/\bvlog\b|\bday\s+in\b|\bmy\s+life\b|\broutine\b|\bgrwm\b/i.test(title)) {
            scores['Vlog'] = (scores['Vlog'] || 0) + 15;
        }
        
        // ASMR patterns
        if (/\basmr\b/i.test(combined)) {
            scores['ASMR'] = (scores['ASMR'] || 0) + 20;
        }
        
        // Find highest scoring category
        let maxScore = 0;
        let bestCategory = 'Entertainment';
        
        Object.entries(scores).forEach(([category, score]) => {
            if (score > maxScore) {
                maxScore = score;
                bestCategory = category;
            }
        });
        
        // Only return non-Entertainment if confidence is high enough
        if (maxScore >= 10) {
            return bestCategory;
        }
        
        // Last resort: check for very specific patterns
        return this.lastResortCategorization(video);
    }

    // Last resort categorization to avoid Entertainment
    lastResortCategorization(video) {
        const title = (video.title || '').toLowerCase();
        const channel = (video.channel || '').toLowerCase();
        
        // Check for specific video type indicators
        if (/^\[.+\]/.test(video.title)) return 'Gaming'; // [Game Name] format
        if (/\d{4}/.test(title) && /movie|film|trailer/i.test(title)) return 'Entertainment';
        if (/^[A-Z\s]+\-/.test(video.title)) return 'Music'; // ALL CAPS - Title format
        if (channel.split(' ').length === 2 && /^[A-Z][a-z]+ [A-Z][a-z]+$/.test(video.channel)) {
            return 'Vlog'; // First Last name format
        }
        
        return 'Entertainment'; // True fallback
    }

    // Advanced channel analysis
    advancedChannelAnalysis(videos) {
        // Group videos by channel
        const channelGroups = {};
        videos.forEach(video => {
            if (!channelGroups[video.channel]) {
                channelGroups[video.channel] = [];
            }
            channelGroups[video.channel].push(video);
        });
        
        // Analyze each channel
        Object.entries(channelGroups).forEach(([channel, channelVideos]) => {
            // Find dominant category for this channel
            const categoryCounts = {};
            channelVideos.forEach(video => {
                if (video.category !== 'Entertainment' && video.category !== 'Uncategorized') {
                    categoryCounts[video.category] = (categoryCounts[video.category] || 0) + 1;
                }
            });
            
            // If channel has a clear category pattern
            const entries = Object.entries(categoryCounts);
            if (entries.length > 0) {
                entries.sort((a, b) => b[1] - a[1]);
                const [dominantCategory, count] = entries[0];
                const totalCategorized = Object.values(categoryCounts).reduce((a, b) => a + b, 0);
                
                // If >60% of categorized videos are in one category, apply to all
                if (count / totalCategorized > 0.6) {
                    channelVideos.forEach(video => {
                        if (video.category === 'Entertainment' || video.category === 'Uncategorized') {
                            video.category = dominantCategory;
                            this.categorizationStats.contextCategorized++;
                        }
                    });
                }
            }
        });
    }

    // AI categorization with context
    async aiCategorizeWithContext(videos, apiKey) {
        const batchSize = 20; // Smaller batches for better accuracy
        const batches = [];
        
        for (let i = 0; i < videos.length; i += batchSize) {
            batches.push(videos.slice(i, i + batchSize));
        }
        
        for (let i = 0; i < batches.length; i++) {
            const batch = batches[i];
            
            try {
                // Build context for this batch
                const videoList = batch.map((v, idx) => 
                    `${idx + 1}. "${v.title}" by ${v.channel}`
                ).join('\n');
                
                const prompt = `You are an expert YouTube content categorizer with expertise in GLOBAL content across ALL languages and cultures.

CRITICAL RULES:
1. NEVER default to "Entertainment" unless it's clearly entertainment/movies/shows
2. Look for SPECIFIC indicators in BOTH title AND channel
3. Consider channel names heavily - they often indicate content type
4. Gaming, Music, Tech are VERY common - look for these first
5. Personal vlogs are "Vlog" NOT "Entertainment"
6. Educational content is "Education" or "Tutorial" NOT "Entertainment"
7. MULTI-LANGUAGE: Recognize content in ANY language without bias
8. TOPIC over LANGUAGE: Focus on content type, not the language it's in
9. CULTURAL NEUTRALITY: Treat all languages and cultures equally

UNIVERSAL PATTERNS:
- Channels ending in "- Topic" = Music (YouTube auto-generated music channels)
- News channels use local terms: "news", "noticias", "nouvelles", "balita", "berita", etc.
- Vlogs often include: "day in", "my life", "routine", "daily" in ANY language
- Music videos: "official video", "official audio", "lyric video", "MV"
- Tutorials: "how to", "tutorial", "guide", "learn" patterns across languages

Available categories:
Gaming, Music, Education, Tech, Comedy, News, Cooking, Sports, Science, Documentary, 
Podcast, Tutorial, Fitness, Art, Travel, Vlog, Politics, Fashion, Beauty, Finance, 
Business, Health, DIY, Lifestyle, Review, Reaction, Animation, History, Nature, 
Language, Religion, ASMR, Kids, Automotive, Photography, Entertainment

Examples (showing language diversity):
- "Let's Play Minecraft Part 5" → Gaming (English)
- "Como cocinar paella" → Cooking (Spanish)
- "Mon routine du matin" → Vlog (French)
- "テクノロジーレビュー" → Tech (Japanese)
- ANY video with "- Topic" channel → Music (universal)

Respond ONLY with number and category:
1. [Category]
2. [Category]

Videos:
${videoList}`;

                const response = await this.callGeminiForCategorization(prompt, apiKey);
                
                if (response) {
                    const lines = response.trim().split('\n');
                    lines.forEach(line => {
                        const match = line.match(/^(\d+)\.\s*(.+)$/);
                        if (match) {
                            const index = parseInt(match[1]) - 1;
                            const category = match[2].trim();
                            
                            if (index >= 0 && index < batch.length) {
                                const validCategory = this.validateCategory(category);
                                batch[index].category = validCategory;
                                this.categorizationStats.aiCategorized++;
                            }
                        }
                    });
                }
                
                // Delay between batches
                if (i < batches.length - 1) {
                    await new Promise(resolve => setTimeout(resolve, 1200));
                }
                
            } catch (error) {
                console.error(`Error in AI batch ${i + 1}:`, error.message);
            }
        }
    }

    // Contextual refinement
    contextualRefinement(videos) {
        // Temporal pattern analysis
        const timePatterns = {};
        
        videos.forEach(video => {
            const hour = video.time.getHours();
            const timeSlot = hour < 6 ? 'night' : hour < 12 ? 'morning' : hour < 18 ? 'afternoon' : 'evening';
            
            if (!timePatterns[timeSlot]) {
                timePatterns[timeSlot] = {};
            }
            
            const category = video.category;
            timePatterns[timeSlot][category] = (timePatterns[timeSlot][category] || 0) + 1;
        });
        
        // Sequence analysis - videos watched in succession
        for (let i = 1; i < videos.length; i++) {
            const prev = videos[i - 1];
            const curr = videos[i];
            const timeDiff = (curr.time - prev.time) / 1000 / 60; // minutes
            
            // If videos watched within 10 minutes
            if (timeDiff < 10) {
                // If previous video has strong category and current is Entertainment
                if (curr.category === 'Entertainment' && 
                    prev.category !== 'Entertainment' &&
                    prev.channel === curr.channel) {
                    // Inherit category from previous
                    curr.category = prev.category;
                    this.categorizationStats.contextCategorized++;
                }
            }
        }
    }

    // Final category validation
    finalCategoryValidation(videos) {
        videos.forEach(video => {
            // Re-check Entertainment assignments
            if (video.category === 'Entertainment') {
                const recheck = this.enhancedKeywordCategorization(video);
                if (recheck !== 'Entertainment') {
                    video.category = recheck;
                }
            }
        });
    }

    // Call Gemini API for categorization
    async callGeminiForCategorization(prompt, apiKey) {
        const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=${apiKey}`;
        
        try {
            const response = await fetch(url, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    contents: [{
                        parts: [{
                            text: prompt
                        }]
                    }],
                    generationConfig: {
                        temperature: 0.1, // Lower temperature for consistency
                        maxOutputTokens: 300,
                        topP: 0.9,
                        topK: 40
                    }
                })
            });

            if (!response.ok) {
                const error = await response.json();
                console.error('Gemini API error:', error);
                return null;
            }

            const data = await response.json();
            if (data.candidates && data.candidates[0] && data.candidates[0].content) {
                return data.candidates[0].content.parts[0].text;
            }
            
            return null;
        } catch (error) {
            console.error('Error calling Gemini for categorization:', error);
            return null;
        }
    }

    // Validate and normalize category names
    validateCategory(category) {
        const validCategories = {
            'Gaming': 'Gaming',
            'Music': 'Music',
            'Education': 'Education',
            'Educational': 'Education',
            'Tech': 'Tech',
            'Technology': 'Tech',
            'Comedy': 'Comedy',
            'News': 'News',
            'Cooking': 'Cooking',
            'Food': 'Cooking',
            'Sports': 'Sports',
            'Sport': 'Sports',
            'Science': 'Science',
            'Documentary': 'Documentary',
            'Podcast': 'Podcast',
            'Tutorial': 'Tutorial',
            'Tutorials': 'Tutorial',
            'Fitness': 'Fitness',
            'Workout': 'Fitness',
            'Art': 'Art',
            'Travel': 'Travel',
            'Vlog': 'Vlog',
            'Vlogs': 'Vlog',
            'Politics': 'Politics',
            'Political': 'Politics',
            'Fashion': 'Fashion',
            'Beauty': 'Beauty',
            'Finance': 'Finance',
            'Business': 'Business',
            'Health': 'Health',
            'DIY': 'DIY',
            'Entertainment': 'Entertainment',
            'Lifestyle': 'Lifestyle',
            'Review': 'Review',
            'Reviews': 'Review',
            'Reaction': 'Reaction',
            'Reactions': 'Reaction',
            'Animation': 'Animation',
            'Animated': 'Animation',
            'History': 'History',
            'Historical': 'History',
            'Nature': 'Nature',
            'Language': 'Language',
            'Religion': 'Religion',
            'Religious': 'Religion',
            'ASMR': 'ASMR',
            'Kids': 'Kids',
            'Children': 'Kids',
            'Automotive': 'Automotive',
            'Cars': 'Automotive',
            'Photography': 'Photography',
            'Photo': 'Photography'
        };

        // Clean the category string
        const cleaned = category.replace(/[^\w\s]/g, '').trim();
        
        // Find exact or close match
        for (const [key, value] of Object.entries(validCategories)) {
            if (cleaned.toLowerCase() === key.toLowerCase()) {
                return value;
            }
        }
        
        // If no match found, return original (will be caught in validation)
        return category;
    }

    // Clean video title
    cleanTitle(title) {
        return title
            .replace('Watched ', '')
            .replace('Watched a video that has been removed', 'Removed Video')
            .trim();
    }

    // Extract channel name
    extractChannel(item) {
        if (item.subtitles && item.subtitles[0] && item.subtitles[0].name) {
            return item.subtitles[0].name;
        }
        if (item.channel && item.channel.name) {
            return item.channel.name;
        }
        if (item.channel) {
            return item.channel;
        }
        return 'Unknown Channel';
    }

    // [REST OF THE CLASS METHODS REMAIN THE SAME - analyzeData, filterByTimePeriod, etc.]
    // ... (keeping all the other methods from the original file)
    
    // Analyze the data
    analyzeData(data) {
        if (!data || data.length === 0) {
            return {
                totalVideos: 0,
                uniqueChannels: 0,
                topChannels: [],
                channelCounts: {},
                categoryCounts: {},
                hourCounts: new Array(24).fill(0),
                dayOfWeekCounts: new Array(7).fill(0),
                yearCounts: {},
                dateRange: {
                    first: new Date(),
                    last: new Date(),
                    days: 0
                }
            };
        }
        
        const channelCounts = {};
        const categoryCounts = {};
        const hourCounts = new Array(24).fill(0);
        const dayOfWeekCounts = new Array(7).fill(0);
        const yearCounts = {};

        data.forEach(video => {
            channelCounts[video.channel] = (channelCounts[video.channel] || 0) + 1;
            categoryCounts[video.category] = (categoryCounts[video.category] || 0) + 1;
            
            if (video.time) {
                hourCounts[video.time.getHours()]++;
                dayOfWeekCounts[video.time.getDay()]++;
                const year = video.time.getFullYear();
                yearCounts[year] = (yearCounts[year] || 0) + 1;
            }
        });

        const topChannels = Object.entries(channelCounts)
            .sort((a, b) => b[1] - a[1])
            .slice(0, 20);

        const dates = data.map(v => v.time).filter(d => d instanceof Date && !isNaN(d));
        let firstDate = new Date();
        let lastDate = new Date();
        let daySpan = 0;
        
        if (dates.length > 0) {
            dates.sort((a, b) => a - b);
            firstDate = dates[0];
            lastDate = dates[dates.length - 1];
            daySpan = Math.max(1, Math.floor((lastDate - firstDate) / (1000 * 60 * 60 * 24)));
        }

        this.processedData = {
            totalVideos: data.length,
            uniqueChannels: Object.keys(channelCounts).length,
            topChannels: topChannels,
            channelCounts: channelCounts,
            categoryCounts: categoryCounts,
            hourCounts: hourCounts,
            dayOfWeekCounts: dayOfWeekCounts,
            yearCounts: yearCounts,
            dateRange: {
                first: firstDate,
                last: lastDate,
                days: daySpan
            }
        };

        return this.processedData;
    }

    // Filter data by time period
    filterByTimePeriod(period) {
        const now = new Date();
        const mostRecentVideo = this.allData.length > 0 
            ? this.allData[this.allData.length - 1].time 
            : now;
        
        let startDate, endDate;
        
        switch(period) {
            case 'month':
                endDate = new Date(mostRecentVideo);
                startDate = new Date(mostRecentVideo);
                startDate.setDate(startDate.getDate() - 30);
                break;
            case 'year':
                endDate = new Date(mostRecentVideo);
                startDate = new Date(mostRecentVideo);
                startDate.setDate(startDate.getDate() - 365);
                break;
            case '5years':
                endDate = new Date(mostRecentVideo);
                startDate = new Date(mostRecentVideo);
                startDate.setFullYear(startDate.getFullYear() - 5);
                break;
            case 'all':
            default:
                startDate = this.allData.length > 0 ? this.allData[0].time : new Date(0);
                endDate = mostRecentVideo;
                break;
        }

        this.filteredData = this.allData.filter(video => 
            video.time >= startDate && video.time <= endDate
        );
        
        if (this.filteredData.length === 0) {
            this.filteredData = [...this.allData];
        }

        return this.analyzeData(this.filteredData);
    }
    
    // Get available time periods based on data
    getAvailableTimePeriods() {
        if (this.allData.length === 0) return [];
        
        const firstVideo = this.allData[0].time;
        const lastVideo = this.allData[this.allData.length - 1].time;
        const totalDays = Math.floor((lastVideo - firstVideo) / (1000 * 60 * 60 * 24));
        
        const periods = [];
        
        periods.push({ 
            id: 'all', 
            label: 'All Time',
            description: `${totalDays} days`
        });
        
        if (totalDays >= 30) {
            periods.push({ 
                id: 'month', 
                label: 'Last Month',
                description: 'Last 30 days'
            });
        }
        
        if (totalDays >= 365) {
            periods.push({ 
                id: 'year', 
                label: 'Last Year',
                description: 'Last 365 days'
            });
        }
        
        if (totalDays >= 365 * 5) {
            periods.push({ 
                id: '5years', 
                label: 'Last 5 Years',
                description: 'Last 5 years'
            });
        }
        
        return periods;
    }
    
    // Get year-by-year comparison data
    getYearlyComparison() {
        const yearlyData = {};
        
        this.allData.forEach(video => {
            const year = video.time.getFullYear();
            if (!yearlyData[year]) {
                yearlyData[year] = {
                    videos: [],
                    count: 0,
                    channels: new Set(),
                    categories: {}
                };
            }
            
            yearlyData[year].videos.push(video);
            yearlyData[year].count++;
            yearlyData[year].channels.add(video.channel);
            
            if (!yearlyData[year].categories[video.category]) {
                yearlyData[year].categories[video.category] = 0;
            }
            yearlyData[year].categories[video.category]++;
        });
        
        Object.keys(yearlyData).forEach(year => {
            const data = yearlyData[year];
            
            const channelCounts = {};
            data.videos.forEach(v => {
                channelCounts[v.channel] = (channelCounts[v.channel] || 0) + 1;
            });
            
            let entropy = 0;
            const total = data.count;
            Object.values(channelCounts).forEach(count => {
                const p = count / total;
                if (p > 0) {
                    entropy -= p * Math.log2(p);
                }
            });
            
            const maxEntropy = Math.log2(data.channels.size);
            const diversity = maxEntropy > 0 ? entropy / maxEntropy : 0;
            
            yearlyData[year].diversity = diversity;
            yearlyData[year].uniqueChannels = data.channels.size;
            yearlyData[year].dominantCategory = Object.entries(data.categories)
                .sort((a, b) => b[1] - a[1])[0]?.[0] || 'Unknown';
        });
        
        return yearlyData;
    }

    // Get data for specific year
    getYearData(year) {
        return this.allData.filter(video => video.time.getFullYear() === year);
    }

    // Get current filtered data
    getFilteredData() {
        return this.filteredData;
    }

    // Get all data
    getAllData() {
        return this.allData;
    }

    // Export methods
    exportCategorizedData() {
        const exportData = {
            metadata: {
                totalVideos: this.allData.length,
                exportDate: new Date().toISOString(),
                categorizationStats: this.categorizationStats,
                uniqueChannels: [...new Set(this.allData.map(v => v.channel))].length,
                dateRange: {
                    first: this.allData[0]?.time,
                    last: this.allData[this.allData.length - 1]?.time
                }
            },
            categorySummary: {},
            videos: []
        };

        this.allData.forEach(video => {
            if (!exportData.categorySummary[video.category]) {
                exportData.categorySummary[video.category] = {
                    count: 0,
                    percentage: 0,
                    channels: new Set()
                };
            }
            exportData.categorySummary[video.category].count++;
            exportData.categorySummary[video.category].channels.add(video.channel);
        });

        Object.keys(exportData.categorySummary).forEach(category => {
            exportData.categorySummary[category].percentage = 
                ((exportData.categorySummary[category].count / this.allData.length) * 100).toFixed(2) + '%';
            exportData.categorySummary[category].uniqueChannels = 
                exportData.categorySummary[category].channels.size;
            delete exportData.categorySummary[category].channels;
        });

        exportData.videos = this.allData.map(video => ({
            title: video.title,
            channel: video.channel,
            category: video.category,
            date: video.time.toISOString().split('T')[0],
            time: video.time.toTimeString().split(' ')[0],
            dayOfWeek: ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'][video.time.getDay()],
            hour: video.time.getHours(),
            year: video.time.getFullYear(),
            url: video.url || ''
        }));

        return exportData;
    }

    exportToCSV() {
        const csvRows = [];
        
        csvRows.push(['Title', 'Channel', 'Category', 'Date', 'Time', 'Day of Week', 'Hour', 'Year', 'URL'].join(','));
        
        this.allData.forEach(video => {
            const row = [
                `"${video.title.replace(/"/g, '""')}"`,
                `"${video.channel.replace(/"/g, '""')}"`,
                video.category,
                video.time.toISOString().split('T')[0],
                video.time.toTimeString().split(' ')[0],
                ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'][video.time.getDay()],
                video.time.getHours(),
                video.time.getFullYear(),
                video.url || ''
            ];
            csvRows.push(row.join(','));
        });
        
        return csvRows.join('\n');
    }

    downloadCategorizedData(format = 'json') {
        let data, filename, mimeType;
        
        if (format === 'csv') {
            data = this.exportToCSV();
            filename = `youtube-categorized-${Date.now()}.csv`;
            mimeType = 'text/csv';
        } else {
            const exportData = this.exportCategorizedData();
            data = JSON.stringify(exportData, null, 2);
            filename = `youtube-categorized-${Date.now()}.json`;
            mimeType = 'application/json';
        }
        
        const blob = new Blob([data], { type: mimeType });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = filename;
        link.click();
        URL.revokeObjectURL(url);
    }

    getCategoryStatistics() {
        const stats = {};
        
        this.filteredData.length > 0 ? this.filteredData : this.allData.forEach(video => {
            if (!stats[video.category]) {
                stats[video.category] = {
                    videos: [],
                    count: 0,
                    channels: new Set(),
                    firstWatched: video.time,
                    lastWatched: video.time,
                    topChannels: {}
                };
            }
            
            stats[video.category].videos.push(video);
            stats[video.category].count++;
            stats[video.category].channels.add(video.channel);
            
            stats[video.category].topChannels[video.channel] = 
                (stats[video.category].topChannels[video.channel] || 0) + 1;
            
            if (video.time < stats[video.category].firstWatched) {
                stats[video.category].firstWatched = video.time;
            }
            if (video.time > stats[video.category].lastWatched) {
                stats[video.category].lastWatched = video.time;
            }
        });
        
        Object.keys(stats).forEach(category => {
            stats[category].topChannels = Object.entries(stats[category].topChannels)
                .sort((a, b) => b[1] - a[1])
                .slice(0, 5)
                .map(([channel, count]) => ({ channel, count }));
            
            stats[category].uniqueChannels = stats[category].channels.size;
            delete stats[category].channels;
            
            stats[category].percentage = ((stats[category].count / (this.filteredData.length > 0 ? this.filteredData.length : this.allData.length)) * 100).toFixed(2);
        });
        
        const sortedStats = Object.entries(stats)
            .sort((a, b) => b[1].count - a[1].count)
            .reduce((obj, [key, value]) => {
                obj[key] = value;
                return obj;
            }, {});
        
        return sortedStats;
    }

    // Generate sample data for testing
    generateSampleData() {
        const sampleChannels = {
            'Gaming': ['GameSpot', 'IGN', 'Markiplier', 'PewDiePie', 'GameTheory', 'Dunkey'],
            'Music': ['Vevo', 'Spotify', 'NPR Music', 'Tiny Desk', 'COLORS', 'Boiler Room'],
            'Education': ['Khan Academy', 'CrashCourse', 'TED-Ed', 'Veritasium', '3Blue1Brown'],
            'Tech': ['MKBHD', 'Unbox Therapy', 'LinusTechTips', 'The Verge', 'CNET'],
            'Comedy': ['SNL', 'Comedy Central', 'CollegeHumor', 'The Onion', 'Key & Peele'],
            'News': ['CNN', 'BBC', 'Vox', 'Vice', 'The Guardian', 'Reuters'],
            'Cooking': ['Bon AppÃ©tit', 'Binging with Babish', 'Gordon Ramsay', 'Tasty'],
            'Science': ['Vsauce', 'Kurzgesagt', 'SmarterEveryDay', 'Mark Rober', 'NileRed']
        };

        const sampleData = [];
        const startDate = new Date('2019-01-01');
        const endDate = new Date();
        const totalDays = Math.floor((endDate - startDate) / (1000 * 60 * 60 * 24));

        const videoCount = 500 + Math.floor(Math.random() * 1500);

        for (let i = 0; i < videoCount; i++) {
            const progress = i / videoCount;
            
            const diversityFactor = progress < 0.3 ? 1 : progress < 0.6 ? 0.7 : 0.4;
            const categories = Object.keys(sampleChannels);
            const availableCategories = Math.floor(categories.length * diversityFactor);
            
            const category = categories[Math.floor(Math.random() * Math.max(3, availableCategories))];
            const channels = sampleChannels[category];
            const channel = channels[Math.floor(Math.random() * channels.length)];
            
            const dayOffset = Math.floor(progress * totalDays);
            const date = new Date(startDate.getTime() + dayOffset * 24 * 60 * 60 * 1000);
            
            const hour = Math.random() < 0.7 
                ? 19 + Math.floor(Math.random() * 5)
                : Math.floor(Math.random() * 24);
            
            date.setHours(hour);
            date.setMinutes(Math.floor(Math.random() * 60));

            sampleData.push({
                title: `${category} Video - ${channel} Content ${i + 1}`,
                time: date.toISOString(),
                subtitles: [{ name: channel }],
                titleUrl: `https://www.youtube.com/watch?v=${Math.random().toString(36).substr(2, 11)}`
            });
        }

        return sampleData;
    }
}

window.DataProcessor = DataProcessor;