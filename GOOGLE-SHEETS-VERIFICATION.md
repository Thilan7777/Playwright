# Google Sheets Integration - Verification Checklist

## Issue: Cells Not Being Filled

If the script runs but cells are not being filled, follow this checklist:

### ✅ Step 1: Verify Service Account Email is Shared

1. Open `credentials.json` file in your Playwright folder
2. Find the line with `"client_email": "..."`
3. Copy that entire email address

**Your service account email is:** `thilan@example-bucket-471905.iam.gserviceaccount.com`

4. Go to your Google Sheet: https://docs.google.com/spreadsheets/d/1M_DJYj5VtnO5cOrY9jl_le7UohfAYxJ14rVGcCuKHO8/
5. Click **Share** (top right)
6. Paste the email: `thilan@example-bucket-471905.iam.gserviceaccount.com`
7. Select **Editor** (not Viewer)
8. **UNCHECK** "Notify people"
9. Click **Share**

### ✅ Step 2: Wait for Permissions to Propagate

After sharing, wait **2-3 minutes** for Google to propagate permissions.

### ✅ Step 3: Verify Sheet Structure

Open the Google Sheet and ensure:
- [ ] Column F exists
- [ ] Column F has header "File Path" in row 1 (or is empty for row 1)
- [ ] The sheet is named "Sheet1" (or update SHEET_NAME in google-sheets-integration.js)

### ✅ Step 4: Run Diagnostic Test

```bash
cd "c:\Users\Admin\Documents\Playwright"
node utils/diagnostic.js
```

Expected output should show:
- ✅ credentials.json found
- ✅ Credentials loaded
- ✅ Authorization successful
- ✅ Sheet access successful
- ✅ Write permission verified
- ✅ Append successful!

### ✅ Step 5: Test the Integration

```bash
npx playwright test utils/extract-to-sheets.js
```

Then check your Google Sheet - you should see data in Column F!

---

## Common Issues & Solutions

### Issue: "Authorization failed"
- **Cause**: Credentials file is invalid or malformed
- **Solution**: 
  1. Delete credentials.json
  2. Create new service account credentials
  3. Download as JSON and save as credentials.json

### Issue: "Sheet access failed" or "Permission denied"
- **Cause**: Service account email not shared with Editor permissions
- **Solution**: 
  1. Get email from credentials.json
  2. Share Google Sheet with that email
  3. Grant Editor permissions
  4. Wait 2-3 minutes

### Issue: "Write permission test failed"
- **Cause**: Service account was added but permissions not yet propagated
- **Solution**: Wait 5-10 minutes and try again

### Issue: "Column F not found"
- **Cause**: Sheet structure is different
- **Solution**: Edit `utils/google-sheets-integration.js` and update:
  ```javascript
  const TARGET_COLUMN = 'G';  // Change F to your column
  const SHEET_NAME = 'Results';  // Change to your sheet name
  ```

---

## Step-by-Step Service Account Setup (if needed)

### 1. Go to Google Cloud Console
https://console.cloud.google.com/

### 2. Enable Google Sheets API
- Select your project
- Click "Enable APIs and Services"
- Search for "Google Sheets API"
- Click "Enable"

### 3. Create Service Account
- Go to "Service Accounts" (IAM & Admin)
- Click "Create Service Account"
- Name: `playwright-bot`
- Click "Create and Continue"
- Click "Create Key" → "JSON"
- Download the file

### 4. Save Credentials
- Rename downloaded file to `credentials.json`
- Place in: `c:\Users\Admin\Documents\Playwright\credentials.json`

### 5. Share Google Sheet
- Email from step 3: `thilan@example-bucket-471905.iam.gserviceaccount.com`
- Go to your sheet
- Click "Share"
- Add the email with "Editor" permission
- **Important: Uncheck "Notify people"**

---

## Quick Test Command

Run this to verify your setup is correct:

```bash
# Run diagnostic
node utils/diagnostic.js

# If successful, test the full extraction
npx playwright test utils/extract-to-sheets.js
```

---

Need help? Check that you:
1. ✅ Shared the Google Sheet with the service account email
2. ✅ Granted "Editor" permissions (not just Viewer)
3. ✅ Waited at least 2-3 minutes for propagation
4. ✅ Have credentials.json in the root Playwright folder
