/**
 * Test export button from analytics.html
 * Simulates user interaction
 */

const { chromium } = require('@playwright/test');
const fs = require('fs');
const path = require('path');

async function testExportButton() {
    console.log('\n🧪 Testing Export Button from Analytics Page\n');
    
    let browser;
    try {
        browser = await chromium.launch();
        const page = await browser.newPage();
        
        // Load analytics page
        const analyticsPath = 'file://' + path.resolve(__dirname, '../analytics.html').replace(/\\/g, '/');
        console.log('1️⃣  Loading analytics page...');
        console.log(`   Path: ${analyticsPath}\n`);
        
        await page.goto(analyticsPath);
        console.log('✅ Analytics page loaded\n');
        
        // Load test data into localStorage (simulate Playwright test)
        console.log('2️⃣  Loading test data into localStorage...');
        await page.evaluate(() => {
            const testData = {
                processName: 'test.exe',
                data: [
                    {
                        path: 'C:\\Windows\\System32\\taskmgr.exe',
                        vendor: 'Microsoft Corporation',
                        productName: 'Windows Task Manager',
                        version: '10.0.19041.1',
                        md5: 'ABC123DEF456',
                        size: 45056
                    }
                ]
            };
            localStorage.setItem('analyticsData', JSON.stringify(testData));
            console.log('Test data stored');
        });
        console.log('✅ Test data loaded\n');
        
        // Wait for analytics to render
        console.log('3️⃣  Waiting for analytics to render...');
        await page.waitForSelector('.candidate-card.best-candidate', { timeout: 5000 });
        console.log('✅ Best candidate card found\n');
        
        // Check if export button exists
        console.log('4️⃣  Checking for export button...');
        const exportBtn = await page.locator('.export-btn').first();
        const exists = await exportBtn.isVisible();
        
        if (!exists) {
            console.log('❌ Export button not found\n');
            await browser.close();
            return false;
        }
        console.log('✅ Export button found\n');
        
        // Set up console logging to capture what happens
        console.log('5️⃣  Setting up console listeners...');
        page.on('console', msg => {
            if (msg.type() === 'log' || msg.type() === 'error') {
                console.log(`   [PAGE] ${msg.type().toUpperCase()}: ${msg.text()}`);
            }
        });
        console.log('✅ Listeners set up\n');
        
        // Click export button
        console.log('6️⃣  Clicking export button...');
        await exportBtn.click();
        console.log('✅ Export button clicked\n');
        
        // Wait for response
        console.log('7️⃣  Waiting for export response...');
        await page.waitForTimeout(3000);
        
        // Check button state
        const buttonText = await exportBtn.textContent();
        console.log(`   Button state: ${buttonText}`);
        
        if (buttonText.includes('Exported')) {
            console.log('✅ Export successful!\n');
            await browser.close();
            return true;
        } else if (buttonText.includes('Failed')) {
            console.log('❌ Export failed\n');
            
            // Get error details from page
            const errorMsg = await page.evaluate(() => {
                return document.body.innerText;
            });
            console.log('Page content sample:');
            console.log(errorMsg.substring(0, 500) + '...\n');
            
            await browser.close();
            return false;
        } else {
            console.log('❓ Unknown state\n');
            await browser.close();
            return false;
        }
        
    } catch (error) {
        console.log('❌ Test error:', error.message, '\n');
        if (browser) await browser.close();
        return false;
    }
}

// Run the test
testExportButton().then(success => {
    if (success) {
        console.log('🎉 Export button is working!\n');
    } else {
        console.log('⚠️  Export button has issues\n');
    }
    process.exit(success ? 0 : 1);
}).catch(err => {
    console.error('Fatal error:', err);
    process.exit(1);
});
