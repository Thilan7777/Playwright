/**
 * Test script for product name export endpoint
 * Tests the /export-to-sheets endpoint with productName parameter
 * 
 * Run: node utils/test-product-export.js
 */

async function testProductExport() {
    console.log('\n🧪 Testing Product Name Export Endpoint\n');
    console.log('========================================\n');

    const testCases = [
        {
            name: 'Valid Product Name',
            payload: { productName: 'Task Manager' },
            shouldSucceed: true
        },
        {
            name: 'Product Name with Special Characters',
            payload: { productName: 'Microsoft® Office Document' },
            shouldSucceed: true
        },
        {
            name: 'Empty Product Name',
            payload: { productName: '' },
            shouldSucceed: false
        },
        {
            name: 'Long Product Name',
            payload: { productName: 'This is a very long product name that contains multiple words and characters to test the export functionality' },
            shouldSucceed: true
        }
    ];

    for (const testCase of testCases) {
        console.log(`📍 Test: ${testCase.name}`);
        console.log(`   Payload: ${JSON.stringify(testCase.payload)}`);

        try {
            const response = await fetch('http://localhost:3000/export-to-sheets', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(testCase.payload)
            });

            const data = await response.json();

            if (testCase.shouldSucceed) {
                if (data.success) {
                    console.log(`   ✅ Success: ${data.message}`);
                    console.log(`   Response:`, data);
                } else {
                    console.log(`   ⚠️  Unexpected: ${data.message}`);
                    console.log(`   Response:`, data);
                }
            } else {
                if (!data.success) {
                    console.log(`   ✅ Correctly failed: ${data.message}`);
                } else {
                    console.log(`   ⚠️  Should have failed but succeeded`);
                }
            }
        } catch (error) {
            console.log(`   ❌ Error: ${error.message}`);
        }

        console.log();
    }

    console.log('========================================');
    console.log('✨ Product Export Endpoint Tests Complete\n');
}

// Run the test
testProductExport().catch(err => {
    console.error('Fatal error:', err);
    process.exit(1);
});
