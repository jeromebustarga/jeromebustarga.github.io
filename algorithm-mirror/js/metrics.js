// metrics.js - Handles all metric calculations

class MetricsCalculator {
    constructor() {
        this.metrics = {};
        this.explanations = {
            'Echo Chamber Strength': {
                term: 'Echo Chamber Strength',
                text: 'Percentage of your viewing from your top 5 channels. Above 70% indicates a strong filter bubble where the algorithm has narrowed your content exposure.',
                formula: '(Views from top 5 channels / Total views) × 100'
            },
            'Content Diversity': {
                term: 'Content Diversity (Shannon Entropy)',
                text: 'Mathematical measure of how varied your viewing is. 1.0 means perfectly diverse, 0 means you watch only one channel.',
                formula: 'H = -Σ p(x) log₂(p(x))'
            },
            'Binge Score': {
                term: 'Binge Score',
                text: 'Measures your tendency to watch multiple videos in one session. Higher scores indicate compulsive viewing patterns.',
                formula: 'Sessions with 3+ videos / Total sessions × Average daily videos'
            },
            'Peak Hour': {
                term: 'Peak Viewing Hour',
                text: 'The hour when you watch the most videos. Late night viewing often indicates passive consumption and higher susceptibility to rabbit holes.',
                formula: 'Hour with maximum video count'
            },
            'Night Owl Score': {
                term: 'Night Owl Score',
                text: 'Percentage of viewing between 11 PM and 5 AM. High scores correlate with reduced decision-making quality and algorithmic vulnerability.',
                formula: '(Videos 11PM-5AM / Total videos) × 100'
            }
        };
    }

    // Calculate all metrics
    calculateAllMetrics(processedData, videoData) {
        if (!processedData || !videoData || videoData.length === 0) {
            return this.getEmptyMetrics();
        }

        const total = processedData.totalVideos;
        
        // Shannon Entropy (Diversity Score)
        const entropy = this.calculateShannonEntropy(processedData.channelCounts, total);
        const maxEntropy = Math.log2(processedData.uniqueChannels || 1);
        const diversityScore = maxEntropy > 0 ? entropy / maxEntropy : 0;

        // Echo Chamber Strength
        const echoStrength = this.calculateEchoStrength(processedData.topChannels, total);

        // Binge Score
        const bingeScore = this.calculateBingeScore(videoData);

        // Peak Hour
        const peakHour = this.findPeakHour(processedData.hourCounts);

        // Night Owl Score
        const nightOwlScore = this.calculateNightOwlScore(processedData.hourCounts, total);

        // Historical metrics
        const historicalMetrics = this.calculateHistoricalMetrics(videoData);

        // Algorithm Learning Curve
        const learningCurve = this.calculateAlgorithmLearning(videoData);

        this.metrics = {
            diversityScore,
            echoStrength,
            bingeScore,
            peakHour,
            nightOwlScore,
            ...historicalMetrics,
            ...learningCurve
        };

        return this.metrics;
    }

    // Shannon Entropy calculation
    calculateShannonEntropy(channelCounts, total) {
        let entropy = 0;
        
        Object.values(channelCounts).forEach(count => {
            if (count > 0) {
                const probability = count / total;
                entropy -= probability * Math.log2(probability);
            }
        });
        
        return entropy;
    }

    // Echo Chamber Strength
    calculateEchoStrength(topChannels, total) {
        if (!topChannels || topChannels.length === 0) return 0;
        
        const top5Views = topChannels
            .slice(0, 5)
            .reduce((sum, [_, count]) => sum + count, 0);
        
        return (top5Views / total) * 100;
    }

