/**
 * Playwright Script to Extract Best Candidate and Add to Google Sheet
 * 
 * Usage:
 *   npx playwright test utils/extract-to-sheets.js
 * 
 * Or run directly:
 *   node utils/extract-to-sheets.js <analytics-page-url>
 */

const { test, expect } = require('@playwright/test');
const path = require('path');
const { appendBestCandidatePath } = require('./google-sheets-integration');

test.describe('Analytics to Google Sheets', () => {
    test('Extract best candidate and add to sheet', async ({ browser }) => {
        const analyticsPagePath = 'file:///' + path.resolve(__dirname, '../analytics.html').replace(/\\/g, '/');
        
        console.log('\n📊 Starting extraction from analytics page...\n');
        
        const context = await browser.newContext();
        const page = await context.newPage();
        
        // Navigate to analytics page
        await page.goto(analyticsPagePath);
        console.log('✅ Analytics page loaded');
        
        // Wait for analytics to load
        await page.waitForSelector('.candidate-card.best-candidate', { timeout: 10000 });
        console.log('✅ Best candidate card found');
        
        // Extract best candidate path
        const bestCandidatePath = await page.evaluate(() => {
            const bestCard = document.querySelector('.candidate-card.best-candidate');
            if (!bestCard) return null;
            
            const pathElement = bestCard.querySelector('[data-copy]');
            if (pathElement) {
                return pathElement.dataset.copy;
            }
            
            // Fallback: get from text content
            const textContent = bestCard.textContent;
            const pathMatch = textContent.match(/Path:(.+?)Vendor:/s);
            return pathMatch ? pathMatch[1].trim() : null;
        });
        
        if (!bestCandidatePath) {
            throw new Error('Could not extract best candidate path from analytics page');
        }
        
        console.log(`📁 Best candidate path: ${bestCandidatePath}`);
        
        // Append to Google Sheet
        const success = await appendBestCandidatePath(bestCandidatePath);
        
        expect(success).toBe(true);
        console.log('\n✅ Successfully added to Google Sheet!\n');
        
        await context.close();
    });
});

// Allow running directly from command line with URL
if (require.main === module) {
    const url = process.argv[2] || './analytics.html';
    console.log(`\nExtracting from: ${url}\n`);
}
