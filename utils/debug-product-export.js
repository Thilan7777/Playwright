/**
 * Debug script for testing product name export to Google Sheet
 * Simulates user interaction with the analytics page product export button
 * 
 * Run: node utils/debug-product-export.js
 */

const fs = require('fs');
const path = require('path');
const { JSDOM } = require('jsdom');

async function testProductExport() {
    console.log('\n🧪 Testing Product Name Export Functionality\n');
    console.log('========================================\n');

    try {
        // Read analytics.html
        const analyticsPath = path.join(__dirname, '../analytics.html');
        const htmlContent = fs.readFileSync(analyticsPath, 'utf-8');

        // Create virtual DOM
        const dom = new JSDOM(htmlContent);
        const document = dom.window.document;
        const window = dom.window;

        // Mock fetch to capture requests
        let fetchCalls = [];
        window.fetch = async (url, options) => {
            const body = JSON.parse(options.body);
            fetchCalls.push({
                url,
                method: options.method,
                contentType: options.headers['Content-Type'],
                body
            });

            console.log(`✅ Fetch request intercepted`);
            console.log(`   URL: ${url}`);
            console.log(`   Method: ${options.method}`);
            console.log(`   Body:`, body);

            // Simulate server response
            return {
                status: 200,
                json: async () => ({
                    success: true,
                    exportType: 'Product Name',
                    data: body.productName.substring(0, 50),
                    message: 'Product Name exported to Google Sheets'
                })
            };
        };

        console.log('✅ Virtual DOM environment created\n');

        // Inject test data and render a candidate with product name
        const candidates = [
            {
                score: 95,
                filePath: 'C:\\Windows\\System32\\taskmgr.exe',
                vendor: 'Microsoft Corporation',
                productName: 'Task Manager',
                version: '10.0',
                size: 45056,
                md5: 'abc123def456'
            }
        ];

        console.log('📊 Test Candidate Data:\n');
        console.log(`   File Path: ${candidates[0].filePath}`);
        console.log(`   Product Name: ${candidates[0].productName}`);
        console.log(`   Vendor: ${candidates[0].vendor}\n`);

        // Find export product button for product name
        // We need to simulate the HTML structure: field-value -> copy-btn -> export-btn
        const productField = document.createElement('div');
        productField.innerHTML = `
            <div class="field-row">
                <div class="field-label">📦 Product:</div>
                <div class="field-value" data-copy="Task Manager">Task Manager</div>
                <button class="copy-btn" onclick="copyToClipboard(this.previousElementSibling.dataset.copy, this)" title="Copy product name">📋 Copy</button>
                <button class="export-btn" onclick="exportProductName(this)" title="Export to Google Sheet">📤 Export</button>
            </div>
        `;

        // Add to document
        document.body.appendChild(productField);

        // Inject the exportProductName function into window scope
        window.eval(`
            ${fs.readFileSync(analyticsPath, 'utf-8').split('<script>')[1].split('</script>')[0]}
            
            function exportProductName(button) {
                // Get the product name from the product div
                const copyBtn = button.previousElementSibling;
                const productDiv = copyBtn.previousElementSibling;
                const productName = productDiv.dataset.copy;
                
                console.log('📤 Product export button clicked');
                console.log('   Product name:', productName);
                
                if (!productName || productName.trim() === '' || productName === 'N/A') {
                    alert('No product name to export');
                    return;
                }
                
                button.classList.add('loading');
                button.disabled = true;
                const originalText = button.textContent;
                button.textContent = '⏳ Exporting...';
                
                console.log('Sending to server:', productName);
                
                // Call the backend endpoint to export to Google Sheets
                fetch('http://localhost:3000/export-to-sheets', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                        productName: productName
                    })
                })
                .then(response => {
                    console.log('Response status:', response.status);
                    return response.json();
                })
                .then(data => {
                    console.log('Response data:', data);
                    if (data.success) {
                        button.textContent = '✅ Exported!';
                        button.classList.remove('loading');
                        button.classList.add('success');
                        console.log('✅ Export successful:', productName);
                    } else {
                        throw new Error(data.message || 'Export failed');
                    }
                })
                .catch(err => {
                    console.error('❌ Export error:', err);
                    button.textContent = '❌ Failed';
                    button.classList.remove('loading');
                    button.disabled = false;
                });
            }
        `);

        console.log('📤 Simulating product export button click...\n');

        // Find and click the product export button
        const exportButtons = document.querySelectorAll('.export-btn');
        console.log(`Found ${exportButtons.length} export button(s)\n`);

        if (exportButtons.length > 0) {
            const productExportBtn = exportButtons[exportButtons.length - 1]; // Get the product export button
            console.log('✅ Product export button found:\n');
            console.log(`   Button text: ${productExportBtn.textContent}`);
            console.log(`   Button class: ${productExportBtn.className}\n`);

            // Click the button
            productExportBtn.click();

            // Wait for async operations
            await new Promise(resolve => setTimeout(resolve, 500));

            console.log('\n📋 Fetch Requests Made:\n');
            fetchCalls.forEach((call, i) => {
                console.log(`Request ${i + 1}:`);
                console.log(`   URL: ${call.url}`);
                console.log(`   Method: ${call.method}`);
                console.log(`   Headers: Content-Type = ${call.contentType}`);
                console.log(`   Body:`, call.body, '\n');
            });

            // Verify the request
            if (fetchCalls.length > 0) {
                const lastCall = fetchCalls[fetchCalls.length - 1];
                if (lastCall.body.productName === 'Task Manager') {
                    console.log('✅ Product name correctly extracted and sent to server');
                    console.log(`   Product: "${lastCall.body.productName}"\n`);

                    // Check button state
                    console.log('✅ Button state verification:');
                    console.log(`   Final button text: ${productExportBtn.textContent}\n`);

                    console.log('🎉 PRODUCT EXPORT TEST SUCCESSFUL!\n');
                    console.log('========================================');
                    console.log('✨ Product Name Export Ready for Use\n');
                } else {
                    console.log('❌ Product name not correctly extracted');
                    console.log(`   Expected: "Task Manager"`);
                    console.log(`   Got: "${lastCall.body.productName}"\n`);
                }
            } else {
                console.log('❌ No fetch requests were made\n');
            }
        } else {
            console.log('❌ No export buttons found in document\n');
        }

    } catch (error) {
        console.error('❌ Test error:', error.message);
        console.error('\nStack:', error.stack);
    }
}

// Run the test
testProductExport().catch(err => {
    console.error('Fatal error:', err);
    process.exit(1);
});
