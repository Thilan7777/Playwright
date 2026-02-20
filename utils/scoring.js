/**
 * Analytics Scoring System for Dialer.exe Search Results
 * 
 * This module provides scoring and classification logic for analyzing
 * search candidates without modifying the existing search algorithm.
 */

/**
 * Calculate path score based on location with intelligent C:\Users\ handling
 * @param {string} path - File path
 * @returns {number} Path score
 */
function calculatePathScore(path) {
    const pathUpper = path.toUpperCase();
    let score = 0;
    
    // ===== TIER 1: System Directories (Highest Trust) =====
    if (pathUpper.includes('C:\\WINDOWS\\SYSTEM32')) {
        return 50; // Trusted system location
    }
    
    if (pathUpper.includes('C:\\PROGRAM FILES (X86)')) {
        return 35; // Standard 32-bit program installation
    }
    
    if (pathUpper.includes('C:\\PROGRAM FILES') && !pathUpper.includes('(X86)')) {
        return 40; // Standard 64-bit program installation
    }
    
    // ===== TIER 2: Other Drives =====
    if (/^[D-Z]:\\/i.test(path)) {
        return 10; // Other drives, neutral-positive
    }
    
    // ===== TIER 3: C:\Users\ Directory (Granular Scoring) =====
    if (pathUpper.includes('C:\\USERS\\')) {
        
        // HIGHEST SUSPICION: Temp folders
        if (pathUpper.includes('\\APPDATA\\LOCAL\\TEMP\\') || 
            pathUpper.includes('\\TEMP\\') || 
            pathUpper.includes('\\TMP\\')) {
            return -30; // Highly suspicious temporary location
        }
        
        // HIGH SUSPICION: Common malware/suspicious locations
        if (pathUpper.includes('\\DESKTOP\\') || 
            pathUpper.includes('\\DOWNLOADS\\') || 
            pathUpper.includes('\\DOCUMENTS\\')) {
            return -20; // Moderate penalty for user profile locations
        }
        
        // MODERATE TRUST: User-installed software
        if (pathUpper.includes('\\APPDATA\\LOCAL\\PROGRAMS\\')) {
            return -5; // Legitimate user-installed applications (Windows Store apps, portable installs)
        }
        
        // LOW TRUST: Project/Development folders (legitimate but not system-level)
        // Indicators: Project, Development, University, Version folders, numeric version patterns
        const projectIndicators = [
            '\\PROJECT',
            '\\DEVELOPMENT',
            '\\UNIVERSITY',
            '\\VERSION',
            '\\VERSIONS',
            '\\BUILDS',
            '\\SRC\\',  // Source code folder
            '\\SOURCE\\'  // Source folder
        ];
        
        if (projectIndicators.some(indicator => pathUpper.includes(indicator))) {
            return -10; // Neutral-low trust for development/project files
        }
        
        // Check for numeric version patterns (e.g., "3.7", "2021", "v2.0")
        if (/(.\\|\\_|\\/)(v?\d+\.\d+|v?\d{4})(.\\|\\_|\\|$)/i.test(path)) {
            return -10; // Likely versioned software folder
        }
        
        // DEFAULT: All other C:\Users\ paths
        return -10; // Neutral-low trust, not heavily suspicious but not system-level
    }
    
    // ===== TIER 4: Everything Else =====
    return 0; // Unknown location, neutral
}

/**
 * Calculate vendor score
 * @param {string} vendor - Vendor name
 * @returns {number} Vendor score
 */
function calculateVendorScore(vendor) {
    const vendorUpper = vendor.toUpperCase();
    
    // Microsoft with potential digital signature indicator
    if (vendorUpper.includes('MICROSOFT')) {
        // If vendor string suggests digital signature, give extra points
        if (vendorUpper.includes('CORPORATION') || vendorUpper.includes('CORP.')) {
            return 45;
        }
        return 40;
    }
    
    // Modem brands
    const modemBrands = [
        'BSNL', 'MTNL', 'VISIONTEK', 'HUAWEI', 'ZTE', 
        'QUALCOMM', 'SIERRA WIRELESS', 'NOVATEL', 
        'ERICSSON', 'ALCATEL', 'TELIT', 'U-BLOX'
    ];
    
    for (const brand of modemBrands) {
        if (vendorUpper.includes(brand)) {
            return 25;
        }
    }
    
    // Explicit suspicious keywords (high penalty)
    const explicitSuspicious = [
        'CRACK', 'KEYGEN', 'PATCH', 'LOADER', 'PIRATE', 
        'WAREZ', 'NULLED', 'CRACKED', 'HACKED'
    ];
    
    for (const suspicious of explicitSuspicious) {
        if (vendorUpper.includes(suspicious)) {
            return -25;
        }
    }
    
    // Unknown/empty vendor (mild penalty)
    if (!vendor || vendor.trim() === '' || 
        vendorUpper === 'UNKNOWN' || vendorUpper === 'N/A' || vendorUpper === 'NONE') {
        return -5;
    }
    
    return 0;
}

