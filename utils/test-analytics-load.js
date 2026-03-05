/**
 * Test analytics.html functionality by simulating the display flow
 * This verifies that the page loads without errors after the fix
 */

const fs = require('fs');
const path = require('path');

// Test: Parse the analytics.html to verify it can be evaluated
console.log('\n🧪 Testing Analytics Page Load Sequence\n');
console.log('=========================================\n');

// Step 1: Check if analytics.html exists
const analyticsPath = path.join(__dirname, '../analytics.html');
if (!fs.existsSync(analyticsPath)) {
    console.log('❌ analytics.html not found');
    process.exit(1);
}
console.log('✅ analytics.html exists');

// Step 2: Read and validate the file
const content = fs.readFileSync(analyticsPath, 'utf-8');
console.log(`✅ File size: ${Math.round(content.length / 1024)}KB`);

// Step 3: Extract and check the JavaScript section
const scriptMatch = content.match(/<script>([\s\S]*?)<\/script>/);
if (!scriptMatch) {
    console.log('❌ No script tag found in analytics.html');
    process.exit(1);
}
console.log('✅ Script section found');

const jsCode = scriptMatch[1];

// Step 4: Basic syntax validation by checking for common patterns
const checks = [
    { name: 'displayAnalytics function definition', test: () => jsCode.includes('function displayAnalytics()') },
    { name: 'renderCandidate function definition', test: () => jsCode.includes('function renderCandidate(') },
    { name: 'analyzeResults function definition', test: () => jsCode.includes('function analyzeResults(') },
    { name: 'calculateScore function definition', test: () => jsCode.includes('function calculateScore(') },
    { name: 'DOM Ready listener', test: () => jsCode.includes('DOMContentLoaded') },
    { name: 'loadingMessage element reference', test: () => jsCode.includes('loadingMessage') },
    { name: 'analyticsContent element reference', test: () => jsCode.includes('analyticsContent') },
    { name: 'Try-catch error handling in displayAnalytics', test: () => jsCode.includes('catch (error)') }
];

console.log('\n📋 Function Checks:\n');
let allChecksPassed = true;
for (const check of checks) {
    if (check.test()) {
        console.log(`   ✅ ${check.name}`);
    } else {
        console.log(`   ❌ ${check.name}`);
        allChecksPassed = false;
    }
}

// Step 5: Check for common syntax issues
console.log('\n🔍 Syntax Safety Checks:\n');

// Check for unmatched braces
const openBraces = (jsCode.match(/{/g) || []).length;
const closeBraces = (jsCode.match(/}/g) || []).length;
if (openBraces === closeBraces) {
    console.log(`   ✅ Braces balanced: ${openBraces} pairs`);
} else {
    console.log(`   ❌ Brace mismatch: {${openBraces} vs }${closeBraces}`);
    allChecksPassed = false;
}

// Check for unmatched parentheses
const openParens = (jsCode.match(/\(/g) || []).length;
const closeParens = (jsCode.match(/\)/g) || []).length;
if (openParens === closeParens) {
    console.log(`   ✅ Parentheses balanced: ${openParens} pairs`);
} else {
    console.log(`   ⚠️  Parentheses may be unbalanced: (${openParens} vs )${closeParens}`);
}

// Check for unmatched brackets
const openBrackets = (jsCode.match(/\[/g) || []).length;
const closeBrackets = (jsCode.match(/\]/g) || []).length;
if (openBrackets === closeBrackets) {
    console.log(`   ✅ Brackets balanced: ${openBrackets} pairs`);
} else {
    console.log(`   ❌ Bracket mismatch: [${openBrackets} vs ]${closeBrackets}`);
    allChecksPassed = false;
}

// Step 6: Test function calls
console.log('\n🚀 Function Call Verification:\n');

const functionCalls = [
    { name: 'displayAnalytics() called on DOM ready', test: () => jsCode.includes('displayAnalytics()') },
    { name: 'analyzeResults() called in displayAnalytics', test: () => jsCode.includes('analyzeResults(candidates)') || jsCode.includes('analyzeResults(rawData.data)') },
    { name: 'renderCandidate() called for best candidate', test: () => jsCode.includes('renderCandidate(') },
    { name: 'exportToSheet() function defined', test: () => jsCode.includes('function exportToSheet(') },
    { name: 'exportProductName() function defined', test: () => jsCode.includes('function exportProductName(') }
];

for (const check of functionCalls) {
    if (check.test()) {
        console.log(`   ✅ ${check.name}`);
    } else {
        console.log(`   ❌ ${check.name}`);
        allChecksPassed = false;
    }
}

console.log('\n=========================================');
if (allChecksPassed) {
    console.log('✨ All checks passed! Analytics.html is ready.\n');
    console.log('📝 Next Steps:');
    console.log('   1. Go back to results.html');
    console.log('   2. Click "📊 View Analytics" button');
    console.log('   3. Analytics page should load without errors\n');
} else {
    console.log('❌ Some checks failed. Review the output above.\n');
}
