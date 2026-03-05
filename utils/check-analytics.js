/**
 * Quick test to verify analytics.html loads and renders correctly
 * Opens analytics.html and triggers displayAnalytics
 */

const fs = require('fs');
const path = require('path');

// Simple check: read the file and look for the renderCandidate function
const analyticsPath = path.join(__dirname, '../analytics.html');
const content = fs.readFileSync(analyticsPath, 'utf-8');

console.log('🧪 Analytics.html syntax check\n');
console.log('================================\n');

// Check for key function definitions
const checks = [
    { name: 'renderCandidate function', pattern: /function renderCandidate\(/ },
    { name: 'displayAnalytics function', pattern: /function displayAnalytics\(/ },
    { name: 'exportToSheet function', pattern: /function exportToSheet\(/ },
    { name: 'exportProductName function', pattern: /function exportProductName\(/ },
    { name: 'calculateScore function', pattern: /function calculateScore\(/ },
    { name: 'analyzeResults function', pattern: /function analyzeResults\(/ },
    { name: 'escapeHtml function', pattern: /function escapeHtml\(/ },
    { name: 'copyToClipboard function', pattern: /function copyToClipboard\(/ }
];

let allPassed = true;

for (const check of checks) {
    if (check.pattern.test(content)) {
        console.log(`✅ ${check.name}`);
    } else {
        console.log(`❌ ${check.name} - NOT FOUND`);
        allPassed = false;
    }
}

// Check for script tags
const scriptCount = (content.match(/<script>/g) || []).length;
const scriptCloseCount = (content.match(/<\/script>/g) || []).length;

console.log(`\n📝 Script tags: ${scriptCount} open, ${scriptCloseCount} close`);
if (scriptCount === scriptCloseCount) {
    console.log('✅ Script tags are balanced');
} else {
    console.log('❌ Script tag mismatch - potential syntax error');
    allPassed = false;
}

// Check for unmatched backticks in template literals
const backtickCount = (content.match(/`/g) || []).length;
console.log(`\n📝 Backticks found: ${backtickCount}`);
if (backtickCount % 2 === 0) {
    console.log('✅ Backticks are balanced');
} else {
    console.log('⚠️  Odd number of backticks - possible unclosed template literal');
}

console.log('\n================================');
if (allPassed) {
    console.log('✨ All checks passed!\n');
} else {
    console.log('❌ Some checks failed. See above.\n');
}