/**
 * Calculate MD5 frequency score (Enhanced with trusted location check)
 * @param {string} md5 - MD5 hash
 * @param {Map<string, number>} md5FrequencyMap - Map of MD5 to frequency
 * @param {Array<Object>} allCandidates - All candidates for cross-validation
 * @returns {number} MD5 score
 */
function calculateMD5Score(md5, md5FrequencyMap, allCandidates) {
    if (!md5 || !md5FrequencyMap) {
        return 0;
    }
    
    const frequency = md5FrequencyMap.get(md5) || 1;
    
    // Enhanced logic: Only reward high frequency if at least one instance is in trusted location
    if (frequency > 5) {
        // Check if ANY instance with this MD5 is in a trusted location
        const trustedLocations = ['C:\\WINDOWS\\SYSTEM32', 'C:\\PROGRAM FILES', 'C:\\PROGRAM FILES (X86)'];
        const hasInstanceInTrustedLocation = allCandidates.some(candidate => {
            if (candidate.md5 === md5) {
                const pathUpper = (candidate.filePath || '').toUpperCase();
                return trustedLocations.some(loc => pathUpper.includes(loc));
            }
            return false;
        });
        
        if (hasInstanceInTrustedLocation) {
            return 30;
        } else {
            // High frequency but only in suspicious locations - reduced reward
            return 5;
        }
    }
    
    if (frequency >= 2 && frequency <= 5) {
        return 15;
    }
    
    return 0;
}

/**
 * Calculate product relevance score
 * @param {string} productName - Product name
 * @returns {number} Product score
 */
function calculateProductScore(productName) {
    const productUpper = productName.toUpperCase();
    
    // Relevant products (positive)
    const relevantKeywords = ['DIALER', 'MODEM', '3G', '4G', 'USB', 'WWAN', 'MOBILE BROADBAND', 'TELEPHONY'];
    
    for (const keyword of relevantKeywords) {
        if (productUpper.includes(keyword)) {
            return 20;
        }
    }
    
    // Unrelated software (negative)
    const unrelatedKeywords = [
        'VMWARE', 'NERO', 'OFFICE', 'WORD', 'EXCEL', 
        'POWERPOINT', 'ANTIVIRUS', 'KASPERSKY', 'NORTON', 
        'MCAFEE', 'AVAST', 'AVG', 'PHOTOSHOP', 'ACROBAT',
        'CHROME', 'FIREFOX', 'INTERNET EXPLORER', 'EDGE',
        'STEAM', 'GAMING'
    ];
    
    for (const keyword of unrelatedKeywords) {
        if (productUpper.includes(keyword)) {
            return -30;
        }
    }
    
    return 0;
}

/**
 * Calculate digital signature score (heuristic-based)
 * @param {Object} candidate - The candidate object
 * @returns {number} Signature score
 */
function calculateSignatureScore(candidate) {
    // Note: In a real implementation, you would check actual digital signature
    // For now, we use heuristics based on vendor and path
    
    const vendor = (candidate.vendor || '').toUpperCase();
    const path = (candidate.filePath || '').toUpperCase();
    
    // Heuristic: If it's Microsoft in System32, likely digitally signed
    if (vendor.includes('MICROSOFT') && path.includes('C:\\WINDOWS\\SYSTEM32')) {
        return 30; // Assume valid signature
    }
    
    // Known legitimate vendors in Program Files
    const trustedVendors = ['MICROSOFT', 'HUAWEI', 'ZTE', 'QUALCOMM', 'SIERRA WIRELESS'];
    const inProgramFiles = path.includes('C:\\PROGRAM FILES');
    
    if (inProgramFiles && trustedVendors.some(v => vendor.includes(v))) {
        return 30; // Assume valid signature
    }
    
    // Suspicious indicators that suggest no signature or invalid
    const suspiciousKeywords = ['CRACK', 'KEYGEN', 'PATCH', 'UNKNOWN'];
    if (suspiciousKeywords.some(k => vendor.includes(k))) {
        return -20; // Invalid or no signature
    }
    
    // No clear indication
    return 0;
}

/**
 * Get confidence label based on score
 * @param {number} score - Total score
 * @returns {string} Confidence label
 */
function getConfidenceLabel(score) {
    if (score >= 100) return 'Highly Legitimate';
    if (score >= 70) return 'Likely Legitimate';
    if (score >= 30) return 'Uncertain';
    if (score >= 0) return 'Suspicious';
    return 'Highly Suspicious';
}

/**
 * Calculate total score with all factors
 * @param {Object} candidate - The candidate object
 * @param {Map<string, number>} md5FrequencyMap - Map of MD5 to frequency count
 * @param {Array<Object>} allCandidates - All candidates for cross-validation
 * @returns {Object} Score result with breakdown
 */