    // Binge Score calculation
    calculateBingeScore(videoData) {
        if (!videoData || videoData.length === 0) return 0;

        const sessions = this.identifySessions(videoData);
        const bingeSessions = sessions.filter(s => s.length >= 3).length;
        const bingeRatio = sessions.length > 0 ? bingeSessions / sessions.length : 0;

        // Calculate daily average
        const dates = videoData.map(v => v.time);
        const daySpan = Math.max(1, this.getDaysBetween(
            Math.min(...dates),
            Math.max(...dates)
        ));
        const dailyAverage = videoData.length / daySpan;

        // Combine metrics (normalized to 0-1)
        return Math.min(1, bingeRatio * (dailyAverage / 10));
    }

    // Identify viewing sessions
    identifySessions(videoData) {
        const sessions = [];
        let currentSession = [];
        const SESSION_GAP = 2 * 60 * 60 * 1000; // 2 hours

        const sortedVideos = [...videoData].sort((a, b) => a.time - b.time);

        sortedVideos.forEach((video, index) => {
            if (index === 0) {
                currentSession.push(video);
            } else {
                const timeDiff = video.time - sortedVideos[index - 1].time;
                
                if (timeDiff < SESSION_GAP) {
                    currentSession.push(video);
                } else {
                    if (currentSession.length > 0) {
                        sessions.push([...currentSession]);
                    }
                    currentSession = [video];
                }
            }
        });

        if (currentSession.length > 0) {
            sessions.push(currentSession);
        }

        return sessions;
    }

    // Find peak viewing hour
    findPeakHour(hourCounts) {
        if (!hourCounts || hourCounts.length === 0) return 0;
        
        let maxCount = 0;
        let peakHour = 0;
        
        hourCounts.forEach((count, hour) => {
            if (count > maxCount) {
                maxCount = count;
                peakHour = hour;
            }
        });
        
        return peakHour;
    }

    // Night Owl Score
    calculateNightOwlScore(hourCounts, total) {
        if (!hourCounts || total === 0) return 0;
        
        // Hours 23, 0, 1, 2, 3, 4, 5
        const nightHours = [23, 0, 1, 2, 3, 4, 5];
        const nightViews = nightHours.reduce((sum, hour) => {
            return sum + (hourCounts[hour] || 0);
        }, 0);
        
        return (nightViews / total) * 100;
    }

    // Calculate historical metrics
    calculateHistoricalMetrics(videoData) {
        if (!videoData || videoData.length < 2) {
            return {
                algorithmicDrift: 0,
                diversityTrend: 'stable',
                pivotalMoments: []
            };
        }

        // Group by year
        const yearlyData = {};
        videoData.forEach(video => {
            const year = video.time.getFullYear();
            if (!yearlyData[year]) {
                yearlyData[year] = [];
            }
            yearlyData[year].push(video);
        });

        // Calculate yearly diversity
        const yearlyDiversity = {};
        Object.entries(yearlyData).forEach(([year, videos]) => {
            const channels = {};
            videos.forEach(v => {
                channels[v.channel] = (channels[v.channel] || 0) + 1;
            });
            
            const entropy = this.calculateShannonEntropy(channels, videos.length);
            const maxEntropy = Math.log2(Object.keys(channels).length || 1);
            yearlyDiversity[year] = maxEntropy > 0 ? entropy / maxEntropy : 0;
        });

        // Calculate drift
        const years = Object.keys(yearlyDiversity).sort();
        const firstYearDiv = yearlyDiversity[years[0]] || 0;
        const lastYearDiv = yearlyDiversity[years[years.length - 1]] || 0;
        const algorithmicDrift = firstYearDiv - lastYearDiv;

        // Determine trend
        let diversityTrend = 'stable';
        if (algorithmicDrift > 0.2) {
            diversityTrend = 'narrowing';
        } else if (algorithmicDrift < -0.2) {
            diversityTrend = 'expanding';
        }

        // Find pivotal moments (simplified)
        const pivotalMoments = this.findPivotalMoments(videoData);

        return {
            algorithmicDrift,
            diversityTrend,
            yearlyDiversity,
            pivotalMoments
        };
    }

