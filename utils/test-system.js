#!/usr/bin/env node

/**
 * Complete Google Sheets Export System Test
 * Tests: Credentials → Server → Export → Google Sheet
 */

const http = require('http');
const fs = require('fs');
const path = require('path');

console.log('\n' + '='.repeat(60));
console.log('🧪 GOOGLE SHEETS EXPORT - COMPLETE SYSTEM TEST');
console.log('='.repeat(60) + '\n');

let testsPassed = 0;
let testsFailed = 0;

// Test 1: Check credentials
console.log('1️⃣  Checking credentials.json...');
const credPath = path.join(__dirname, '../credentials.json');
if (!fs.existsSync(credPath)) {
    console.log('❌ FAILED: credentials.json not found\n');
    testsFailed++;
} else {
    try {
        const creds = JSON.parse(fs.readFileSync(credPath, 'utf-8'));
        console.log('✅ PASSED: Credentials found');
        console.log(`   Service Account: ${creds.client_email}\n`);
        testsPassed++;
    } catch (e) {
        console.log('❌ FAILED: Invalid JSON in credentials.json\n');
        testsFailed++;
    }
}

// Test 2: Check packages
console.log('2️⃣  Checking required packages...');
try {
    require('googleapis');
    require('express');
    require('cors');
    console.log('✅ PASSED: All packages installed\n');
    testsPassed++;
} catch (e) {
    console.log('❌ FAILED: Missing package:', e.message);
    console.log('   Run: npm install\n');
    testsFailed++;
}

// Test 3: Check export-server.js exists
console.log('3️⃣  Checking export-server.js...');
const serverPath = path.join(__dirname, 'export-server.js');
if (!fs.existsSync(serverPath)) {
    console.log('❌ FAILED: export-server.js not found\n');
    testsFailed++;
} else {
    console.log('✅ PASSED: export-server.js exists\n');
    testsPassed++;
}

// Test 4: Check analytics.html has export button
console.log('4️⃣  Checking analytics.html has export button...');
const analyticsPath = path.join(__dirname, '../analytics.html');
if (!fs.existsSync(analyticsPath)) {
    console.log('❌ FAILED: analytics.html not found\n');
    testsFailed++;
} else {
    const content = fs.readFileSync(analyticsPath, 'utf-8');
    if (content.includes('exportToSheet') && content.includes('.export-btn')) {
        console.log('✅ PASSED: Export button code found\n');
        testsPassed++;
    } else {
        console.log('❌ FAILED: Export button code not found\n');
        testsFailed++;
    }
}

// Test 5: Server health check
console.log('5️⃣  Checking if server is running on port 3000...');
setTimeout(() => {
    http.get('http://localhost:3000/health', (res) => {
        let data = '';
        res.on('data', chunk => data += chunk);
        res.on('end', () => {
            try {
                const json = JSON.parse(data);
                console.log('✅ PASSED: Server is running\n');
                testsPassed++;
                
                // Test 6: Export endpoint
                console.log('6️⃣  Testing export endpoint...');
                testExportEndpoint();
            } catch (e) {
                console.log('❌ FAILED: Invalid response from server\n');
                testsFailed++;
                summary();
            }
        });
    }).on('error', (err) => {
        console.log('❌ FAILED: Cannot connect to server');
        console.log('   Start with: node utils/export-server.js\n');
        testsFailed++;
        summary();
    });
}, 500);

function testExportEndpoint() {
    const testPath = 'C:\\Windows\\System32\\test.exe';
    const data = JSON.stringify({ filePath: testPath });
    
    const options = {
        hostname: 'localhost',
        port: 3000,
        path: '/export-to-sheets',
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Content-Length': data.length
        }
    };
    
    const req = http.request(options, (res) => {
        let response = '';
        res.on('data', chunk => response += chunk);
        res.on('end', () => {
            try {
                const json = JSON.parse(response);
                if (json.success) {
                    console.log('✅ PASSED: Export endpoint working');
                    console.log(`   Successfully exported: ${testPath}\n`);
                    testsPassed++;
                    
                    // Test 7: Google Sheets write
                    console.log('7️⃣  Testing Google Sheets write...');
                    testGoogleSheets();
                } else {
                    console.log('❌ FAILED: Export endpoint returned error');
                    console.log(`   ${json.message}\n`);
                    testsFailed++;
                    summary();
                }
            } catch (e) {
                console.log('❌ FAILED: Invalid response:', response.substring(0, 100) + '...\n');
                testsFailed++;
                summary();
            }
        });
    });
    
    req.on('error', (err) => {
        console.log('❌ FAILED: Request error:', err.message, '\n');
        testsFailed++;
        summary();
    });
    
    req.write(data);
    req.end();
}

function testGoogleSheets() {
    const { appendBestCandidatePath } = require('./google-sheets-integration');
    
    appendBestCandidatePath('C:\\Windows\\System32\\diagnostic-test.exe')
        .then(success => {
            if (success) {
                console.log('✅ PASSED: Google Sheets write successful\n');
                testsPassed++;
            } else {
                console.log('❌ FAILED: Google Sheets write failed');
                console.log('   Check:\n');
                console.log('   - Service account email is in sheet share settings');
                console.log('   - Sheet has Editor permission for service account\n');
                testsFailed++;
            }
            summary();
        })
        .catch(err => {
            console.log('❌ FAILED: Google Sheets error:', err.message, '\n');
            testsFailed++;
            summary();
        });
}

function summary() {
    console.log('='.repeat(60));
    console.log('📊 TEST SUMMARY');
    console.log('='.repeat(60));
    console.log(`✅ Passed: ${testsPassed}`);
    console.log(`❌ Failed: ${testsFailed}`);
    console.log('='.repeat(60));
    
    if (testsFailed === 0) {
        console.log('\n🎉 ALL TESTS PASSED!');
        console.log('\n📝 Next Steps:');
        console.log('   1. Open analytics.html');
        console.log('   2. Click "📤 Export" button');
        console.log('   3. Check your Google Sheet Column F\n');
    } else {
        console.log('\n⚠️  Some tests failed. See above for details.\n');
    }
    
    process.exit(testsFailed === 0 ? 0 : 1);
}