function calculateTotalScore(candidate, md5FrequencyMap, allCandidates) {
    const pathScore = calculatePathScore(candidate.filePath || '');
    const vendorScore = calculateVendorScore(candidate.vendor || '');
    const md5Score = calculateMD5Score(candidate.md5, md5FrequencyMap, allCandidates);
    const productScore = calculateProductScore(candidate.productName || '');
    const signatureScore = calculateSignatureScore(candidate);
    
    const totalScore = pathScore + vendorScore + md5Score + productScore + signatureScore;
    const confidenceLabel = getConfidenceLabel(totalScore);
    
    return {
        totalScore,
        confidenceLabel,
        breakdown: {
            pathScore,
            vendorScore,
            md5Score,
            productScore,
            signatureScore
        }
    };
}

/**
 * Calculate the score for a single candidate (wrapper for backwards compatibility)
 * @param {Object} candidate - The candidate object
 * @param {string} candidate.filePath - Full file path
 * @param {string} candidate.vendor - Vendor name
 * @param {string} candidate.version - Version string
 * @param {string} candidate.productName - Product name
 * @param {string} candidate.md5 - MD5 hash
 * @param {number} candidate.size - File size in bytes
 * @param {Map<string, number>} md5FrequencyMap - Map of MD5 to frequency count
 * @param {Array<Object>} allCandidates - All candidates for cross-validation
 * @returns {Object} Score result with details
 */
function calculateScore(candidate, md5FrequencyMap, allCandidates) {
    const result = calculateTotalScore(candidate, md5FrequencyMap, allCandidates);
    return {
        score: result.totalScore,
        details: result.breakdown,
        confidenceLabel: result.confidenceLabel
    };
}

/**
 * Build MD5 frequency map from candidates
 * @param {Array<Object>} candidates - Array of candidate objects
 * @returns {Map<string, number>} Map of MD5 to frequency count
 */
function buildMD5FrequencyMap(candidates) {
    const md5Map = new Map();
    
    candidates.forEach(candidate => {
        if (candidate.md5) {
            const count = md5Map.get(candidate.md5) || 0;
            md5Map.set(candidate.md5, count + 1);
        }
    });
    
    return md5Map;
}

/**
 * Check if candidate should be ignored
 * @param {Object} candidate - The candidate object
 * @returns {boolean} True if should be ignored
 */
function shouldIgnore(candidate) {
    const path = (candidate.filePath || '').toUpperCase();
    
    // Desktop paths
    if (path.includes('DESKTOP')) {
        return true;
    }
    
    // Root drive paths (e.g., D:\Dialer.exe)
    if (/^[D-Z]:\\[^\\]+\.exe$/i.test(candidate.filePath)) {
        return true;
    }
    
    return false;
}

/**
 * Analyze and classify all candidates
 * @param {Array<Object>} candidates - Array of candidate objects with structure:
 *   {filePath, vendor, version, productName, md5, size}
 * @returns {Object} Analytics results with classifications
 */
function analyzeResults(candidates) {
    // Build MD5 frequency map
    const md5FrequencyMap = buildMD5FrequencyMap(candidates);
    
    // Calculate scores for all candidates
    const scoredCandidates = candidates.map(candidate => {
        const scoreResult = calculateScore(candidate, md5FrequencyMap, candidates);
        return {
            ...candidate,
            score: scoreResult.score,
            scoreDetails: scoreResult.details,
            confidenceLabel: scoreResult.confidenceLabel,
            ignored: shouldIgnore(candidate)
        };
    });
    
    // Separate ignored candidates
    const validCandidates = scoredCandidates.filter(c => !c.ignored);
    const ignoredCandidates = scoredCandidates.filter(c => c.ignored);
    
    // Sort valid candidates by score (descending)
    validCandidates.sort((a, b) => b.score - a.score);
    
    // Classify
    const bestCandidate = validCandidates.length > 0 ? validCandidates[0] : null;
    const secondBest = validCandidates.length > 1 ? validCandidates[1] : null;
    const worstCandidates = validCandidates.filter(c => c.score < 0);
    
    return {
        bestCandidate,
        secondBest,
        worstCandidates,
        ignoredCandidates,
        allRanked: validCandidates,
        totalProcessed: candidates.length,
        totalValid: validCandidates.length,
        totalIgnored: ignoredCandidates.length,
        md5FrequencyMap: Object.fromEntries(md5FrequencyMap)
    };
}

// Export functions for use in browser or Node.js
if (typeof module !== 'undefined' && module.exports) {
    // Node.js environment
    module.exports = {
        calculateScore,
        calculateTotalScore,
        calculatePathScore,
        calculateVendorScore,
        calculateMD5Score,
        calculateProductScore,
        calculateSignatureScore,
        getConfidenceLabel,
        analyzeResults,
        buildMD5FrequencyMap,
        shouldIgnore
    };
} else {
    // Browser environment
    window.AnalyticsScoring = {
        calculateScore,
        calculateTotalScore,
        calculatePathScore,
        calculateVendorScore,
        calculateMD5Score,
        calculateProductScore,
        calculateSignatureScore,
        getConfidenceLabel,
        analyzeResults,
        buildMD5FrequencyMap,
        shouldIgnore
    };
}