    // Find pivotal moments in viewing history
    findPivotalMoments(videoData) {
        const moments = [];
        
        // Group by month
        const monthlyData = {};
        videoData.forEach(video => {
            const monthKey = `${video.time.getFullYear()}-${video.time.getMonth()}`;
            if (!monthlyData[monthKey]) {
                monthlyData[monthKey] = {
                    videos: [],
                    channels: new Set(),
                    categories: new Set()
                };
            }
            monthlyData[monthKey].videos.push(video);
            monthlyData[monthKey].channels.add(video.channel);
            monthlyData[monthKey].categories.add(video.category);
        });

        // Detect significant changes
        const months = Object.keys(monthlyData).sort();
        
        for (let i = 1; i < months.length; i++) {
            const prev = monthlyData[months[i - 1]];
            const curr = monthlyData[months[i]];
            
            // Check for sudden channel dominance
            const prevDiversity = prev.channels.size / prev.videos.length;
            const currDiversity = curr.channels.size / curr.videos.length;
            
            if (Math.abs(prevDiversity - currDiversity) > 0.3) {
                moments.push({
                    date: months[i],
                    type: currDiversity < prevDiversity ? 'narrowing' : 'expanding',
                    description: `Viewing diversity ${currDiversity < prevDiversity ? 'decreased' : 'increased'} significantly`
                });
            }
        }

        return moments.slice(0, 5); // Return top 5 moments
    }

    // Calculate algorithm learning curve
    calculateAlgorithmLearning(videoData) {
        if (!videoData || videoData.length < 100) {
            return {
                learningPoint: null,
                currentPhase: 'exploring'
            };
        }

        // Divide data into quarters
        const quarterSize = Math.floor(videoData.length / 4);
        const quarters = [
            videoData.slice(0, quarterSize),
            videoData.slice(quarterSize, quarterSize * 2),
            videoData.slice(quarterSize * 2, quarterSize * 3),
            videoData.slice(quarterSize * 3)
        ];

        // Calculate diversity for each quarter
        const quarterlyDiversity = quarters.map(quarter => {
            const channels = {};
            quarter.forEach(v => {
                channels[v.channel] = (channels[v.channel] || 0) + 1;
            });
            
            const entropy = this.calculateShannonEntropy(channels, quarter.length);
            const maxEntropy = Math.log2(Object.keys(channels).length || 1);
            return maxEntropy > 0 ? entropy / maxEntropy : 0;
        });

        // Find when algorithm "learned" user (biggest drop in diversity)
        let maxDrop = 0;
        let learningPoint = null;
        
        for (let i = 1; i < quarterlyDiversity.length; i++) {
            const drop = quarterlyDiversity[i - 1] - quarterlyDiversity[i];
            if (drop > maxDrop) {
                maxDrop = drop;
                learningPoint = i;
            }
        }

        // Determine current phase
        const currentDiversity = quarterlyDiversity[3];
        let currentPhase = 'diverse';
        if (currentDiversity < 0.3) {
            currentPhase = 'echo_chamber';
        } else if (currentDiversity < 0.6) {
            currentPhase = 'narrowing';
        }

        return {
            learningPoint,
            quarterlyDiversity,
            currentPhase,
            maxDrop
        };
    }

    // Utility function
    getDaysBetween(date1, date2) {
        return Math.floor(Math.abs(date2 - date1) / (1000 * 60 * 60 * 24));
    }

    // Get empty metrics
    getEmptyMetrics() {
        return {
            diversityScore: 0,
            echoStrength: 0,
            bingeScore: 0,
            peakHour: 0,
            nightOwlScore: 0,
            algorithmicDrift: 0,
            diversityTrend: 'unknown',
            yearlyDiversity: {},
            pivotalMoments: [],
            learningPoint: null,
            currentPhase: 'unknown'
        };
    }

    // Get explanations for metrics
    getExplanations() {
        return this.explanations;
    }
}

// Export for use in other modules
window.MetricsCalculator = MetricsCalculator;