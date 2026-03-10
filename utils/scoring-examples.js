/**
 * Example Usage of Analytics Scoring System
 * 
 * This file demonstrates how to use the scoring.js module
 * for testing or integration purposes.
 */

// For Node.js environment (if testing with Node)
// const { calculateScore, analyzeResults, buildMD5FrequencyMap } = require('./utils/scoring.js');

// Example candidate data
const exampleCandidates = [
    {
        filePath: "C:\\Windows\\System32\\Dialer.exe",
        productName: "Windows Telephony Dialer",
        vendor: "Microsoft Corporation",
        version: "10.0.19041.1",
        size: 98304,
        md5: "a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6"
    },
    {
        filePath: "C:\\Program Files\\BSNL 3G\\Dialer.exe",
        productName: "BSNL 3G Modem Dialer",
        vendor: "BSNL",
        version: "2.1.0.5",
        size: 524288,
        md5: "b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6q7"
    },
    {
        filePath: "C:\\Users\\Admin\\Desktop\\Dialer.exe",
        productName: "Unknown Dialer",
        vendor: "Unknown",
        version: "1.0.0.0",
        size: 45056,
        md5: "d4e5f6g7h8i9j0k1l2m3n4o5p6q7r8s9"
    }
];

/**
 * Example 1: Calculate score for a single candidate
 */
function example1_SingleCandidateScore() {
    console.log("=== Example 1: Single Candidate Score ===\n");
    
    // Build MD5 frequency map from all candidates
    const md5Map = buildMD5FrequencyMap(exampleCandidates);
    
    // Calculate score for first candidate
    const candidate = exampleCandidates[0];
    const result = calculateScore(candidate, md5Map);
    
    console.log("Candidate:", candidate.filePath);
    console.log("Total Score:", result.score);
    console.log("Score Breakdown:");
    console.log("  - Path Score:", result.details.pathScore);
    console.log("  - Vendor Score:", result.details.vendorScore);
    console.log("  - MD5 Score:", result.details.md5Score);
    console.log("  - Product Score:", result.details.productScore);
    console.log("\n");
}

/**
 * Example 2: Analyze complete results
 */
function example2_FullAnalysis() {
    console.log("=== Example 2: Full Analysis ===\n");
    
    // Analyze all candidates
    const analytics = analyzeResults(exampleCandidates);
    
    console.log("Total Candidates:", analytics.totalProcessed);
    console.log("Valid Candidates:", analytics.totalValid);
    console.log("Ignored Candidates:", analytics.totalIgnored);
    console.log("\n");
    
    if (analytics.bestCandidate) {
        console.log("🏆 Best Candidate:");
        console.log("  Path:", analytics.bestCandidate.filePath);
        console.log("  Score:", analytics.bestCandidate.score);
        console.log("  Vendor:", analytics.bestCandidate.vendor);
        console.log("\n");
    }
    
    if (analytics.secondBest) {
        console.log("🥈 Second Best:");
        console.log("  Path:", analytics.secondBest.filePath);
        console.log("  Score:", analytics.secondBest.score);
        console.log("  Vendor:", analytics.secondBest.vendor);
        console.log("\n");
    }
    
    console.log("Worst Candidates Count:", analytics.worstCandidates.length);
    if (analytics.worstCandidates.length > 0) {
        analytics.worstCandidates.forEach(c => {
            console.log("  ⚠️", c.filePath, "- Score:", c.score);
        });
    }
    console.log("\n");
    
    console.log("Full Ranking:");
    analytics.allRanked.forEach((c, index) => {
        console.log(`  ${index + 1}. [${c.score}] ${c.filePath}`);
    });
}

/**
 * Example 3: Test different path scenarios
 */
function example3_PathScoring() {
    console.log("=== Example 3: Path Scoring Tests ===\n");
    
    const testPaths = [
        "C:\\Windows\\System32\\test.exe",          // Should get +50
        "C:\\Program Files\\test.exe",               // Should get +40
        "C:\\Program Files (x86)\\test.exe",         // Should get +35
        "D:\\SomeFolder\\test.exe",                   // Should get +10
        "C:\\Users\\Admin\\Desktop\\test.exe",       // Should get -40
        "C:\\Users\\Admin\\Documents\\test.exe",     // Should get -40
        "C:\\SomeOtherPath\\test.exe"                // Should get 0
    ];
    
    const md5Map = new Map();
    
    testPaths.forEach(path => {
        const testCandidate = {
            filePath: path,
            vendor: "Test Vendor",
            productName: "Test Product",
            md5: "test123",
            size: 1000
        };
        
        const result = calculateScore(testCandidate, md5Map);
        console.log(`Path: ${path}`);
        console.log(`  Path Score: ${result.details.pathScore}`);
        console.log(`  Total Score: ${result.score}\n`);
    });
}

/**
 * Example 4: Test vendor scoring
 */
