/**
 * Proper debug analytics page rendering
 * Sets data and triggers displayAnalytics in same eval
 */

const { chromium } = require('@playwright/test');
const path = require('path');

async function debugAnalytics() {
    console.log('\n🔍 Debugging Analytics Page\n');
    
    const browser = await chromium.launch();
    const page = await browser.newPage();
    
    // Set up console logging FIRST
    page.on('console', msg => {
        console.log(`[ANALYTICS] ${msg.text()}`);
    });
    
    const analyticsPath = 'file://' + path.resolve(__dirname, '../analytics.html').replace(/\\/g, '/');
    console.log(`Opening: ${analyticsPath}\n`);
    
    await page.goto(analyticsPath);
    console.log('✅ Page loaded, waiting for DOM\n');
    
    // Wait for DOMContentLoaded
    await page.waitForFunction(() => document.readyState === 'complete');
    
    // Set data and call displayAnalytics in the SAME evaluation
    console.log('Setting test data and triggering displayAnalytics...\n');
    
    const result = await page.evaluate(() => {
        // Set test data
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
                },
                {
                    path: 'C:\\Program Files\\Test\\app.exe',
                    vendor: 'Test Vendor',
                    productName: 'Test App',
                    version: '1.0',
                    md5: 'XYZ789',
                    size: 123456
                }
            ]
        };
        
        localStorage.setItem('analyticsData', JSON.stringify(testData));
        console.log('✅ Data set in localStorage');
        
        // Trigger displayAnalytics
        if (typeof displayAnalytics === 'function') {
            console.log('Calling displayAnalytics()...');
            displayAnalytics();
            return 'called';
        } else {
            return 'function not found';
        }
    });
    
    console.log(`Result: ${result}\n`);
    
    // Wait a bit for rendering
    await page.waitForTimeout(2000);
    
    // Check state
    const state = await page.evaluate(() => {
        return {
            loadingVisible: !!(document.getElementById('loadingMessage') && 
                              document.getElementById('loadingMessage').style.display !== 'none'),
            contentVisible: !!(document.getElementById('analyticsContent') && 
                              document.getElementById('analyticsContent').style.display !== 'none'),
            bestCardExists: !!document.querySelector('.candidate-card'),
            exportBtnCount: document.querySelectorAll('.export-btn').length,
            copyBtnCount: document.querySelectorAll('.copy-btn').length
        };
    });
    
    console.log('Page State After displayAnalytics:');
    console.log(`  Loading visible: ${state.loadingVisible}`);
    console.log(`  Content visible: ${state.contentVisible}`);
    console.log(`  Candidate cards: ${state.bestCardExists}`);
    console.log(`  Export buttons: ${state.exportBtnCount}`);
    console.log(`  Copy buttons: ${state.copyBtnCount}\n`);
    
    if (state.exportBtnCount > 0) {
        console.log('✅ Export buttons found!\n');
        console.log('Testing export button click...');
        
        // Get button text before
        const before = await page.locator('.export-btn').first().textContent();
        console.log(`Before click: ${before}`);
        
        // Click it
        await page.click('.export-btn');
        
        // Wait for response
        await page.waitForTimeout(3000);
        
        // Get button text after
        const after = await page.locator('.export-btn').first().textContent();
        console.log(`After click: ${after}\n`);
        
        if (after.includes('Exported')) {
            console.log('🎉 EXPORT SUCCESSFUL!\n');
        } else if (after.includes('Failed')) {
            console.log('❌ Export failed\n');
        }
    } else {
        console.log('❌ No export buttons found\n');
    }
    
    await browser.close();
}

debugAnalytics().catch(err => {
    console.error('Error:', err);
    process.exit(1);
});
