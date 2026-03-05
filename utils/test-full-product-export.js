/**
 * Comprehensive test for product name export workflow
 * Tests the entire flow: analytics page → export button → server → Google Sheets
 * 
 * Run: node utils/test-full-product-export.js
 */

// Use built-in fetch (Node 18+) or require node-fetch
const fetchFn = async (...args) => {
    try {
        return await fetch(...args);
    } catch (e) {
        // Fallback to node-fetch if fetch is not available
        const nodeFetch = require('node-fetch');
        return await nodeFetch(...args);
    }
};

async function testFullProductExportWorkflow() {
    console.log('\n🧪 Testing Full Product Name Export Workflow\n');
    console.log('========================================\n');

    const testProducts = [
        'Windows Task Manager',
        'Google Chrome',
        'Microsoft Word 2019',
        'Adobe Acrobat Reader'
    ];

    console.log('📊 Test Scenario: Exporting multiple product names\n');

    for (const productName of testProducts) {
        console.log(`📍 Exporting: "${productName}"`);

        try {
            const response = await fetchFn('http://localhost:3000/export-to-sheets', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ productName })
            });

            const result = await response.json();

            if (result.success) {
                console.log(`   ✅ Success!`);
                console.log(`      Message: ${result.message}`);
                console.log(`      Type: ${result.exportType}`);
            } else {
                console.log(`   ❌ Failed: ${result.message}`);
            }
        } catch (error) {
            console.log(`   ❌ Error: ${error.message}`);
        }

        console.log();
    }

    console.log('========================================');
    console.log('✨ Full Product Export Test Complete\n');
    console.log('📋 Check your Google Sheet Column G for the exported product names\n');
}

// Run the test
testFullProductExportWorkflow().catch(err => {
    console.error('Fatal error:', err);
    process.exit(1);
});
