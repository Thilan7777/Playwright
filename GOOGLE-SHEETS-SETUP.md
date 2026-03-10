# Google Sheets Integration Setup Guide

## Overview
This setup enables Playwright to automatically extract the best candidate path from the analytics page and add it to your Google Sheet in Column F.

## Prerequisites
- Google Cloud Project with enabled Google Sheets API
- Service Account with credentials file

## Step-by-Step Setup

### 1. Install Required Package
```bash
npm install googleapis
```

### 2. Create Google Cloud Service Account

#### a) Go to Google Cloud Console
- Visit: https://console.cloud.google.com/
- Create a new project (or use existing)
- Enable the Google Sheets API

#### b) Create Service Account
1. Go to: **IAM & Admin** → **Service Accounts**
2. Click **Create Service Account**
3. Fill in details:
   - Service account name: `playwright-sheets`
   - Description: `Playwright analytics to sheets integration`
4. Click **Create**

#### c) Create JSON Key
1. Click on the created service account
2. Go to **Keys** tab
3. Click **Add Key** → **Create new key**
4. Select **JSON**
5. Click **Create** (file will download automatically)

### 3. Add Credentials to Project

1. Place the downloaded `credentials.json` in your Playwright project root directory:
   ```
   c:\Users\Admin\Documents\Playwright\credentials.json
   ```

### 4. Grant Sheet Access to Service Account

1. Open your Google Sheet: https://docs.google.com/spreadsheets/d/1M_DJYj5VtnO5cOrY9jl_le7UohfAYxJ14rVGcCuKHO8/
2. Click **Share**
3. Copy the service account email from credentials.json (format: `name@project.iam.gserviceaccount.com`)
4. Paste in Share dialog
5. Give **Editor** permission
6. Uncheck "Notify people"
7. Click **Share**

### 5. Run the Script

#### Option A: As a Playwright Test
```bash
npx playwright test utils/extract-to-sheets.js
```

#### Option B: Add to Existing Test
```javascript
const { appendBestCandidatePath } = require('./utils/google-sheets-integration');

// After analytics page is loaded and best candidate is available
const filePath = 'C:\\WINDOWS\\System32\\taskmgr.exe'; // or extracted value
await appendBestCandidatePath(filePath);
```

#### Option C: Integrate into Your Test Flow
Add to your existing `process-search.spec.js`:

```javascript
const { appendBestCandidatePath } = require('../utils/google-sheets-integration');

// After results are generated and you open analytics:
test('Search process and export to sheets', async ({ page }) => {
    // ... your existing search code ...
    
    // Extract best candidate path
    const bestCandidatePath = await page.evaluate(() => {
        const bestCard = document.querySelector('.candidate-card.best-candidate');
        return bestCard?.querySelector('[data-copy]')?.dataset?.copy || null;
    });
    
    // Add to Google Sheet
    if (bestCandidatePath) {
        await appendBestCandidatePath(bestCandidatePath);
        console.log('✅ Added to Google Sheet:', bestCandidatePath);
    }
});
```

## Troubleshooting

### "credentials.json not found"
- Ensure credentials.json is in the project root directory
- Path: `c:\Users\Admin\Documents\Playwright\credentials.json`

### "Permission denied" in Google Sheet
- Verify you shared the sheet with the service account email
- Check if service account has Editor permissions
- Wait a few moments for permissions to propagate

### "Sheet not found" Error
- Verify the Sheet name matches your actual sheet
- Default is 'Sheet1' - change if needed in `google-sheets-integration.js`

## Configuration

To customize column or header, edit `google-sheets-integration.js`:

```javascript
const TARGET_COLUMN = 'F';        // Change to A, B, C, etc.
const HEADER = 'File Path';       // Your column header
const SHEET_NAME = 'Sheet1';      // Your sheet name
```

## Security Notes
- Never commit `credentials.json` to version control
- Add to `.gitignore`: `credentials.json`
- Service account keys have long expiration but can be rotated
- Credentials file should have restricted file permissions

## Next Steps

1. Set up credentials.json (steps above)
2. Install package: `npm install googleapis`
3. Run the script: `npx playwright test utils/extract-to-sheets.js`
4. Check your Google Sheet - best candidate path should appear in Column F!

---

**Need help?** Check errors in the console output - they're detailed and actionable.