function example4_VendorScoring() {
    console.log("=== Example 4: Vendor Scoring Tests ===\n");
    
    const testVendors = [
        "Microsoft Corporation",          // Should get +40
        "BSNL",                            // Should get +25
        "Huawei Technologies",             // Should get +25
        "Qualcomm Incorporated",           // Should get +25
        "Unknown",                         // Should get -20
        "Regular Software Inc."            // Should get 0
    ];
    
    const md5Map = new Map();
    
    testVendors.forEach(vendor => {
        const testCandidate = {
            filePath: "C:\\Test\\test.exe",
            vendor: vendor,
            productName: "Test Product",
            md5: "test123",
            size: 1000
        };
        
        const result = calculateScore(testCandidate, md5Map);
        console.log(`Vendor: ${vendor}`);
        console.log(`  Vendor Score: ${result.details.vendorScore}`);
        console.log(`  Total Score: ${result.score}\n`);
    });
}

/**
 * Example 5: Test MD5 frequency scoring
 */
function example5_MD5FrequencyScoring() {
    console.log("=== Example 5: MD5 Frequency Scoring ===\n");
    
    // Create candidates with duplicate MD5s
    const candidatesWithDuplicates = [
        { filePath: "C:\\Path1\\file.exe", vendor: "Vendor", productName: "Product", md5: "hash1", size: 1000 },
        { filePath: "C:\\Path2\\file.exe", vendor: "Vendor", productName: "Product", md5: "hash1", size: 1000 },
        { filePath: "C:\\Path3\\file.exe", vendor: "Vendor", productName: "Product", md5: "hash1", size: 1000 },
        { filePath: "C:\\Path4\\file.exe", vendor: "Vendor", productName: "Product", md5: "hash1", size: 1000 },
        { filePath: "C:\\Path5\\file.exe", vendor: "Vendor", productName: "Product", md5: "hash1", size: 1000 },
        { filePath: "C:\\Path6\\file.exe", vendor: "Vendor", productName: "Product", md5: "hash1", size: 1000 },
        { filePath: "C:\\Path7\\file.exe", vendor: "Vendor", productName: "Product", md5: "hash2", size: 1000 },
        { filePath: "C:\\Path8\\file.exe", vendor: "Vendor", productName: "Product", md5: "hash2", size: 1000 },
        { filePath: "C:\\Path9\\file.exe", vendor: "Vendor", productName: "Product", md5: "hash3", size: 1000 }
    ];
    
    const md5Map = buildMD5FrequencyMap(candidatesWithDuplicates);
    
    console.log("MD5 Frequency Map:");
    md5Map.forEach((count, hash) => {
        console.log(`  ${hash}: appears ${count} times`);
    });
    console.log("\n");
    
    candidatesWithDuplicates.slice(0, 3).forEach((candidate, index) => {
        const result = calculateScore(candidate, md5Map);
        console.log(`Candidate ${index + 1} (MD5: ${candidate.md5}):`);
        console.log(`  Frequency: ${md5Map.get(candidate.md5)} occurrences`);
        console.log(`  MD5 Score: ${result.details.md5Score}\n`);
    });
}

/**
 * Example 6: Test product relevance scoring
 */
function example6_ProductScoring() {
    console.log("=== Example 6: Product Relevance Scoring ===\n");
    
    const testProducts = [
        "Windows Dialer Application",      // Should get +20
        "3G Modem Manager",                 // Should get +20
        "USB WWAN Dialer",                  // Should get +20
        "VMware Network Tools",             // Should get -30
        "Microsoft Office Word",            // Should get -30
        "Norton Antivirus",                 // Should get -30
        "Random Application"                // Should get 0
    ];
    
    const md5Map = new Map();
    
    testProducts.forEach(product => {
        const testCandidate = {
            filePath: "C:\\Test\\test.exe",
            vendor: "Test Vendor",
            productName: product,
            md5: "test123",
            size: 1000
        };
        
        const result = calculateScore(testCandidate, md5Map);
        console.log(`Product: ${product}`);
        console.log(`  Product Score: ${result.details.productScore}`);
        console.log(`  Total Score: ${result.score}\n`);
    });
}

// Run all examples if this file is executed directly
if (typeof window === 'undefined') {
    // Node.js environment
    console.log("\n╔════════════════════════════════════════════╗");
    console.log("║   Analytics Scoring System - Examples     ║");
    console.log("╚════════════════════════════════════════════╝\n");
    
    example1_SingleCandidateScore();
    console.log("─────────────────────────────────────────────\n");
    
    example2_FullAnalysis();
    console.log("─────────────────────────────────────────────\n");
    
    example3_PathScoring();
    console.log("─────────────────────────────────────────────\n");
    
    example4_VendorScoring();
    console.log("─────────────────────────────────────────────\n");
    
    example5_MD5FrequencyScoring();
    console.log("─────────────────────────────────────────────\n");
    
    example6_ProductScoring();
} else {
    // Browser environment - expose examples to window
    window.AnalyticsExamples = {
        example1_SingleCandidateScore,
        example2_FullAnalysis,
        example3_PathScoring,
        example4_VendorScoring,
        example5_MD5FrequencyScoring,
        example6_ProductScoring,
        exampleCandidates
    };
    
    console.log("Analytics Examples loaded. Access via window.AnalyticsExamples");
    console.log("Available functions:");
    console.log("  - example1_SingleCandidateScore()");
    console.log("  - example2_FullAnalysis()");
    console.log("  - example3_PathScoring()");
    console.log("  - example4_VendorScoring()");
    console.log("  - example5_MD5FrequencyScoring()");
    console.log("  - example6_ProductScoring()");
}
